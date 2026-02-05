"use client"

import { useState, useEffect } from "react"
import { getOrderDetailsAdmin, updateOrderStatusAdmin } from "@/app/actions/admin-orders"
import { useParams, useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { useLanguage } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
    History,
    User
} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { supabase } from "@/lib/supabase"

export default function OrderDetailsPage() {
    const { t, setLanguage } = useLanguage()
    const params = useParams()
    const router = useRouter()
    const orderId = params.id as string

    // Flattened State (View Model)
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [printType, setPrintType] = useState<'delivery' | 'invoice' | null>(null)

    // Set French as default for dashboard
    useEffect(() => {
        const savedLang = localStorage.getItem("language")
        if (!savedLang) {
            setLanguage("fr")
        }
    }, [setLanguage])

    useEffect(() => {
        if (orderId) loadData()
    }, [orderId])

    async function loadData() {
        setLoading(true)
        try {
            const { success, data, error } = await getOrderDetailsAdmin(orderId)
            if (error || !success || !data) throw new Error(error || "Failed to fetch data")
            setOrder(data)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handlePrint = (type: 'delivery' | 'invoice') => {
        setPrintType(type)
        setTimeout(() => {
            window.print()
        }, 100)
    }

    const handleStatusChange = async (newStatus: string) => {
        if (!order) return
        setUpdating(true)
        const statusLower = newStatus.toLowerCase()

        // Use Server Action to bypass RLS and create logs
        // Pass the Actor ID from client session to properly attribute the log
        const { data: { user } } = await supabase.auth.getUser()
        const { error, success } = await updateOrderStatusAdmin(order.id, statusLower, user?.id)

        if (error) {
            toast.error(`Failed to update status: ${error}`)
        } else if (success) {
            // Optimistic update
            setOrder((prev: any) => ({
                ...prev,
                status: statusLower,
                auditLogs: [{
                    id: `temp-${Date.now()}`,
                    new_status: statusLower,
                    created_at: new Date().toISOString(),
                    changed_by_user: { name: 'You (Just Now)' }
                }, ...(prev.auditLogs || [])]
            }))

            toast.success(`Order status updated to ${newStatus}`)

            // Automated Printing
            if (statusLower === 'shipped') {
                handlePrint('delivery')
            } else if (statusLower === 'delivered') {
                handlePrint('invoice')
            }
        }
        setUpdating(false)
    }

    const getStatusColor = (status: string) => {
        const s = status.toLowerCase()
        switch (s) {
            case "processing": return "bg-blue-500/10 text-blue-500 border-blue-500/20"
            case "delivered": return "bg-green-500/10 text-green-500 border-green-500/20"
            case "pending": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
            case "shipped": return "bg-amber-500/10 text-amber-500 border-amber-500/20"
            case "cancelled": return "bg-red-500/10 text-red-500 border-red-500/20"
            default: return "bg-secondary text-secondary-foreground"
        }
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
                            <p className="text-xs font-bold text-primary mt-0.5">{order.display_company_name}</p>
                            <p className="text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="rounded-full h-9 bg-background/50 border-white/10 hover:bg-white/10" onClick={() => handlePrint('delivery')}>
                            <Truck className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">Bon Livraison</span>
                        </Button>
                        <Button variant="outline" className="rounded-full h-9 bg-background/50 border-white/10 hover:bg-white/10" onClick={() => handlePrint('invoice')}>
                            <Printer className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">Facture</span>
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
                                {order.items.map((item: any, i: number) => (
                                    <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5">
                                        <div className="h-16 w-16 bg-muted rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                                            {item.image_url ? (
                                                <Image
                                                    src={item.image_url}
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
                                            <p className="text-sm text-muted-foreground">Qty: {item.quantity} × MAD {item.final_price}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-foreground">MAD {item.subtotal}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span>MAD {order.subtotal}</span>
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Shipping</span>
                                    <span>MAD {order.shipping_cost}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-foreground pt-4 border-t border-white/5">
                                    <span>Total</span>
                                    <span className="text-primary">MAD {order.total}</span>
                                </div>
                            </div>
                        </div>

                        {/* Print Only Section (Unchanged for compatibility) */}
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
                                    .no-break { page-break-inside: avoid; }
                                }
                            `}} />

                            {/* Invoice Header */}
                            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4 no-break">
                                <div>
                                    <div className="relative w-24 h-7 mb-2">
                                        <Image
                                            src="/logo.png"
                                            alt="Dedali Store Logo"
                                            fill
                                            className="object-contain object-left"
                                            priority
                                        />
                                    </div>
                                    <div className="space-y-0 text-[10px] text-black/70">
                                        <p className="font-black text-[#1a1a1a] text-xs">Dedali Store SARL</p>
                                        <p className="italic">Premium IT Equipment</p>
                                        <p>Casablanca, Morocco</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h1 className="text-2xl font-black text-[#1a1a1a] uppercase mb-0 tracking-tighter">
                                        {printType === 'delivery' ? 'Bon de Livraison' : 'Facture'}
                                    </h1>
                                    <div className="space-y-0">
                                        <p className="text-xs font-bold text-black/90">N° {order.order_number}</p>
                                        <p className="text-[10px] text-black/60">Date: {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                        <p className="text-[10px] text-black/60">Statut: <span className="uppercase font-bold text-green-600">PAYÉ</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Billing & Shipping Info */}
                            <div className="grid grid-cols-2 gap-4 mb-4 no-break">
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <h3 className="text-[8px] font-black text-black/40 uppercase tracking-[0.2em] mb-1">Client</h3>
                                    <div className="space-y-0">
                                        <p className="font-black text-sm text-[#1a1a1a]">{order.display_company_name}</p>
                                        <p className="text-[9px] text-black/50 italic leading-none">Contact: {order.display_reseller_name}</p>
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
                            <div className="mb-4 no-break">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b-2 border-black">
                                            <th className="py-1 px-1 text-left text-[9px] uppercase font-black tracking-wider w-[50%]">Produit</th>
                                            <th className="py-1 px-1 text-center text-[9px] uppercase font-black tracking-wider w-[15%]">Qté</th>
                                            {printType === 'invoice' && <th className="py-1 px-1 text-right text-[9px] uppercase font-black tracking-wider w-[15%]">PU</th>}
                                            {printType === 'invoice' && <th className="py-1 px-1 text-right text-[9px] uppercase font-black tracking-wider w-[20%]">Total</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {order.items.map((item: any, i: number) => (
                                            <tr key={i}>
                                                <td className="py-1 px-1 text-left">
                                                    <p className="font-bold text-[11px] text-[#1a1a1a]">{item.product_title}</p>
                                                    {item.variant_name && <p className="text-[8px] text-black/60 italic leading-none">{item.variant_name}</p>}
                                                </td>
                                                <td className="py-1 px-1 text-center font-bold text-[11px]">{item.quantity}</td>
                                                {printType === 'invoice' && <td className="py-1 px-1 text-right text-[11px] text-black/70">{(item.final_price || 0).toLocaleString('fr-FR')}</td>}
                                                {printType === 'invoice' && <td className="py-1 px-1 text-right font-black text-[11px]">{(item.subtotal || 0).toLocaleString('fr-FR')}</td>}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary */}
                            {printType === 'invoice' && (
                                <div className="flex justify-end mb-4 no-break">
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
                            )}

                            {/* Footer */}
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-black/10 text-left no-break">
                                <div>
                                    <h4 className="text-[8px] font-black text-[#1a1a1a] uppercase tracking-widest mb-1">Informations</h4>
                                    <p className="text-[8px] text-black/50 leading-tight">
                                        Dedali Store SARL — RC: 78910 — ICE: 0011223344556677<br />
                                        Ce document fait office de preuve {printType === 'delivery' ? 'de livraison' : "d'achat"}.
                                    </p>
                                </div>
                                <div className="flex flex-col items-end justify-center">
                                    <div className="text-center">
                                        <p className="text-[8px] text-black/40 font-black uppercase tracking-[0.3em] mb-1">Cachet & Signature</p>
                                        <div className="w-24 h-10 border-2 border-dashed border-gray-200 rounded-lg"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Status & History */}
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

                        {/* NEW: Audit Logs / Timeline */}
                        <div className="glass-strong rounded-3xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <History className="w-4 h-4 text-primary" />
                                <h3 className="font-bold text-foreground">Timeline Logs</h3>
                            </div>
                            <div className="relative pl-2 border-l border-white/10 space-y-6 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {order.auditLogs && order.auditLogs.map((log: any, idx: number) => (
                                    <div key={log.id} className="relative pl-6 group">
                                        <div className={`absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-background ${idx === 0 ? 'bg-primary shadow-lg shadow-primary/50' : 'bg-muted-foreground/30'}`} />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-foreground capitalize mb-0.5">{log.new_status}</span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {new Date(log.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span className="text-[10px] text-primary/80 font-medium flex items-center gap-1 mt-1">
                                                <User className="w-3 h-3" />
                                                {log.changed_by_user?.name || "System/Admin"}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {(!order.auditLogs || order.auditLogs.length === 0) && (
                                    <p className="text-xs text-muted-foreground pl-6">No logs available.</p>
                                )}
                            </div>
                        </div>

                        {/* Costumer Details Card */}
                        <div className="glass-strong rounded-3xl p-6">
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-lg font-bold text-foreground">Customer</h3>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                    {(order.display_company_name || "C").charAt(0)}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="p-2 bg-white/5 rounded-lg text-primary"><Package className="w-4 h-4" /></div>
                                    <div>
                                        <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Company</p>
                                        <p className="text-foreground font-medium">{order.display_company_name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="p-2 bg-white/5 rounded-lg text-primary"><User className="w-4 h-4" /></div>
                                    <div>
                                        <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Contact</p>
                                        <p className="text-foreground font-medium">{order.display_reseller_name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="p-2 bg-white/5 rounded-lg text-primary"><Mail className="w-4 h-4" /></div>
                                    <div>
                                        <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Email</p>
                                        <p className="text-foreground font-medium truncate max-w-[180px]">{order.customer_email}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
