"use client"

import { useEffect, useState } from "react"
import { useCart } from "@/components/cart-provider"
import { useLanguage } from "@/components/language-provider"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ArrowRight, Copy, ShoppingBag, PhoneCall } from "lucide-react"
import { toast } from "sonner"

interface OrderData {
    items: any[]
    subtotal: number
    shipping: number
    total: number
    customerName: string
}

export default function CheckoutSuccessPage() {
    const { clearCart } = useCart()
    const { t, language } = useLanguage()
    const [order, setOrder] = useState<OrderData | null>(null)

    useEffect(() => {
        // Load order details first
        const storedOrder = localStorage.getItem("last_order")
        if (storedOrder) {
            try {
                setOrder(JSON.parse(storedOrder))
            } catch (e) {
                console.error("Failed to parse order", e)
            }
        }

        // Clear cart on successful checkout
        clearCart()
    }, [])

    const copyCoupon = () => {
        navigator.clipboard.writeText("THANKYOU20")
        toast.success("Coupon code copied!")
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 py-12 relative overflow-hidden">
            {/* Background gradient orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-2xl space-y-8 relative z-10">

                {/* Main Success Card */}
                <div className="glass rounded-3xl p-8 sm:p-12 text-center border-primary/10 shadow-2xl shadow-primary/5">
                    {/* Logo */}
                    <div className="mb-8">
                        <Image src="/logo.png" alt="Dedali Store" width={150} height={60} className="h-12 w-auto mx-auto" />
                    </div>

                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500">
                        <CheckCircle2 className="w-10 h-10 text-primary" />
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                        {t('success.thank_you')}{order?.customerName ? `, ${order.customerName.split(' ')[0]}!` : '!'}
                    </h1>

                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-8 inline-block">
                        <p className="text-foreground font-medium flex items-center justify-center gap-2">
                            <PhoneCall className="w-5 h-5 text-primary" />
                            {t('checkout.success_desc')}
                        </p>
                    </div>

                    {/* Coupon Section */}
                    <div className="glass-strong rounded-2xl p-6 mb-8 border border-dashed border-primary/30 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                        <div className="relative">
                            <p className="text-sm font-semibold text-primary uppercase tracking-wide mb-2">{t('success.coupon_title')}</p>
                            <div className="flex items-center justify-center gap-3 mb-2">
                                <span className="text-2xl sm:text-3xl font-bold font-mono text-foreground">THANKYOU20</span>
                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-primary/20" onClick={copyCoupon}>
                                    <Copy className="w-4 h-4 text-primary" />
                                </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">{t('success.coupon_desc')}</p>
                        </div>
                    </div>

                    <Link href="/">
                        <Button size="lg" className="rounded-full w-full sm:w-auto px-10 h-12 text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-105">
                            {t('checkout.continue_shopping')} <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                </div>

                {/* Order Summary Card */}
                {order && (
                    <div className="glass-subtle rounded-3xl p-6 sm:p-8 animate-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-backwards">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-foreground">
                            <ShoppingBag className="w-5 h-5 text-primary" />
                            {t('success.order_summary')}
                        </h3>

                        <div className="space-y-4">
                            {order.items.map((item: any) => (
                                <div key={`${item.id}-${item.size}`} className="flex gap-4 py-2">
                                    <div className="relative w-14 h-14 bg-muted rounded-xl overflow-hidden flex-shrink-0 border border-border/50">
                                        <Image
                                            src={item.image || "/placeholder.svg"}
                                            alt={language === 'ar' && item.nameAr ? item.nameAr : item.name}
                                            fill
                                            className="object-cover"
                                        />
                                        <span className="absolute bottom-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-tl-lg">
                                            x{item.quantity}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0 flex justify-between items-center">
                                        <div>
                                            <h4 className="font-medium text-sm text-foreground line-clamp-1">
                                                {language === 'ar' && item.nameAr ? item.nameAr : item.name}
                                            </h4>
                                            {item.size && <p className="text-xs text-muted-foreground">{item.size}</p>}
                                        </div>
                                        <p className="text-sm font-semibold text-primary">
                                            {t('common.currency')} {(item.price * item.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="my-6 h-px bg-border/50" />

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-muted-foreground">
                                <span>{t('cart.subtotal')}</span>
                                <span className="font-medium text-foreground">{t('common.currency')} {order.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>{t('cart.shipping')}</span>
                                <span className="font-medium text-foreground">
                                    {order.shipping === 0 ? t('cart.free') : `${t('common.currency')} ${order.shipping}`}
                                </span>
                            </div>
                            <div className="flex justify-between text-lg font-bold text-foreground pt-3 border-t border-border/50">
                                <span>{t('cart.total')}</span>
                                <span>{t('common.currency')} {order.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}
