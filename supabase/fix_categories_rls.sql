-- Allow public read access to categories
DROP POLICY IF EXISTS "Allow public read access" ON categories;

CREATE POLICY "Allow public read access"
ON categories FOR SELECT
USING (true);
