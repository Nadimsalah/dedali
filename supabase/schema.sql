-- =====================================================
-- Rateb E-Commerce Database Schema for Supabase
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    sku TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL, -- 'face', 'body', 'hair', 'gift'
    price DECIMAL(10, 2) NOT NULL,
    compare_at_price DECIMAL(10, 2),
    stock INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'active'
    images TEXT[], -- Array of image URLs
    benefits TEXT[], -- Array of key benefits
    ingredients TEXT,
    how_to_use TEXT,
    sales_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PRODUCT VARIANTS (Optional - for sizes, colors, etc.)
-- =====================================================
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., "50ml", "100ml"
    price DECIMAL(10, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    sku TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CUSTOMERS TABLE
-- =====================================================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'blocked'
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ORDERS TABLE
-- =====================================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL, -- e.g., "ORD-7829"
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    
    -- Shipping Address
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    governorate TEXT NOT NULL,
    postal_code TEXT,
    
    -- Order Details
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
    subtotal DECIMAL(10, 2) NOT NULL,
    shipping_cost DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    
    -- Metadata
    ip_address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ORDER ITEMS TABLE
-- =====================================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_title TEXT NOT NULL,
    product_sku TEXT NOT NULL,
    variant_name TEXT, -- e.g., "50ml"
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL, -- Price at time of order
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ORDER TIMELINE/HISTORY TABLE
-- =====================================================
CREATE TABLE order_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ADMIN SETTINGS TABLE
-- =====================================================
CREATE TABLE admin_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin settings
INSERT INTO admin_settings (key, value) VALUES
    ('store_name', 'Rateb Store'),
    ('support_email', 'support@rateb.com'),
    ('admin_pin', '123456'), -- CHANGE THIS!
    ('currency', 'EGP'),
    ('default_language', 'en');

-- =====================================================
-- CROSS-SELL RELATIONSHIPS TABLE
-- =====================================================
CREATE TABLE product_cross_sells (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    related_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, related_product_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_customers_email ON customers(email);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_cross_sells ENABLE ROW LEVEL SECURITY;

-- Public read access for products (for storefront)
CREATE POLICY "Public can view active products" ON products
    FOR SELECT USING (status = 'active');

-- Admin full access (you'll need to set up auth for this)
-- For now, allowing all operations (you should restrict this in production)
CREATE POLICY "Allow all for authenticated users" ON products
    FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON product_variants
    FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON customers
    FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON orders
    FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON order_items
    FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON order_timeline
    FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON admin_settings
    FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON product_cross_sells
    FOR ALL USING (true);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON admin_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample products
INSERT INTO products (title, description, sku, category, price, compare_at_price, stock, status, images, benefits) VALUES
    ('Pure Argan Oil', 'Premium organic argan oil from Morocco', 'ARG-1001', 'face'
CREATE POLICY "Allow all for authenticated users" ON orders
    FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON order_items
    FOR ALL USING (true);, 299.00, 399.00, 50, 'active', 
     ARRAY['/placeholder.svg'], 
     ARRAY['Deeply moisturizes skin', 'Rich in Vitamin E', 'Anti-aging properties']),
    ('Nourishing Face Serum', 'Lightweight serum for all skin types', 'SER-2001', 'face', 450.00, 550.00, 30, 'active',
     ARRAY['/placeholder.svg'],
     ARRAY['Brightens complexion', 'Reduces fine lines', 'Fast absorbing']),
    ('Body Butter', 'Luxurious hydrating body butter', 'BUT-3001', 'body', 350.00, NULL, 40, 'active',
     ARRAY['/placeholder.svg'],
     ARRAY['24-hour moisture', 'Silky smooth texture', 'Natural ingredients']);

-- Insert sample customer
INSERT INTO customers (name, email, phone, total_orders, total_spent) VALUES
    ('Ahmed Hassan', 'ahmed@example.com', '+20 123 456 7890', 3, 1200.00);
