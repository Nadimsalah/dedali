"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/components/language-provider"
import { supabase } from "@/lib/supabase"
import { Customer, Order, getCustomerOrders } from "@/lib/supabase-api"
import { Loader2, Package, ShoppingBag, CreditCard, User, Building2, FileText, Globe, MapPin, LogOut } from "lucide-react"
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
        <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {isArabic ? "لوحة تحكم الموزع" : "Reseller Dashboard"}
                        </h1>
                        <p className="text-gray-500 mt-1">
                            {isArabic ? `مرحباً، ${profile?.name || user?.email}` : `Welcome back, ${profile?.name || user?.email}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/">
                            <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                                <ShoppingBag className={`w-4 h-4 ${isArabic ? "ml-2" : "mr-2"}`} />
                                {isArabic ? "تصفح المنتجات" : "Browse Products"}
                            </Button>
                        </Link>
                        <Button variant="outline" onClick={handleSignOut} className="bg-white border-gray-200 hover:bg-gray-50 text-red-600 hover:text-red-700">
                            <LogOut className={`w-4 h-4 ${isArabic ? "ml-2" : "mr-2"}`} />
                            {isArabic ? "خروج" : "Sign Out"}
                        </Button>
                    </div>
                </div>



                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Stats & Profile */}
                    <div className="space-y-8 lg:col-span-1">

                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                                    <Package className="w-5 h-5" />
                                </div>
                                <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
                                <div className="text-sm text-gray-500 font-medium">{isArabic ? "إجمالي الطلبات" : "Total Orders"}</div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-4">
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {orders.reduce((sum, o) => sum + Number(o.total), 0).toLocaleString()} MAD
                                </div>
                                <div className="text-sm text-gray-500 font-medium">{isArabic ? "إجمالي الإنفاق" : "Total Spent"}</div>
                            </div>
                        </div>

                        {/* Profile Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-50">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-gray-400" />
                                    {isArabic ? "معلومات الشركة" : "Company Profile"}
                                </h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{isArabic ? "الشركة" : "Company"}</label>
                                    <div className="text-gray-900 font-medium mt-1">{profile?.company_name || "-"}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{isArabic ? "رقم ICE" : "ICE Number"}</label>
                                    <div className="text-gray-900 font-medium mt-1 uppercase tracking-widest">{profile?.ice || "-"}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{isArabic ? "الموقع" : "Website"}</label>
                                    <div className="text-blue-600 font-medium mt-1 truncate">
                                        {profile?.website ? (
                                            <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noreferrer" className="hover:underline">
                                                {profile.website}
                                            </a>
                                        ) : "-"}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{isArabic ? "المدينة" : "City"}</label>
                                    <div className="text-gray-900 font-medium mt-1 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        {profile?.city || "-"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Orders History */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
                            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-gray-400" />
                                    {isArabic ? "سجل الطلبات" : "Order History"}
                                </h3>
                            </div>

                            {orders.length === 0 ? (
                                <div className="p-12 text-center text-gray-500">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                        <Package className="w-8 h-8" />
                                    </div>
                                    <p className="text-lg font-medium text-gray-900 mb-1">
                                        {isArabic ? "لا توجد طلبات حتى الآن" : "No orders yet"}
                                    </p>
                                    <p className="mb-6">
                                        {isArabic ? "ابدأ التسوق اليوم واحصل على أفضل العروض." : "Start shopping today to get the best wholesale deals."}
                                    </p>
                                    <Link href="/">
                                        <Button variant="outline">
                                            {isArabic ? "تسوق الآن" : "Shop Now"}
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                                            <tr>
                                                <th className="px-6 py-4 font-semibold">{isArabic ? "رقم الطلب" : "Order ID"}</th>
                                                <th className="px-6 py-4 font-semibold">{isArabic ? "التاريخ" : "Date"}</th>
                                                <th className="px-6 py-4 font-semibold">{isArabic ? "الحالة" : "Status"}</th>
                                                <th className="px-6 py-4 font-semibold text-right">{isArabic ? "المجموع" : "Total"}</th>
                                                <th className="px-6 py-4 font-semibold text-center">{isArabic ? "إجراءات" : "Actions"}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {orders.map((order) => (
                                                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-gray-900">
                                                        #{order.order_number}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-500">
                                                        {new Date(order.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                                            {getStatusLabel(order.status)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                                                        {order.total.toLocaleString()} MAD
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <Link href={`/reseller/orders/${order.id}`}>
                                                            <Button size="sm" variant="ghost" className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                                {isArabic ? "عرض التفاصيل" : "View Details"}
                                                            </Button>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
