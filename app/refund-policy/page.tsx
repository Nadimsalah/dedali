"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

export default function RefundPolicyPage() {
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
            {isArabic ? "سياسة الاسترجاع" : "Refund Policy"}
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 sm:py-14 max-w-4xl">
        <h1 className={`text-2xl sm:text-3xl font-bold mb-6 ${isArabic ? "text-right" : ""}`}>
          {isArabic ? "سياسة الاسترجاع لديدالي – مصر" : "Dedali Egypt – Refund & Returns Policy"}
        </h1>
        <div className={`space-y-5 text-sm sm:text-base text-muted-foreground leading-relaxed ${isArabic ? "text-right" : ""}`}>
          <p>
            {isArabic
              ? "نحرص على رضاك التام عن منتجات ديدالي. توضح هذه السياسة الشروط التي يتم من خلالها استرجاع أو استبدال المنتجات داخل مصر وفقًا لقانون حماية المستهلك المصري."
              : "We want you to be fully satisfied with your Dedali products. This policy explains the conditions for returns and refunds within Egypt, in line with Egyptian consumer protection law."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "١. فترة الاسترجاع" : "1. Return period"}
          </h2>
          <p>
            {isArabic
              ? "يمكنك طلب استرجاع أو استبدال المنتج خلال 14 يومًا من تاريخ الاستلام، بشرط أن يكون غير مستخدم، وفي عبوته الأصلية، وغير مفتوح لاعتبارات الصحة والعناية الشخصية."
              : "You may request a return or exchange within 14 days of receipt, provided the product is unused, unopened, and in its original packaging, due to health and personal care regulations."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "٢. المنتجات التالفة أو الخاطئة" : "2. Damaged or incorrect items"}
          </h2>
          <p>
            {isArabic
              ? "في حال استلام منتج تالف أو غير مطابق للطلب، نتحمل تكلفة الاسترجاع أو الاستبدال بالكامل. يُرجى التواصل معنا خلال 48 ساعة من الاستلام مع صور توضح المشكلة."
              : "If you receive a damaged item or an item that does not match your order, we will cover all return or exchange costs. Please contact us within 48 hours of delivery with photos showing the issue."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "٣. طريقة الاسترجاع" : "3. How refunds are processed"}
          </h2>
          <p>
            {isArabic
              ? "يتم رد المبلغ بنفس طريقة الدفع الأصلية إن أمكن، أو عن طريق تحويل بنكي/محفظة إلكترونية خلال مدة قد تصل إلى 14 يوم عمل بعد استلام المنتج وفحصه."
              : "Refunds are issued using the original payment method where possible, or via bank transfer / e‑wallet within up to 14 business days after we receive and inspect the returned item."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "٤. الاستثناءات" : "4. Exceptions"}
          </h2>
          <p>
            {isArabic
              ? "لا يمكن استرجاع المنتجات التي تم فتحها أو استخدامها، إلا إذا كانت هناك عيوب تصنيع واضحة. يحق لنا رفض أي طلب استرجاع لا يطابق الشروط السابقة."
              : "We cannot accept returns of opened or used products except where there is a clear manufacturing defect. We reserve the right to decline returns that do not meet the conditions above."}
          </p>
        </div>
      </main>
    </div>
  )
}

