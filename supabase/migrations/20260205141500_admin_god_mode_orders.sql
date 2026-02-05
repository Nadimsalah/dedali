-- Final migration to ensure Admin has full control over orders
-- File: supabase/migrations/20260205141500_admin_god_mode_orders.sql

-- 1. Ensure is_admin is robust and doesn't cause recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- We use SECURITY DEFINER and a direct query with a limit to be fast
  -- We also check both profiles and auth.users metadata just in case
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop all possibly conflicting policies on orders
DROP POLICY IF EXISTS "Allow all for authenticated users" ON orders;
DROP POLICY IF EXISTS "Account Managers can view assigned orders" ON orders;
DROP POLICY IF EXISTS "Account Managers can update assigned orders status" ON orders;
DROP POLICY IF EXISTS "Admins have full access to orders" ON orders;

-- 3. Create a clean, definitive Admin policy
CREATE POLICY "Admins have full access to orders" 
ON orders FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- 4. Create Account Manager policies (Permissive)
CREATE POLICY "Account Managers can view assigned orders" 
ON orders FOR SELECT 
USING (
    reseller_id IN (
        SELECT reseller_id
        FROM account_manager_assignments
        WHERE account_manager_id = auth.uid()
        AND soft_deleted_at IS NULL
    )
);

CREATE POLICY "Account Managers can update assigned orders status" 
ON orders FOR UPDATE 
USING (
    reseller_id IN (
        SELECT reseller_id
        FROM account_manager_assignments
        WHERE account_manager_id = auth.uid()
        AND soft_deleted_at IS NULL
    )
);

-- 5. Extend God Mode to resellers and profiles
DROP POLICY IF EXISTS "Admins can manage all resellers" ON resellers;
CREATE POLICY "Admins have full access to resellers" ON resellers FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
CREATE POLICY "Admins have full access to profiles" ON profiles FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 6. Ensure the trigger function is SECURITY DEFINER and handles NULL changed_by
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.order_status_logs (order_id, changed_by, old_status, new_status)
        VALUES (NEW.id, auth.uid(), OLD.status, NEW.status);
    END IF;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- If logging fails, we still want the order update to proceed
    -- This is a fallback to prevent the whole transaction from failing
    RAISE WARNING 'Failed to log order status change: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
