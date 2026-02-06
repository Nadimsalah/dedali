"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { ComingSoonPage } from "@/components/coming-soon-page"

export default function TermsPage() {
  const { language } = useLanguage()
  const isArabic = language === "ar"

  // Temporary: Coming soon layout for footer page
  return (
    <ComingSoonPage
      titleEn="Terms of Service"
      titleFr="Conditions d’utilisation"
      subtitleEn="The updated terms and conditions for using Didali Store will be published here very soon."
      subtitleFr="Les conditions générales d’utilisation de Didali Store seront publiées ici très bientôt."
    />
  )

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
            {isArabic ? "شروط الخدمة" : "Terms of Service"}
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 sm:py-14 max-w-4xl">
        <h1 className={`text-2xl sm:text-3xl font-bold mb-6 ${isArabic ? "text-right" : ""}`}>
          {isArabic ? "شروط وأحكام استخدام موقع ديدالي – مصر" : "Didali Egypt – Terms of Service"}
        </h1>
        <div className={`space-y-5 text-sm sm:text-base text-muted-foreground leading-relaxed ${isArabic ? "text-right" : ""}`}>
          <p>
            {isArabic
              ? "باستخدامك لموقع ديدالي في مصر أو إجرائك لأي طلب شراء، فأنت توافق على الشروط والأحكام الموضحة أدناه، والمطبقة وفقًا لأحكام القانون المصري."
              : "By accessing Didali&apos;s website in Egypt or placing an order, you agree to the terms and conditions below, applied in accordance with Egyptian law."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "١. استخدام الموقع" : "1. Use of the website"}
          </h2>
          <p>
            {isArabic
              ? "يُسمح لك باستخدام الموقع لعرض المنتجات وطلبها لأغراض شخصية وغير تجارية فقط. لا يُسمح بأي استخدام غير قانوني أو يضر بديدالي أو بعملائها."
              : "You may use the website to browse and purchase products for personal, non‑commercial use only. Any unlawful use or use that may harm Didali or its customers is prohibited."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "٢. الأسعار والدفع" : "2. Prices and payment"}
          </h2>
          <p>
            {isArabic
              ? "جميع الأسعار بالعملة المصرية (ج.م) وتشمل الضرائب المطبقة ما لم يُذكر خلاف ذلك. يتم السداد باستخدام الوسائل المتاحة على الموقع أو عند الاستلام وفقًا لشروط كل عرض."
              : "All prices are in Egyptian pounds (EGP) and include applicable taxes unless stated otherwise. Payment is made using the methods available on the website or cash on delivery, depending on the offer."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "٣. الشحن والتسليم" : "3. Shipping and delivery"}
          </h2>
          <p>
            {isArabic
              ? "نقوم بتوصيل الطلبات داخل جمهورية مصر العربية فقط. يتم تقدير مواعيد التسليم وطرق الشحن في صفحة الدفع، وقد تختلف بحسب المحافظة وشركات الشحن."
              : "We deliver orders within the Arab Republic of Egypt only. Delivery times and methods are indicated at checkout and may vary by governorate and courier."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "٤. المسؤولية" : "4. Liability"}
          </h2>
          <p>
            {isArabic
              ? "نحرص على أن تكون جميع المعلومات المعروضة دقيقة، ومع ذلك لا نتحمل مسؤولية أي أضرار غير مباشرة ناتجة عن استخدام الموقع أو المنتجات بما يتجاوز ما يسمح به القانون المصري لحماية المستهلك."
              : "We strive to ensure all information displayed is accurate; however, we are not liable for any indirect damages arising from the use of the website or products beyond what is permitted under Egyptian consumer protection law."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "٥. التعديلات على الشروط" : "5. Changes to the terms"}
          </h2>
          <p>
            {isArabic
              ? "يحق لدیار أرجان تعديل هذه الشروط من وقت لآخر. يسري أي تحديث من تاريخ نشره على هذه الصفحة، ويُعد استمرار استخدامك للموقع بعد التعديل موافقة ضمنية على الشروط المحدثة."
              : "Didali may update these terms from time to time. Any changes take effect from the date they are published on this page, and your continued use of the website constitutes acceptance of the updated terms."}
          </p>
        </div>
      </main>
    </div>
  )
}

