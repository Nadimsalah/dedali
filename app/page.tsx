"use client"

import { useState, useEffect } from "react"
import { useCart } from "@/components/cart-provider"
import { useLanguage } from "@/components/language-provider"
import { getProducts, getHeroCarouselItems, getCategories, getAdminSettings, type Product } from "@/lib/supabase-api"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Search,
  ShoppingBag,
  Menu,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Leaf,
  Heart,
  Award,
  ChevronUp,
  ArrowRight,
  ChevronDown,
  X,
} from "lucide-react"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { ModernHeroCarousel } from "@/components/modern-hero-carousel"
import { WhatsAppSubscription } from "@/components/whatsapp-subscription"

// Countdown Timer Component
function CountdownTimer() {
  const { t } = useLanguage()
  const [timeLeft, setTimeLeft] = useState({
    days: 3,
    hours: 12,
    minutes: 45,
    seconds: 30,
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { days, hours, minutes, seconds } = prev
        seconds--
        if (seconds < 0) {
          seconds = 59
          minutes--
        }
        if (minutes < 0) {
          minutes = 59
          hours--
        }
        if (hours < 0) {
          hours = 23
          days--
        }
        if (days < 0) {
          return { days: 3, hours: 12, minutes: 45, seconds: 30 }
        }
        return { days, hours, minutes, seconds }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex gap-3 sm:gap-4">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="text-center">
          <div className="glass-strong rounded-2xl px-3 py-2 sm:px-4 sm:py-3 min-w-[50px] sm:min-w-[60px]">
            <span className="text-xl sm:text-2xl font-bold text-foreground">
              {value.toString().padStart(2, "0")}
            </span>
          </div>
          <span className="text-xs text-muted-foreground mt-1 capitalize">
            {t(`timer.${unit}`)}
          </span>
        </div>
      ))}
    </div>
  )
}

function CartCount() {
  const { cartCount } = useCart()
  if (cartCount === 0) return null
  return <>{cartCount}</>
}

