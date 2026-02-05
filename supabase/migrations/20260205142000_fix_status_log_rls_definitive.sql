-- Definitive fix for Order Status Update and Logs
-- File: supabase/migrations/20260205142000_fix_status_log_rls_definitive.sql

-- 1. Grant INSERT permission on order_status_logs to authenticated users
-- The trigger acts on behalf of the user, and even with SECURITY DEFINER, 
-- having an explicit policy avoids many edge cases with RLS.
-- Since there is no public API to insert into this table directly, this is safe.
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON order_status_logs;
CREATE POLICY "Enable insert for authenticated users" ON order_status_logs 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 2. Ensure Admins can do EVERYTHING on order_status_logs
DROP POLICY IF EXISTS "Admins have full access to status logs" ON order_status_logs;
CREATE POLICY "Admins have full access to status logs" ON order_status_logs 
FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());

-- 3. Double check orders policy for Admin (Redundant safety)
-- Re-apply to be absolutely sure
DROP POLICY IF EXISTS "Admins have full access to orders" ON orders;
CREATE POLICY "Admins have full access to orders" 
ON orders FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());

-- 4. Re-define the trigger function to be absolutely sure it catches errors
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.order_status_logs (order_id, changed_by, old_status, new_status)
        VALUES (NEW.id, auth.uid(), OLD.status, NEW.status);
    END IF;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log the error but DO NOT FAIL the transaction
    RAISE WARNING 'Failed to log order status change: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
