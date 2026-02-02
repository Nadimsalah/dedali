"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useLanguage } from "@/components/language-provider"
import { supabase } from "@/lib/supabase"
import { getOrderById, type Order, type OrderItem } from "@/lib/supabase-api"
import {
    ArrowLeft,
    Package,
    Truck,
    CreditCard,
    Calendar,
    MapPin,
    Phone,
    Mail,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    Download
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

export default function ResellerOrderDetailsPage() {
    const { language } = useLanguage()
    const isArabic = language === "ar"
    const params = useParams()
    const router = useRouter()
    const orderId = params.id as string

    const [order, setOrder] = useState<(Order & { order_items: OrderItem[] }) | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadOrder() {
            if (!orderId) return
            setLoading(true)

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push("/login")
                return
            }

            const data = await getOrderById(orderId)

            if (data && data.customer_id === user.id) {
                setOrder(data)
            } else {
                console.error("Order not found or access denied")
            }
            setLoading(false)
        }
        loadOrder()
    }, [orderId, router])

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'bg-yellow-50 text-yellow-600 border-yellow-200'
            case 'processing': return 'bg-blue-50 text-blue-600 border-blue-200'
            case 'shipped': return 'bg-purple-50 text-purple-600 border-purple-200'
            case 'delivered': return 'bg-green-50 text-green-600 border-green-200'
            case 'cancelled': return 'bg-red-50 text-red-600 border-red-200'
            default: return 'bg-gray-50 text-gray-600 border-gray-200'
        }
    }

    const getStatusLabel = (status: string) => {
        if (!isArabic) return status.charAt(0).toUpperCase() + status.slice(1)
        switch (status.toLowerCase()) {
            case 'pending': return 'قيد الانتظار'
            case 'processing': return 'جاري التنفيذ'
            case 'shipped': return 'تم الشحن'
            case 'delivered': return 'تم التوصيل'
            case 'cancelled': return 'ملغي'
            default: return status
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!order) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50/50 text-center">
                <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {isArabic ? "طلب غير موجود" : "Order Not Found"}
                    </h2>
                    <p className="text-gray-500 mb-6">
                        {isArabic ? "لم نتمكن من العثور على هذا الطلب أو لا تملك صلاحية الوصول إليه." : "We couldn't find this order or you don't have permission to view it."}
                    </p>
                    <Link href="/reseller/dashboard">
                        <Button className="w-full h-12 rounded-xl">
                            {isArabic ? "العودة للوحة التحكم" : "Back to Dashboard"}
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    const isDelivered = order.status.toLowerCase() === 'delivered'

    return (
        <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0 print:px-0">
            <div className="max-w-4xl mx-auto print:max-w-full">
                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                    <div className="flex items-center gap-4">
                        <Link href="/reseller/dashboard">
                            <Button variant="outline" size="icon" className="rounded-full bg-white border-gray-200">
                                <ArrowLeft className="w-5 h-5 text-gray-500" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                {isArabic ? "تفاصيل الطلب" : "Order Details"}
                                <span className="text-primary font-mono text-lg">#{order.order_number}</span>
                            </h1>
                            <div className="flex items-center gap-2 mt-1 text-left">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                                    {getStatusLabel(order.status)}
                                </span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(order.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                    {isDelivered && (
                        <Button variant="default" className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl px-6" onClick={() => window.print()}>
                            <Download className={`w-4 h-4 ${isArabic ? "ml-2" : "mr-2"}`} />
                            {isArabic ? "تحميل الفاتورة" : "Download Invoice"}
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">
                    {/* Left Column: Items */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-50">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Package className="w-5 h-5 text-gray-400" />
                                    {isArabic ? "المنتجات" : "Products"}
                                </h3>
                            </div>
                            <div className="p-6">
                                <div className="space-y-6">
                                    {order.order_items.map((item, i) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="h-20 w-20 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 relative border border-gray-100">
                                                {item.product_image ? (
                                                    <Image
                                                        src={item.product_image}
                                                        alt={item.product_title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                                                        <Package className="w-8 h-8" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <h4 className="font-bold text-gray-900 truncate">
                                                    {item.product_title}
                                                </h4>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {isArabic ? `الكمية: ${item.quantity}` : `Quantity: ${item.quantity}`} × {item.price.toLocaleString()} MAD
                                                </p>
                                                {item.variant_name && (
                                                    <span className="inline-block mt-2 px-2 py-0.5 bg-gray-50 text-gray-500 text-[10px] font-bold rounded uppercase tracking-wider">
                                                        {item.variant_name}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900">{item.subtotal.toLocaleString()} MAD</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 pt-8 border-t border-gray-50 space-y-3">
                                    <div className="flex justify-between items-center text-gray-500">
                                        <span>{isArabic ? "المجموع الفرعي" : "Subtotal"}</span>
                                        <span className="font-medium">{order.subtotal.toLocaleString()} MAD</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-500">
                                        <span>{isArabic ? "الشحن" : "Shipping"}</span>
                                        <span className="font-medium">{order.shipping_cost.toLocaleString()} MAD</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                                        <span className="text-lg font-bold text-gray-900">{isArabic ? "الإجمالي" : "Total Amount"}</span>
                                        <span className="text-2xl font-black text-primary">{order.total.toLocaleString()} MAD</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-6">
                                <Clock className="w-5 h-5 text-gray-400" />
                                {isArabic ? "تتبع الطلب" : "Order Tracking"}
                            </h3>
                            <div className="space-y-8 text-left">
                                {[
                                    { label: 'Pending', arabic: 'تم استلام الطلب', icon: CheckCircle2, completed: true },
                                    { label: 'Processing', arabic: 'جاري التحضير', icon: Loader2, completed: ['processing', 'shipped', 'delivered'].includes(order.status) },
                                    { label: 'Shipped', arabic: 'تم الشحن', icon: Truck, completed: ['shipped', 'delivered'].includes(order.status) },
                                    { label: 'Delivered', arabic: 'تم التوصيل', icon: CheckCircle2, completed: order.status === 'delivered' },
                                ].map((step, idx, arr) => (
                                    <div key={idx} className="flex items-start gap-4 relative">
                                        {idx !== arr.length - 1 && (
                                            <div className={`absolute left-2.5 top-5 w-0.5 h-10 ${step.completed ? 'bg-primary' : 'bg-gray-100'}`} />
                                        )}
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 ${step.completed ? 'bg-primary text-white' : 'bg-gray-100 text-gray-300'}`}>
                                            <step.icon className="w-3 h-3" />
                                        </div>
                                        <div className="flex-1 pt-0.5">
                                            <p className={`font-bold text-sm ${step.completed ? 'text-gray-900' : 'text-gray-300'}`}>
                                                {isArabic ? step.arabic : step.label}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Address & Payment */}
                    <div className="space-y-6">
                        {/* Shipping Address */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                                {isArabic ? "عنوان الشحن" : "Shipping Address"}
                            </h4>
                            <div className="flex items-start gap-3 text-left">
                                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-gray-900 font-bold">{order.customer_name}</p>
                                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                                        {order.address_line1}<br />
                                        {order.city}, {order.governorate}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                                {isArabic ? "معلومات الاتصال" : "Contact Information"}
                            </h4>
                            <div className="space-y-3 text-left">
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <Phone className="w-4 h-4" />
                                    {order.customer_phone}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <Mail className="w-4 h-4" />
                                    {order.customer_email}
                                </div>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                                {isArabic ? "طريقة الدفع" : "Payment Method"}
                            </h4>
                            <div className="flex items-center gap-3 text-left">
                                <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center text-green-500 shrink-0">
                                    <CreditCard className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 uppercase">
                                        {order.payment_method === 'cod' ? (isArabic ? 'الدفع عند الاستلام' : 'Cash on Delivery') : order.payment_method}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {isArabic ? "فاتورة رسمية للموزعين" : "Official Reseller Invoice"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Synchronized Professional Invoice Layout (Print Only) */}
                {isDelivered && (
                    <div className="hidden print:block bg-white text-black p-0 min-h-screen font-sans" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as any}>
                        <style dangerouslySetInnerHTML={{
                            __html: `
                            @media print {
                                @page { margin: 5mm; size: auto; }
                                body { -webkit-print-color-adjust: exact !important; margin: 0; padding: 0; }
                                .print-container { padding: 0 !important; }
                                * { -webkit-print-color-adjust: exact !important; }
                                table { page-break-inside: auto; }
                                tr { page-break-inside: avoid; page-break-after: auto; }
                            }
                        `}} />

                        {/* Invoice Header */}
                        <div className="flex justify-between items-start border-b-2 border-[#1a1a1a] pb-4 mb-4">
                            <div>
                                <div className="relative w-40 h-10 mb-2">
                                    <Image
                                        src="/logo.png"
                                        alt="Dedali Store Logo"
                                        fill
                                        className="object-contain object-left"
                                        priority
                                    />
                                </div>
                                <div className="space-y-0 text-[10px] text-black/70 text-left">
                                    <p className="font-black text-[#1a1a1a] text-xs">Dedali Store</p>
                                    <p className="italic">Premium IT Equipment</p>
                                    <p>Casablanca, Morocco</p>
                                    <p>Email: contact@dedalistore.com</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h1 className="text-3xl font-black text-[#1a1a1a] uppercase mb-0 tracking-tighter">FACTURE</h1>
                                <div className="space-y-0">
                                    <p className="text-xs font-bold text-black/90">N° Commande: {order.order_number}</p>
                                    <p className="text-[10px] text-black/60">Date: {new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                    <p className="text-[10px] text-black/60">Statut: <span className="uppercase font-bold text-green-600">DELIVRÉ</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Billing & Shipping Info */}
                        <div className="grid grid-cols-2 gap-4 mb-4 text-left">
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <h3 className="text-[8px] font-black text-black/40 uppercase tracking-[0.2em] mb-1">Facturé à</h3>
                                <div className="space-y-0">
                                    <p className="font-black text-sm text-[#1a1a1a]">{order.customer_name}</p>
                                    <p className="text-[10px] text-black/80">{order.customer_email}</p>
                                    <p className="text-[10px] text-black/80">{order.customer_phone}</p>
                                </div>
                            </div>
                            <div className="p-3">
                                <h3 className="text-[8px] font-black text-black/40 uppercase tracking-[0.2em] mb-1 text-right">Adresse de livraison</h3>
                                <div className="text-right space-y-0">
                                    <p className="font-black text-sm text-[#1a1a1a]">{order.customer_name}</p>
                                    <p className="text-[10px] text-black/80">{order.address_line1}</p>
                                    {order.address_line2 && <p className="text-[10px] text-black/80">{order.address_line2}</p>}
                                    <p className="text-[10px] text-black/80 font-bold">{order.city}, {order.governorate}</p>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-4">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-black">
                                        <th className="py-1 px-1 text-left text-[9px] uppercase font-black tracking-wider w-[50%]">Produit</th>
                                        <th className="py-1 px-1 text-center text-[9px] uppercase font-black tracking-wider w-[15%]">Qté</th>
                                        <th className="py-1 px-1 text-right text-[9px] uppercase font-black tracking-wider w-[15%]">PU</th>
                                        <th className="py-1 px-1 text-right text-[9px] uppercase font-black tracking-wider w-[20%]">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {order.order_items.map((item, i) => (
                                        <tr key={i}>
                                            <td className="py-1.5 px-1 text-left">
                                                <p className="font-bold text-[11px] text-[#1a1a1a]">{item.product_title}</p>
                                                {item.variant_name && <p className="text-[8px] text-black/60 italic leading-none">{item.variant_name}</p>}
                                            </td>
                                            <td className="py-1.5 px-1 text-center font-bold text-[11px]">{item.quantity}</td>
                                            <td className="py-1.5 px-1 text-right text-[11px] text-black/70">{(item.price || 0).toLocaleString('fr-FR')}</td>
                                            <td className="py-1.5 px-1 text-right font-black text-[11px]">{(item.subtotal || 0).toLocaleString('fr-FR')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary */}
                        <div className="flex justify-end mb-4">
                            <div className="w-48 space-y-0.5">
                                <div className="flex justify-between items-center py-0.5 border-b border-gray-100 px-1">
                                    <span className="text-[9px] font-bold text-black/60">Sous-total</span>
                                    <span className="text-[10px] font-medium">{(order.subtotal || 0).toLocaleString('fr-FR')} MAD</span>
                                </div>
                                <div className="flex justify-between items-center py-0.5 border-b border-gray-100 px-1">
                                    <span className="text-[9px] font-bold text-black/60">Livraison</span>
                                    <span className="text-[10px] font-medium">{(order.shipping_cost || 0).toLocaleString('fr-FR')} MAD</span>
                                </div>
                                <div className="flex justify-between items-center py-1 bg-[#1a1a1a] text-white rounded-lg px-3 shadow-sm mt-1">
                                    <span className="text-[9px] font-black uppercase tracking-wider">Total à payer</span>
                                    <span className="text-base font-black font-mono">{(order.total || 0).toLocaleString('fr-FR')} MAD</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-black/10 text-left">
                            <div>
                                <h4 className="text-[8px] font-black text-[#1a1a1a] uppercase tracking-widest mb-1">Informations</h4>
                                <p className="text-[8px] text-black/50 leading-tight">
                                    Merci de votre confiance. Cette facture est une preuve de votre achat en tant que revendeur agréé.
                                    Pour toute assistance technique: contact@dedalistore.com
                                </p>
                            </div>
                            <div className="flex flex-col items-end justify-center">
                                <div className="text-center">
                                    <p className="text-[8px] text-black/40 font-black uppercase tracking-[0.3em] mb-1">Cachet & Signature</p>
                                    <div className="w-24 h-10 border-2 border-dashed border-gray-200 rounded-lg"></div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 text-center">
                            <p className="text-[8px] text-black/30 font-bold uppercase tracking-[0.2em]">Dedali Store SARL — RC: 123456 — ICE: 0000000000000000</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
