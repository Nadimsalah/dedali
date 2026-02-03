-- Allow public (anon) users to insert into customers table (for guest checkout)
CREATE POLICY "Allow anon insert customers" ON customers
    FOR INSERT 
    TO anon
    WITH CHECK (true);

-- Allow public (anon) users to update customers table (to update stats if they exist)
-- Note: In production, this should be tighter (e.g. only if ID matches), but anon users don't have IDs.
-- We rely on the internal API logic to handle safety mostly, but RLS is the last line.
-- For guest checkout updates, we might need this.
CREATE POLICY "Allow anon update customers" ON customers
    FOR UPDATE
    TO anon
    USING (true);

-- Allow public (anon) users to view customers (needed for finding existing email)
CREATE POLICY "Allow anon select customers" ON customers
    FOR SELECT
    TO anon
    USING (true);

-- Allow public insert orders
CREATE POLICY "Allow anon insert orders" ON orders
    FOR INSERT
    TO anon
    WITH CHECK (true);
    
-- Allow public insert order items
CREATE POLICY "Allow anon insert order_items" ON order_items
    FOR INSERT
    TO anon
    WITH CHECK (true);
