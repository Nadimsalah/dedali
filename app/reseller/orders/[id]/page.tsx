"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { formatPrice } from "@/lib/utils"
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    CreditCard,
    FileText,
    Loader2,
    Mail,
    MapPin,
    Package,
    Phone,
    Truck,
    XCircle,
} from "lucide-react"

type TimelineStep = {
    label: string
    arabic: string
    icon: typeof CheckCircle2
    completed: boolean
}

const FRENCH_STATUS_LABELS: Record<string, string> = {
    pending: "En attente",
    processing: "En traitement",
    shipped: "Expediee",
    delivered: "Livree",
    cancelled: "Annulee",
}

export default function ResellerOrderDetailsPage() {
    const { language } = useLanguage()
    const isArabic = language === "ar"
    const isFrench = language === "fr"
    const params = useParams()
    const router = useRouter()
    const orderId = params.id as string

    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadOrder() {
            if (!orderId) return
            setLoading(true)

            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                router.push("/login")
                return
            }

            const {
                data: { session },
            } = await supabase.auth.getSession()

            const res = await fetch(`/api/reseller/orders/${orderId}`, {
                headers: session?.access_token
                    ? { Authorization: `Bearer ${session.access_token}` }
                    : {},
            })

            if (!res.ok) {
                console.error("Order not found or access denied")
                setLoading(false)
                return
            }

            const json = await res.json()
            setOrder(json.order)
            setLoading(false)
        }

        loadOrder()
    }, [orderId, router])

    const formatDate = (value: string) =>
        new Date(value).toLocaleDateString(isArabic ? "ar" : "fr-FR")

    const formatDateTime = (value: string) =>
        new Date(value).toLocaleString(isArabic ? "ar" : "fr-FR")

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "pending":
                return "bg-yellow-50 text-yellow-600 border-yellow-200"
            case "processing":
                return "bg-blue-50 text-blue-600 border-blue-200"
            case "shipped":
                return "bg-purple-50 text-purple-600 border-purple-200"
            case "delivered":
                return "bg-green-50 text-green-600 border-green-200"
            case "cancelled":
                return "bg-red-50 text-red-600 border-red-200"
            default:
                return "bg-gray-50 text-gray-600 border-gray-200"
        }
    }

    const getStatusLabel = (status: string) => {
        if (!isArabic) {
            return FRENCH_STATUS_LABELS[status.toLowerCase()] || status
        }

        switch (status.toLowerCase()) {
            case "pending":
                return "En attente de traitement"
            case "processing":
                return "En cours de preparation"
            case "shipped":
                return "Expedie"
            case "delivered":
                return "Livre"
            case "cancelled":
                return "Annule"
            default:
                return status
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
                        {isArabic ? "الطلب غير موجود" : "Commande introuvable"}
                    </h2>
                    <p className="text-gray-500 mb-6">
                        {isArabic
                            ? "Nous n'avons pas pu trouver cette commande ou vous n'avez pas l'autorisation de la consulter."
                            : "Nous n'avons pas trouve cette commande ou vous n'avez pas l'autorisation de la consulter."}
                    </p>
                    <Link href="/reseller/dashboard">
                        <Button className="w-full h-12 rounded-xl">
                            {isArabic ? "العودة الى لوحة التحكم" : "Retour au tableau de bord"}
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    const timelineSteps: TimelineStep[] = [
        {
            label: "Commande recue",
            arabic: "Reception de la commande",
            icon: CheckCircle2,
            completed: true,
        },
        {
            label: "Preparation en cours",
            arabic: "Preparation en cours",
            icon: Loader2,
            completed: ["processing", "shipped", "delivered"].includes(order.status),
        },
        {
            label: "Expediee",
            arabic: "Expedition",
            icon: Truck,
            completed: ["shipped", "delivered"].includes(order.status),
        },
        {
            label: "Livree",
            arabic: "Livraison terminee",
            icon: CheckCircle2,
            completed: order.status === "delivered",
        },
    ]

    return (
        <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8 print:p-0 print:bg-white">
            <div className="max-w-4xl mx-auto print:hidden">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/reseller/dashboard">
                            <Button variant="outline" size="icon" className="rounded-full bg-white border-gray-200">
                                <ArrowLeft className="w-5 h-5 text-gray-500" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                {isArabic ? "تفاصيل الطلب" : "Details de la commande"}
                                <span className="text-primary font-mono text-lg">#{order.order_number}</span>
                            </h1>
                            <div className="flex items-center gap-2 mt-1 text-left">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                                    {getStatusLabel(order.status)}
                                </span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(order.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>
                    {!loading && order && order.status.toLowerCase() === "processing" && (
                        <Button
                            onClick={() => {
                                setTimeout(() => window.print(), 100)
                            }}
                            className="bg-primary text-white hover:bg-primary/90"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            {isArabic ? "Bon de commande" : "Bon de commande"}
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-50">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Package className="w-5 h-5 text-gray-400" />
                                    {isArabic ? "Produits" : "Produits"}
                                </h3>
                            </div>
                            <div className="p-6">
                                <div className="space-y-6">
                                    {order.order_items.map((item: any, i: number) => (
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
                                                <h4 className="font-bold text-gray-900 truncate">{item.product_title}</h4>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {isArabic ? `Quantite : ${item.quantity}` : `Quantite : ${item.quantity}`} x {formatPrice(item.price)} MAD
                                                </p>
                                                {item.variant_name && (
                                                    <span className="inline-block mt-2 px-2 py-0.5 bg-gray-50 text-gray-500 text-[10px] font-bold rounded uppercase tracking-wider">
                                                        {item.variant_name}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900">{formatPrice(item.subtotal)} MAD</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 pt-8 border-t border-gray-50 space-y-3">
                                    <div className="flex justify-between items-center text-gray-500">
                                        <span>{isArabic ? "Sous-total" : "Sous-total"}</span>
                                        <span className="font-medium">{formatPrice(order.subtotal)} MAD</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-500">
                                        <span>{isArabic ? "Livraison" : "Livraison"}</span>
                                        <span className="font-medium">{formatPrice(order.shipping_cost)} MAD</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                                        <span className="text-lg font-bold text-gray-900">{isArabic ? "Montant total" : "Montant total"}</span>
                                        <span className="text-2xl font-black text-primary">{formatPrice(order.total)} MAD</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-6">
                                <Clock className="w-5 h-5 text-gray-400" />
                                {isArabic ? "Suivi de la commande" : "Suivi de la commande"}
                            </h3>
                            <div className="space-y-8 text-left">
                                {timelineSteps.map((step, idx, arr) => (
                                    <div key={idx} className="flex items-start gap-4 relative">
                                        {idx !== arr.length - 1 && (
                                            <div className={`absolute left-2.5 top-5 w-0.5 h-10 ${step.completed ? "bg-primary" : "bg-gray-100"}`} />
                                        )}
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 ${step.completed ? "bg-primary text-white" : "bg-gray-100 text-gray-300"}`}>
                                            <step.icon className="w-3 h-3" />
                                        </div>
                                        <div className="flex-1 pt-0.5">
                                            <p className={`font-bold text-sm ${step.completed ? "text-gray-900" : "text-gray-300"}`}>
                                                {isArabic ? step.arabic : step.label}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {order.notes && order.notes.length > 0 && (
                            <div className="bg-amber-50 rounded-3xl shadow-sm border border-amber-200 p-6">
                                <h3 className="font-semibold text-amber-900 flex items-center gap-2 mb-4">
                                    <FileText className="w-5 h-5 text-amber-600" />
                                    {isArabic ? "Notes de commande" : "Notes de commande"}
                                </h3>
                                <div className="space-y-3 text-left">
                                    {order.notes.map((note: any) => (
                                        <div key={note.id} className="rounded-2xl bg-white/70 border border-amber-100 p-4">
                                            <p className="text-sm font-medium text-gray-900">{note.note}</p>
                                            <p className="text-xs text-amber-700 mt-2">
                                                {note.author?.name || "Admin"} - {formatDateTime(note.created_at)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                                {isArabic ? "Adresse de livraison" : "Adresse de livraison"}
                            </h4>
                            <div className="flex items-start gap-3 text-left">
                                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-gray-900 font-bold">{order.customer_name}</p>
                                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                                        {order.address_line1}
                                        <br />
                                        {order.city}, {order.governorate}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                                {isArabic ? "Informations de contact" : "Informations de contact"}
                            </h4>
                            <div className="space-y-3 text-left">
                                {order.account_manager?.name && (
                                    <div className="text-sm font-semibold text-gray-900">{order.account_manager.name}</div>
                                )}
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <Phone className="w-4 h-4" />
                                    {order.account_manager?.phone || order.customer_phone}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <Mail className="w-4 h-4" />
                                    {order.account_manager?.email || order.customer_email}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                                {isArabic ? "Mode de paiement" : "Mode de paiement"}
                            </h4>
                            <div className="flex items-center gap-3 text-left">
                                <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center text-green-500 shrink-0">
                                    <CreditCard className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 uppercase">
                                        {order.payment_method === "cod" ? "Paiement a la livraison" : order.payment_method}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">Facture officielle revendeur</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="hidden print:block bg-white text-black p-0 min-h-screen font-sans">
                <div className="flex justify-between items-start border-b-2 border-gray-900 pb-4 mb-6">
                    <div>
                        <div className="relative w-32 h-9 mb-2">
                            <Image
                                src="/logo.png"
                                alt="Logo"
                                fill
                                className="object-contain object-left"
                            />
                        </div>
                        <div className="text-xs text-gray-600">
                            <p className="font-bold text-gray-900">Didali Store SARL</p>
                            <p>Casablanca, Morocco</p>
                            <p>Email: contact@dedalistore.com</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h1 className="text-2xl font-black text-gray-900 uppercase">BON DE COMMANDE</h1>
                        <div className="text-sm mt-2">
                            <p><span className="font-bold">No Commande:</span> {order.order_number}</p>
                            <p><span className="font-bold">Date:</span> {new Date().toLocaleDateString("fr-FR")}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Client</h3>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm">
                            <p className="font-bold text-gray-900">{order.reseller?.company_name || order.customer_name}</p>
                            <p className="text-gray-600">Attn: {order.reseller?.profile?.name || order.customer_name}</p>
                            <p className="text-gray-600">{order.customer_email}</p>
                            <p className="text-gray-600">{order.customer_phone}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 text-right">Adresse de livraison</h3>
                        <div className="text-sm text-right">
                            <p className="font-bold text-gray-900">{order.customer_name}</p>
                            <p className="text-gray-600">{order.address_line1}</p>
                            {order.address_line2 && <p className="text-gray-600">{order.address_line2}</p>}
                            <p className="text-gray-600">{order.city}, {order.governorate}</p>
                        </div>
                    </div>
                </div>

                <table className="w-full mb-8 border-collapse">
                    <thead>
                        <tr className="border-b-2 border-gray-900 text-gray-900">
                            <th className="py-2 text-left text-xs font-bold uppercase tracking-wider">Produit</th>
                            <th className="py-2 text-center text-xs font-bold uppercase tracking-wider">Quantite</th>
                            <th className="py-2 text-right text-xs font-bold uppercase tracking-wider">Prix unitaire</th>
                            <th className="py-2 text-right text-xs font-bold uppercase tracking-wider">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {order.order_items.map((item: any, i: number) => (
                            <tr key={i}>
                                <td className="py-3 text-sm">
                                    <p className="font-bold text-gray-900">{item.product_title}</p>
                                    <p className="text-xs text-gray-500">{item.variant_name}</p>
                                </td>
                                <td className="py-3 text-center text-sm font-medium">{item.quantity}</td>
                                <td className="py-3 text-right text-sm text-gray-600">{formatPrice(item.price)} MAD</td>
                                <td className="py-3 text-right text-sm font-bold text-gray-900">{formatPrice(item.subtotal)} MAD</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-end mb-12">
                    <div className="w-1/3 space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Sous-total</span>
                            <span>{formatPrice(order.subtotal)} MAD</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Livraison</span>
                            <span>{formatPrice(order.shipping_cost)} MAD</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                            <span>Total</span>
                            <span>{formatPrice(order.total)} MAD</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-end pt-8 border-t border-gray-200">
                    <div className="text-xs text-gray-400">
                        <p>Ce document est genere automatiquement.</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Cachet et signature</p>
                        <div className="h-16 w-32 border border-gray-200 rounded-lg bg-gray-50"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}
