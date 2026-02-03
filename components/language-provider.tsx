"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

type Language = "en" | "ar" | "fr"
type Direction = "ltr" | "rtl"

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: string) => string
    dir: Direction
    toggleLanguage: () => void
}

const translations = {
    en: {
        "common.currency": "MAD",
        // Navigation
        "nav.shop": "Shop",
        "nav.collections": "Collections",
        "nav.about": "About",
        "nav.faq": "FAQ",
        "nav.search": "Search",
        "nav.shop_now": "Shop Now",
        "nav.view_all_collections": "View All Collections",

        // Header Popups
        "header.categories": "Categories",
        "header.browse_by_category": "Browse by Category",
        "header.face_care": "Computers & Laptops",
        "header.face_care_desc": "High performance workstations",
        "header.hair_care": "Servers & Storage",
        "header.hair_care_desc": "Enterprise grade solutions",
        "header.body_care": "Printers & Scanners",
        "header.body_care_desc": "Professional printing",
        "header.gift_sets": "Components",
        "header.gift_sets_desc": "Processors, RAM & more",
        "header.new_arrival": "New Arrival",
        "header.argan_elixir": "Gaming Rigs",
        "header.argan_elixir_desc": "Ultimate performance for gamers",
        "header.signature": "Enterprise",
        "header.essentials": "Home Office",
        "header.premium": "Gaming",

        // Hero
        "hero.title_prefix": "Dedali",
        "hero.title_suffix": "Store",
        "hero.subtitle": "Leader in IT distribution in Morocco. Wholesale provider of PCs, servers, printers, and more.",
        "hero.shop_collection": "Browse Products",
        "hero.explore_best_sellers": "View Best Sellers",
        "hero.fast_delivery": "Fast Delivery",
        "hero.secure_checkout": "Secure Payment",
        "hero.easy_returns": "Official Warranty",
        "hero.pure_argan_oil": "Genuine Products",
        "hero.cold_pressed": "Best Prices",

        // Sections
        "section.featured_collections": "Featured Departments",
        "section.featured_desc": "Browse our wide range of IT equipment",
        "section.best_sellers": "Categories",
        "section.best_sellers_desc": "Show all our categories here",
        "section.all_categories": "All",
        "section.view_all_products": "View All Products",
        "section.load_more": "Load More",
        "section.why_choose": "Why Choose Dedali Store?",
        "section.organic": "100% Genuine",
        "section.organic_desc": "Authentic products from top brands",
        "section.award_winning": "Industry Leader",
        "section.award_winning_desc": "More than 20 years of experience",
        "section.cruelty_free": "Full Warranty",
        "section.cruelty_free_desc": "Official manufacturer warranty",
        "section.handcrafted": "Expert Support",
        "section.handcrafted_desc": "Technical guidance from IT professionals",
        "section.limited_offer": "Limited Time Offer",
        "section.promo_title": "25% Off Your First Order",
        "section.promo_desc": "Get the best deal on your first order. Use code WELCOME25 at checkout.",
        "section.get_offer": "Get the Offer",
        "section.hurry_up": "Hurry Up!",
        "section.view_collection": "View Collection",

        // Newsletter
        "newsletter.title": "Stay in the Loop",
        "newsletter.desc": "Subscribe for exclusive offers, skincare tips, and new product launches.",
        "newsletter.placeholder": "Enter your email",
        "newsletter.subscribe": "Subscribe",
        "newsletter.disclaimer": "By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.",

        // Footer
        "footer.company": "Company",
        "footer.support": "Support",
        "footer.legal": "Legal",
        "footer.our_story": "Our Story",
        "footer.sustainability": "Sustainability",
        "footer.press": "Press",
        "footer.careers": "Careers",
        "footer.contact_us": "Contact Us",
        "footer.shipping_info": "Shipping Info",
        "footer.track_order": "Track Order",
        "footer.privacy_policy": "Privacy Policy",
        "footer.terms": "Terms of Service",
        "footer.refund_policy": "Refund Policy",
        "footer.cookies": "Cookies",
        "footer.rights": "All rights reserved.",

        // Product & Cart
        "product.add_to_cart": "Add to Cart",
        "product.reviews": "reviews",
        "product.in_stock": "In Stock",
        "product.out_of_stock": "Out of Stock",
        "product.select_size": "Select Size",
        "product.quantity": "Quantity",
        "product.features": "Key Features",
        "product.specifications": "Technical Specifications",
        "product.warranty": "Warranty & Support",
        "product.you_may_also_like": "You May Also Like",
        "cart.your_cart_empty": "Your Cart is Empty",
        "cart.empty_desc": "Looks like you haven't added any items to your cart yet.",
        "cart.start_shopping": "Start Shopping",
        "cart.shopping_cart": "Shopping Cart",
        "cart.items": "items",
        "cart.order_summary": "Order Summary",
        "cart.subtotal": "Subtotal",
        "cart.shipping": "Shipping",
        "cart.free": "Free",
        "cart.total": "Total",
        "cart.proceed_checkout": "Proceed to Checkout",
        "cart.promo_code": "Promo Code",
        "cart.apply": "Apply",
        "cart.applied": "Applied",
        "cart.enter_code": "Enter code",
        "cart.discount_applied": "discount applied!",
        "cart.add_more_shipping": "Add more for free shipping",
        "cart.continue_shopping": "Continue Shopping",
        "cart.trust.shipping": "Free Shipping MAD 750+",
        "cart.trust.secure": "Secure Payment",
        "cart.trust.returns": "30-Day Returns",

        // FAQ
        "faq.title": "Frequently Asked Questions",
        "faq.subtitle": "Everything you need to know about our products",
        "faq.q1": "What kind of products do you sell?",
        "faq.a1": "We are a wholesale distributor of IT equipment including PCs, laptops, servers, printers, and networking gear from top brands.",
        "faq.q2": "Do you offer warranty?",
        "faq.a2": "Yes, all our products come with official manufacturer warranty.",
        "faq.q3": "Do you sell to individuals?",
        "faq.a3": "We primarily serve businesses and resellers, but we also sell to individuals.",
        "faq.q4": "Where are you located?",
        "faq.a4": "We are based in Morocco and serve customers nationwide.",
        "faq.q5": "How can I get a quote?",
        "faq.a5": "You can request a quote through our website or contact our sales team directly.",
        "faq.q6": "Do you provide technical support?",
        "faq.a6": "Yes, our team of experts can assist you with technical inquiries and solution design.",

        // Checkout
        "checkout.title": "Checkout",
        "checkout.contact_info": "Contact Information",
        "checkout.full_name": "Full Name",
        "checkout.phone": "Phone Number",
        "checkout.email": "Email (Optional)",
        "checkout.city": "City",
        "checkout.address": "Address",
        "checkout.pay": "Pay",
        "checkout.processing": "Processing...",
        "checkout.success_title": "Order Confirmed!",
        "checkout.success_desc": "We have received your order. We will call you shortly to confirm the details.",
        "checkout.continue_shopping": "Continue Shopping",
        "checkout.cancel_title": "Payment Cancelled",
        "checkout.cancel_desc": "Your payment was cancelled. No charges were made.",
        "checkout.return_cart": "Return to Cart",
        "checkout.retry": "Retry Payment",
        "validation.required": "This field is required",
        "validation.phone": "Please enter a valid phone number (min 10 chars)",
        "validation.email": "Please enter a valid email address",

        // Success Page
        "success.thank_you": "Thank You",
        "success.order_confirmed": "Your order is confirmed",
        "success.coupon_title": "A special gift for you",
        "success.coupon_desc": "Use this code for 20% off your next purchase",
        "success.order_summary": "Order Summary",
        "footer.about_desc": "Dedali Store - Your trusted partner for IT hardware and solutions in Morocco. Empowering businesses with technology.",
        "footer.privacy_short": "Privacy",
        "footer.terms_short": "Terms",
        "footer.system_status": "System Normal",

        // WhatsApp
        "whatsapp.title": "Stay in the Loop on WhatsApp",
        "whatsapp.desc": "Join our VIP list for exclusive discounts, skincare tips, and early access to new launches directly to your phone.",
        "whatsapp.placeholder": "Phone number",
        "whatsapp.button": "Join Now",
        "whatsapp.success_title": "You're on the list!",
        "whatsapp.success_desc": "Thank you for subscribing. We've sent a welcome gift to your WhatsApp.",
        "whatsapp.disclaimer": "By joining, you agree to receive marketing messages on WhatsApp. Opt-out anytime.",
        "whatsapp.register_another": "Register Another Number",
        "whatsapp.verified_updates": "Verified WhatsApp Updates",
        "whatsapp.processing": "Processing...",

        // Timer
        "timer.days": "Days",
        "timer.hours": "Hours",
        "timer.minutes": "Minutes",
        "timer.seconds": "Seconds",
        "timer.loading": "Loading Products...",

        // Accessibility
        "accessibility.go_to_slide": "Go to slide",
    },
    ar: {
        "common.currency": "د.م",
        // Navigation
        "nav.shop": "المتجر",
        "nav.collections": "المجموعات",
        "nav.about": "من نحن",
        "nav.faq": "أسئلة شائعة",
        "nav.search": "بحث",
        "nav.shop_now": "تسوق الآن",
        "nav.view_all_collections": "عرض كل المجموعات",

        // Header Popups
        "header.categories": "الأقسام",
        "header.browse_by_category": "تصفح حسب القسم",
        "header.face_care": "حواسيب ولابتوب",
        "header.face_care_desc": "محطات عمل عالية الأداء",
        "header.hair_care": "خوادم وتخزين",
        "header.hair_care_desc": "حلول للمؤسسات",
        "header.body_care": "طابعات وماسحات",
        "header.body_care_desc": "طباعة احترافية",
        "header.gift_sets": "إكسسوارات",
        "header.gift_sets_desc": "معالجات وذواكر والمزيد",
        "header.new_arrival": "وصل حديثاً",
        "header.argan_elixir": "أجهزة ألعاب",
        "header.argan_elixir_desc": "أداء فائق للألعاب",
        "header.signature": "مؤسسات",
        "header.essentials": "مكاتب",
        "header.premium": "ألعاب",

        // Hero
        "hero.title_prefix": "متجر",
        "hero.title_suffix": "ديدالي",
        "hero.subtitle": "الرائد في توزيع معدات تكنولوجيا المعلومات في المغرب. بيع بالجملة للحواسيب، الخوادم، الطابعات والمزيد.",
        "hero.shop_collection": "تصفح المنتجات",
        "hero.explore_best_sellers": "استكشف الأكثر مبيعاً",
        "hero.fast_delivery": "توصيل سريع",
        "hero.secure_checkout": "دفع آمن",
        "hero.easy_returns": "ضمان رسمي",
        "hero.pure_argan_oil": "منتجات أصلية",
        "hero.cold_pressed": "أفضل الأسعار",

        // Sections
        "section.featured_collections": "أقسام مميزة",
        "section.featured_desc": "استكشف مجموعتنا الواسعة من معدات تكنولوجيا المعلومات",
        "section.certifications": "معتمد للجودة والنقاء",
        "section.best_sellers": "الأقسام",
        "section.best_sellers_desc": "استعرضي جميع أقسامنا هنا",
        "section.all_categories": "الكل",
        "section.view_all_products": "عرض كل المنتجات",
        "section.load_more": "تحميل المزيد",
        "section.why_choose": "لماذا تختار ديدالي ستور؟",
        "section.organic": "أصلي 100%",
        "section.organic_desc": "منتجات أصلية من أفضل العلامات التجارية",
        "section.award_winning": "رائد الصناعة",
        "section.award_winning_desc": "أكثر من 20 عاماً من الخبرة",
        "section.cruelty_free": "ضمان كامل",
        "section.cruelty_free_desc": "ضمان المصنع الرسمي",
        "section.handcrafted": "دعم خبراء",
        "section.handcrafted_desc": "توجيه فني من محترفي تكنولوجيا المعلومات",
        "section.limited_offer": "عرض لفترة محدودة",
        "section.promo_title": "خصم 25% على طلبك الأول",
        "section.promo_desc": "احصل على أفضل صفقة في طلبك الأول. استخدم الكود WELCOME25 عند الدفع.",
        "section.get_offer": "احصلي على العرض",
        "section.hurry_up": "سارعي!",
        "section.view_collection": "شفي المجموعة",

        // Newsletter
        "newsletter.title": "ابقي على تواصل",
        "newsletter.desc": "اشتركي للحصول على عروض حصرية، نصائح للعناية بالبشرة، وإطلاق المنتجات الجديدة.",
        "newsletter.placeholder": "أدخلي بريدك الإلكتروني",
        "newsletter.subscribe": "اشترك",
        "newsletter.disclaimer": "بالاشتراك، أنت توافقين على سياسة الخصوصية الخاصة بنا. يمكنك إلغاء الاشتراك في أي وقت.",

        // WhatsApp
        "whatsapp.title": "خليك على تواصل عبر واتساب",
        "whatsapp.desc": "انضمي لقائمتنا المميزة عشان يوصلك خصومات حصرية، نصائح للعناية، وأولوية الوصول للمنتجات الجديدة مباشرة على موبايلك.",
        "whatsapp.placeholder": "رقم الموبايل",
        "whatsapp.button": "انضمي دلوقتي",
        "whatsapp.success_title": "أهلاً بيكي في القائمة!",
        "whatsapp.success_desc": "شكراً لاشتراكك. بعتنالك هدية ترحيبية على واتساب.",
        "whatsapp.disclaimer": "بالانضمام، انتي بتوافقي انك تستقبلي رسائل تسويقية على واتساب. تقدري تلغي الاشتراك في أي وقت.",


        // Footer
        "footer.company": "الشركة",
        "footer.support": "الدعم",
        "footer.legal": "قانوني",
        "footer.our_story": "قصتنا",
        "footer.sustainability": "الاستدامة",
        "footer.press": "الصحافة",
        "footer.careers": "وظائف",
        "footer.contact_us": "اتصل بنا",
        "footer.shipping_info": "معلومات الشحن",
        "footer.track_order": "تتبع الطلب",
        "footer.privacy_policy": "سياسة الخصوصية",
        "footer.terms": "شروط الخدمة",
        "footer.refund_policy": "سياسة الاسترجاع",
        "footer.cookies": "ملفات تعريف الارتباط",
        "footer.rights": "جميع الحقوق محفوظة.",
        "footer.about_desc": "متجر ديدالي - شريكك الموثوق لحلول تكنولوجيا المعلومات في المغرب. نمكن الشركات بالتكنولوجيا.",
        "footer.privacy_short": "الخصوصية",
        "footer.terms_short": "الشروط",
        "footer.system_status": "النظام يعمل",

        // Product & Cart
        "product.add_to_cart": "أضف إلى السلة",
        "product.reviews": "مراجعات",
        "product.in_stock": "متوفر",
        "product.out_of_stock": "غير متوفر",
        "product.select_size": "اختر الحجم",
        "product.quantity": "الكمية",
        "product.features": "المميزات الرئيسية",
        "product.specifications": "المواصفات التقنية",
        "product.warranty": "الضمان والدعم",
        "product.you_may_also_like": "قد يعجبك أيضاً",
        "cart.your_cart_empty": "سلة التسوق فارغة",
        "cart.empty_desc": "يبدو أنك لم تضف أي منتجات إلى سلتك بعد.",
        "cart.start_shopping": "ابدأ التسوق",
        "cart.shopping_cart": "سلة التسوق",
        "cart.items": "منتجات",
        "cart.order_summary": "ملخص الطلب",
        "cart.subtotal": "المجموع الفرعي",
        "cart.shipping": "الشحن",
        "cart.free": "مجاني",
        "cart.total": "المجموع",
        "cart.proceed_checkout": "إتمام الشراء",
        "cart.promo_code": "كود الخصم",
        "cart.apply": "تطبيق",
        "cart.applied": "تم التطبيق",
        "cart.enter_code": "أدخل الكود",
        "cart.discount_applied": "تم تطبيق الخصم!",
        "cart.add_more_shipping": "أضف المزيد للحصول على شحن مجاني",
        "cart.continue_shopping": "مواصلة التسوق",
        "cart.trust.shipping": "شحن مجاني فوق 750 د.م",
        "cart.trust.secure": "دفع آمن",
        "cart.trust.returns": "إرجاع خلال 30 يوم",

        // FAQ
        "faq.title": "أسئلة شائعة",
        "faq.subtitle": "كل اللي محتاج تعرفه عن منتجاتنا",
        "faq.q1": "ما هي المنتجات التي تبيعونها؟",
        "faq.a1": "نحن موزع بالجملة لمعدات تكنولوجيا المعلومات بما في ذلك أجهزة الكمبيوتر والمحمول والخوادم والطابعات ومعدات الشبكات.",
        "faq.q2": "هل تقدمون ضمان؟",
        "faq.a2": "نعم، جميع منتجاتنا تأتي بضمان المصنع الرسمي.",
        "faq.q3": "هل تبيعون للأفراد؟",
        "faq.a3": "نحن نخدم الشركات والموزعين بشكل أساسي، ولكننا نبيع أيضًا للأفراد.",
        "faq.q4": "أين موقعكم؟",
        "faq.a4": "مقرنا في المغرب ونخدم العملاء في جميع أنحاء المملكة.",
        "faq.q5": "كيف يمكنني الحصول على عرض سعر؟",
        "faq.a5": "يمكنك طلب عرض سعر من خلال موقعنا الإلكتروني أو الاتصال بفريق المبيعات مباشرة.",
        "faq.q6": "هل تقدمون دعماً فنياً؟",
        "faq.a6": "نعم، فريق خبرائنا يمكنه مساعدتك في الاستفسارات الفنية وتصميم الحلول.",

        // Checkout
        "checkout.title": "إتمام الطلب",
        "checkout.contact_info": "معلومات الاتصال",
        "checkout.full_name": "الاسم الكامل",
        "checkout.phone": "رقم الهاتف",
        "checkout.email": "البريد الإلكتروني (اختياري)",
        "checkout.city": "المدينة",
        "checkout.address": "العنوان",
        "checkout.pay": "دفع",
        "checkout.processing": "جاري المعالجة...",
        "checkout.success_title": "تم تأكيد الطلب!",
        "checkout.continue_shopping": "مواصلة التسوق",
        "checkout.cancel_title": "تم إلغاء الدفع",
        "checkout.cancel_desc": "تم إلغاء عملية الدفع. لم يتم خصم أي مبلغ.",
        "checkout.return_cart": "العودة للسلة",
        "checkout.retry": "إعادة المحاولة",
        "validation.required": "هذا الحقل مطلوب",
        "validation.phone": "يرجى إدخال رقم هاتف صحيح (أكثر من 10 أرقام)",
        "validation.email": "يرجى إدخال بريد إلكتروني صحيح",

        // Success Page
        "success.thank_you": "شكراً لك",
        "success.order_confirmed": "تم استلام طلبك",
        "checkout.success_desc": "لقد استلمنا طلبك. سنتصل بك قريباً لتأكيد التفاصيل.",
        "success.coupon_title": "هدية خاصة لك",
        "success.coupon_desc": "استخدم هذا الكود لخصم 20% على طلبك القادم",
        "success.order_summary": "ملخص الطلب",

        // WhatsApp New
        "whatsapp.register_another": "تسجيل رقم آخر",
        "whatsapp.verified_updates": "تحديثات واتساب موثقة",
        "whatsapp.processing": "جاري المعالجة...",

        // Timer
        "timer.days": "أيام",
        "timer.hours": "ساعات",
        "timer.minutes": "دقائق",
        "timer.seconds": "ثواني",
        "timer.loading": "جاري تحميل المنتجات...",

        // Accessibility
        "accessibility.go_to_slide": "اذهب للشريحة",
    },
    fr: {
        "common.currency": "MAD",
        // Navigation
        "nav.shop": "Boutique",
        "nav.collections": "Collections",
        "nav.about": "À propos",
        "nav.faq": "FAQ",
        "nav.search": "Rechercher",
        "nav.shop_now": "Acheter",
        "nav.view_all_collections": "Voir toutes les collections",

        // Header Popups
        "header.categories": "Catégories",
        "header.browse_by_category": "Parcourir par catégorie",
        "header.face_care": "Ordinateurs & Portables",
        "header.face_care_desc": "Stations de travail haute performance",
        "header.hair_care": "Serveurs & Stockage",
        "header.hair_care_desc": "Solutions pour entreprises",
        "header.body_care": "Imprimantes & Scanners",
        "header.body_care_desc": "Impression professionnelle",
        "header.gift_sets": "Composants",
        "header.gift_sets_desc": "Processeurs, RAM & plus",
        "header.new_arrival": "Nouveautés",
        "header.argan_elixir": "Gaming",
        "header.argan_elixir_desc": "Performance ultime pour gamers",
        "header.signature": "Entreprise",
        "header.essentials": "Bureau",
        "header.premium": "Gaming",

        // Hero
        "hero.title_prefix": "Dedali",
        "hero.title_suffix": "Store",
        "hero.subtitle": "Leader de la distribution informatique au Maroc. Grossiste en PC, serveurs, imprimantes et plus.",
        "hero.shop_collection": "Parcourir les produits",
        "hero.explore_best_sellers": "Voir les meilleures ventes",
        "hero.fast_delivery": "Livraison Rapide",
        "hero.secure_checkout": "Paiement Sécurisé",
        "hero.easy_returns": "Garantie Officielle",
        "hero.pure_argan_oil": "Produits Authentiques",
        "hero.cold_pressed": "Meilleurs Prix",

        // Sections
        "section.featured_collections": "Départements Vedettes",
        "section.featured_desc": "Découvrez notre large gamme d'équipements informatiques",
        "section.best_sellers": "Catégories",
        "section.best_sellers_desc": "Afficher toutes nos catégories ici",
        "section.all_categories": "Tout",
        "section.view_all_products": "Voir tous les produits",
        "section.load_more": "Charger plus",
        "section.why_choose": "Pourquoi choisir Dedali Store ?",
        "section.organic": "100% Authentique",
        "section.organic_desc": "Produits authentiques des grandes marques",
        "section.award_winning": "Leader du marché",
        "section.award_winning_desc": "Plus de 20 ans d'expérience",
        "section.cruelty_free": "Garantie Complète",
        "section.cruelty_free_desc": "Garantie constructeur officielle",
        "section.handcrafted": "Support Expert",
        "section.handcrafted_desc": "Conseils techniques par des pros",
        "section.limited_offer": "Offre Limitée",
        "section.promo_title": "25% de remise sur votre 1ère commande",
        "section.promo_desc": "Profitez de la meilleure offre pour votre première commande. Utilisez le code WELCOME25.",
        "section.get_offer": "Profiter de l'offre",
        "section.hurry_up": "Dépêchez-vous !",
        "section.view_collection": "Voir la collection",

        // Newsletter
        "newsletter.title": "Restez informé",
        "newsletter.desc": "Abonnez-vous pour des offres exclusives et les nouveaux lancements de produits.",
        "newsletter.placeholder": "Entrez votre email",
        "newsletter.subscribe": "S'abonner",
        "newsletter.disclaimer": "En vous abonnant, vous acceptez notre politique de confidentialité. Désinscription à tout moment.",

        // WhatsApp
        "whatsapp.title": "Restez connecté sur WhatsApp",
        "whatsapp.desc": "Rejoignez notre liste VIP pour des remises exclusives et un accès prioritaire aux nouveautés.",
        "whatsapp.placeholder": "Numéro de téléphone",
        "whatsapp.button": "Rejoindre maintenant",
        "whatsapp.success_title": "Vous êtes sur la liste !",
        "whatsapp.success_desc": "Merci de votre inscription. Un cadeau de bienvenue vous a été envoyé.",
        "whatsapp.disclaimer": "En rejoignant, vous acceptez de recevoir des messages marketing sur WhatsApp.",
        "whatsapp.register_another": "Inscrire un autre numéro",
        "whatsapp.verified_updates": "Mises à jour vérifiées",
        "whatsapp.processing": "Traitement...",

        // Footer
        "footer.company": "Entreprise",
        "footer.support": "Support",
        "footer.legal": "Légal",
        "footer.our_story": "Notre histoire",
        "footer.sustainability": "Durabilité",
        "footer.press": "Presse",
        "footer.careers": "Carrières",
        "footer.contact_us": "Contactez-nous",
        "footer.shipping_info": "Livraison",
        "footer.track_order": "Suivre ma commande",
        "footer.privacy_policy": "Politique de confidentialité",
        "footer.terms": "Conditions d'utilisation",
        "footer.refund_policy": "Politique de remboursement",
        "footer.cookies": "Cookies",
        "footer.rights": "Tous droits réservés.",
        "footer.about_desc": "Dedali Store - Votre partenaire de confiance pour le matériel et les solutions informatiques au Maroc.",
        "footer.privacy_short": "Confidentialité",
        "footer.terms_short": "Conditions",
        "footer.system_status": "Système Opérationnel",

        // Product & Cart
        "product.add_to_cart": "Ajouter au panier",
        "product.reviews": "avis",
        "product.in_stock": "En Stock",
        "product.out_of_stock": "Rupture de stock",
        "product.select_size": "Choisir la taille",
        "product.quantity": "Quantité",
        "product.features": "Caractéristiques Clés",
        "product.specifications": "Spécifications Techniques",
        "product.warranty": "Garantie & Support",
        "product.you_may_also_like": "Vous aimerez aussi",
        "cart.your_cart_empty": "Votre panier est vide",
        "cart.empty_desc": "Il semblerait que vous n'ayez rien ajouté à votre panier pour le moment.",
        "cart.start_shopping": "Commencer vos achats",
        "cart.shopping_cart": "Panier",
        "cart.items": "articles",
        "cart.order_summary": "Résumé de la commande",
        "cart.subtotal": "Sous-total",
        "cart.shipping": "Livraison",
        "cart.free": "Gratuit",
        "cart.total": "Total",
        "cart.proceed_checkout": "Passer à la caisse",
        "cart.promo_code": "Code Promo",
        "cart.apply": "Appliquer",
        "cart.applied": "Appliqué",
        "cart.enter_code": "Entrer le code",
        "cart.discount_applied": "Remise appliquée !",
        "cart.add_more_shipping": "Ajoutez plus pour la livraison gratuite",
        "cart.continue_shopping": "Continuer vos achats",
        "cart.trust.shipping": "Livraison Gratuite > 750 MAD",
        "cart.trust.secure": "Paiement Sécurisé",
        "cart.trust.returns": "Retours sous 30 jours",

        // FAQ
        "faq.title": "Questions Fréquentes",
        "faq.subtitle": "Tout ce que vous devez savoir sur nos produits",
        "faq.q1": "Quels types de produits vendez-vous ?",
        "faq.a1": "Nous sommes un distributeur grossiste d'équipements informatiques, incluant PC, serveurs, imprimantes et réseaux.",
        "faq.q2": "Offrez-vous une garantie ?",
        "faq.a2": "Oui, tous nos produits sont couverts par la garantie officielle du fabricant.",
        "faq.q3": "Vendez-vous aux particuliers ?",
        "faq.a3": "Nous servons principalement les entreprises et revendeurs, mais vendons aussi aux particuliers.",
        "faq.q4": "Où êtes-vous situés ?",
        "faq.a4": "Nous sommes basés au Maroc et servons des clients dans tout le royaume.",
        "faq.q5": "Comment obtenir un devis ?",
        "faq.a5": "Vous pouvez demander un devis via notre site web ou contacter notre équipe commerciale.",
        "faq.q6": "Fournissez-vous un support technique ?",
        "faq.a6": "Oui, notre équipe d'experts peut vous assister pour vos questions techniques et la conception de solutions.",

        // Checkout
        "checkout.title": "Paiement",
        "checkout.contact_info": "Informations de contact",
        "checkout.full_name": "Nom complet",
        "checkout.phone": "Numéro de téléphone",
        "checkout.email": "Email (Optionnel)",
        "checkout.city": "Ville",
        "checkout.address": "Adresse",
        "checkout.pay": "Payer",
        "checkout.processing": "Traitement...",
        "checkout.success_title": "Commande Confirmée !",
        "checkout.continue_shopping": "Continuer vos achats",
        "checkout.cancel_title": "Paiement Annulé",
        "checkout.cancel_desc": "Votre paiement a été annulé. Aucun débit n'a été effectué.",
        "checkout.return_cart": "Retour au panier",
        "checkout.retry": "Réessayer",
        "validation.required": "Ce champ est requis",
        "validation.phone": "Veuillez entrer un numéro valide (min 10 car.)",
        "validation.email": "Veuillez entrer un email valide",

        // Success Page
        "success.thank_you": "Merci",
        "success.order_confirmed": "Votre commande est confirmée",
        "checkout.success_desc": "Nous avons bien reçu votre commande. Nous vous appellerons bientôt pour confirmer.",
        "success.coupon_title": "Un cadeau pour vous",
        "success.coupon_desc": "Utilisez ce code pour 20% de réduction sur votre prochain achat",
        "success.order_summary": "Résumé de la commande",

        // Timer
        "timer.days": "Jours",
        "timer.hours": "Heures",
        "timer.minutes": "Min",
        "timer.seconds": "Sec",
        "timer.loading": "Chargement...",

        // Accessibility
        "accessibility.go_to_slide": "Aller à la diapositive",
    }
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>("fr")

    useEffect(() => {
        // Check localStorage or browser preference on mount
        const savedLang = localStorage.getItem("language") as Language
        if (savedLang) {
            setLanguage(savedLang)
        }
    }, [])

    useEffect(() => {
        localStorage.setItem("language", language)

        // Update direction on document
        const dir = language === "ar" ? "rtl" : "ltr"
        document.documentElement.dir = dir
        document.documentElement.lang = language
    }, [language])

    const t = (key: string) => {
        return translations[language][key as keyof typeof translations["en"]] || key
    }

    const toggleLanguage = () => {
        setLanguage(prev => {
            if (prev === 'fr') return 'en'
            if (prev === 'en') return 'ar'
            return 'fr'
        })
    }

    return (
        <LanguageContext.Provider value={{
            language,
            setLanguage,
            t,
            dir: language === "ar" ? "rtl" : "ltr",
            toggleLanguage
        }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider")
    }
    return context
}
