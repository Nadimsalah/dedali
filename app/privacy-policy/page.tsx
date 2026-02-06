"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { ComingSoonPage } from "@/components/coming-soon-page"

export default function PrivacyPolicyPage() {
  const { language } = useLanguage()
  const isArabic = language === "ar"

  // Temporary: Coming soon layout for footer page
  return (
    <ComingSoonPage
      titleEn="Privacy Policy"
      titleFr="Politique de confidentialité"
      subtitleEn="Our updated privacy and data protection policy for Didali Store will be published here very soon."
      subtitleFr="Notre politique de confidentialité et de protection des données pour Didali Store sera publiée ici très bientôt."
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
            {isArabic ? "سياسة الخصوصية" : "Privacy Policy"}
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 sm:py-14 max-w-4xl">
        <h1 className={`text-2xl sm:text-3xl font-bold mb-6 ${isArabic ? "text-right" : ""}`}>
          {isArabic ? "سياسة الخصوصية لديدالي – مصر" : "Didali Egypt – Privacy Policy"}
        </h1>
        <div className={`space-y-5 text-sm sm:text-base text-muted-foreground leading-relaxed ${isArabic ? "text-right" : ""}`}>
          <p>
            {isArabic
              ? "هذه السياسة تشرح كيفية قيام ديدالي مصر بجمع واستخدام وحماية بياناتك الشخصية وفقًا لأحكام قانون حماية البيانات الشخصية المصري رقم 151 لسنة 2020 واللوائح ذات الصلة."
              : "This policy explains how Didali Egypt collects, uses, and protects your personal data in accordance with Egyptian Personal Data Protection Law No. 151 of 2020 and applicable regulations."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "١. البيانات التي نقوم بجمعها" : "1. Information we collect"}
          </h2>
          <p>
            {isArabic
              ? "قد نقوم بجمع بيانات مثل الاسم، رقم الهاتف، البريد الإلكتروني، عنوان التسليم، وسجل الطلبات عند الشراء من موقعنا أو عند التواصل معنا عبر نموذج الاتصال أو واتساب."
              : "We may collect data such as your name, phone number, email address, delivery address, and order history when you purchase from our website or contact us via forms or WhatsApp."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "٢. كيفية استخدام البيانات" : "2. How we use your data"}
          </h2>
          <p>
            {isArabic
              ? "نستخدم بياناتك لمعالجة الطلبات، توصيل المنتجات داخل مصر، التواصل بشأن حالة الطلب أو خدمة العملاء، وإرسال عروض تسويقية بعد الحصول على موافقتك الصريحة."
              : "We use your data to process orders, deliver products within Egypt, communicate about order status or customer service, and send marketing offers where you have given explicit consent."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "٣. مشاركة البيانات مع الغير" : "3. Sharing with third parties"}
          </h2>
          <p>
            {isArabic
              ? "قد نشارك بياناتك بشكل محدود مع شركات الشحن أو مزودي خدمات الدفع داخل مصر فقط بالقدر اللازم لتنفيذ الطلب، مع التزامهم بالحفاظ على سرية البيانات."
              : "We may share your data in a limited way with shipping partners and payment providers in Egypt, strictly for order fulfillment and subject to confidentiality obligations."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "٤. حقوقك" : "4. Your rights"}
          </h2>
          <p>
            {isArabic
              ? "يحق لك طلب الوصول إلى بياناتك، تصحيحها، أو طلب مسحها، وكذلك سحب موافقتك على استخدام البيانات التسويقية، وذلك من خلال التواصل معنا عبر صفحة الاتصال."
              : "You have the right to request access to your data, rectification, deletion, and to withdraw your consent for marketing use, by contacting us through our contact page."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "٥. الاحتفاظ بالبيانات" : "5. Data retention"}
          </h2>
          <p>
            {isArabic
              ? "نحتفظ بالبيانات فقط للمدة اللازمة لأغراض المعالجة والامتثال للالتزامات القانونية والضريبية في مصر، ثم يتم حذفها أو إخفاؤها عن الهوية."
              : "We retain your data only for as long as necessary for processing and to comply with legal and tax obligations in Egypt, after which it is deleted or anonymised."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "٦. التواصل" : "6. Contact"}
          </h2>
          <p>
            {isArabic
              ? "لأي أسئلة بخصوص سياسة الخصوصية أو بياناتك، يمكنك التواصل معنا من خلال نموذج الاتصال في الموقع أو قنوات التواصل الرسمية لدينا."
              : "For any questions regarding this policy or your data, please contact us via the website contact form or our official communication channels."}
          </p>
        </div>
      </main>
    </div>
  )
}

