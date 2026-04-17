-- Add WooCommerce Object ID tracking variables to the database
-- Run this in the Supabase SQL Editor

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS woo_id bigint null;
CREATE INDEX IF NOT EXISTS products_woo_id_idx ON public.products (woo_id);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS woo_order_id bigint null;
CREATE INDEX IF NOT EXISTS orders_woo_order_id_idx ON public.orders (woo_order_id);
