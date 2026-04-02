"use client"

import { useEffect, useState } from "react"
import { EditableOrderItem, getOrderDetailsAdmin, updateOrderItemsAdmin, updateOrderStatusAdmin } from "@/app/actions/admin-orders"
import { useParams, useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { useLanguage } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { Product } from "@/lib/supabase-api"
import { formatPrice } from "@/lib/utils"
import { ArrowLeft, CheckCircle2, FileText, History, Loader2, Mail, MapPin, Minus, Package, Plus, Save, Search, Trash2, User, X } from "lucide-react"

type EditableItem = EditableOrderItem & { warehouse_name?: string | null }
type ProductSearchResult = Pick<Product, "id" | "title" | "sku" | "price" | "stock" | "status" | "images">

const mapOrderItemsToEditable = (items: any[] = []): EditableItem[] =>
    items.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        product_title: item.product_title,
        product_sku: item.product_sku,
        product_image: item.image_url || item.product_image || null,
        variant_name: item.variant_name,
        quantity: Number(item.quantity) || 1,
        price: Number(item.final_price ?? item.price) || 0,
        warehouse_name: item.warehouse_name || null,
    }))

export default function OrderDetailsPage() {
    const { t, setLanguage, language } = useLanguage()
    const params = useParams()
    const router = useRouter()
    const orderId = params.id as string
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [editableItems, setEditableItems] = useState<EditableItem[]>([])
    const [savingItems, setSavingItems] = useState(false)
    const [productSearchQuery, setProductSearchQuery] = useState("")
    const [productResults, setProductResults] = useState<ProductSearchResult[]>([])
    const [searchingProducts, setSearchingProducts] = useState(false)
    const [deliveryMen, setDeliveryMen] = useState<any[]>([])
    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false)
    const [selectedDeliveryId, setSelectedDeliveryId] = useState("")
    const [dmSearchQuery, setDmSearchQuery] = useState("")
    const [pendingStatus, setPendingStatus] = useState<string | null>(null)

    useEffect(() => {
        const savedLang = localStorage.getItem("language")
        if (!savedLang) setLanguage("fr")
    }, [setLanguage])

    useEffect(() => { if (orderId) loadData() }, [orderId])

    useEffect(() => {
        const q = productSearchQuery.trim()
        if (q.length < 2) { setProductResults([]); setSearchingProducts(false); return }
        const timeoutId = window.setTimeout(async () => {
            setSearchingProducts(true)
            const { data, error } = await supabase.from("products").select("id, title, sku, price, stock, status, images").or(`title.ilike.%${q}%,sku.ilike.%${q}%`).order("title").limit(8)
            if (error) { console.error("[OrderItemsSearch]", error); toast.error("Impossible de rechercher les produits"); setProductResults([]) }
            else setProductResults((data || []) as ProductSearchResult[])
            setSearchingProducts(false)
        }, 300)
        return () => window.clearTimeout(timeoutId)
    }, [productSearchQuery])

    async function loadData() {
        setLoading(true)
        try {
            const { success, data, error } = await getOrderDetailsAdmin(orderId)
            if (error || !success || !data) throw new Error(error || "Failed to fetch data")
            setOrder(data)
            setEditableItems(mapOrderItemsToEditable(data.items))
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleStatusChange = async (newStatus: string) => {
        if (!order) return
        const statusLower = newStatus.toLowerCase()
        if (statusLower === "shipped") {
            setPendingStatus(statusLower)
            setIsDeliveryModalOpen(true)
            if (deliveryMen.length === 0) {
                const { data } = await supabase.from("profiles").select("id, name, city, phone").eq("role", "DELIVERY_MAN").eq("is_blocked", false)
                setDeliveryMen(data || [])
            }
            return
        }
        if (statusLower === order.status) return
        await performStatusUpdate(statusLower)
    }

    const performStatusUpdate = async (statusLower: string, deliveryManId?: string) => {
        setUpdating(true)
        const { data: { user } } = await supabase.auth.getUser()
        const { error, success } = await updateOrderStatusAdmin(order.id, statusLower, user?.id, deliveryManId)
        if (error) toast.error(`Failed to update status: ${error}`)
        else if (success) {
            setOrder((prev: any) => ({ ...prev, status: statusLower, delivery_man_id: deliveryManId || prev.delivery_man_id, auditLogs: [{ id: `temp-${Date.now()}`, new_status: statusLower, created_at: new Date().toISOString(), changed_by_user: { name: "Admin", role: "ADMIN" } }, ...(prev.auditLogs || [])] }))
            toast.success(`Statut mis a jour : ${statusLower}`)
            setIsDeliveryModalOpen(false)
        }
        setUpdating(false)
    }

    const handlePrint = () => setTimeout(() => window.print(), 100)
    const hasUnsavedItemChanges = JSON.stringify(editableItems.map((item) => ({ id: item.id || null, product_id: item.product_id, quantity: item.quantity, price: item.price }))) !== JSON.stringify((order?.items || []).map((item: any) => ({ id: item.id || null, product_id: item.product_id, quantity: Number(item.quantity) || 1, price: Number(item.final_price ?? item.price) || 0 })))
    const editableSubtotal = editableItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const editableTotal = editableSubtotal + Number(order?.shipping_cost || 0)
    const getStatusColor = (status: string) => ({ processing: "bg-blue-500/10 text-blue-500 border-blue-500/20", delivered: "bg-green-500/10 text-green-500 border-green-500/20", pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", shipped: "bg-amber-500/10 text-amber-500 border-amber-500/20", cancelled: "bg-red-500/10 text-red-500 border-red-500/20" }[status.toLowerCase()] || "bg-secondary text-secondary-foreground")
    const getStatusLabel = (status: string) => {
        const s = status.toLowerCase()
        if (language === "fr") return ({ pending: "En attente", processing: "En traitement", shipped: "Expediee", delivered: "Livree", cancelled: "Annulee" } as Record<string, string>)[s] || (s.charAt(0).toUpperCase() + s.slice(1))
        return ({ pending: "Pending", processing: "Processing", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" } as Record<string, string>)[s] || (s.charAt(0).toUpperCase() + s.slice(1))
    }
    const getTimelineLabel = (log: any) => {
        if (log.old_status && log.old_status === log.new_status) {
            return language === "fr" ? "Produits mis a jour" : "Products updated"
        }
        return getStatusLabel(log.new_status)
    }
    const getTimelineActorLabel = (log: any) => {
        const role = log.changed_by_user?.role
        const name = log.changed_by_user?.name
        if (role === "ADMIN") return "Admin"
        if (name?.trim().toLowerCase() === "nadim") return "Admin"
        if (role === "ACCOUNT_MANAGER") return name || "Account Manager"
        return name || "System"
    }

    const updateItemQuantity = (index: number, quantity: number) => setEditableItems((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: Math.max(1, Number.isFinite(quantity) ? quantity : 1) } : item))
    const removeItem = (index: number) => setEditableItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
    const addProductToOrder = (product: ProductSearchResult) => {
        setEditableItems((prev) => {
            const existingIndex = prev.findIndex((item) => item.product_id === product.id)
            if (existingIndex >= 0) return prev.map((item, itemIndex) => itemIndex === existingIndex ? { ...item, quantity: item.quantity + 1 } : item)
            return [...prev, { product_id: product.id, product_title: product.title, product_sku: product.sku || "", product_image: product.images?.[0] || null, variant_name: null, quantity: 1, price: Number(product.price) || 0, warehouse_name: null }]
        })
        setProductSearchQuery("")
        setProductResults([])
    }
    const resetItemChanges = () => { setEditableItems(mapOrderItemsToEditable(order?.items || [])); setProductSearchQuery(""); setProductResults([]) }
    const saveOrderItems = async () => {
        if (!order) return
        if (editableItems.length === 0) { toast.error("La commande doit contenir au moins un produit"); return }
        setSavingItems(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            const payload: EditableOrderItem[] = editableItems.map((item) => ({ id: item.id, product_id: item.product_id, product_title: item.product_title, product_sku: item.product_sku, product_image: item.product_image, variant_name: item.variant_name, quantity: item.quantity, price: item.price }))
            const result = await updateOrderItemsAdmin(order.id, payload, user?.id ?? null)
            if (result.error) throw new Error(result.error)
            toast.success("Produits de la commande mis a jour")
            await loadData()
        } catch (error: any) {
            toast.error(error.message || "Impossible de mettre a jour les produits")
        } finally {
            setSavingItems(false)
        }
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="flex flex-col items-center gap-4"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /><p className="text-muted-foreground animate-pulse">Loading order details...</p></div></div>
    if (!order) return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><h2 className="text-2xl font-bold mb-4">Order not found</h2><Button onClick={() => router.back()}>Go Back</Button></div></div>

    return (
        <div className="min-h-screen bg-background relative overflow-hidden print:bg-white print:overflow-visible">
            <div className="fixed inset-0 pointer-events-none print:hidden"><div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" /><div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px]" /></div>
            <div className="print:hidden"><AdminSidebar /></div>
            <main className="lg:pl-72 p-4 sm:p-6 lg:p-8 min-h-screen relative z-10 print:p-0 print:pl-0 print:min-h-0">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sticky top-4 z-40 glass-strong p-4 rounded-3xl border border-white/5 shadow-lg shadow-black/5 print:hidden">
                    <div className="flex items-center gap-3"><Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-primary/10"><ArrowLeft className="w-5 h-5" /></Button><div><h1 className="text-xl font-bold text-foreground flex items-center gap-2">{order.order_number}<Badge variant="outline" className={`ml-2 border-primary/20 ${getStatusColor(order.status)}`}>{getStatusLabel(order.status)}</Badge></h1><p className="text-xs font-bold text-primary mt-0.5">{order.display_company_name}</p><p className="text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p></div></div>
                    {order.status.toLowerCase() !== "pending" && order.status.toLowerCase() !== "cancelled" && <Button onClick={handlePrint} className="bg-primary text-primary-foreground hover:bg-primary/90"><FileText className="w-4 h-4 mr-2" />Bon de Commande</Button>}
                </header>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 print:hidden">
                    <div className="xl:col-span-2 space-y-6">
                        <div className="glass-strong rounded-3xl p-6">
                            <div className="flex flex-col gap-4 mb-5 lg:flex-row lg:items-start lg:justify-between">
                                <div><h3 className="text-lg font-bold text-foreground flex items-center gap-2"><Package className="w-5 h-5 text-primary" /> {t("admin.orders.table.items")}</h3><p className="text-sm text-muted-foreground mt-1">Recherchez un produit, ajoutez-le a la commande, modifiez la quantite ou retirez-le.</p></div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {hasUnsavedItemChanges && <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-500">Modifications non enregistrees</Badge>}
                                    <Button type="button" variant="outline" className="rounded-xl border-white/10 bg-white/5" onClick={resetItemChanges} disabled={!hasUnsavedItemChanges || savingItems}><X className="w-4 h-4 mr-2" />Annuler</Button>
                                    <Button type="button" className="rounded-xl" onClick={saveOrderItems} disabled={!hasUnsavedItemChanges || savingItems || editableItems.length === 0}>{savingItems ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Enregistrer</Button>
                                </div>
                            </div>
                            <div className="mb-5 space-y-3">
                                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input value={productSearchQuery} onChange={(e) => setProductSearchQuery(e.target.value)} placeholder="Ajouter un produit par nom ou SKU..." className="pl-10 h-11 rounded-2xl bg-white/5 border-white/10" /></div>
                                {productSearchQuery.trim().length >= 2 && <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">{searchingProducts ? <div className="p-4 text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Recherche des produits...</div> : productResults.length > 0 ? <div className="max-h-72 overflow-y-auto">{productResults.map((product) => <button key={product.id} type="button" onClick={() => addProductToOrder(product)} className="w-full flex items-center gap-3 p-3 text-left border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors"><div className="relative h-12 w-12 rounded-xl overflow-hidden bg-muted flex-shrink-0">{product.images?.[0] ? <Image src={product.images[0]} alt={product.title} fill className="object-cover" /> : <div className="h-full w-full flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground/40" /></div>}</div><div className="flex-1 min-w-0"><p className="font-semibold text-foreground truncate">{product.title}</p><p className="text-xs text-muted-foreground truncate">SKU: {product.sku || "Sans SKU"} • Stock: {product.stock}</p></div><div className="text-right flex-shrink-0"><p className="font-bold text-foreground">MAD {formatPrice(product.price)}</p><span className="text-xs text-primary font-medium">Ajouter</span></div></button>)}</div> : <div className="p-4 text-sm text-muted-foreground">Aucun produit trouve pour cette recherche.</div>}</div>}
                            </div>
                            <div className="space-y-4">
                                {editableItems.length > 0 ? editableItems.map((item, i: number) => { const lineTotal = item.price * item.quantity; return <div key={`${item.id || item.product_id}-${i}`} className="flex flex-col gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 sm:flex-row sm:items-center"><div className="h-16 w-16 bg-muted rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center relative">{item.product_image ? <Image src={item.product_image} alt={item.product_title} fill className="object-cover" /> : <Package className="w-8 h-8 text-muted-foreground/20" />}</div><div className="flex-1 min-w-0"><h4 className="font-semibold text-foreground">{item.product_title}</h4><div className="flex flex-wrap items-center gap-2 mt-1"><p className="text-xs text-muted-foreground">SKU: {item.product_sku || "Sans SKU"} • MAD {formatPrice(item.price)}</p>{item.warehouse_name && <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-md font-medium">Entrepot: {item.warehouse_name}</span>}</div></div><div className="flex items-center justify-between gap-4 sm:justify-end"><div className="flex items-center gap-2 rounded-xl border border-white/10 bg-background/40 p-1"><Button type="button" size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => updateItemQuantity(i, item.quantity - 1)} disabled={item.quantity <= 1}><Minus className="w-4 h-4" /></Button><Input type="number" min={1} value={item.quantity} onChange={(e) => updateItemQuantity(i, Number(e.target.value))} className="h-8 w-16 border-0 bg-transparent text-center font-semibold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" /><Button type="button" size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => updateItemQuantity(i, item.quantity + 1)}><Plus className="w-4 h-4" /></Button></div><div className="text-right min-w-[90px]"><p className="font-bold text-foreground">MAD {formatPrice(lineTotal)}</p><p className="text-[11px] text-muted-foreground">Total ligne</p></div><Button type="button" size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-red-400 hover:text-red-500 hover:bg-red-500/10" onClick={() => removeItem(i)}><Trash2 className="w-4 h-4" /></Button></div></div> }) : <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-muted-foreground">Aucun produit dans la commande. Ajoutez-en un avant d&apos;enregistrer.</div>}
                            </div>
                            <div className="mt-6 pt-6 border-t border-white/10 space-y-2"><div className="flex justify-between text-sm text-muted-foreground"><span>{t("cart.subtotal")}</span><span>MAD {formatPrice(editableSubtotal)}</span></div><div className="flex justify-between text-sm text-muted-foreground"><span>{t("cart.shipping")}</span><span>MAD {formatPrice(order.shipping_cost)}</span></div><div className="flex justify-between text-lg font-bold text-foreground pt-4 border-t border-white/5"><span>{t("cart.total")}</span><span className="text-primary">MAD {formatPrice(editableTotal)}</span></div></div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="glass-strong rounded-3xl p-6 border-l-4 border-primary">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">{language === "fr" ? "Mettre a jour le statut" : "Update Status"}</h3>
                            <div className="space-y-3">{["pending", "processing", "shipped", "delivered", "cancelled"].map((s) => <button key={s} disabled={updating} onClick={() => handleStatusChange(s)} className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between ${order.status === s ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-white/5 text-foreground"} ${updating ? "opacity-50 cursor-not-allowed" : ""}`}><span className="font-medium">{getStatusLabel(s)}</span>{order.status === s && <CheckCircle2 className="w-4 h-4" />}</button>)}</div>
                        </div>
                        <div className="glass-strong rounded-3xl p-6">
                            <div className="flex items-center gap-2 mb-4"><History className="w-4 h-4 text-primary" /><h3 className="font-bold text-foreground">{language === "fr" ? "Historique des statuts" : "Timeline Logs"}</h3></div>
                            <div className="relative pl-2 border-l border-white/10 space-y-6 max-h-[300px] overflow-y-auto custom-scrollbar">{order.auditLogs && order.auditLogs.map((log: any, idx: number) => <div key={log.id} className="relative pl-6 group"><div className={`absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-background ${idx === 0 ? "bg-primary shadow-lg shadow-primary/50" : "bg-muted-foreground/30"}`} /><div className="flex flex-col"><span className="text-xs font-bold text-foreground capitalize mb-0.5">{getTimelineLabel(log)}</span>{log.new_status === "cancelled" && order.delivery_failed_reason && <span className="text-[10px] text-red-500 font-medium block">Raison: {order.delivery_failed_reason}</span>}<span className="text-[10px] text-muted-foreground">{new Date(log.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span><span className="text-[10px] text-primary/80 font-medium flex items-center gap-1 mt-1"><User className="w-3 h-3" />{getTimelineActorLabel(log)}</span></div></div>)}{(!order.auditLogs || order.auditLogs.length === 0) && <p className="text-xs text-muted-foreground pl-6">{language === "fr" ? "Aucun journal disponible." : "No logs available."}</p>}</div>
                        </div>
                        {order.delivery_proof && <div className="glass-strong rounded-3xl p-6"><div className="flex items-center gap-2 mb-4"><CheckCircle2 className="w-5 h-5 text-emerald-500" /><h3 className="font-bold text-foreground">{language === "fr" ? "Preuve de Livraison" : "Proof of Delivery"}</h3></div><div className="relative w-full h-48 bg-white/5 rounded-xl overflow-hidden border border-white/10 mb-3">{order.delivery_proof.toLowerCase().endsWith(".pdf") ? <div className="flex items-center justify-center h-full"><FileText className="w-12 h-12 text-muted-foreground" /><span className="ml-2 text-sm text-foreground font-bold">Document PDF</span></div> : <div className="relative w-full h-full"><Image src={order.delivery_proof} alt="Preuve de livraison" fill className="object-contain" /></div>}</div><a href={order.delivery_proof} target="_blank" rel="noopener noreferrer" className="block w-full py-3 bg-primary/10 text-primary text-center rounded-xl text-sm font-bold hover:bg-primary/20 transition-colors">{language === "fr" ? "Voir le document" : "View Document"}</a></div>}
                        <div className="glass-strong rounded-3xl p-6">
                            <div className="flex justify-between items-start mb-6"><h3 className="text-lg font-bold text-foreground">{language === "fr" ? "Client" : "Customer"}</h3><div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">{(order.display_company_name || "C").charAt(0)}</div></div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-sm"><div className="p-2 bg-white/5 rounded-lg text-primary"><Package className="w-4 h-4" /></div><div><p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">{language === "fr" ? "Entreprise" : "Company"}</p><p className="text-foreground font-medium">{order.display_company_name}</p></div></div>
                                <div className="flex items-center gap-3 text-sm"><div className="p-2 bg-white/5 rounded-lg text-primary"><User className="w-4 h-4" /></div><div><p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">{language === "fr" ? "Contact" : "Contact"}</p><p className="text-foreground font-medium">{order.display_reseller_name}</p></div></div>
                                <div className="flex items-center gap-3 text-sm"><div className="p-2 bg-white/5 rounded-lg text-primary"><Mail className="w-4 h-4" /></div><div><p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">{language === "fr" ? "E-mail" : "Email"}</p><p className="text-foreground font-medium truncate max-w-[180px]">{order.customer_email}</p></div></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="hidden print:block bg-white text-black p-0 min-h-screen font-sans">
                    <div className="flex justify-between items-start border-b-2 border-gray-900 pb-4 mb-6"><div><div className="relative w-32 h-9 mb-2"><Image src="/logo.png" alt="Logo" fill className="object-contain object-left" /></div><div className="text-xs text-gray-600"><p className="font-bold text-gray-900">Didali Store SARL</p><p>Casablanca, Morocco</p><p>Email: contact@dedalistore.com</p></div></div><div className="text-right"><h1 className="text-2xl font-black text-gray-900 uppercase">BON DE COMMANDE</h1><div className="text-sm mt-2"><p><span className="font-bold">N Commande:</span> {order.order_number}</p><p><span className="font-bold">Date:</span> {new Date().toLocaleDateString("fr-FR")}</p></div></div></div>
                    <div className="grid grid-cols-2 gap-8 mb-8"><div><h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Client</h3><div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm"><p className="font-bold text-gray-900">{order.display_company_name}</p><p className="text-gray-600">Attn: {order.display_reseller_name}</p><p className="text-gray-600">{order.customer_email}</p><p className="text-gray-600">{order.customer_phone}</p></div></div><div><h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 text-right">Adresse de Livraison</h3><div className="text-sm text-right"><p className="font-bold text-gray-900">{order.customer_name}</p><p className="text-gray-600">{order.address_line1}</p>{order.address_line2 && <p className="text-gray-600">{order.address_line2}</p>}<p className="text-gray-600">{order.city}, {order.governorate}</p></div></div></div>
                    <table className="w-full mb-8 border-collapse"><thead><tr className="border-b-2 border-gray-900 text-gray-900"><th className="py-2 text-left text-xs font-bold uppercase tracking-wider">Produit</th><th className="py-2 text-center text-xs font-bold uppercase tracking-wider">Quantite</th><th className="py-2 text-right text-xs font-bold uppercase tracking-wider">Prix Unitaire</th><th className="py-2 text-right text-xs font-bold uppercase tracking-wider">Total</th></tr></thead><tbody className="divide-y divide-gray-100">{order.items.map((item: any, i: number) => <tr key={i}><td className="py-3 text-sm"><p className="font-bold text-gray-900">{item.product_title}</p><p className="text-xs text-gray-600">{item.variant_name}</p>{item.warehouse_name && <p className="text-[10px] text-blue-600 font-medium mt-1">Entrepot: {item.warehouse_name}</p>}</td><td className="py-3 text-center text-sm font-medium">{item.quantity}</td><td className="py-3 text-right text-sm text-gray-600">{formatPrice(item.final_price)} MAD</td><td className="py-3 text-right text-sm font-bold text-gray-900">{formatPrice(item.subtotal)} MAD</td></tr>)}</tbody></table>
                    <div className="flex justify-end mb-12"><div className="w-1/3 space-y-2"><div className="flex justify-between text-sm text-gray-600"><span>Sous-total</span><span>{formatPrice(order.subtotal)} MAD</span></div><div className="flex justify-between text-sm text-gray-600"><span>Livraison</span><span>{formatPrice(order.shipping_cost)} MAD</span></div><div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200"><span>Total</span><span>{formatPrice(order.total)} MAD</span></div></div></div>
                    <div className="flex justify-between items-end pt-8 border-t border-gray-200"><div className="text-xs text-gray-400"><p>Ce document est genere automatiquement.</p></div><div className="text-center"><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Cachet et Signature</p><div className="h-16 w-32 border border-gray-200 rounded-lg bg-gray-50"></div></div></div>
                </div>
                <Dialog open={isDeliveryModalOpen} onOpenChange={setIsDeliveryModalOpen}>
                    <DialogContent className="glass-strong border-white/10 rounded-[2rem] max-w-lg">
                        <DialogHeader><DialogTitle className="text-2xl font-black">Assigner un Logisticien</DialogTitle><DialogDescription>Choisissez le logisticien responsable de cette expedition.</DialogDescription></DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Rechercher par nom ou ville..." value={dmSearchQuery} onChange={(e) => setDmSearchQuery(e.target.value)} className="pl-10 h-11 rounded-xl bg-white/5 border-white/10" /></div>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">{deliveryMen.filter((m) => (m.name || "").toLowerCase().includes(dmSearchQuery.toLowerCase()) || (m.city || "").toLowerCase().includes(dmSearchQuery.toLowerCase())).map((m) => <div key={m.id} onClick={() => setSelectedDeliveryId(m.id)} className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${selectedDeliveryId === m.id ? "bg-primary/10 border-primary shadow-sm" : "bg-white/5 border-white/5 hover:border-white/20"}`}><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">{(m.name || "?").charAt(0)}</div><div><p className="font-bold text-foreground">{m.name}</p><div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium"><MapPin className="w-3 h-3" />{m.city || "Ville non definie"}</div></div></div>{selectedDeliveryId === m.id && <CheckCircle2 className="w-5 h-5 text-primary" />}</div>)}</div>
                        </div>
                        <DialogFooter><Button className="w-full h-12 rounded-xl font-bold bg-primary text-primary-foreground" disabled={!selectedDeliveryId || updating} onClick={() => performStatusUpdate(pendingStatus || "shipped", selectedDeliveryId)}>{updating ? <Loader2 className="animate-spin" /> : "Confirmer l'expedition"}</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    )
}
