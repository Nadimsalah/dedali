"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Leaf, Recycle, Droplets, Globe2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import { ComingSoonPage } from "@/components/coming-soon-page"

export default function SustainabilityPage() {
  const { language } = useLanguage()
  const isArabic = language === "ar"

  // Temporary: Coming soon layout for footer page
  return (
    <ComingSoonPage
      titleEn="Sustainability"
      titleFr="Durabilité"
      subtitleEn="Our full sustainability commitments and initiatives will be detailed here very soon."
      subtitleFr="Nos engagements et initiatives en matière de durabilité seront détaillés ici très bientôt."
    />
  )

  return (
    <div className={`min-h-screen bg-background ${isArabic ? "font-[var(--font-almarai)]" : ""}`}>
      {/* Top Bar */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isArabic ? "العودة إلى الصفحة الرئيسية" : "Back to Home"}</span>
          </Link>
          <Link href="/" className="flex-shrink-0 relative group">
            <Image
              src="/logo.webp"
              alt="Didali Store"
              width={142}
              height={40}
              className="h-8 w-auto transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-secondary/10">
        <div className="absolute inset-0">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-200/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-16 sm:py-24 relative z-10 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className={`space-y-6 ${isArabic ? "text-right" : ""}`}>
            <p className="text-xs font-semibold tracking-[0.35em] uppercase text-primary/80">
              {isArabic ? "جمال مسؤول • من المغرب إلى مصر" : "Responsible Beauty • From Morocco to Egypt"}
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              {isArabic ? "الاستدامة في ديدالي" : "Sustainability at Didali"}
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
              {isArabic
                ? "منذ عام 1999 ونحن نؤمن أن جمال الأرغان الحقيقي لا يكتمل إلا عندما يحترم الأرض والناس الذين يقفون وراءه. في ديدالي، الاستدامة ليست مجرد كلمة، بل طريقة عمل يومية."
                : "Since 1999, we believe that the true beauty of argan oil is only complete when it respects both the earth and the people behind it. At Didali, sustainability is not a slogan – it is a daily way of working."}
            </p>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              {isArabic
                ? "نعمل مع تعاونيات محلية في المغرب، نختار مكوناتنا بعناية، ونصمم عبوات تهدف لتقليل الأثر البيئي مع الحفاظ على جودة المنتجات التي تحبينها."
                : "We work closely with local cooperatives in Morocco, carefully select our ingredients, and design packaging that aims to reduce environmental impact while preserving the quality you love."}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-semibold uppercase tracking-[0.2em]">
                <Leaf className="w-3.5 h-3.5" />
                {isArabic ? "مكونات أنظف" : "Clean Ingredients"}
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-[0.2em]">
                <Recycle className="w-3.5 h-3.5" />
                {isArabic ? "عبوات مدروسة" : "Thoughtful Packaging"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-4 sm:space-y-6">
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl shadow-black/10">
                <Image
                  src="/hero-showcase-5.jpg"
                  alt={isArabic ? "أشجار الأرجان في الطبيعة" : "Argan trees in nature"}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-square rounded-3xl overflow-hidden shadow-xl shadow-black/10">
                <Image
                  src="/hero-showcase-6.jpg"
                  alt={isArabic ? "تفاصيل زيت الأرجان النقي" : "Details of pure argan oil"}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div className="space-y-4 sm:space-y-6 translate-y-6 sm:translate-y-10">
              <div className="relative aspect-square rounded-3xl overflow-hidden shadow-xl shadow-black/10">
                <Image
                  src="/hero-showcase-2.jpg"
                  alt={isArabic ? "زيت الأرجان في عبوة زجاجية" : "Argan oil in glass bottle"}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl shadow-black/10">
                <Image
                  src="/hero-showcase-1.jpg"
                  alt={isArabic ? "منابع الأرجان في المغرب" : "Argan origins in Morocco"}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 max-w-5xl space-y-12">
          <div className={`space-y-4 text-center max-w-2xl mx-auto ${isArabic ? "rtl" : ""}`}>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              {isArabic ? "ثلاث ركائز للاستدامة في ديدالي" : "Three Pillars of Sustainability at Didali"}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              {isArabic
                ? "نوازن بين الجودة العالية واحترام الإنسان والبيئة، من شجرة الأرجان في المغرب حتى روتين العناية اليومي في مصر."
                : "We balance high quality with respect for people and the planet – from the argan tree in Morocco to your daily ritual in Egypt."}
            </p>
          </div>

          <div className={`grid md:grid-cols-3 gap-6 sm:gap-8 ${isArabic ? "rtl" : ""}`}>
            <div className="glass-subtle rounded-3xl p-6 space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-700">
                <Droplets className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-foreground">
                {isArabic ? "مكونات نقية ومسؤولة" : "Pure, Responsible Ingredients"}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isArabic
                  ? "نستخدم زيت أرجان نقي ومكونات مختارة بعناية، ونتجنب الإضافات غير الضرورية، لنعطي بشرتك وشعرك ما يحتاجه فقط."
                  : "We use pure argan oil and carefully selected ingredients, avoiding unnecessary additives so your skin and hair receive only what they truly need."}
              </p>
            </div>

            <div className="glass-subtle rounded-3xl p-6 space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700">
                <Globe2 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-foreground">
                {isArabic ? "دعم المجتمعات المحلية" : "Supporting Local Communities"}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isArabic
                  ? "نعمل مع تعاونيات نسائية في المغرب لضمان دخل عادل وتحسين ظروف العمل، مع الحفاظ على المهارات التقليدية."
                  : "We work with women-led cooperatives in Morocco, ensuring fair income and better working conditions while preserving traditional expertise."}
              </p>
            </div>

            <div className="glass-subtle rounded-3xl p-6 space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-primary/10 text-primary">
                <Recycle className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-foreground">
                {isArabic ? "عبوات واعية بالبيئة" : "Eco‑Conscious Packaging"}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isArabic
                  ? "نختار عبوات يمكن إعادة تدويرها قدر الإمكان، ونقلل من المواد الزائدة بدون التأثير على حماية المنتج."
                  : "We choose packaging that is as recyclable as possible and minimize excess materials, without compromising product protection."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-secondary/5 border-t border-border/40">
        <div className={`container mx-auto px-4 max-w-3xl text-center space-y-6 ${isArabic ? "rtl" : ""}`}>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            {isArabic ? "اختاري جمالاً يحترم الكوكب" : "Choose beauty that respects the planet"}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {isArabic
              ? "كل منتج من ديدالي هو خطوة صغيرة نحو روتين عناية أجمل وأكثر وعياً. اختاري منتجات تعكس قيمك وتدلّل بشرتك في نفس الوقت."
              : "Every Didali product is a small step towards a more beautiful and conscious routine. Choose treatments that reflect your values and pamper your skin at the same time."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-full shadow-lg shadow-primary/25">
              <Link href="/#shop">{isArabic ? "تسوقي المنتجات" : "Shop Products"}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full bg-transparent">
              <Link href="/our-story">{isArabic ? "اقرئي قصتنا" : "Read Our Story"}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

