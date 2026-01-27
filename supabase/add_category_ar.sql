-- Add name_ar column to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_ar TEXT;

-- Update existing categories with some defaults (optional, but good for testing)
UPDATE categories SET name_ar = 'العناية بالوجه' WHERE slug = 'face';
UPDATE categories SET name_ar = 'العناية بالجسم' WHERE slug = 'body';
UPDATE categories SET name_ar = 'العناية بالشعر' WHERE slug = 'hair';
UPDATE categories SET name_ar = 'مجموعات الهدايا' WHERE slug = 'gift';
