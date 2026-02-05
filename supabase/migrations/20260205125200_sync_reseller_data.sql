-- Migration to add missing fields to resellers and sync data
-- File: supabase/migrations/20260205125200_sync_reseller_data.sql

-- 1. Add missing columns to resellers table
ALTER TABLE public.resellers 
ADD COLUMN IF NOT EXISTS ice TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS city TEXT;

-- 2. Sync data from customers to resellers
-- This fixes the issue where company_name was incorrectly set to contact name
UPDATE public.resellers r
SET 
  company_name = c.company_name,
  ice = c.ice,
  website = c.website,
  city = c.city,
  phone = COALESCE(r.phone, c.phone)
FROM public.customers c
WHERE r.user_id = c.id;

-- 3. Update the handle_new_user trigger to include these fields for future resellers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  assigned_role user_role;
BEGIN
  -- Safe Mapping for Role
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

  -- Create reseller record only for resellers
  IF (assigned_role IN ('RESELLER', 'RESELLER_PENDING')) THEN
      INSERT INTO public.resellers (user_id, company_name, ice, website, city, phone)
      VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'company_name', 'Personal Account'),
        new.raw_user_meta_data->>'ice',
        new.raw_user_meta_data->>'website',
        new.raw_user_meta_data->>'city',
        new.raw_user_meta_data->>'phone'
      )
      ON CONFLICT (user_id) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        ice = EXCLUDED.ice,
        website = EXCLUDED.website,
        city = EXCLUDED.city,
        phone = EXCLUDED.phone;
  END IF;

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
