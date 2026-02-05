"use client"

import { useState, useEffect } from "react"
import { updateOrderStatusAdmin, getOrderDetailsAdmin } from "@/app/actions/admin-orders"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
    ChevronLeft,
    Clock,
    User,
    Package,
    ShoppingBag,
    History,
    MessageSquare,
    Save,
    Truck,
    Printer,
    Building2,
    MapPin,
    Phone
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

export default function OrderDetailsPage() {
    const { orderId } = useParams()
    const router = useRouter()

    // Flattened State
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isUpdating, setIsUpdating] = useState(false)
    const [newNote, setNewNote] = useState("")
    const [amId, setAmId] = useState<string | null>(null)
    const [printType, setPrintType] = useState<'delivery' | 'invoice' | null>(null)

    useEffect(() => {
        if (orderId) loadData()
    }, [orderId])

    async function loadData() {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            setAmId(user?.id || null)

            // SERVER ACTION CALL
            const { success, data, error } = await getOrderDetailsAdmin(orderId as string)

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

    const handleUpdateStatus = async (newStatus: string) => {
        if (!order || newStatus === order.status) return

        setIsUpdating(true)
        try {
            const { success, error } = await updateOrderStatusAdmin(order.id, newStatus.toLowerCase(), amId!)

            if (error || !success) throw new Error(error || "Update failed")

            toast.success(`Status updated to ${newStatus}`)
            setOrder((prev: any) => ({
                ...prev, status: newStatus.toLowerCase(), auditLogs: [{
                    id: `temp-${Date.now()}`,
                    new_status: newStatus.toLowerCase(),
                    created_at: new Date().toISOString(),
                    changed_by_user: { name: 'You (Just Now)' }
                }, ...prev.auditLogs]
            }))

            if (newStatus === 'shipped') handlePrint('delivery')
            else if (newStatus === 'delivered') handlePrint('invoice')

        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsUpdating(false)
        }
    }

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newNote.trim()) return

        setIsUpdating(true)
        try {
            const res = await fetch(`/api/manager/orders/${orderId}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ note: newNote, accountManagerId: amId })
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error)
            }
            toast.success("Internal note added")
            setNewNote("")
            loadData()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsUpdating(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <p className="text-slate-400 font-medium animate-pulse">Loading Order Details...</p>
        </div>
    )

    if (!order) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-bold text-xl">Order not found.</div>

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans print:bg-white pb-20">
            {/* Custom Styles for Print */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { margin: 5mm; size: auto; }
                    .print-hidden { display: none !important; }
                    body { background: white !important; margin: 0; padding: 0; }
                    .print-only { display: block !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    table { page-break-inside: auto; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                    .no-break { page-break-inside: avoid; }
                }
                .print-only { display: none; }
            `}} />

            {/* Modern Clean Navbar */}
            <nav className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 flex items-center justify-between sticky top-0 z-30 print-hidden supports-[backdrop-filter]:bg-white/60">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="h-6 w-[1px] bg-slate-200" />
                    <span className="font-bold text-slate-900">Order #{order.order_number}</span>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-mono text-xs hidden sm:flex">
                        {new Date(order.created_at).toLocaleDateString()}
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handlePrint('delivery')} className="hidden sm:flex rounded-full text-xs font-bold text-slate-600 border-slate-300">
                        <Truck className="w-3.5 h-3.5 mr-2" />
                        Delivery Note
                    </Button>
                    <Button size="sm" onClick={() => handlePrint('invoice')} className="rounded-full text-xs font-bold shadow-lg shadow-primary/20 bg-slate-900 text-white hover:bg-slate-800">
                        <Printer className="w-3.5 h-3.5 mr-2" />
                        Invoice
                    </Button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-6 md:p-8 print:p-0 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* HERO SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 print-hidden">
                    {/* Status Card */}
                    <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors duration-700" />

                        <div className="relative">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Company / Customer</span>
                            </div>

                            {/* COMPANY NAME DISPLAY */}
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">
                                {order.display_company_name}
                            </h1>
                            <p className="text-slate-500 font-medium flex items-center gap-2 mb-1">
                                <User className="w-4 h-4 text-slate-400" />
                                Contact: <span className="text-slate-900 font-bold">{order.display_reseller_name}</span>
                            </p>
                            {/* Phone Number Display */}
                            {(order.reseller?.profile?.phone || order.reseller?.phone || order.customer_phone) && (
                                <p className="text-slate-500 font-medium flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-900 font-bold">
                                        {order.reseller?.profile?.phone || order.reseller?.phone || order.customer_phone}
                                    </span>
                                </p>
                            )}

                            {/* DEBUG info to diagnose NULL reseller_id */}
                            <div className="mt-4 p-2 bg-slate-100/50 rounded text-[10px] text-slate-400 font-mono">
                                REF: {order.id.slice(0, 8)} | RID: {order.reseller_id || "NULL (Direct Order)"}
                            </div>

                            <div className="h-px w-full bg-slate-100 my-6" />

                            <div className="flex flex-wrap gap-2">
                                {['pending', 'processing', 'shipped', 'delivered'].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => handleUpdateStatus(s)}
                                        disabled={isUpdating}
                                        className={`
                                            px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all duration-200
                                            ${order.status === s
                                                ? 'bg-slate-900 text-white shadow-lg scale-105'
                                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                            }
                                        `}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 flex flex-col justify-center gap-6">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-500">Current Status</span>
                            <Badge className={`capitalize px-3 py-1 rounded-lg text-sm ${order.status === 'delivered' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                order.status === 'pending' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' :
                                    'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                }`}>
                                {order.status}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400">
                                    <ShoppingBag className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-bold text-slate-600">Total</span>
                            </div>
                            <span className="text-xl font-black text-slate-900">MAD {order.total.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Location</span>
                            <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
                                <MapPin className="w-3.5 h-3.5 text-primary" />
                                {order.city}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20 print-hidden">
                    {/* Items List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-bold text-lg text-slate-900">Items Ordered</h3>
                                <Badge variant="outline" className="rounded-full">{order.items.length} Items</Badge>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {order.items.map((item: any) => (
                                    <div key={item.id} className="p-6 flex items-center gap-6 hover:bg-slate-50/50 transition-colors">
                                        <div className="w-20 h-20 rounded-2xl bg-slate-100 flex-shrink-0 border border-slate-200/60 overflow-hidden relative group">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.product_title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold bg-slate-50">IMG</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-900 truncate text-base mb-1">{item.product_title}</h4>
                                            <p className="text-sm text-slate-500 mb-2">{item.variant_name || "Standard Option"}</p>
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 rounded-lg text-xs">
                                                Qty: {item.quantity}
                                            </Badge>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-lg text-slate-900">MAD {item.subtotal.toLocaleString()}</p>
                                            <p className="text-xs text-slate-400 font-medium">MAD {item.final_price?.toLocaleString()} each</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Stats & Notes */}
                    <div className="space-y-6">
                        {/* Internal Notes */}
                        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <MessageSquare className="w-4 h-4 text-primary" />
                                <h3 className="font-bold text-slate-900">Internal Notes</h3>
                            </div>

                            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-4 mb-4 custom-scrollbar">
                                {(!order.notes || order.notes.length === 0) && (
                                    <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-xs">No internal notes yet.</p>
                                    </div>
                                )}
                                {order.notes && order.notes.map((note: any) => (
                                    <div key={note.id} className="bg-slate-50 p-3 rounded-2xl rounded-tl-sm border border-slate-100">
                                        <p className="text-sm text-slate-600 mb-2">{note.note}</p>
                                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium border-t border-slate-200/50 pt-2">
                                            <span>{note.author?.name || "System"}</span>
                                            <span>{new Date(note.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={handleAddNote} className="relative">
                                <Textarea
                                    placeholder="Write a note..."
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    className="min-h-[80px] pr-10 bg-white border-slate-200 rounded-xl text-sm focus:ring-primary/20 resize-none"
                                />
                                <Button type="submit" size="sm" disabled={isUpdating} className="absolute bottom-2 right-2 h-8 w-8 p-0 rounded-lg">
                                    <Save className="w-3.5 h-3.5" />
                                </Button>
                            </form>
                        </div>

                        {/* Audit Log */}
                        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <History className="w-4 h-4 text-slate-400" />
                                <h3 className="font-bold text-slate-900">Timeline</h3>
                            </div>
                            <div className="relative pl-2 border-l border-slate-100 space-y-6">
                                {order.auditLogs && order.auditLogs.map((log: any, idx: number) => (
                                    <div key={log.id} className="relative pl-6">
                                        <div className={`absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${idx === 0 ? 'bg-primary' : 'bg-slate-200'}`} />
                                        <p className="text-xs font-bold text-slate-900 capitalize mb-0.5">{log.new_status}</p>
                                        <p className="text-[10px] text-slate-400">
                                            {new Date(log.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                            by {log.changed_by_user?.name || "System"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>


                {/* PRINTABLE OVERLAYS (Standardized) */}
                <div className="print-only w-full text-slate-900">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6 no-break">
                        <div>
                            <img src="/logo.png" alt="Logo" className="h-8 w-auto mb-2" />
                            <div className="space-y-0.5 text-[10px] text-slate-500">
                                <p className="font-black text-slate-900 text-xs text-nowrap">Dedali Store SARL</p>
                                <p>Casablanca, Morocco</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-1">
                                {printType === 'delivery' ? 'Bon de Livraison' : 'Facture'}
                            </h1>
                            <div className="text-[10px] space-y-0.5">
                                <p className="font-bold text-slate-900 text-xs">N° {order.order_number}</p>
                                <p className="text-slate-500">Date: {new Date().toLocaleString('fr-FR')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Addresses */}
                    <div className="grid grid-cols-2 gap-6 mb-6 no-break">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Client</h3>
                            <div className="space-y-0">
                                <p className="font-black text-sm">{order.display_company_name}</p>
                                <p className="text-[10px] text-slate-500 italic">Contact: {order.display_reseller_name}</p>
                                <p className="text-[10px]">{order.customer_email}</p>
                                <p className="text-[10px]">{order.customer_phone}</p>
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 text-right">Adresse de Livraison</h3>
                            <div className="text-right space-y-0">
                                <p className="font-bold text-sm">{order.address_line1}</p>
                                <p className="font-black text-[10px] text-primary">{order.city}</p>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <table className="w-full mb-6 border-collapse no-break">
                        <thead>
                            <tr className="border-b-2 border-slate-900 text-slate-900">
                                <th className="py-2 text-left text-[10px] font-black uppercase tracking-widest">Produit</th>
                                <th className="py-2 text-center text-[10px] font-black uppercase tracking-widest">Quantité</th>
                                {printType === 'invoice' && <th className="py-2 text-right text-[10px] font-black uppercase tracking-widest">PU (MAD)</th>}
                                {printType === 'invoice' && <th className="py-2 text-right text-[10px] font-black uppercase tracking-widest">Total (MAD)</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-900">
                            {order.items.map((item: any) => (
                                <tr key={item.id}>
                                    <td className="py-2">
                                        <p className="font-bold text-sm">{item.product_title}</p>
                                    </td>
                                    <td className="py-2 text-center font-bold text-sm">{item.quantity}</td>
                                    {printType === 'invoice' && <td className="py-2 text-right text-sm">{item.final_price?.toLocaleString('fr-FR')}</td>}
                                    {printType === 'invoice' && <td className="py-2 text-right font-black text-sm">{item.subtotal.toLocaleString('fr-FR')}</td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </main>
        </div>
    )
}
