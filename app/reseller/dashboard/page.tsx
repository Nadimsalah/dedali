"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/components/language-provider"
import { supabase } from "@/lib/supabase"
import { Customer, Order, getCustomerOrders } from "@/lib/supabase-api"
import { Badge } from "@/components/ui/badge"
import { Loader2, Package, ShoppingBag, CreditCard, User, Building2, FileText, Globe, MapPin, LogOut, Eye } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function ResellerDashboard() {
    const { t, language } = useLanguage()
    const router = useRouter()
    const isArabic = language === "ar"

    const [isLoading, setIsLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<Customer | null>(null)
    const [orders, setOrders] = useState<Order[]>([])

    useEffect(() => {
        const checkUser = async () => {
            try {
                // 1. Get Auth User
                const { data: { user }, error } = await supabase.auth.getUser()
                if (error || !user) {
                    router.push('/login')
                    return
                }
                setUser(user)

                // 2. Get Profile
                const { data: profileData, error: profileError } = await supabase
                    .from('customers')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (profileError) {
                    console.error("Error fetching profile:", profileError)
                } else {
                    setProfile(profileData)
                }

                // 3. Get Orders
                if (user.id) {
                    const ordersData = await getCustomerOrders(user.id)
                    setOrders(ordersData)
                }

            } catch (error) {
                console.error("Error loading dashboard:", error)
            } finally {
                setIsLoading(false)
            }
        }

        checkUser()
    }, [router])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        toast.success(isArabic ? "تم تسجيل الخروج" : "Signed out successfully")
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    // Status Badge Color Helper
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-200'
            case 'delivered': return 'bg-green-100 text-green-800 border-green-200'
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
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


    return (
        <div className="min-h-screen bg-background relative overflow-hidden font-sans">
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
                {/* Header Section */}
                <header className="glass-strong p-6 sm:p-8 rounded-[2.5rem] border border-white/20 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 mb-12 animate-in fade-in slide-in-from-top-6 duration-700">
                    <div className="flex items-center gap-6 w-full md:w-auto">
                        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-xl shadow-primary/20 ring-4 ring-white/10 shrink-0">
                            <User className="w-8 h-8 text-white" />
                        </div>
                        <div className={isArabic ? "text-right" : "text-left"}>
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                                {profile?.company_name || (isArabic ? "لوحة تحكم الموزع" : "Reseller Dashboard")}
                            </h1>
                            <p className="text-muted-foreground font-medium mt-1">
                                {isArabic ? `مرحباً بك مجدداً، ${profile?.name || user?.email}` : `Welcome back, ${profile?.name || user?.email}`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Link href="/" className="flex-1 md:flex-none">
                            <Button className="w-full rounded-2xl h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 group">
                                <ShoppingBag className={`w-5 h-5 ${isArabic ? "ml-2" : "mr-2"} group-hover:animate-bounce`} />
                                {isArabic ? "تصفح الكتالوج" : "Browse Catalog"}
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            onClick={handleSignOut}
                            className="rounded-2xl h-14 px-6 bg-white/5 border-white/10 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all"
                        >
                            <LogOut className="w-5 h-5" />
                        </Button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Metrics & Profile */}
                    <div className="lg:col-span-4 space-y-8 animate-in fade-in slide-in-from-left-6 duration-700 delay-100">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="glass rounded-[2rem] p-6 border-white/10 shadow-xl group hover:border-primary/30 transition-all">
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                                    <Package className="w-6 h-6" />
                                </div>
                                <div className="text-3xl font-black text-foreground tabular-nums">{orders.length}</div>
                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                    {isArabic ? "إجمالي الطلبات" : "Total Orders"}
                                </div>
                            </div>
                            <div className="glass rounded-[2rem] p-6 border-white/10 shadow-xl group hover:border-green-500/30 transition-all">
                                <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-600 mb-4 group-hover:scale-110 transition-transform">
                                    <CreditCard className="w-6 h-6" />
                                </div>
                                <div className="text-xl sm:text-2xl font-black text-foreground tabular-nums truncate">
                                    {orders.reduce((sum, o) => sum + Number(o.total), 0).toLocaleString()} <span className="text-xs">MAD</span>
                                </div>
                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                    {isArabic ? "إجمالي المبلغ" : "Total Value"}
                                </div>
                            </div>
                        </div>

                        {/* Profile Info Card */}
                        <div className="glass-strong rounded-[2.5rem] p-8 border-white/10 shadow-2xl relative overflow-hidden group">
                            {/* Decorative element */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />

                            <h3 className={`text-lg font-bold text-foreground flex items-center gap-3 mb-8 ${isArabic ? "flex-row-reverse" : ""}`}>
                                <Building2 className="w-5 h-5 text-primary" />
                                {isArabic ? "بيانات المؤسسة" : "Organization Profile"}
                            </h3>

                            <div className="space-y-6">
                                <div className={isArabic ? "text-right" : "text-left"}>
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] block mb-2">{isArabic ? "اسم الشركة" : "Company Name"}</label>
                                    <div className="text-lg font-bold text-foreground">
                                        {profile?.company_name || <span className="text-muted-foreground/30 italic">Not set</span>}
                                    </div>
                                </div>

                                <div className={isArabic ? "text-right" : "text-left"}>
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] block mb-2">{isArabic ? "رقم التعريف الموحد (ICE)" : "Business Identification (ICE)"}</label>
                                    <div className="text-lg font-mono text-foreground tracking-widest bg-white/5 py-2 px-4 rounded-xl border border-white/5 inline-block min-w-40 text-center">
                                        {profile?.ice || "XXXXXXXXXXX"}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className={isArabic ? "text-right" : "text-left"}>
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] block mb-2">{isArabic ? "المدينة" : "Location"}</label>
                                        <div className="flex items-center gap-2 font-bold text-foreground">
                                            <MapPin className="w-4 h-4 text-primary" />
                                            {profile?.city || "N/A"}
                                        </div>
                                    </div>
                                    <div className={isArabic ? "text-right" : "text-left"}>
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] block mb-2">{isArabic ? "الموقع" : "Site"}</label>
                                        <div className="flex items-center gap-2 font-bold text-primary truncate">
                                            <Globe className="w-4 h-4" />
                                            {profile?.website ? (
                                                <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" className="hover:underline">View</a>
                                            ) : "N/A"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Order History */}
                    <div className="lg:col-span-8 animate-in fade-in slide-in-from-right-6 duration-700 delay-200">
                        <div className="glass-strong rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
                            <div className={`p-8 border-b border-white/5 flex justify-between items-center ${isArabic ? "flex-row-reverse" : ""}`}>
                                <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
                                    <FileText className="w-6 h-6 text-primary" />
                                    {isArabic ? "سجل العمليات" : "Transaction History"}
                                </h3>
                                <Badge className="bg-primary/10 text-primary border-none hover:bg-primary/20 px-4 py-1.5 rounded-xl">
                                    {orders.length} {orders.length === 1 ? "Order" : "Orders"}
                                </Badge>
                            </div>

                            <div className="flex-1">
                                {orders.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                                        <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mb-6 text-muted-foreground/40">
                                            <Package className="w-12 h-12" />
                                        </div>
                                        <h4 className="text-2xl font-bold text-foreground mb-3">
                                            {isArabic ? "لا توجد طلبات مسجلة" : "No Transactions Recorded"}
                                        </h4>
                                        <p className="text-muted-foreground max-w-sm mb-10 leading-relaxed font-medium">
                                            {isArabic ? "ابدأ عملياتك التجارية اليوم للحصول على أسعار الجملة الحصرية." : "Initialize your wholesale journey today and unlock Tier-1 inventory pricing."}
                                        </p>
                                        <Link href="/">
                                            <Button size="lg" variant="outline" className="rounded-2xl h-14 px-10 border-white/10 hover:bg-white/5 font-bold tracking-wide">
                                                {isArabic ? "ابدأ الآن" : "Initialize Trade"}
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <>
                                        {/* Mobile Card View */}
                                        <div className="md:hidden space-y-4 p-4">
                                            {orders.map((order) => (
                                                <div key={order.id} className="bg-white/5 rounded-2xl p-5 border border-white/5 space-y-4 hover:border-primary/30 transition-colors">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <span className="font-mono text-sm font-bold text-foreground block">#{order.order_number}</span>
                                                            <div className="text-xs font-medium text-muted-foreground mt-1">
                                                                {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </div>
                                                        </div>
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                                                            {getStatusLabel(order.status)}
                                                        </span>
                                                    </div>

                                                    <div className="flex justify-between items-end pt-4 border-t border-white/5">
                                                        <div>
                                                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">{isArabic ? "المجموع" : "Total"}</div>
                                                            <div className="font-black text-xl text-foreground">
                                                                {order.total.toLocaleString()} <span className="text-[10px] text-muted-foreground">MAD</span>
                                                            </div>
                                                        </div>
                                                        <Link href={`/reseller/orders/${order.id}`}>
                                                            <Button size="sm" className="rounded-xl h-9 px-4 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground shadow-none">
                                                                {isArabic ? "عرض" : "View"}
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Desktop Table View */}
                                        <div className="hidden md:block overflow-x-auto p-4 sm:p-8">
                                            <table className="w-full text-left border-separate border-spacing-y-4">
                                                <thead>
                                                    <tr className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                                        <th className={`pb-4 px-4 ${isArabic ? "text-right" : "text-left"}`}>{isArabic ? "الرقم التسلسلي" : "Reference ID"}</th>
                                                        <th className={`pb-4 px-4 ${isArabic ? "text-right" : "text-left"}`}>{isArabic ? "التاريخ" : "Timestamp"}</th>
                                                        <th className={`pb-4 px-4 ${isArabic ? "text-right" : "text-left"}`}>{isArabic ? "الحالة" : "Fulfillment"}</th>
                                                        <th className={`pb-4 px-4 ${isArabic ? "text-right" : "text-right"}`}>{isArabic ? "المجموع" : "Volume"}</th>
                                                        <th className="pb-4 px-4 text-center">{isArabic ? "عرض" : "Action"}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {orders.map((order, idx) => (
                                                        <tr key={order.id} className="group transition-all hover:-translate-y-1">
                                                            <td className={`bg-white/5 py-5 px-4 rounded-l-[1.5rem] border-y border-l border-white/5 group-hover:border-primary/20 group-hover:bg-primary/[0.02] ${isArabic ? "text-right" : "text-left"}`}>
                                                                <span className="font-mono text-xs font-bold text-foreground">#{order.order_number}</span>
                                                            </td>
                                                            <td className={`bg-white/5 py-5 px-4 border-y border-white/5 group-hover:border-primary/20 group-hover:bg-primary/[0.02] ${isArabic ? "text-right" : "text-left"}`}>
                                                                <div className="text-sm font-semibold text-foreground/80">
                                                                    {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                </div>
                                                            </td>
                                                            <td className={`bg-white/5 py-5 px-4 border-y border-white/5 group-hover:border-primary/20 group-hover:bg-primary/[0.02] ${isArabic ? "text-right" : "text-left"}`}>
                                                                <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(order.status)} shrink-0`}>
                                                                    {getStatusLabel(order.status)}
                                                                </span>
                                                            </td>
                                                            <td className={`bg-white/5 py-5 px-4 border-y border-white/5 group-hover:border-primary/20 group-hover:bg-primary/[0.02] ${isArabic ? "text-right" : "text-right"}`}>
                                                                <span className="font-black text-foreground">
                                                                    {order.total.toLocaleString()} <span className="text-[10px] text-muted-foreground mr-1">MAD</span>
                                                                </span>
                                                            </td>
                                                            <td className="bg-white/5 py-5 px-4 rounded-r-[1.5rem] border-y border-r border-white/5 group-hover:border-primary/20 group-hover:bg-primary/[0.02] text-center">
                                                                <Link href={`/reseller/orders/${order.id}`}>
                                                                    <Button size="sm" variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-primary/20 text-primary transition-all group-hover:scale-110">
                                                                        <Eye className="w-5 h-5" />
                                                                    </Button>
                                                                </Link>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
