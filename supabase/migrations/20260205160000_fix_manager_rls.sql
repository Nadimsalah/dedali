-- Fix RLS for Account Managers to allow Smart Discovery (ID + Email)

-- 1. Allow AMs to view PROFILES of their assigned resellers (needed to fetch emails)
DROP POLICY IF EXISTS "Account Managers can view assigned reseller profiles" ON profiles;
CREATE POLICY "Account Managers can view assigned reseller profiles" ON profiles FOR SELECT USING (
    id IN (
        SELECT r.user_id
        FROM resellers r
        JOIN account_manager_assignments ama ON ama.reseller_id = r.id
        WHERE ama.account_manager_id = auth.uid()
        AND ama.soft_deleted_at IS NULL
    )
);

-- 2. Allow AMs to view ORDERS based on Customer Email matching an assigned Reseller
-- This covers cases where order.reseller_id is NULL/Missing but the email matches.
DROP POLICY IF EXISTS "Account Managers can view orders by reseller email" ON orders;
CREATE POLICY "Account Managers can view orders by reseller email" ON orders FOR SELECT USING (
    customer_email IN (
        SELECT p.email
        FROM profiles p
        JOIN resellers r ON r.user_id = p.id
        JOIN account_manager_assignments ama ON ama.reseller_id = r.id
        WHERE ama.account_manager_id = auth.uid()
        AND ama.soft_deleted_at IS NULL
    )
);

-- 3. Ensure the existing ID-based policy allows NULLs if covered by Email?
-- No, policies are OR-ed. If either passes, row is visible.
-- Existing policy handles ID match. New policy handles Email match.
