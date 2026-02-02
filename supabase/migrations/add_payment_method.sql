-- Add payment_method column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cod';

-- Add keys for payment settings to admin_settings table if needed (optional since upsert handles it in code)
INSERT INTO admin_settings (key, value) VALUES 
('payment_virement_enabled', 'false'),
('payment_virement_details', ''),
('payment_cheque_enabled', 'false'),
('payment_cheque_details', ''),
('payment_cod_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
