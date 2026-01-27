-- Add link column to hero_carousel table
ALTER TABLE hero_carousel ADD COLUMN IF NOT EXISTS link TEXT;

-- Enable RLS
ALTER TABLE hero_carousel ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public can view carousel" ON hero_carousel;
CREATE POLICY "Public can view carousel" ON hero_carousel
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admin full access" ON hero_carousel;
CREATE POLICY "Admin full access" ON hero_carousel
    FOR ALL USING (true);

