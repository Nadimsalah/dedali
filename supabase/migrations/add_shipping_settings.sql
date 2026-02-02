-- Create shipping_settings table
CREATE TABLE IF NOT EXISTS shipping_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role TEXT NOT NULL, -- 'retail' or 'reseller'
    base_price DECIMAL(10, 2) NOT NULL DEFAULT 50.00,
    free_shipping_threshold DECIMAL(10, 2) NOT NULL DEFAULT 750.00,
    free_shipping_min_items INTEGER NOT NULL DEFAULT 0,
    enabled BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Initial data
INSERT INTO shipping_settings (role, base_price, free_shipping_threshold, free_shipping_min_items)
VALUES 
('retail', 50.00, 750.00, 0),
('reseller', 50.00, 1500.00, 5)
ON CONFLICT DO NOTHING;

-- Function to handle timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS set_shipping_settings_updated_at ON shipping_settings;
CREATE TRIGGER set_shipping_settings_updated_at
BEFORE UPDATE ON shipping_settings
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();
