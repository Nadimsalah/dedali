-- migration for account manager system
-- File: supabase/migrations/20260204153500_account_manager_system.sql

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- roles enum (if not already handled by a string check)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('ADMIN', 'ACCOUNT_MANAGER', 'RESELLER', 'RESELLER_PENDING');
    ELSE
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ADMIN';
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ACCOUNT_MANAGER';
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'RESELLER';
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'RESELLER_PENDING';
    END IF;
END $$;

-- Helper functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_account_manager()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ACCOUNT_MANAGER'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'RESELLER',
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- resellers table
CREATE TABLE IF NOT EXISTS resellers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    company_name TEXT NOT NULL,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- account_manager_assignments table
CREATE TABLE IF NOT EXISTS account_manager_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_manager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reseller_id UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    soft_deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(account_manager_id, reseller_id) -- We allow re-assignment if soft deleted, but let's handle that in logic
);

-- order_internal_notes table
CREATE TABLE IF NOT EXISTS order_internal_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id),
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- order_status_logs for auditability
CREATE TABLE IF NOT EXISTS order_status_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    changed_by UUID NOT NULL REFERENCES profiles(id),
    old_status TEXT,
    new_status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add reseller_id to orders if not exists
DO $$ BEGIN
    ALTER TABLE orders ADD COLUMN reseller_id UUID REFERENCES resellers(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_manager_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_internal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_logs ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
CREATE POLICY "Admins can manage all profiles" ON profiles FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);

-- Policies for resellers
DROP POLICY IF EXISTS "Admins can manage all resellers" ON resellers;
CREATE POLICY "Admins can manage all resellers" ON resellers FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Account Managers can view assigned resellers" ON resellers;
CREATE POLICY "Account Managers can view assigned resellers" ON resellers FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM account_manager_assignments 
        WHERE account_manager_id = auth.uid() 
        AND reseller_id = resellers.id 
        AND soft_deleted_at IS NULL
    )
);
DROP POLICY IF EXISTS "Resellers can view their own record" ON resellers;
CREATE POLICY "Resellers can view their own record" ON resellers FOR SELECT USING (user_id = auth.uid());

-- Policies for assignments
DROP POLICY IF EXISTS "Admins can manage assignments" ON account_manager_assignments;
CREATE POLICY "Admins can manage assignments" ON account_manager_assignments FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Account Managers can view their assignments" ON account_manager_assignments;
CREATE POLICY "Account Managers can view their assignments" ON account_manager_assignments FOR SELECT USING (account_manager_id = auth.uid());

-- Policies for internal notes
DROP POLICY IF EXISTS "Account Managers can manage internal notes for assigned resellers" ON order_internal_notes;
CREATE POLICY "Account Managers can manage internal notes for assigned resellers" ON order_internal_notes FOR ALL USING (
    EXISTS (
        SELECT 1 FROM orders o
        JOIN account_manager_assignments ama ON o.reseller_id = ama.reseller_id
        WHERE o.id = order_internal_notes.order_id
        AND ama.account_manager_id = auth.uid()
        AND ama.soft_deleted_at IS NULL
    ) OR is_admin()
);

-- Policies for orders (strict constraint)
DROP POLICY IF EXISTS "Account Managers can view assigned orders" ON orders;
CREATE POLICY "Account Managers can view assigned orders" ON orders FOR SELECT USING (
    reseller_id IN (
        SELECT reseller_id
        FROM account_manager_assignments
        WHERE account_manager_id = auth.uid()
        AND soft_deleted_at IS NULL
    ) OR is_admin()
);

DROP POLICY IF EXISTS "Account Managers can update assigned orders status" ON orders;
CREATE POLICY "Account Managers can update assigned orders status" ON orders FOR UPDATE USING (
    reseller_id IN (
        SELECT reseller_id
        FROM account_manager_assignments
        WHERE account_manager_id = auth.uid()
        AND soft_deleted_at IS NULL
    ) OR is_admin()
);

-- Trigger for orders status log
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO order_status_logs (order_id, changed_by, old_status, new_status)
        VALUES (NEW.id, auth.uid(), OLD.status, NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_log_order_status_change ON orders;
CREATE TRIGGER tr_log_order_status_change
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION log_order_status_change();

-- Profile synchronization trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  assigned_role user_role;
BEGIN
  -- Safe Mapping for Role (Handles case-sensitivity and unknown roles)
  assigned_role := CASE 
    WHEN UPPER(COALESCE(new.raw_user_meta_data->>'role', '')) = 'ADMIN' THEN 'ADMIN'::user_role
    WHEN UPPER(COALESCE(new.raw_user_meta_data->>'role', '')) = 'ACCOUNT_MANAGER' THEN 'ACCOUNT_MANAGER'::user_role
    WHEN UPPER(COALESCE(new.raw_user_meta_data->>'role', '')) = 'RESELLER_PENDING' THEN 'RESELLER_PENDING'::user_role
    ELSE 'RESELLER'::user_role
  END;

  INSERT INTO public.profiles (id, name, email, role, phone)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email), 
    new.email, 
    assigned_role,
    new.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone;

  -- Create reseller record only for resellers (Pending or Active)
  IF (assigned_role IN ('RESELLER', 'RESELLER_PENDING')) THEN
      INSERT INTO public.resellers (user_id, company_name, phone)
      VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'company_name', 'Personal Account'),
        new.raw_user_meta_data->>'phone'
      )
      ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Prevent trigger failure from blocking account creation
  RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
