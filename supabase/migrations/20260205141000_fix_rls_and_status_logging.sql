-- Migration to fix RLS for order_status_logs and order_internal_notes
-- File: supabase/migrations/20260205141000_fix_rls_and_status_logging.sql

-- 1. Set log_order_status_change to SECURITY DEFINER
-- This allows the trigger to insert into order_status_logs even if the user doesn't have direct insert permissions
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.order_status_logs (order_id, changed_by, old_status, new_status)
        VALUES (NEW.id, auth.uid(), OLD.status, NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add RLS policies for order_status_logs
DROP POLICY IF EXISTS "Admins can view all status logs" ON order_status_logs;
CREATE POLICY "Admins can view all status logs" ON order_status_logs FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Account Managers can view logs for assigned orders" ON order_status_logs;
CREATE POLICY "Account Managers can view logs for assigned orders" ON order_status_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM orders o
        JOIN account_manager_assignments ama ON o.reseller_id = ama.reseller_id
        WHERE o.id = order_status_logs.order_id
        AND ama.account_manager_id = auth.uid()
        AND ama.soft_deleted_at IS NULL
    )
);

-- 3. Ensure Admins can manage internal notes (already exists but making sure it's robust)
DROP POLICY IF EXISTS "Admins can manage all internal notes" ON order_internal_notes;
CREATE POLICY "Admins can manage all internal notes" ON order_internal_notes FOR ALL USING (is_admin());

-- 4. Fix potential issue with profiles policy (ensure account managers can see profiles to avoid JOIN errors)
DROP POLICY IF EXISTS "Account Managers can view profiles" ON profiles;
CREATE POLICY "Account Managers can view profiles" ON profiles FOR SELECT USING (is_account_manager() OR is_admin());
