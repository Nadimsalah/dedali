-- Add IT categories
INSERT INTO categories (name, slug) VALUES
    ('Laptops', 'laptops'),
    ('Components', 'components'),
    ('Monitors', 'monitors'),
    ('Printers', 'printers')
ON CONFLICT (slug) DO NOTHING;

-- Insert Mock IT Products
INSERT INTO products (
    title, title_ar, 
    description, description_ar, 
    sku, category, price, reseller_price, compare_at_price, 
    stock, status, images, benefits, benefits_ar
) VALUES
    (
        'HP Victus 16-d1013dx Gaming Laptop', 'لابتوب جيمنج إتش بي فيكتوس 16',
        'Experience powerful gaming performance with the HP Victus 16. Featuring an Intel Core i7 processor and NVIDIA RTX graphics, this laptop is built for speed and immersion.', 'استمتع بأداء ألعاب قوي مع إتش بي فيكتوس 16. يتميز بمعالج إنتل كور i7 ورسومات إنفيديا RTX، تم بناء هذا اللابتوب للسرعة والانغماس.',
        'HP-VIC-16', 'laptops', 12500.00, 11800.00, 13500.00,
        15, 'active', ARRAY['/products/hp-victus.png'],
        ARRAY['144Hz Refresh Rate', 'Ray Tracing Support', 'Enhanced Cooling System'],
        ARRAY['معدل تحديث 144 هرتز', 'دعم تتبع الأشعة', 'نظام تبريد محسن']
    ),
    (
        'Dell XPS 15 9530 laptop', 'لابتوب ديل إكس بي إس 15',
        'The Dell XPS 15 is the ultimate creative tool, with a stunning InfinityEdge display and top-tier performance for professionals.', 'يعتبر ديل إكس بي إس 15 الأداة الإبداعية المثالية، مع شاشة InfinityEdge مذهلة وأداء من الدرجة الأولى للمحترفين.',
        'DELL-XPS-15', 'laptops', 18900.00, 17500.00, 19999.00,
        10, 'active', ARRAY['/products/dell-xps.png'],
        ARRAY['4K OLED Display', 'Premium Aluminum Chassis', 'Long Battery Life'],
        ARRAY['شاشة 4K OLED', 'هيكل ألومنيوم فاخر', 'بطارية تدوم طويلاً']
    ),
    (
        'NVIDIA GeForce RTX 4090 Founders Edition', 'بطاقة رسوميات إنفيديا جي فورس آر تي إكس 4090',
        'The ultimate GPU for gamers and creators. Powered by Ada Lovelace architecture for unprecedented performance and AI-driven graphics.', 'أقوى بطاقة رسوميات للاعبين والمبدعين. مدعومة بمعمارية Ada Lovelace لأداء غير مسبوق ورسومات مدعومة بالذكاء الاصطناعي.',
        'NV-RTX-4090', 'components', 24500.00, 23000.00, NULL,
        5, 'active', ARRAY['/products/nvidia-rtx4090.png'],
        ARRAY['24GB GDDR6X VRAM', 'DLSS 3.0 Technology', 'Extreme Gaming Performance'],
        ARRAY['ذاكرة 24 جيجابايت GDDR6X', 'تقنية DLSS 3.0', 'أداء ألعاب فائق']
    ),
    (
        'HP LaserJet Pro M404n Monochrome Printer', 'طابعة إتش بي ليزر جيت برو M404n',
        'Efficient monochrome laser printing for small businesses. Fast print speeds and robust security to keep your workflow moving.', 'طباعة ليزر أحادية اللون فعالة للشركات الصغيرة. سرعات طباعة عالية وأمان قوي للحفاظ على سير عملك.',
        'HP-LJ-M404N', 'printers', 3200.00, 2950.00, 3500.00,
        25, 'active', ARRAY['/products/hp-laserjet.png'],
        ARRAY['Fast 40ppm Print Speed', 'Built-in Security', 'Compact Design'],
        ARRAY['سرعة طباعة 40 صفحة في الدقيقة', 'أمان مدمج', 'تصميم مدمج']
    ),
    (
        'Dell UltraSharp 27 4K Hub Monitor U2723QE', 'شاشة ديل ألترا شارب 27 بوصة 4K',
        'Outstanding 4K resolution and color accuracy with IPS Black technology. A versatile USB-C hub monitor for the modern workspace.', 'دقة 4K رائعة ودقة ألوان مع تقنية IPS Black. شاشة USB-C hub متعددة الاستخدامات لمساحة العمل الحديثة.',
        'DELL-U2723QE', 'monitors', 6800.00, 6400.00, 7200.00,
        12, 'active', ARRAY['/products/dell-monitor.png'],
        ARRAY['IPS Black Technology', 'USB-C Connectivity', '98% DCI-P3 Color Gamut'],
        ARRAY['تقنية IPS Black', 'اتصال USB-C', 'تغطية ألوان 98% DCI-P3']
    );
