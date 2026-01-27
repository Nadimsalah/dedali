"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getOrderById, updateOrderStatus, type Order, type OrderItem } from "@/lib/supabase-api"
import {
    ArrowLeft,
    Printer,
    MapPin,
    Phone,
    Mail,
    CreditCard,
    Package,
    CheckCircle2,
    Clock,
    Truck,
} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

export default function OrderDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const orderId = params.id as string

    const [order, setOrder] = useState<(Order & { order_items: OrderItem[] }) | null>(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)

    useEffect(() => {
        async function loadOrder() {
            if (!orderId) return
            setLoading(true)
            const data = await getOrderById(orderId)
            setOrder(data)
            setLoading(false)
        }
        loadOrder()
    }, [orderId])

    const handlePrint = () => {
        window.print()
        toast.success("Printing Invoice...")
    }

    const handleStatusChange = async (newStatus: string) => {
        if (!order) return
        setUpdating(true)
        const { error } = await updateOrderStatus(order.id, newStatus.toLowerCase())

        if (error) {
            toast.error("Failed to update status")
        } else {
            setOrder(prev => prev ? { ...prev, status: newStatus.toLowerCase() } : null)
            toast.success(`Order status updated to ${newStatus}`)
        }
        setUpdating(false)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground animate-pulse">Loading order details...</p>
                </div>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Order not found</h2>
                    <Button onClick={() => router.back()}>Go Back</Button>
                </div>
            </div>
        )
    }

    const getStatusColor = (status: string) => {
        const s = status.toLowerCase()
        switch (s) {
            case "processing": return "bg-blue-500/10 text-blue-500 border-blue-500/20"
            case "delivered": return "bg-green-500/10 text-green-500 border-green-500/20"
            case "pending": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
            case "cancelled": return "bg-red-500/10 text-red-500 border-red-500/20"
            default: return "bg-secondary text-secondary-foreground"
        }
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden print:bg-white print:overflow-visible">
            {/* Background gradients */}
            <div className="fixed inset-0 pointer-events-none print:hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px]" />
            </div>

            <div className="print:hidden">
                <AdminSidebar />
            </div>

            <main className="lg:pl-72 p-4 sm:p-6 lg:p-8 min-h-screen relative z-10 print:pl-0 print:p-0">
                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sticky top-4 z-40 glass-strong p-4 rounded-3xl border border-white/5 shadow-lg shadow-black/5 print:hidden">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-primary/10">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                                {order.order_number}
                                <Badge variant="outline" className={`ml-2 border-primary/20 ${getStatusColor(order.status)}`}>
                                    {order.status}
                                </Badge>
                            </h1>
                            <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="rounded-full h-9 bg-background/50 border-white/10 hover:bg-white/10" onClick={handlePrint}>
                            <Printer className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">Print Invoice</span>
                        </Button>
                    </div>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 print:block">
                    {/* Left Column: Order Details */}
                    <div className="xl:col-span-2 space-y-6">

                        {/* Items Card */}
                        <div className="glass-strong rounded-3xl p-6 print:hidden">
                            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                <Package className="w-5 h-5 text-primary" /> Order Items
                            </h3>

                            <div className="space-y-4">
                                {order.order_items.map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5">
                                        <div className="h-16 w-16 bg-muted rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                                            {item.product_image ? (
                                                <Image
                                                    src={item.product_image}
                                                    alt={item.product_title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <Package className="w-8 h-8 text-muted-foreground/20" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-foreground">{item.product_title}</h4>
                                            <p className="text-sm text-muted-foreground">Qty: {item.quantity} × EGP {item.price}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-foreground">EGP {item.subtotal}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span>EGP {order.subtotal}</span>
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Shipping</span>
                                    <span>EGP {order.shipping_cost}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-foreground pt-4 border-t border-white/5">
                                    <span>Total</span>
                                    <span className="text-primary">EGP {order.total}</span>
                                </div>
                            </div>
                        </div>

                        {/* Professional Invoice Layout (Print Only) */}
                        <div className="hidden print:block bg-white text-black p-0 min-h-screen" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as any}>
                            <style dangerouslySetInnerHTML={{
                                __html: `
                                @media print {
                                    @page { margin: 10mm; }
                                    body { -webkit-print-color-adjust: exact !important; }
                                }
                            `}} />

                            {/* Invoice Header */}
                            <div className="flex justify-between items-start border-b-2 border-[#1a1a1a] pb-8 mb-8">
                                <div>
                                    <div className="relative w-56 h-24 mb-4">
                                        <Image
                                            src="/logo.webp"
                                            alt="Diar Argan Logo"
                                            fill
                                            className="object-contain object-left"
                                            priority
                                        />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-black text-[#1a1a1a]">Diar Argan</p>
                                        <p className="text-xs text-black/70 italic">L'excellence de l'Argan Bio</p>
                                        <p className="text-xs text-black/60">Casablanca, Morocco</p>
                                        <p className="text-xs text-black/60">Email: contact@diarargan.com</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h1 className="text-5xl font-black text-[#1a1a1a] uppercase mb-2 tracking-tighter">FACTURE</h1>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-black/90">N° Commande: {order.order_number}</p>
                                        <p className="text-xs text-black/60">Date: {new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                        <p className="text-xs text-black/60">Statut: <span className="uppercase font-bold text-green-600">{order.status}</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Billing & Shipping Info */}
                            <div className="grid grid-cols-2 gap-16 mb-12">
                                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                    <h3 className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] mb-4">Facturé à</h3>
                                    <div className="space-y-1">
                                        <p className="font-black text-lg text-[#1a1a1a]">{order.customer_name}</p>
                                        <p className="text-sm text-black/80">{order.customer_email}</p>
                                        <p className="text-sm text-black/80">{order.customer_phone}</p>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] mb-4 text-right">Adresse de livraison</h3>
                                    <div className="text-right space-y-1">
                                        <p className="font-black text-lg text-[#1a1a1a]">{order.customer_name}</p>
                                        <p className="text-sm text-black/80">{order.address_line1}</p>
                                        {order.address_line2 && <p className="text-sm text-black/80">{order.address_line2}</p>}
                                        <p className="text-sm text-black/80 font-bold">{order.city}, {order.governorate}</p>
                                        {order.postal_code && <p className="text-sm text-black/80">{order.postal_code}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="mb-12">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b-2 border-black">
                                            <th className="py-4 px-2 text-left text-[10px] uppercase font-black tracking-wider w-[50%]">Produit & Description</th>
                                            <th className="py-4 px-2 text-center text-[10px] uppercase font-black tracking-wider w-[15%]">Quantité</th>
                                            <th className="py-4 px-2 text-right text-[10px] uppercase font-black tracking-wider w-[15%]">Prix Unitaire</th>
                                            <th className="py-4 px-2 text-right text-[10px] uppercase font-black tracking-wider w-[20%]">Total HT</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {order.order_items.map((item, i) => (
                                            <tr key={i} className="border-b border-gray-100">
                                                <td className="py-5 px-2">
                                                    <p className="font-bold text-sm text-[#1a1a1a]">{item.product_title}</p>
                                                    <p className="text-[10px] text-black/40 font-mono mt-1">SKU: {item.product_sku || 'N/A'}</p>
                                                    {item.variant_name && <p className="text-[10px] text-black/60 italic mt-1 bg-gray-50 inline-block px-2 py-0.5 rounded-md">{item.variant_name}</p>}
                                                </td>
                                                <td className="py-5 px-2 text-center font-bold text-sm">{item.quantity}</td>
                                                <td className="py-5 px-2 text-right text-sm">{(item.price || 0).toLocaleString('fr-FR')} EGP</td>
                                                <td className="py-5 px-2 text-right font-black text-sm">{(item.subtotal || 0).toLocaleString('fr-FR')} EGP</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer Summary */}
                            <div className="flex justify-end mb-20">
                                <div className="w-96 space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100 px-2">
                                        <span className="text-xs font-bold text-black/60">Sous-total</span>
                                        <span className="text-sm font-medium">{(order.subtotal || 0).toLocaleString('fr-FR')} EGP</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100 px-2">
                                        <span className="text-xs font-bold text-black/60">Frais de livraison</span>
                                        <span className="text-sm font-medium">{(order.shipping_cost || 0).toLocaleString('fr-FR')} EGP</span>
                                    </div>
                                    <div className="flex justify-between items-center py-4 bg-[#1a1a1a] text-white rounded-xl px-6 shadow-xl">
                                        <span className="text-sm font-black uppercase tracking-wider">Total à payer</span>
                                        <span className="text-2xl font-black font-mono">{(order.total || 0).toLocaleString('fr-FR')} EGP</span>
                                    </div>
                                    {order.status !== 'delivered' && (
                                        <div className="text-right pt-2">
                                            <p className="text-[10px] font-bold text-red-600 uppercase tracking-tight">Paiement à la livraison (COD)</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Notes / Legal */}
                            <div className="grid grid-cols-2 gap-12 pt-12 border-t border-black/10">
                                <div>
                                    <h4 className="text-[10px] font-black text-[#1a1a1a] uppercase tracking-widest mb-4">Informations Importantes</h4>
                                    <p className="text-[10px] text-black/50 leading-relaxed">
                                        Merci de conserver cette facture. Pour toute question concernant votre commande,
                                        veuillez nous contacter par téléphone au (+212) 6 00 00 00 00 ou par email.
                                        Les retours sont acceptés sous 15 jours si l'emballage n'est pas ouvert.
                                    </p>
                                </div>
                                <div className="flex flex-col items-end justify-center">
                                    <div className="text-center">
                                        <p className="text-[10px] text-black/40 font-black uppercase tracking-[0.3em] mb-4">Cachet & Signature</p>
                                        <div className="w-48 h-24 border-2 border-dashed border-gray-200 rounded-2xl"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="fixed bottom-10 left-0 right-0 text-center">
                                <p className="text-[10px] text-black/30 font-bold uppercase tracking-[0.2em]">Diar Argan SARL — RC: 123456 — ICE: 0000000000000000</p>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Customer & Status */}
                    <div className="space-y-6 print:hidden">

                        {/* Status Card */}
                        <div className="glass-strong rounded-3xl p-6 border-l-4 border-primary">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Update Status</h3>
                            <div className="space-y-3">
                                {["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map((s) => (
                                    <button
                                        key={s}
                                        disabled={updating}
                                        onClick={() => handleStatusChange(s)}
                                        className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between ${order.status === s.toLowerCase()
                                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                            : "hover:bg-white/5 text-foreground"
                                            } ${updating ? "opacity-50 cursor-not-allowed" : ""}`}
                                    >
                                        <span className="font-medium">{s}</span>
                                        {order.status === s.toLowerCase() && <CheckCircle2 className="w-4 h-4" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Customer Details */}
                        <div className="glass-strong rounded-3xl p-6">
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-lg font-bold text-foreground">Customer</h3>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                    {order.customer_name.charAt(0)}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="p-2 bg-white/5 rounded-lg text-primary">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Email</p>
                                        <p className="text-foreground font-medium truncate">{order.customer_email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="p-2 bg-white/5 rounded-lg text-primary">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Phone</p>
                                        <p className="text-foreground font-medium">{order.customer_phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="p-2 bg-white/5 rounded-lg text-primary">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Address</p>
                                        <p className="text-foreground font-medium leading-tight">
                                            {order.address_line1}, {order.city}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Info */}
                        <div className="glass-strong rounded-3xl p-6">
                            <h3 className="text-lg font-bold text-foreground mb-4">Delivery Info</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-sm">
                                    <Truck className="w-4 h-4 text-primary" />
                                    <div>
                                        <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Method</p>
                                        <p className="text-foreground font-medium">Standard Delivery</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <MapPin className="w-4 h-4 text-primary" />
                                    <div>
                                        <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Destination</p>
                                        <p className="text-foreground font-medium">{order.city}, Egypt</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="glass-strong rounded-3xl p-6">
                            <h3 className="text-lg font-bold text-foreground mb-4">Payment</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-sm">
                                    <CreditCard className="w-4 h-4 text-primary" />
                                    <div>
                                        <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Method</p>
                                        <p className="text-foreground font-medium">Cash on Delivery (COD)</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Badge variant="outline" className={`border-primary/20 ${order.status === "delivered" ? "text-primary bg-primary/5" : "text-yellow-500 bg-yellow-500/10"}`}>
                                        {order.status === "delivered" ? "Payment Collected" : "Payment Pending"}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
