"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

type Language = "en" | "ar"
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
        "common.currency": "EGP",
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
        "header.face_care": "Face Care",
        "header.face_care_desc": "Serums, creams & oils",
        "header.hair_care": "Hair Care",
        "header.hair_care_desc": "Treatments & masks",
        "header.body_care": "Body Care",
        "header.body_care_desc": "Lotions & butters",
        "header.gift_sets": "Gift Sets",
        "header.gift_sets_desc": "Curated bundles",
        "header.new_arrival": "New Arrival",
        "header.argan_elixir": "Argan Hair Elixir",
        "header.argan_elixir_desc": "Revolutionary formula for silky smooth hair",
        "header.signature": "Signature",
        "header.essentials": "Essentials",
        "header.premium": "Premium",

        // Hero
        "hero.title_prefix": "The Secret of",
        "hero.title_suffix": "Moroccan Beauty",
        "hero.subtitle": "Discover the transformative power of pure argan oil. Luxurious skincare crafted from Morocco's liquid gold.",
        "hero.shop_collection": "Shop the Collection",
        "hero.explore_best_sellers": "Explore Best Sellers",
        "hero.fast_delivery": "Fast Delivery",
        "hero.secure_checkout": "Secure Checkout",
        "hero.easy_returns": "Easy Returns",
        "hero.pure_argan_oil": "Pure Argan Oil",
        "hero.cold_pressed": "Cold Pressed",

        // Sections
        "section.featured_collections": "Featured Collections",
        "section.featured_desc": "Explore our curated collections of premium argan-based products",
        "section.best_sellers": "Categories",
        "section.best_sellers_desc": "Show all our categories here",
        "section.all_categories": "All",
        "section.view_all_products": "View All Products",
        "section.load_more": "Load More",
        "section.why_choose": "Why Choose Diar Argan?",
        "section.organic": "100% Organic",
        "section.organic_desc": "Pure, certified organic argan oil",
        "section.award_winning": "Award Winning",
        "section.award_winning_desc": "Recognized for excellence in cosmetics",
        "section.cruelty_free": "Cruelty Free",
        "section.cruelty_free_desc": "Never tested on animals",
        "section.handcrafted": "Handcrafted",
        "section.handcrafted_desc": "Artisanally made in Morocco",
        "section.limited_offer": "Limited Time Offer",
        "section.promo_title": "25% Off Your First Order",
        "section.promo_desc": "Experience the magic of Moroccan argan oil. Use code WELCOME25 at checkout.",
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
        "product.key_benefits": "Key Benefits",
        "product.ingredients": "Ingredients",
        "product.how_to_use": "How to Use",
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
        "cart.trust.shipping": "Free Shipping EGP 750+",
        "cart.trust.secure": "Secure Payment",
        "cart.trust.returns": "30-Day Returns",

        // FAQ
        "faq.title": "Frequently Asked Questions",
        "faq.subtitle": "Everything you need to know about our products",
        "faq.q1": "What is argan oil and where does it come from?",
        "faq.a1": "Argan oil is a precious oil extracted from the kernels of the argan tree, native to Morocco. Our oil is 100% organic, cold-pressed, and sourced directly from cooperatives in Morocco.",
        "faq.q2": "How long does shipping take?",
        "faq.a2": "We offer fast shipping! Orders within Europe typically arrive in 2-4 business days. International orders take 5-8 business days.",
        "faq.q3": "What is your return policy?",
        "faq.a3": "We love our products and think you will too! If you're not satisfied, we offer a 30-day money-back guarantee on all orders.",
        "faq.q4": "Are your products cruelty-free?",
        "faq.a4": "Yes, absolutely. We are Leaping Bunny certified. We never test on animals and neither do our suppliers.",
        "faq.q5": "How should I store argan oil?",
        "faq.a5": "Store in a cool, dark place away from direct sunlight to preserve its properties. Our dark amber glass bottles help protect the oil.",
        "faq.q6": "Can I use argan oil on sensitive skin?",
        "faq.a6": "Yes! Pure argan oil is non-comedogenic and gentle, making it perfect for sensitive and acne-prone skin. Always do a patch test first.",

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
        "footer.about_desc": "Authentic Moroccan beauty, crafted with care. We bring you the purest organic Argan oil, directly from the source to your daily routine.",
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
        "common.currency": "ج.م",
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
        "header.face_care": "العناية بالوجه",
        "header.face_care_desc": "سيروم، كريمات وزيوت",
        "header.hair_care": "العناية بالشعر",
        "header.hair_care_desc": "علاجات وأقنعة",
        "header.body_care": "العناية بالجسم",
        "header.body_care_desc": "لوشن وزبدة الجسم",
        "header.gift_sets": "مجموعات الهدايا",
        "header.gift_sets_desc": "باقات مختارة",
        "header.new_arrival": "وصل حديثاً",
        "header.argan_elixir": "إكسير الأرغان للشعر",
        "header.argan_elixir_desc": "تركيبة ثورية لشعر ناعم كالحرير",
        "header.signature": "المميزة",
        "header.essentials": "الأساسية",
        "header.premium": "الفاخرة",

        // Hero
        "hero.title_prefix": "سر",
        "hero.title_suffix": "الجمال المغربي",
        "hero.subtitle": "اكتشفي القوة التحويلية لزيت الأرغان النقي. عناية فاخرة بالبشرة مصنوعة من الذهب السائل المغربي.",
        "hero.shop_collection": "تسوقي المجموعة",
        "hero.explore_best_sellers": "استكشفي الأكثر مبيعاً",
        "hero.fast_delivery": "توصيل سريع",
        "hero.secure_checkout": "دفع آمن",
        "hero.easy_returns": "إرجاع سهل",
        "hero.pure_argan_oil": "زيت أرغان نقي",
        "hero.cold_pressed": "معصور على البارد",

        // Sections
        "section.featured_collections": "مجموعات مميزة",
        "section.featured_desc": "استكشفي مجموعاتنا المختارة من منتجات الأرغان الفاخرة",
        "section.certifications": "معتمد للجودة والنقاء",
        "section.best_sellers": "الأقسام",
        "section.best_sellers_desc": "استعرضي جميع أقسامنا هنا",
        "section.all_categories": "الكل",
        "section.view_all_products": "عرض كل المنتجات",
        "section.load_more": "تحميل المزيد",
        "section.why_choose": "لماذا تختارين ديار أرغان؟",
        "section.organic": "عضوي 100%",
        "section.organic_desc": "زيت أرغان نقي وعضوي معتمد",
        "section.award_winning": "حائز على جوائز",
        "section.award_winning_desc": "معترف به للتميز في مستحضرات التجميل",
        "section.cruelty_free": "خالي من القسوة",
        "section.cruelty_free_desc": "لم يتم اختباره على الحيوانات أبداً",
        "section.handcrafted": "صناعة يدوية",
        "section.handcrafted_desc": "صنع بحرفية في المغرب",
        "section.limited_offer": "عرض لفترة محدودة",
        "section.promo_title": "خصم 25% على طلبك الأول",
        "section.promo_desc": "جربي سحر زيت الأرغان المغربي. استخدمي الكود WELCOME25 عند الدفع.",
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
        "footer.about_desc": "جمال مغربي أصيل، مصنوع بعناية. نقدم لك أقى زيت أرغان عضوي، من المصدر مباشرة لروتينك اليومي.",
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
        "product.key_benefits": "الفوائد الرئيسية",
        "product.ingredients": "المكونات",
        "product.how_to_use": "كيفية الاستخدام",
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
        "cart.trust.shipping": "شحن مجاني فوق 750 ج.م",
        "cart.trust.secure": "دفع آمن",
        "cart.trust.returns": "إرجاع خلال 30 يوم",

        // FAQ
        "faq.title": "أسئلة شائعة",
        "faq.subtitle": "كل اللي محتاج تعرفه عن منتجاتنا",
        "faq.q1": "ايه هو زيت الأرغان وبيجي منين؟",
        "faq.a1": "زيت الأرغان هو زيت ثمين بيستخرج من حبات شجرة الأرغان، وموطنها الأصلي المغرب. الزيت بتاعنا عضوي 100%، معصور على البارد، وبنجيبه مباشرة من تعاونيات في المغرب.",
        "faq.q2": "الشحن بياخد وقت قد ايه؟",
        "faq.a2": "بنوفر شحن سريع! الطلبات داخل أوروبا بتوصل عادة في 2-4 أيام عمل. الطلبات الدولية بتاخد 5-8 أيام عمل.",
        "faq.q3": "ايه هي سياسة الاسترجاع؟",
        "faq.a3": "احنا بنحب منتجاتنا وواثقين انك هتحبها كمان! لو مش راضي عنها، بنقدم ضمان استرجاع الفلوس لمدة 30 يوم على كل الطلبات.",
        "faq.q4": "هل منتجاتكم خالية من القسوة؟",
        "faq.a4": "أيوه، بالتأكيد. احنا معتمدين من Leaping Bunny. عمرنا ما بنجرب على الحيوانات ولا الموردين بتوعنا.",
        "faq.q5": "ازاي المفروض أخزن زيت الأرغان؟",
        "faq.a5": "احفظه في مكان بارد وضلمة بعيد عن ضوء الشمس المباشر عشان تحافظ على خصايصه. ازايزنا الزجاجية الغامقة بتساعد في حماية الزيت.",
        "faq.q6": "هل ممكن أستخدم زيت الأرغان على البشرة الحساسة؟",
        "faq.a6": "أيوه! زيت الأرغان النقي مش بيسد المسام ولطيف جداً، وده بيخليه ممتاز للبشرة الحساسة والمعرضة للحبوب. بس دايماً اعمل اختبار حساسية الأول.",

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
    }
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>("en")

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
        setLanguage(prev => prev === "en" ? "ar" : "en")
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
