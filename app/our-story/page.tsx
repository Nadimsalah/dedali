"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Globe2, MapPin, Droplets, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import { ComingSoonPage } from "@/components/coming-soon-page"

export default function OurStoryPage() {
  const { language } = useLanguage()
  const isArabic = language === "ar"

  // Temporary: Coming soon layout for footer page
  return (
    <ComingSoonPage
      titleEn="Our Story"
      titleFr="Notre histoire"
      subtitleEn="Very soon you’ll be able to explore the full Didali story, our origins and our vision for the future."
      subtitleFr="Très bientôt, vous pourrez découvrir toute l’histoire de Didali, nos origines et notre vision pour l’avenir."
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

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-secondary/10">
        <div className="absolute inset-0">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-16 sm:py-24 relative z-10 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className={`space-y-6 ${isArabic ? "text-right" : ""}`}>
            <p className="text-xs font-semibold tracking-[0.35em] uppercase text-primary/80">
              {isArabic ? "منذ 1999 • خبرة في زيت الأرجان المغربي" : "Since 1999 • Moroccan Argan Expertise"}
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              {isArabic ? (
                <>
                  حكايتنا في <span className="text-primary">ديدالي</span>
                </>
              ) : (
                <>
                  Our Story at <span className="text-primary">Didali</span>
                </>
              )}
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
              {isArabic
                ? "ديدالي تصدّر زيت الأرجان المغربي النقي منذ عام 1999. لأكثر من عشرين عامًا، عملنا جنبًا إلى جنب مع التعاونيات والحرفيين المحليين لنحوّل هذا الزيت النادر إلى طقوس عناية فاخرة للبشرة والشعر."
                : "Didali has been exporting pure Moroccan argan oil since 1999. For more than two decades, we have worked hand in hand with local cooperatives and artisans to transform this rare oil into high‑performance skincare and haircare rituals."}
            </p>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              {isArabic
                ? "اليوم نقدّم لك خلاصة أفضل منتجاتنا بجودة لا تُضاهى. نحن على ثقة أنك ستُحبينها وتعودين مرة أخرى، لأن الجودة والأصالة هما جوهر كل ما نقدّمه."
                : "Today, we offer you the elixir of our best products, crafted with irreproachable quality. We are convinced you&apos;ll love them and come back again, because quality and authenticity are at the heart of everything we do."}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-[0.2em]">
                <Droplets className="w-3.5 h-3.5" />
                {isArabic ? "خبرة 100٪ في زيت الأرجان" : "100% Argan Expertise"}
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-semibold uppercase tracking-[0.2em]">
                <Sparkles className="w-3.5 h-3.5" />
                {isArabic ? "أصالة ونقاء" : "Authentic &amp; Clean"}
              </div>
            </div>
            <div className={`mt-4 space-y-2 ${isArabic ? "text-right" : ""}`}>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {isArabic
                  ? "ديدالي حاصلة على عدة شهادات للجودة والنقاء من جهات رقابية دولية وإقليمية، تؤكد مصدر زيتنا وطريقة استخلاصه."
                  : "Didali holds multiple quality and purity certifications from international and regional bodies, confirming the origin of our oil and our extraction methods."}
              </p>
              <div className="flex flex-wrap items-center gap-4 opacity-80">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16">
                  <Image
                    src="/certifications/1.png"
                    alt={isArabic ? "شهادة جودة" : "Quality certification logo"}
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="relative w-14 h-14 sm:w-16 sm:h-16">
                  <Image
                    src="/certifications/2.png"
                    alt={isArabic ? "شهادة نقاء" : "Purity certification logo"}
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="relative w-14 h-14 sm:w-16 sm:h-16">
                  <Image
                    src="/certifications/3.png"
                    alt={isArabic ? "شهادة مستحضرات تجميل" : "Cosmetics certification logo"}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Visual Story (placeholder images – replace with Anobanana renders if desired) */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-4 sm:space-y-6">
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl shadow-black/10">
                <Image
                  src="/hero-showcase-1.jpg"
                  alt="Argan trees in the Moroccan sun"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-square rounded-3xl overflow-hidden shadow-xl shadow-black/10">
                <Image
                  src="/hero-showcase-2.jpg"
                  alt="Cold-pressed argan oil in glass bottle"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div className="space-y-4 sm:space-y-6 translate-y-6 sm:translate-y-10">
              <div className="relative aspect-square rounded-3xl overflow-hidden shadow-xl shadow-black/10">
                <Image
                  src="/hero-showcase-3.jpg"
                  alt="Artisanal argan oil products"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl shadow-black/10">
                <Image
                  src="/hero-showcase-4.jpg"
                  alt="Luxury argan-based care ritual"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline / Story */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 max-w-4xl space-y-12">
          <div className="grid md:grid-cols-[1fr_minmax(0,2fr)] gap-8 md:gap-12 items-start">
            <div className={`space-y-4 ${isArabic ? "text-right" : ""}`}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-[0.2em]">
                <Globe2 className="w-3.5 h-3.5" />
                {isArabic ? "من المغرب إلى العالم" : "From Morocco to the World"}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                {isArabic ? "جذورنا في المغرب وثقتكم في كل مكان" : "Rooted in Morocco, trusted worldwide"}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {isArabic
                  ? "منذ عام 1999، تكرّس ديدالي لمشاركة أسرار الجمال المغربي مع العالم. ما بدأ كشغف بزيت الأرجان النقي تحوّل إلى مجموعة كاملة من منتجات العناية التي تحترم بشرتك والأرض التي تأتي منها."
                : "Since 1999, Didali has been dedicated to sharing the secrets of Moroccan beauty with the world. What started as a passion for pure argan oil has grown into a full range of care products that respect both your skin and the land they come from."}
              </p>
            </div>
            <div className={`space-y-4 text-sm sm:text-base text-muted-foreground leading-relaxed ${isArabic ? "text-right" : ""}`}>
              <p>
                {isArabic
                  ? "لأكثر من عشرين عامًا، أتقنّا كل خطوة في رحلتنا – من اختيار حبوب الأرجان بعناية إلى العصر البارد للزيت وصياغة تركيبات فعّالة. كل زجاجة هي ثمرة خبرة وصبر واحترام عميق للإرث المغربي."
                  : "For more than 20 years, we have perfected every step of our process – from carefully selecting argan kernels to cold‑pressing the oil and formulating high‑performance treatments. Every bottle is the result of expertise, patience, and a deep respect for Moroccan heritage."}
              </p>
              <p>
                {isArabic
                  ? "شركاؤنا والتعاونيات النسائية في المغرب هم قلب هذه الحكاية. معًا نضمن أن يحتفظ كل قطرة من زيت الأرجان بخصائصه الفريدة في التغذية والإصلاح وإضفاء الإشراقة على البشرة والشعر."
                  : "Our partners and cooperatives are at the center of this story. Together, we ensure that each drop of argan oil keeps its exceptional virtues: nourishing, repairing, and illuminating your skin and hair."}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-[minmax(0,2fr)_1fr] gap-8 md:gap-12 items-start">
            <div className={`space-y-4 ${isArabic ? "text-right" : ""}`}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold uppercase tracking-[0.2em]">
                <MapPin className="w-3.5 h-3.5" />
                {isArabic ? "الآن في السوق المصري" : "Now in Egypt"}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                {isArabic ? "ديدالي تصل إلى السوق المصري" : "Didali arrives in the Egyptian market"}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {isArabic
                  ? "بعد سنوات من خدمة العملاء حول العالم، أصبحت ديدالي اليوم حاضرة في مصر. تظل رسالتنا واحدة: أن نقدّم لك عناية مغربية أصيلة بزيت الأرجان، تناسب روتينك اليومي وطبيعة المناخ من حولك."
                  : "After years of serving customers around the world, Didali is now present in Egypt. Our mission remains the same: to offer you authentic Moroccan argan care, adapted to your daily rituals and climate."}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {isArabic
                  ? "من القاهرة إلى الإسكندرية وما بعدها، نلتزم بتقديم منتجات أرجان عالية الجودة، حتى تعيشي نفس تجربة الفخامة والنتائج الموثوقة التي صنعت اسم ديدالي منذ 1999."
                  : "From Cairo to Alexandria and beyond, we are committed to making premium argan‑based products accessible, so you can experience the same luxurious textures and results that made Didali a trusted name since 1999."}
              </p>
            </div>
            <div className={`glass-subtle rounded-3xl p-6 space-y-3 text-sm sm:text-base ${isArabic ? "text-right" : ""}`}>
              <p className="font-semibold text-foreground">
                {isArabic ? "وعدنا لك" : "Our Promise"}
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  {isArabic
                    ? "• زيت أرجان مختار بعناية من تعاونيات مغربية موثوقة"
                    : "• Carefully selected argan oil from Moroccan cooperatives"}
                </li>
                <li>
                  {isArabic
                    ? "• تركيبات توازن بين الجودة والأمان والفعالية"
                    : "• Formulas focused on quality, safety, and performance"}
                </li>
                <li>
                  {isArabic
                    ? "• التزام طويل الأمد بالأصالة والشفافية"
                    : "• A long‑term commitment to authenticity and transparency"}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-secondary/5 border-t border-border/40">
        <div className={`container mx-auto px-4 max-w-3xl text-center space-y-6 ${isArabic ? "rtl" : ""}`}>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            {isArabic ? "عيشي طقس العناية مع ديدالي" : "Experience the Didali ritual"}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {isArabic
              ? "اكتشفي مجموعتنا من منتجات العناية المعززة بزيت الأرجان والمصمّمة بخبرة تزيد عن 20 عامًا. من كريمات الوجه إلى إكسير الشعر، كل منتج مصمم ليكشف عن إشراقتك الطبيعية."
              : "Discover our collection of argan‑based treatments crafted with over 20 years of expertise. From face creams to hair elixirs, every product is designed to reveal your natural glow."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-full shadow-lg shadow-primary/25">
              <Link href="/#shop">{isArabic ? "تسوقي مجموعتنا" : "Shop Our Collection"}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full bg-transparent">
              <Link href="/search">{isArabic ? "ابحثي عن منتجك" : "Search Products"}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

