"use client"

import { useState, useEffect } from "react"
import { useCart } from "@/components/cart-provider"
import { useLanguage } from "@/components/language-provider"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Loader2, ShieldCheck, ShoppingBag, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

const EGYPT_CITIES = [
    "Cairo", "Alexandria", "Giza", "Shubra El Kheima", "Port Said", "Suez", "Luxor", "Mansoura",
    "El-Mahalla El-Kubra", "Tanta", "Asyut", "Ismailia", "Faiyum", "Zagazig", "Aswan", "Damietta",
    "Damanhur", "Minya", "Beni Suef", "Qena", "Sohag", "Hurghada", "6th of October", "Shibin El Kom",
    "Banha", "Kafr El Sheikh", "Arish", "Mallawi", "10th of Ramadan", "Bilbais", "Marsa Matruh",
    "Idfu", "Mit Ghamr", "Al-Hamidiyya", "Desouk", "Qalyub", "Abu Kabir", "Kafr el-Dawwar", "Girga",
    "Akhmim", "Matareya"
].sort()

export default function CheckoutPage() {
    const { items, cartCount } = useCart()
    const { t, language } = useLanguage()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    // Form State
    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        email: "",
        city: "",
        address: "",
    })

    // Redirect if cart is empty
    useEffect(() => {
        if (cartCount === 0) {
            router.push("/cart")
        }
    }, [cartCount, router])

    // Calculate totals
    const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0)
    const shipping = subtotal >= 750 ? 0 : 50
    const total = subtotal + shipping

    // Handle Input Change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[name]
                return newErrors
            })
        }
    }

    const handleCityChange = (value: string) => {
        setFormData(prev => ({ ...prev, city: value }))
        if (errors.city) {
            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors.city
                return newErrors
            })
        }
    }

    // Validation
    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.fullName.trim()) newErrors.fullName = t('validation.required')
        if (!formData.city.trim()) newErrors.city = t('validation.required')
        if (!formData.address.trim()) newErrors.address = t('validation.required')

        // Phone validation (min 10 chars, rudimentary check)
        if (!formData.phone.trim() || formData.phone.length < 10) {
            newErrors.phone = t('validation.phone')
        }

        // Email validation (only if provided)
        if (formData.email.trim() && !/^\S+@\S+\.\S+$/.test(formData.email)) {
            newErrors.email = t('validation.email')
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // Handle Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            toast.error(t('validation.required'))
            return
        }

        setLoading(true)

        try {
            const response = await fetch("/api/checkout/create-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customer: formData,
                    cart: {
                        items,
                        subtotal,
                        shipping,
                        total
                    }
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Something went wrong")
            }

            if (data.redirectUrl) {
                // Save order details for success page
                localStorage.setItem("last_order", JSON.stringify({
                    items,
                    subtotal,
                    shipping,
                    total,
                    customerName: formData.fullName
                }))
                router.push(data.redirectUrl)
            }
        } catch (error) {
            console.error("Checkout Error:", error)
            toast.error("Failed to process checkout. Please try again.")
            setLoading(false)
        }
    }

    if (cartCount === 0) return null

    return (
        <div className="min-h-screen bg-background relative flex flex-col">
            {/* Background gradient orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute top-1/3 right-0 w-80 h-80 bg-secondary/30 rounded-full blur-3xl opacity-50" />
            </div>

            {/* Simple Header */}
            <header className="sticky top-0 z-50 glass-strong border-b border-border/50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="relative">
                        <Image src="/logo.webp" alt="Diar Argan" width={100} height={50} className="h-8 w-auto" />
                    </Link>
                    <Link href="/cart" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" /> {t('checkout.return_cart')}
                    </Link>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-8 sm:py-12">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start max-w-6xl mx-auto">

                    {/* Left Column: Form */}
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground mb-2">{t('checkout.title')}</h1>
                            <p className="text-muted-foreground">{t('checkout.contact_info')}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Full Name */}
                            <div className="space-y-2">
                                <Label htmlFor="fullName">{t('checkout.full_name')} *</Label>
                                <Input
                                    id="fullName"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="Mohammed Kamal"
                                    className={`bg-background/50 h-10 ${errors.fullName ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                />
                                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <Label htmlFor="phone">{t('checkout.phone')} *</Label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-muted-foreground pointer-events-none z-10">
                                        <span className="text-base">🇪🇬</span>
                                        <span className="text-sm font-medium border-r border-border/50 pr-2 h-4 flex items-center">+20</span>
                                    </div>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="123 456 7890"
                                        className={`bg-background/50 h-10 pl-24 ${errors.phone ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                        dir="ltr"
                                    />
                                </div>
                                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email">{t('checkout.email')}</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="john@example.com"
                                    className={`bg-background/50 h-10 ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                />
                                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                            </div>

                            {/* City */}
                            <div className="space-y-2">
                                <Label htmlFor="city">{t('checkout.city')} *</Label>
                                <Select onValueChange={handleCityChange} value={formData.city}>
                                    <SelectTrigger className={`bg-background/50 h-10 ${errors.city ? "border-destructive ring-destructive" : ""}`}>
                                        <SelectValue placeholder="Select City" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {EGYPT_CITIES.map((city) => (
                                            <SelectItem key={city} value={city}>
                                                {city}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
                            </div>

                            {/* Address */}
                            <div className="space-y-2">
                                <Label htmlFor="address">{t('checkout.address')} *</Label>
                                <Textarea
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Street address, apartment, suite, etc."
                                    className={`bg-background/50 min-h-[100px] resize-none ${errors.address ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                />
                                {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
                            </div>

                            {/* Submit Button (Mobile) */}
                            <Button
                                type="submit"
                                size="lg"
                                className="w-full rounded-full lg:hidden text-base h-12 shadow-lg shadow-primary/20"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        {t('checkout.processing')}
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="w-5 h-5 mr-2" />
                                        {t('checkout.pay')} {total.toFixed(2)} {t('common.currency')}
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:sticky lg:top-24 space-y-6">
                        <div className="glass-strong rounded-2xl p-6 sm:p-8">
                            <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-primary" />
                                {t('cart.order_summary')}
                            </h2>

                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {items.map((item) => (
                                    <div key={`${item.id}-${item.size}`} className="flex gap-4 py-2">
                                        <div className="relative w-16 h-16 bg-muted rounded-xl overflow-hidden flex-shrink-0 border border-border/50">
                                            <Image
                                                src={item.image || "/placeholder.svg"}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                            />
                                            <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-bl-lg">
                                                x{item.quantity}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-sm text-foreground line-clamp-1">
                                                {language === 'ar' && item.nameAr ? item.nameAr : item.name}
                                            </h4>
                                            {item.size && <p className="text-xs text-muted-foreground">{item.size}</p>}
                                            <p className="text-sm font-semibold text-primary mt-1">
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
                                    <span className="font-medium text-foreground">{t('common.currency')} {subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>{t('cart.shipping')}</span>
                                    <span className="font-medium text-foreground">
                                        {shipping === 0 ? t('cart.free') : `${t('common.currency')} ${shipping}`}
                                    </span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-foreground pt-3 border-t border-border/50">
                                    <span>{t('cart.total')}</span>
                                    <span>{t('common.currency')} {total.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Submit Button (Desktop) */}
                            <Button
                                onClick={handleSubmit}
                                size="lg"
                                className="w-full rounded-full hidden lg:flex mt-8 text-base h-12 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all font-bold"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        {t('checkout.processing')}
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="w-5 h-5 mr-2" />
                                        {t('checkout.pay')} {total.toFixed(2)} {t('common.currency')}
                                    </>
                                )}
                            </Button>

                            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                                <Truck className="w-3 h-3" /> {t('cart.trust.shipping')}
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    )
}
