-- Add prime_target_revenue column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS prime_target_revenue DECIMAL(10, 2) DEFAULT 200000.00;

-- Comment for clarity
COMMENT ON COLUMN profiles.prime_target_revenue IS 'Target revenue goal for Account Managers to reach Prime status';
