"use client"

import { useState, useEffect } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { getOrders, type Order } from "@/lib/supabase-api"
import { Notifications } from "@/components/admin/notifications"
import {
    Search,
    Filter,
    Download,
    Calendar,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    Eye,
    ShoppingBag
} from "lucide-react"

export default function AdminOrdersPage() {
    const [activeTab, setActiveTab] = useState("All")
    const [searchQuery, setSearchQuery] = useState("")
    const [orders, setOrders] = useState<Order[]>([])
    const [totalOrders, setTotalOrders] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadOrders() {
            setLoading(true)
            const { data, count } = await getOrders({
                status: activeTab === "All" ? undefined : activeTab.toLowerCase()
            })
            setOrders(data)
            setTotalOrders(count)
            setLoading(false)
        }
        loadOrders()
    }, [activeTab])

    const tabs = ["All", "Processing", "Delivered", "Pending", "Cancelled"]

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesSearch
    })

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
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Background gradients */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px]" />
            </div>

            <AdminSidebar />

            <main className="lg:pl-72 p-4 sm:p-6 lg:p-8 min-h-screen relative z-10">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 sticky top-4 z-40 glass-strong p-4 rounded-3xl border border-white/5 shadow-lg shadow-black/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <ShoppingBag className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Orders</h1>
                            <p className="text-xs text-muted-foreground">Manage and track orders</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="rounded-full h-9 bg-background/50 border-white/10 hidden sm:flex">
                            <Download className="w-4 h-4 mr-2" /> Export
                        </Button>
                        <Button className="rounded-full h-9 shadow-lg shadow-primary/20">
                            <span className="hidden sm:inline">Create Order</span>
                            <span className="sm:hidden">+</span>
                        </Button>
                        <Notifications />
                    </div>
                </header>

                {/* Filters & Controls */}
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-background/40 backdrop-blur-md p-1 rounded-2xl border border-white/5">
                        {/* Tabs */}
                        <div className="flex p-1 bg-white/5 rounded-xl overflow-x-auto max-w-full no-scrollbar w-full sm:w-auto">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab
                                        ? "bg-primary text-primary-foreground shadow-md"
                                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Search & Date */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search orders..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 rounded-xl bg-white/5 border-white/10 focus:bg-white/10 h-10"
                                />
                            </div>
                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-white/5 border-white/10">
                                <Calendar className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Orders Table */}
                    <div className="glass-strong rounded-3xl overflow-hidden min-h-[500px] flex flex-col">
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10 bg-white/5 text-left">
                                        <th className="py-4 pl-4 sm:pl-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order</th>
                                        <th className="py-4 px-2 sm:px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Date</th>
                                        <th className="py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Customer</th>
                                        <th className="py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Items</th>
                                        <th className="py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
                                        <th className="py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                        <th className="py-4 pr-6 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredOrders.length > 0 ? (
                                        filteredOrders.map((order) => (
                                            <tr key={order.id} className="group hover:bg-white/5 transition-colors">
                                                <td className="py-3 sm:py-4 pl-4 sm:pl-6">
                                                    <span className="font-semibold text-foreground text-xs sm:text-sm">{order.order_number}</span>
                                                    <div className="md:hidden text-[10px] text-muted-foreground mt-0.5">
                                                        {new Date(order.created_at).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-foreground/80 hidden md:table-cell">
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="py-4 px-4 text-sm font-medium text-foreground hidden sm:table-cell">
                                                    {order.customer_name}
                                                </td>
                                                <td className="py-4 px-4 text-sm text-muted-foreground hidden lg:table-cell">
                                                    {order.customer_email}
                                                </td>
                                                <td className="py-4 px-4 text-sm font-bold text-foreground">EGP {order.total}</td>
                                                <td className="py-4 px-4">
                                                    <Badge variant="outline" className={`border ${getStatusColor(order.status)} text-[10px] sm:text-xs py-0.5 px-2`}>
                                                        {order.status}
                                                    </Badge>
                                                </td>
                                                <td className="py-4 pr-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link href={`/admin/orders/${order.id}`}>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary">
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary lg:hidden">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-muted-foreground">
                                                {loading ? "Loading orders..." : "No orders found matching your criteria"}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="p-4 border-t border-white/10 flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">Showing 1-{orders.length} of {totalOrders} orders</p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-transparent border-white/10" disabled>
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-transparent border-white/10">
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
