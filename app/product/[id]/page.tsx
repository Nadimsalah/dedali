"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useCart } from "@/components/cart-provider"
import { useLanguage } from "@/components/language-provider"
import { getProductById, getProducts, type Product } from "@/lib/supabase-api"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ShoppingBag, Star, Minus, Plus, Truck, ShieldCheck, RotateCcw, Check, Sparkles, Search } from "lucide-react"

export default function ProductPage() {
  const params = useParams()
  const productId = params.id as string
  const { addItem, cartCount } = useCart()
  const { t, language } = useLanguage()
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const data = await getProductById(productId)
      setProduct(data)

      if (data) {
        // Fetch related products from same category
        const related = await getProducts({
          category: data.category,
          limit: 4,
          status: 'active'
        })
        // Filter out current product
        setRelatedProducts(related.filter(p => p.id !== data.id))
      }

      setLoading(false)
    }
    if (productId) {
      loadData()
    }
  }, [productId])

  // Scroll to top on mount or product change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
    setSelectedImage(0)
    setQuantity(1)
  }, [productId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Product not found</h2>
          <Button asChild variant="outline">
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  const isArabic = language === 'ar'
  const displayTitle = isArabic && product.title_ar ? product.title_ar : product.title
  const displayDescription = isArabic && product.description_ar ? product.description_ar : product.description || ""
  const displayBenefits = isArabic && product.benefits_ar ? product.benefits_ar : product.benefits || []
  const displayIngredients = isArabic && product.ingredients_ar ? product.ingredients_ar : product.ingredients || ""
  const displayHowToUse = isArabic && product.how_to_use_ar ? product.how_to_use_ar : product.how_to_use || ""

  const inStock = product.stock > 0
  const productImages = (product.images && product.images.length > 0) ? product.images : ["/placeholder.svg?height=600&width=600"]
  const rating = 5.0
  const reviewsCount = 127 // Placeholder

  return (
    <div className="min-h-screen bg-background pb-32 lg:pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-strong py-3">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex-shrink-0 relative group">
              <Image
                src="/logo.webp"
                alt="Diar Argan"
                width={120}
                height={60}
                className="h-10 sm:h-12 w-auto transition-transform duration-300 group-hover:scale-105"
              />
            </Link>

            <div className="flex items-center gap-1 sm:gap-2">
              <Link href="/search">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/5 hover:text-primary transition-all">
                  <Search className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/cart">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-full hover:bg-primary/5 hover:text-primary transition-all group"
                >
                  <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-semibold group-hover:scale-110 transition-transform">
                    {cartCount}
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link href="/#shop" className="hover:text-primary transition-colors">Shop</Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate">{displayTitle}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="glass rounded-3xl overflow-hidden aspect-square relative shadow-2xl">
              <Image
                src={productImages[selectedImage]}
                alt={displayTitle}
                fill
                className="object-cover"
                priority
              />
            </div>

            {productImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3 sm:gap-4">
                {productImages.map((image, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`glass rounded-2xl overflow-hidden aspect-square transition-all ${selectedImage === idx ? "ring-2 ring-primary scale-95" : "hover:scale-105"
                      }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.title} ${idx + 1}`}
                      width={150}
                      height={150}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
                {displayTitle}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(rating) ? "fill-primary text-primary" : "text-muted"}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground font-medium flex items-center gap-1">
                  {rating} <span className="text-xs opacity-50">/ 5.0</span>
                  <span className="mx-2">•</span>
                  {reviewsCount} {t('product.reviews')}
                </span>

                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${inStock ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-destructive/10 text-destructive border border-destructive/20"
                  }`}>
                  {inStock ? (
                    <><Check className="w-3 h-3" /> {t('order.success.status') || 'In Stock'}</>
                  ) : (
                    'Out of Stock'
                  )}
                </div>
              </div>

              <div className="flex items-baseline gap-4 mb-8">
                <span className="text-4xl sm:text-5xl font-bold text-primary">{t('common.currency')} {product.price}</span>
                {product.compare_at_price && (
                  <span className="text-2xl text-muted-foreground line-through decoration-destructive/30">
                    {t('common.currency')} {product.compare_at_price}
                  </span>
                )}
                {/* Discount Badge Removed */}
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed mb-10 text-lg border-l-4 border-primary/20 pl-6 italic">
              {displayDescription}
            </p>

            {/* Quantity */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-foreground mb-4 uppercase tracking-widest text-primary/80">
                Quantity
              </label>
              <div className="flex items-center gap-4 bg-secondary/30 w-fit p-1.5 rounded-2xl border border-white/5 backdrop-blur-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl hover:bg-background shadow-sm transition-all text-foreground"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-10 text-center font-bold text-lg text-foreground">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl hover:bg-background shadow-sm transition-all text-foreground"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button
                size="lg"
                className="flex-1 h-16 rounded-2xl text-lg font-bold shadow-2xl shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
                onClick={() =>
                  addItem({
                    id: product.id,
                    name: product.title,
                    nameAr: product.title_ar || undefined,
                    price: Number(product.price),
                    image: productImages[0],
                    quantity: quantity,
                    inStock: inStock
                  })
                }
              >
                <ShoppingBag className="w-6 h-6 mr-3" />
                {t('product.add_to_cart')}
              </Button>
            </div>

            {/* Accordion Details */}
            <Accordion type="single" collapsible className="space-y-4 mb-16">
              {product.benefits && product.benefits.length > 0 && (
                <AccordionItem value="benefits" className="glass rounded-3xl border-white/5 overflow-hidden shadow-sm">
                  <AccordionTrigger className="px-8 py-5 hover:no-underline font-bold text-xl text-foreground">
                    <div className="flex items-center gap-4">
                      <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                      {t('product.key_benefits')}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-8 pb-8 pt-2">
                    <ul className="grid gap-4">
                      {displayBenefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-4 text-muted-foreground group">
                          <div className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0 transition-transform group-hover:scale-150" />
                          <span className="text-lg">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}

              {product.ingredients && (
                <AccordionItem value="ingredients" className="glass rounded-3xl border-white/5 overflow-hidden shadow-sm">
                  <AccordionTrigger className="px-8 py-5 hover:no-underline font-bold text-xl text-foreground">
                    {t('product.ingredients')}
                  </AccordionTrigger>
                  <AccordionContent className="px-8 pb-8 pt-2 text-muted-foreground leading-relaxed text-lg">
                    {displayIngredients}
                  </AccordionContent>
                </AccordionItem>
              )}

              {product.how_to_use && (
                <AccordionItem value="how-to-use" className="glass rounded-3xl border-white/5 overflow-hidden shadow-sm">
                  <AccordionTrigger className="px-8 py-5 hover:no-underline font-bold text-xl text-foreground">
                    {t('product.how_to_use')}
                  </AccordionTrigger>
                  <AccordionContent className="px-8 pb-8 pt-2 text-muted-foreground leading-relaxed text-lg">
                    {displayHowToUse}
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-6">
              {[
                { icon: Truck, text: t('cart.trust.shipping') },
                { icon: ShieldCheck, text: t('cart.trust.secure') },
                { icon: RotateCcw, text: t('cart.trust.returns') },
              ].map((item, idx) => (
                <div key={idx} className="glass-subtle p-6 rounded-3xl text-center hover:bg-white/5 transition-colors">
                  <item.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                  <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground leading-tight">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-24 sm:mt-32">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 sm:mb-16">
              <div className="space-y-4">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
                  {t('product.you_may_also_like')}
                </h2>
                <p className="text-muted-foreground max-w-xl text-lg">
                  Elevate your routine with these carefully selected companions from our collection.
                </p>
              </div>
              <Button variant="ghost" className="hidden sm:flex rounded-full text-primary hover:bg-primary/5" asChild>
                <Link href="/#shop">View All Products</Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
              {relatedProducts.map((item) => (
                <Link
                  key={item.id}
                  href={`/product/${item.id}`}
                  className="glass rounded-3xl p-3 sm:p-5 group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col h-full shadow-lg shadow-black/5"
                >
                  <div className="aspect-square rounded-2xl overflow-hidden mb-4 sm:mb-6 bg-muted relative">
                    <Image
                      src={(item.images && item.images[0]) || "/placeholder.svg"}
                      alt={isArabic && item.title_ar ? item.title_ar : item.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    {/* Discount Badge Removed */}
                  </div>
                  <h3 className="font-bold text-foreground text-sm sm:text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                    {isArabic && item.title_ar ? item.title_ar : item.title}
                  </h3>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                      <span className="text-base sm:text-xl font-bold text-primary">
                        {t('common.currency')} {item.price}
                      </span>
                      {item.compare_at_price && (
                        <span className="text-[10px] sm:text-xs text-muted-foreground line-through">
                          {t('common.currency')} {item.compare_at_price}
                        </span>
                      )}
                    </div>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Mobile Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-white/10 z-50 lg:hidden safe-area-bottom shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-1 border border-white/5 h-14">
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-10 text-foreground hover:bg-white/10 rounded-lg"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="w-4 text-center font-bold text-lg text-foreground">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-10 text-foreground hover:bg-white/10 rounded-lg"
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <Button
            size="lg"
            className="flex-1 h-14 rounded-xl text-base font-bold shadow-lg shadow-primary/25 active:scale-95 transition-all"
            onClick={() =>
              addItem({
                id: product.id,
                name: product.title,
                nameAr: product.title_ar || undefined,
                price: Number(product.price),
                image: productImages[0],
                quantity: quantity,
                inStock: inStock
              })
            }
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            {t('product.add_to_cart')} • {t('common.currency')} {(product.price * quantity).toFixed(2)}
          </Button>
        </div>
      </div>
    </div>
  )
}
