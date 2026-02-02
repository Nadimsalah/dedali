"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users } from "lucide-react"
import { getDashboardStats } from "@/lib/supabase-api"

export function DashboardStats() {
    const [statsData, setStatsData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadStats() {
            const data = await getDashboardStats()
            setStatsData(data)
            setLoading(false)
        }
        loadStats()
    }, [])

    if (loading) {
        return (
            <>
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="glass-strong rounded-3xl p-6 h-32 animate-pulse bg-white/5" />
                ))}
            </>
        )
    }

    const stats = [
        {
            label: "Total Revenue",
            value: `MAD ${statsData?.totalRevenue?.toLocaleString()}`,
            change: "+12.5%", // Mock change for now
            trend: "up",
            icon: DollarSign,
            color: "from-primary/20 to-secondary/20",
            textColor: "text-primary",
        },
        {
            label: "Total Orders",
            value: statsData?.totalOrders?.toString(),
            change: `+${statsData?.pendingOrders}`,
            trend: "up",
            icon: ShoppingCart,
            color: "from-blue-500/20 to-cyan-500/20",
            textColor: "text-blue-500",
        },
        {
            label: "Total Products",
            value: statsData?.totalProducts?.toString(),
            change: "Active",
            trend: "up",
            icon: Package,
            color: "from-orange-500/20 to-red-500/20",
            textColor: "text-orange-500",
        },
        {
            label: "Total Customers",
            value: statsData?.totalCustomers?.toString(),
            change: "Syncing",
            trend: "up",
            icon: Users,
            color: "from-purple-500/20 to-pink-500/20",
            textColor: "text-purple-500",
        },
    ]

    return (
        <>
            {stats.map((stat, i) => (
                <div key={i} className="glass-strong rounded-3xl p-6 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                    <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br ${stat.color} blur-2xl opacity-50 group-hover:opacity-100 transition-opacity`} />

                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} ${stat.textColor} shadow-lg shadow-black/5`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full bg-white/5 ${stat.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                                {stat.change}
                                {stat.trend === 'up' ? <TrendingUp className="w-3 h-3 ml-1" /> : <TrendingDown className="w-3 h-3 ml-1" />}
                            </span>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground font-medium mb-1">{stat.label}</p>
                            <h3 className="text-2xl lg:text-3xl font-bold text-foreground">{stat.value}</h3>
                        </div>
                    </div>
                </div>
            ))}
        </>
    )
}
