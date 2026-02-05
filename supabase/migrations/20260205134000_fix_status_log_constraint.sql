-- Migration to fix order status log constraint error
-- File: supabase/migrations/20260205134000_fix_status_log_constraint.sql

-- 1. Make changed_by nullable in order_status_logs
-- This allows system/admin updates (where auth.uid() is null) to still be logged
ALTER TABLE public.order_status_logs ALTER COLUMN changed_by DROP NOT NULL;

-- 2. (Optional) Update the trigger function to be more descriptive if needed
-- But making the column nullable is the primary fix for the constraint error.
