"use client"

import React, { useState, useEffect } from "react"
import { useCart } from "@/components/cart-provider"
import { useLanguage } from "@/components/language-provider"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  ShoppingBag,
  Minus,
  Plus,
  X,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Tag,
  Heart,
  Trash2,
} from "lucide-react"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"



export default function CartPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [promoCode, setPromoCode] = useState("")
  const [promoApplied, setPromoApplied] = useState(false)
  const { items: cartItems, removeItem, updateQuantity } = useCart()
  const { t, language } = useLanguage()

  // Cart calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discount = promoApplied ? subtotal * 0.2 : 0
  const shipping = subtotal > 750 ? 0 : 50
  const total = subtotal - discount + shipping

  const applyPromo = () => {
    if (promoCode.toUpperCase() === "ARGAN20") {
      setPromoApplied(true)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Announcement Bar */}
      <div className="bg-primary text-primary-foreground text-center py-2 px-4 text-sm font-medium">
        Free Shipping on Orders Over EGP 750 • Use Code ARGAN20 for 20% Off
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



            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <Link href="/cart">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-semibold">
                    {cartItems.length}
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 sm:py-12">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('cart.continue_shopping')}
        </Link>

        {cartItems.length === 0 ? (
          // Empty Cart State
          <div className="glass-strong rounded-2xl sm:rounded-3xl p-8 sm:p-12 lg:p-16 text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 sm:mb-3">{t('cart.your_cart_empty')}</h1>
            <p className="text-muted-foreground mb-6 sm:mb-8 text-base sm:text-lg">
              {t('cart.empty_desc')}
            </p>
            <Link href="/">
              <Button size="lg" className="rounded-full shadow-lg shadow-primary/20 w-full sm:w-auto">
                {t('cart.start_shopping')}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('cart.shopping_cart')}</h1>
                <span className="text-sm sm:text-base text-muted-foreground">{cartItems.length} {t('cart.items')}</span>
              </div>

              {cartItems.map((item) => (
                <div key={item.id} className="glass rounded-xl sm:rounded-2xl p-3 sm:p-6 group hover:shadow-xl transition-all">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    {/* Product Image */}
                    <div className="relative flex-shrink-0">
                      <div className="w-full sm:w-28 sm:h-28 lg:w-32 lg:h-32 aspect-square sm:aspect-auto rounded-xl overflow-hidden bg-muted">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {!item.inStock && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">Out of Stock</span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-base sm:text-lg mb-1 line-clamp-2">
                            {language === 'ar' && item.nameAr ? item.nameAr : item.name}
                          </h3>
                          {item.size && <p className="text-xs sm:text-sm text-muted-foreground">Size: {item.size}</p>}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 sm:h-9 sm:w-9 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all flex-shrink-0"
                          onClick={() => removeItem(item.id, item.size)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-transparent"
                            onClick={() => updateQuantity(item.id, item.quantity - 1, item.size)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center font-medium text-sm sm:text-base">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-transparent"
                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.size)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="text-base sm:text-lg font-bold text-foreground">{t('common.currency')} {(item.price * item.quantity).toFixed(2)}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">{t('common.currency')} {item.price.toFixed(2)} each</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="glass-strong rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:sticky lg:top-24 space-y-5 sm:space-y-6">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">{t('cart.order_summary')}</h2>
                {/* Promo Code */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t('cart.promo_code')}</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder={t('cart.enter_code')}
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      disabled={promoApplied}
                      className="rounded-full bg-background/50"
                    />
                    <Button
                      variant="outline"
                      onClick={applyPromo}
                      disabled={promoApplied}
                      className="rounded-full bg-transparent"
                    >
                      {promoApplied ? t('cart.applied') : t('cart.apply')}
                    </Button>
                  </div>
                  {promoApplied && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <Tag className="w-4 h-4" />
                      <span className="font-medium">{t('cart.discount_applied')}</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-foreground/80">
                    <span>{t('cart.subtotal')}</span>
                    <span className="font-medium">{t('common.currency')} {subtotal.toFixed(2)}</span>
                  </div>
                  {promoApplied && (
                    <div className="flex items-center justify-between text-primary">
                      <span>Discount (20%)</span>
                      <span className="font-medium">-{t('common.currency')} {discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-foreground/80">
                    <span>{t('cart.shipping')}</span>
                    <span className="font-medium">{shipping === 0 ? t('cart.free') : `${t('common.currency')} ${shipping.toFixed(2)}`}</span>
                  </div>
                  {subtotal < 750 && (
                    <p className="text-xs text-muted-foreground">
                      {t('cart.add_more_shipping')} {t('common.currency')} {(750 - subtotal).toFixed(2)}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Total */}
                <div className="flex items-center justify-between text-lg font-bold text-foreground">
                  <span>{t('cart.total')}</span>
                  <span>{t('common.currency')} {total.toFixed(2)}</span>
                </div>

                {/* Checkout Button */}
                <Link href="/checkout" className="block w-full">
                  <Button
                    size="lg"
                    className="w-full rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all text-base h-12"
                  >
                    {t('cart.proceed_checkout')}
                  </Button>
                </Link>

                {/* Trust Badges */}
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                    </div>
                    <span>{t('cart.trust.secure')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Truck className="w-4 h-4 text-primary" />
                    </div>
                    <span>{t('cart.trust.shipping')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
        }

        {/* Recommended Products */}
        {
          cartItems.length > 0 && (
            <div className="mt-12 sm:mt-16">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">You May Also Like</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {[
                  {
                    name: "Argan Face Cream",
                    price: 420.0,
                    image: "https://images.unsplash.com/photo-1616401776156-0e4c699d5122?w=400&h=400&fit=crop",
                  },
                  {
                    name: "Exfoliating Scrub",
                    price: 280.0,
                    image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop",
                  },
                  {
                    name: "Night Repair Serum",
                    price: 550.0,
                    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop",
                  },
                  {
                    name: "Hydrating Mist",
                    price: 240.0,
                    image: "https://images.unsplash.com/photo-1556228994-7a5c6d31ca14?w=400&h=400&fit=crop",
                  },
                ].map((product, idx) => (
                  <Link key={idx} href={`/product/${idx + 1}`} className="glass rounded-xl sm:rounded-2xl p-3 sm:p-4 group hover:shadow-xl transition-all block">
                    <div className="aspect-square rounded-lg sm:rounded-xl overflow-hidden mb-3 sm:mb-4 bg-muted">
                      <Image
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h3 className="font-semibold text-foreground text-sm sm:text-base mb-2 line-clamp-2">{product.name}</h3>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <span className="text-base sm:text-lg font-bold text-primary">{t('common.currency')} {product.price.toFixed(2)}</span>
                      <Button size="sm" variant="outline" className="rounded-full bg-transparent w-full sm:w-auto text-xs sm:text-sm pointer-events-none">
                        View
                      </Button>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )
        }
      </main >


    </div >
  )
}
