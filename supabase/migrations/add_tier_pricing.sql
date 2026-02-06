-- Add tiered pricing and minimum order quantities for partners and wholesalers
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS partner_price DECIMAL(10, 2),
    ADD COLUMN IF NOT EXISTS wholesaler_price DECIMAL(10, 2),
    ADD COLUMN IF NOT EXISTS reseller_min_qty INTEGER,
    ADD COLUMN IF NOT EXISTS partner_min_qty INTEGER,
    ADD COLUMN IF NOT EXISTS wholesaler_min_qty INTEGER;

