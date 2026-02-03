"use client"

import Link from "next/link"
import { ArrowLeft, Truck } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

export default function ShippingInfoPage() {
  const { language } = useLanguage()
  const isArabic = language === "ar"

  return (
    <div className={`min-h-screen bg-background ${isArabic ? "font-[var(--font-almarai)]" : ""}`}>
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isArabic ? "العودة إلى الرئيسية" : "Back to Home"}</span>
          </Link>
          <span className="text-xs text-muted-foreground uppercase tracking-[0.25em]">
            {isArabic ? "معلومات الشحن" : "Shipping Info"}
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 sm:py-14 max-w-4xl">
        <h1 className={`text-2xl sm:text-3xl font-bold mb-6 ${isArabic ? "text-right" : ""}`}>
          {isArabic ? "سياسة الشحن لدى ديدالي – مصر" : "Dedali Egypt – Shipping Information"}
        </h1>
        <div className={`space-y-5 text-sm sm:text-base text-muted-foreground leading-relaxed ${isArabic ? "text-right" : ""}`}>
          <p>
            {isArabic
              ? "نقدم خدمة توصيل للطلبات داخل جمهورية مصر العربية من خلال شركاء شحن موثوقين، مع الحرص على توصيل منتجات ديدالي بأفضل حالة."
              : "We deliver orders across Egypt using trusted courier partners, ensuring your Dedali products arrive in the best condition."}
          </p>

          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Truck className="w-4 h-4 text-primary" />
            {isArabic ? "١. مدة التوصيل" : "1. Delivery times"}
          </h2>
          <p>
            {isArabic
              ? "عادةً ما يتم توصيل الطلبات داخل القاهرة والجيزة خلال 1–3 أيام عمل، وداخل باقي المحافظات خلال 2–5 أيام عمل، حسب شركة الشحن والمنطقة."
              : "Orders in Cairo and Giza are typically delivered within 1–3 business days, and within 2–5 business days for other governorates, depending on the courier and location."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "٢. رسوم الشحن" : "2. Shipping fees"}
          </h2>
          <p>
            {isArabic
              ? "رسوم الشحن تختلف حسب المحافظة وقيمة الطلب. في بعض العروض، قد نقدم شحنًا مجانيًا للطلبات التي تتجاوز مبلغًا معينًا كما هو موضح في صفحة الدفع."
              : "Shipping fees vary by governorate and order value. During some promotions, we may offer free shipping above a certain order amount, as shown at checkout."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "٣. متابعة الشحنة" : "3. Tracking your shipment"}
          </h2>
          <p>
            {isArabic
              ? "بعد شحن الطلب، يمكن أن تتلقى رسالة نصية أو WhatsApp من شركة الشحن برقم التتبع أو تفاصيل التوصيل. في حال وجود أي استفسار، يمكنك التواصل معنا عبر صفحة اتصل بنا."
              : "Once your order is dispatched, you may receive an SMS or WhatsApp from the courier with tracking details. For any questions, you can reach us via the Contact Us page."}
          </p>
        </div>
      </main>
    </div>
  )
}