// Product Card Component
function ProductCard(product: Product) {
  const { t, language } = useLanguage()
  const isArabic = language === 'ar'
  const rating = 5 // Default rating since it's not in DB yet
  return (
    <Link href={`/product/${product.id}`} className="group glass rounded-3xl p-4 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 block">
      <div className="aspect-square bg-gradient-to-br from-secondary to-muted rounded-2xl mb-4 flex items-center justify-center overflow-hidden relative">
        {product.images && product.images.length > 0 ? (
          <Image
            src={product.images[0]}
            alt={isArabic && product.title_ar ? product.title_ar : product.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
        )}
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
          {isArabic && product.title_ar ? product.title_ar : product.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {isArabic && product.description_ar ? product.description_ar : product.description}
        </p>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${i < rating ? "fill-primary text-primary" : "text-muted"}`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1">({rating}.0)</span>
        </div>
        <div className="flex items-center justify-between pt-2">
          <span className="text-lg font-bold text-foreground">{t('common.currency')} {product.price}</span>
          <Button size="sm" className="rounded-full text-xs pointer-events-none">
            {t('product.add_to_cart')}
          </Button>
        </div>
      </div>
    </Link>
  )
}



// Collection Card Component
function CollectionCard({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description: string
  icon: React.ElementType
}) {
  const { t } = useLanguage()
  return (
    <div className="group glass rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 cursor-pointer">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      <Link
        href="#"
        className="inline-flex items-center text-primary font-medium group-hover:gap-2 gap-1 transition-all"
      >
        {t('section.view_collection')} <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}

// Hero Carousel Component - Brand Showcase
function HeroCarousel({ products }: { products: Product[] }) {
  const { t, language } = useLanguage()
  const [carouselItems, setCarouselItems] = useState<Array<{ image: string; title: string; subtitle: string; link?: string | null }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCarouselItems() {
      const items = await getHeroCarouselItems()

      if (items.length > 0) {
        // Use database items
        setCarouselItems(items.map(item => ({
          image: item.image_url,
          title: item.title,
          subtitle: item.subtitle || '',
          link: item.link
        })))
      } else {
        // Fallback to default showcase items
        if (language === 'ar') {
          setCarouselItems([
            {
              image: '/hero-showcase-1.jpg',
              title: 'سر الجمال المغربي',
              subtitle: 'نقي • طبيعي • خالد'
            },
            {
              image: '/hero-showcase-2.jpg',
              title: 'تميز مصنوع يدوياً',
              subtitle: 'من المغرب بكل حب'
            },
            {
              image: '/hero-showcase-3.jpg',
              title: 'الذهب السائل',
              subtitle: 'زيت الأرغان المعصور على البارد'
            },
            {
              image: '/hero-showcase-4.jpg',
              title: 'إشراقة طبيعية',
              subtitle: 'عضوي ١٠٠٪ • معتمد'
            },
            {
              image: '/hero-showcase-5.jpg',
              title: 'طقوس الجمال',
              subtitle: 'حكمة قديمة • عناية حديثة'
            },
            {
              image: '/hero-showcase-6.jpg',
              title: 'ديار أرغان',
              subtitle: 'عناية مغربية أصيلة بالبشرة'
            }
          ])
        } else {
          setCarouselItems([
            {
              image: '/hero-showcase-1.jpg',
              title: 'The Secret of Moroccan Beauty',
              subtitle: 'Pure • Natural • Timeless'
            },
            {
              image: '/hero-showcase-2.jpg',
              title: 'Handcrafted Excellence',
              subtitle: 'From Morocco with Love'
            },
            {
              image: '/hero-showcase-3.jpg',
              title: 'Liquid Gold',
              subtitle: 'Cold Pressed Argan Oil'
            },
            {
              image: '/hero-showcase-4.jpg',
              title: 'Natural Radiance',
              subtitle: '100% Organic • Certified'
            },
            {
              image: '/hero-showcase-5.jpg',
              title: 'Beauty Ritual',
              subtitle: 'Ancient Wisdom • Modern Care'
            },
            {
              image: '/hero-showcase-6.jpg',
              title: 'Diar Argan',
              subtitle: 'Authentic Moroccan Skincare'
            }
          ])
        }
      }

      setLoading(false)
    }

    loadCarouselItems()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="animate-pulse text-muted-foreground">{t('timer.loading')}</div>
      </div>
    )
  }

  return <ModernHeroCarousel items={carouselItems} />
}

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [visibleProducts, setVisibleProducts] = useState(4)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const { t, language, toggleLanguage, dir } = useLanguage()

  // Cart context is now available but we need to create a client component wrapper 
  // or accept that HomePage is a client component (which it already is: "use client" is missing but useState implies it)
  // Let's check imports to see if "use client" is needed or if it's already there


  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
      setShowBackToTop(window.scrollY > 500)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<{ id: string, name: string, slug: string, name_ar?: string }[]>([])
  const [settings, setSettings] = useState<Record<string, string>>({})

  // Fetch data from Supabase
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const [productsData, categoriesData, settingsData] = await Promise.all([
        getProducts({ status: 'active', limit: 20 }),
        getCategories(),
        getAdminSettings()
      ])

      setProducts(productsData || [])
      setCategories(categoriesData || [])
      setSettings(settingsData || {})
      setLoading(false)
    }
    loadData()
  }, [])

  const allCategories = ["All", ...categories.map(c => c.slug)]

  const getCategoryLabel = (cat: string) => {
    if (cat === "All") return t('section.all_categories')
    const category = categories.find(c => c.slug === cat)
    if (category) {
      if (language === 'ar' && category.name_ar) {
        return category.name_ar
      }
      return category.name
    }
    // Fallback to translation keys for default categories
    const categoryMap: Record<string, string> = {
      face: t('header.face_care'),
      hair: t('header.hair_care'),
      body: t('header.body_care'),
      gift: t('header.gift_sets')
    }
    return categoryMap[cat] || cat
  }

  const filteredProducts = selectedCategory === "All"
    ? products
    : products.filter(p => p.category === selectedCategory)



  const faqs = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
    { q: t('faq.q5'), a: t('faq.a5') },
    { q: t('faq.q6'), a: t('faq.a6') },
  ]

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-secondary/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-72 h-72 bg-primary/3 rounded-full blur-3xl" />
      </div>

      {/* Announcement Bar */}
      <div className="bg-primary text-primary-foreground py-2 text-center text-sm">
        <p>
          {language === 'ar'
            ? (settings.announcement_bar_ar || settings.announcement_bar || "شحن مجاني للطلبات فوق ٥٠٠ ج.م | استخدم كود ARGAN20 لخصم ٢٠٪")
            : (settings.announcement_bar || "Free shipping on orders over EGP 500 | Use code ARGAN20 for 20% off")
          }
        </p>
      </div>

      {/* Header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${isScrolled ? "glass-strong py-2" : "bg-transparent py-4"
          }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-8">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 relative group">
              <Image
                src="/logo.webp"
                alt="Diar Argan"
                width={120}
                height={60}
                className="h-10 sm:h-12 w-auto transition-transform duration-300 group-hover:scale-105"
              />
            </Link>

            {/* Desktop Navigation - Modern Mega Menu */}
            <NavigationMenu className="hidden lg:flex" delayDuration={0}>
              <NavigationMenuList className="gap-1">
                {/* Categories Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-foreground/80 hover:text-primary hover:bg-primary/5 data-[state=open]:bg-primary/5 data-[state=open]:text-primary font-medium px-4 py-2 rounded-full transition-all duration-200">
                    {t('header.categories')}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="glass-liquid w-[800px] p-4 rounded-[2.5rem] overflow-hidden border border-white/20 shadow-2xl backdrop-blur-3xl bg-white/10">
                      <div className="grid grid-cols-12 gap-6">
                        {/* Categories List */}
                        <div className="col-span-7 p-4">
                          <h3 className="text-sm font-bold text-primary mb-6 uppercase tracking-widest flex items-center gap-2 px-2">
                            <Sparkles className="w-4 h-4 text-primary animate-pulse" /> {t('header.browse_by_category')}
                          </h3>
                          <div className="grid grid-cols-2 gap-3">
                            {categories.map((cat) => (
                              <NavigationMenuLink key={cat.id} asChild>
                                <a
                                  href="#shop"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    setSelectedCategory(cat.slug)
                                    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })
                                  }}
                                  className="group relative flex flex-col justify-end p-4 h-24 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/20 hover:bg-white/10 transition-all duration-500 overflow-hidden cursor-pointer"
                                >
                                  {/* Hover Gradient */}
                                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                  <div className="absolute top-0 right-0 p-3 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-500">
                                    <ArrowRight className="w-4 h-4 text-primary" />
                                  </div>

                                  <span className="relative z-10 font-bold text-foreground group-hover:text-primary transition-colors text-base leading-tight">
                                    {cat.name}
                                  </span>
                                  {cat.name_ar && language === 'en' && (
                                    <span className="relative z-10 text-[10px] text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity delay-100 font-arabic text-left">
                                      {cat.name_ar}
                                    </span>
                                  )}
                                </a>
                              </NavigationMenuLink>
                            ))}
                          </div>
                        </div>

                        {/* Featured Section */}
                        <div className="col-span-5 relative group overflow-hidden rounded-[2rem] border border-white/10">
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/5 active:scale-105 transition-transform duration-1000" />
                          <div className="absolute inset-0 bg-[url('/hero-showcase-3.jpg')] bg-cover bg-center opacity-30 mix-blend-overlay group-hover:opacity-40 transition-opacity duration-700" />

                          <div className="relative h-full flex flex-col justify-between p-6 bg-gradient-to-b from-transparent to-black/40">
                            <div>
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-full border border-white/20 mb-4 shadow-lg">
                                <Star className="w-3 h-3 fill-current" /> {t('header.new_arrival')}
                              </span>
                              <h4 className="font-bold text-white text-2xl leading-tight mb-2 drop-shadow-lg">
                                {t('header.argan_elixir')}
                              </h4>
                              <p className="text-sm text-white/80 line-clamp-3 leading-relaxed drop-shadow-md">
                                {t('header.argan_elixir_desc')}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              className="rounded-xl w-full bg-white/20 hover:bg-white text-white hover:text-primary border border-white/30 backdrop-blur-md shadow-xl transition-all font-bold mt-4 h-10"
                              onClick={() => {
                                setSelectedCategory("All")
                                document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })
                              }}
                            >
                              {t('nav.shop_now')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Simple Links */}
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      href="#about"
                      className="text-foreground/80 hover:text-primary hover:bg-primary/5 font-medium px-4 py-2 rounded-full transition-all duration-200 inline-flex"
                    >
                      {t('nav.about')}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      href="#faq"
                      className="text-foreground/80 hover:text-primary hover:bg-primary/5 font-medium px-4 py-2 rounded-full transition-all duration-200 inline-flex"
                    >
                      {t('nav.faq')}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* Right Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Link href="/search">
                <Button variant="ghost" size="icon" className="hidden sm:flex rounded-full hover:bg-primary/5 hover:text-primary transition-all">
                  <Search className="w-5 h-5" />
                </Button>
              </Link>

              <Link href="/cart">
                <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-primary/5 hover:text-primary transition-all group">
                  <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-semibold group-hover:scale-110 transition-transform">
                    <CartCount />
                  </span>
                </Button>
              </Link>
              <Button
                onClick={toggleLanguage}
                className="hidden sm:flex rounded-full ml-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 font-bold"
              >
                {language === 'en' ? 'العربية' : 'English'}
              </Button>

              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/5">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-[400px] p-0 border-0">
                  <div className="flex flex-col h-full bg-background">
                    {/* Mobile Menu Header */}
                    <div className="flex items-center justify-between p-6 border-b border-border/50">
                      <Image
                        src="/logo.webp"
                        alt="Diar Argan"
                        width={100}
                        height={50}
                        className="h-10 w-auto"
                      />
                    </div>

                    {/* Mobile Menu Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                      <nav className="space-y-2">
                        {/* Categories Section */}
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="categories" className="border-0">
                            <AccordionTrigger className="py-4 text-lg font-medium text-foreground hover:text-primary hover:no-underline">
                              {t('header.categories')}
                            </AccordionTrigger>
                            <AccordionContent className="pb-4">
                              <div className="space-y-2 pl-4">
                                {categories.map((cat) => (
                                  <a
                                    key={cat.id}
                                    href="#shop"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      setSelectedCategory(cat.slug)
                                      document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })
                                      // Optional: close sheet if we had access to the state, but native behavior might be fine for now or user can close it.
                                      // Ideally we'd toggle the sheet close trigger programmatically or use a controlled component.
                                    }}
                                    className="block py-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                                  >
                                    {cat.name}
                                  </a>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>

                        <Link
                          href="#about"
                          className="block py-4 text-lg font-medium text-foreground hover:text-primary transition-colors"
                        >
                          About
                        </Link>
                        <Link
                          href="#faq"
                          className="block py-4 text-lg font-medium text-foreground hover:text-primary transition-colors"
                        >
                          FAQ
                        </Link>
                      </nav>

                      {/* Mobile Promo Card */}
                      <div className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/20">
                        <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full mb-2">Limited Offer</span>
                        <p className="font-medium text-foreground">
                          {language === 'ar'
                            ? (settings.promo_title_ar || settings.promo_title || "خصم ٢٠٪ على طلبك الأول")
                            : (settings.promo_title || "20% off your first order")
                          }
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {language === 'ar' ? "استخدم كود" : "Use code"} {settings.promo_code || "ARGAN20"}
                        </p>
                      </div>
                    </div>

                    {/* Mobile Menu Footer */}
                    <div className="p-6 border-t border-border/50 space-y-3">
                      <Button className="w-full rounded-full shadow-lg shadow-primary/20">
                        Shop Now
                      </Button>
                      <Button variant="outline" className="w-full rounded-full bg-transparent">
                        <Search className="w-4 h-4 mr-2" />
                        Search
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full rounded-full bg-transparent border-primary/20 text-primary hover:bg-primary/5"
                        onClick={toggleLanguage}
                      >
                        {language === 'en' ? 'العربية' : 'English'}
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight text-balance">
                {language === 'ar' ? (
                  settings.hero_title_ar || settings.hero_title || (
                    <>
                      {t('hero.title_prefix')} <span className="text-primary">{t('hero.title_suffix')}</span>
                    </>
                  )
                ) : (
                  settings.hero_title || (
                    <>
                      {t('hero.title_prefix')} <span className="text-primary">{t('hero.title_suffix')}</span>
                    </>
                  )
                )}
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg">
                {language === 'ar'
                  ? (settings.hero_subtitle_ar || settings.hero_subtitle || t('hero.subtitle'))
                  : (settings.hero_subtitle || t('hero.subtitle'))
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="rounded-full text-base px-8">
                  {t('hero.shop_collection')}
                </Button>
                <Button size="lg" variant="outline" className="rounded-full text-base px-8 bg-transparent">
                  {t('hero.explore_best_sellers')}
                </Button>
              </div>
              {/* Trust Badges */}
              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Truck className="w-5 h-5 text-primary" />
                  <span className="text-sm">{t('hero.fast_delivery')}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <span className="text-sm">{t('hero.secure_checkout')}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RotateCcw className="w-5 h-5 text-primary" />
                  <span className="text-sm">{t('hero.easy_returns')}</span>
                </div>
              </div>
            </div>

            {/* Hero 3D Glass Carousel */}
            <div className="relative">
              {products.length > 0 ? (
                <HeroCarousel products={products.slice(0, 6)} />
              ) : (
                <div className="glass rounded-[2rem] p-8 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/20" />
                  <div className="relative aspect-square bg-gradient-to-br from-secondary to-muted rounded-2xl flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="w-32 h-32 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                        <Sparkles className="w-16 h-16 text-primary" />
                      </div>
                      <p className="text-xl font-semibold text-foreground">{t('timer.loading')}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>



      {/* Best Sellers */}
      <section id="shop" className="py-16 sm:py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">{t('section.best_sellers')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('section.best_sellers_desc')}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {allCategories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                className={`rounded-full px-6 transition-all duration-300 ${selectedCategory === cat
                  ? "shadow-lg shadow-primary/25 scale-105"
                  : "hover:scale-105"
                  }`}
                onClick={() => {
                  setSelectedCategory(cat)
                  setVisibleProducts(4) // Reset visible count on switch
                }}
              >
                {getCategoryLabel(cat)}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-in fade-in duration-500">
            {filteredProducts.slice(0, visibleProducts).map((product, i) => (
              <ProductCard key={`${product.id}-${selectedCategory}`} {...product} />
            ))}
          </div>
          {visibleProducts < filteredProducts.length && (
            <div className="text-center mt-10">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full bg-transparent"
                onClick={() => setVisibleProducts(prev => prev + 4)}
              >
                {t('section.load_more')} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 sm:py-20 bg-secondary/5">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl text-foreground sm:text-4xl font-bold mb-4">{t('faq.title')}</h2>
            <p className="text-muted-foreground">{t('faq.subtitle')}</p>
          </div>
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="glass rounded-2xl px-6 border-0 data-[state=open]:shadow-lg transition-all duration-300">
                <AccordionTrigger className="text-lg font-medium hover:no-underline py-6">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 text-base leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* WhatsApp Subscription */}
      <section className="py-16 sm:py-20 relative">
        <div className="container mx-auto px-4 max-w-2xl">
          <WhatsAppSubscription />
        </div>
      </section>

      {/* Certifications */}
      <section className="py-10 relative overflow-hidden bg-secondary/5 border-t border-border/50">
        <div className="relative flex overflow-x-hidden group" dir="ltr">
          <div className="animate-marquee whitespace-nowrap flex items-center gap-12 sm:gap-20 px-4">
            {/* Original Set */}
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="relative w-24 h-24 sm:w-32 sm:h-32 grayscale hover:grayscale-0 transition-all duration-500 opacity-70 hover:opacity-100 flex-shrink-0">
                <Image
                  src={`/certifications/${i}.png`}
                  alt={`Certification ${i}`}
                  fill
                  className="object-contain"
                />
              </div>
            ))}
            {/* Duplicate Set for smooth infinite scroll */}
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={`dup-${i}`} className="relative w-24 h-24 sm:w-32 sm:h-32 grayscale hover:grayscale-0 transition-all duration-500 opacity-70 hover:opacity-100 flex-shrink-0">
                <Image
                  src={`/certifications/${i}.png`}
                  alt={`Certification ${i}`}
                  fill
                  className="object-contain"
                />
              </div>
            ))}
          </div>
          <div className="absolute top-0 flex w-full h-full pointer-events-none">
            <div className={`w-1/6 h-full bg-gradient-to-r ${language === 'ar' ? 'bg-gradient-to-l ml-auto' : 'from-background'} to-transparent`}></div>
            <div className={`w-1/6 h-full bg-gradient-to-l ${language === 'ar' ? 'bg-gradient-to-r mr-auto' : 'from-background ml-auto'} to-transparent`}></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border/40 py-16 sm:py-20 relative overflow-hidden">
        <div className="container mx-auto px-4 relative">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">

            {/* Brand Column */}
            <div className="md:col-span-4 lg:col-span-5 space-y-6">
              <Link href="/" className="inline-block">
                <Image
                  src="/logo.webp"
                  alt="Diar Argan"
                  width={150}
                  height={60}
                  className="h-10 w-auto opacity-90 hover:opacity-100 transition-opacity"
                />
              </Link>
              <p className="text-muted-foreground/80 max-w-sm leading-relaxed text-sm">
                {t('footer.about_desc')}
              </p>
              <div className="flex gap-3">
                {/* Modern Social Icons */}
                {['Instagram', 'Facebook', 'Twitter'].map((social, i) => (
                  <a key={social} href="#" className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-300 group" aria-label={social}>
                    <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </a>
                ))}
              </div>
            </div>

            {/* Links Columns */}
            <div className="md:col-span-8 lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
              <div>
                <h4 className="font-semibold text-foreground text-sm tracking-wide uppercase mb-6">{t('footer.company')}</h4>
                <ul className="space-y-4 text-sm text-muted-foreground">
                  <li><Link href="#about" className="hover:text-primary transition-colors block py-1">{t('footer.our_story')}</Link></li>
                  <li><Link href="#" className="hover:text-primary transition-colors block py-1">{t('footer.sustainability')}</Link></li>
                  <li><Link href="#" className="hover:text-primary transition-colors block py-1">{t('footer.press')}</Link></li>
                  <li><Link href="#" className="hover:text-primary transition-colors block py-1">{t('footer.careers')}</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground text-sm tracking-wide uppercase mb-6">{t('footer.support')}</h4>
                <ul className="space-y-4 text-sm text-muted-foreground">
                  <li><Link href="#" className="hover:text-primary transition-colors block py-1">{t('footer.contact_us')}</Link></li>
                  <li><Link href="#" className="hover:text-primary transition-colors block py-1">{t('footer.shipping_info')}</Link></li>
                  <li><Link href="#" className="hover:text-primary transition-colors block py-1">{t('footer.track_order')}</Link></li>
                  <li><Link href="#faq" className="hover:text-primary transition-colors block py-1">{t('nav.faq')}</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground text-sm tracking-wide uppercase mb-6">{t('footer.legal')}</h4>
                <ul className="space-y-4 text-sm text-muted-foreground">
                  <li><Link href="#" className="hover:text-primary transition-colors block py-1">{t('footer.privacy_policy')}</Link></li>
                  <li><Link href="#" className="hover:text-primary transition-colors block py-1">{t('footer.terms')}</Link></li>
                  <li><Link href="#" className="hover:text-primary transition-colors block py-1">{t('footer.refund_policy')}</Link></li>
                  <li><Link href="#" className="hover:text-primary transition-colors block py-1">{t('footer.cookies')}</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Diar Argan. {t('footer.rights')}</p>
            <div className="flex items-center gap-6">
              <Link href="#" className="hover:text-foreground transition-colors">{t('footer.privacy_short')}</Link>
              <Link href="#" className="hover:text-foreground transition-colors">{t('footer.terms_short')}</Link>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium text-[10px] uppercase tracking-wider">{t('footer.system_status')}</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
