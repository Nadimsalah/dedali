"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

export default function CookiesPage() {
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
            {isArabic ? "سياسة الكوكيز" : "Cookie Policy"}
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 sm:py-14 max-w-4xl">
        <h1 className={`text-2xl sm:text-3xl font-bold mb-6 ${isArabic ? "text-right" : ""}`}>
          {isArabic ? "سياسة الكوكيز لديدالي – مصر" : "Dedali Egypt – Cookie Policy"}
        </h1>
        <div className={`space-y-5 text-sm sm:text-base text-muted-foreground leading-relaxed ${isArabic ? "text-right" : ""}`}>
          <p>
            {isArabic
              ? "يستخدم موقع ديدالي ملفات تعريف الارتباط (الكوكيز) لتحسين تجربة التصفح وقياس الأداء، بما يتوافق مع القوانين المصرية المنظمة لاستخدام البيانات الإلكترونية."
              : "Dedali&apos;s website uses cookies to improve your browsing experience and measure performance, in line with Egyptian regulations on electronic data usage."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "١. ما هي الكوكيز؟" : "1. What are cookies?"}
          </h2>
          <p>
            {isArabic
              ? "الكوكيز هي ملفات نصية صغيرة تُخزن على متصفحك عند زيارة الموقع، وتسمح لنا بتذكّر تفضيلاتك مثل اللغة أو محتويات عربة التسوق."
              : "Cookies are small text files stored in your browser when you visit our site, allowing us to remember preferences such as language or cart contents."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "٢. أنواع الكوكيز التي نستخدمها" : "2. Types of cookies we use"}
          </h2>
          <p>
            {isArabic
              ? "نستخدم كوكيز أساسية لعمل الموقع (مثل حفظ الجلسة وعربة التسوق)، وكوكيز تحليلية مجهولة الهوية لمساعدتنا على فهم كيفية استخدام العملاء للموقع وتحسينه."
              : "We use essential cookies to operate the site (such as session and cart cookies) and anonymous analytics cookies to understand how our website is used and to improve it."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "٣. التحكم في الكوكيز" : "3. Managing cookies"}
          </h2>
          <p>
            {isArabic
              ? "يمكنك إدارة أو تعطيل الكوكيز من إعدادات المتصفح الخاص بك. يرجى ملاحظة أن إيقاف الكوكيز الأساسية قد يؤثر على عمل بعض وظائف الموقع مثل إتمام الطلبات."
              : "You can manage or disable cookies in your browser settings. Please note that disabling essential cookies may affect key site functions such as completing orders."}
          </p>
        </div>
      </main>
    </div>
  )
}

