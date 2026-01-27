-- Add Arabic fields to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS title_ar TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_ar TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS benefits_ar TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredients_ar TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS how_to_use_ar TEXT;

-- Update existing products to have English content as fallback for Arabic if needed
-- UPDATE products SET title_ar = title WHERE title_ar IS NULL;
-- UPDATE products SET description_ar = description WHERE description_ar IS NULL;

