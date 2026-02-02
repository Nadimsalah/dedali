"use client"

import { useState, useEffect } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Button } from "@/components/ui/button"
import {
    Calendar,
    ChevronDown,
    TrendingUp,
    Users,
    CreditCard,
    ShoppingBag,
    ArrowUpRight,
    ArrowDownRight,
    BarChart3,
    Activity,
    Eye,
    Globe
} from "lucide-react"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from "recharts"
import { getDashboardStats, getRevenueAnalytics, getTopProducts } from "@/lib/supabase-api"

export default function AnalyticsPage() {
    const [stats, setStats] = useState<any>(null)
    const [revenueData, setRevenueData] = useState<any[]>([])
    const [topProducts, setTopProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadAnalytics() {
            setLoading(true)
            const [statsData, revenue, products] = await Promise.all([
                getDashboardStats(),
                getRevenueAnalytics(),
                getTopProducts(5)
            ])
            setStats(statsData)
            setRevenueData(revenue)
            setTopProducts(products)
            setLoading(false)
        }
        loadAnalytics()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground animate-pulse">Gathering intelligence...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            <AdminSidebar />

            <main className="lg:pl-72 p-4 sm:p-6 lg:p-8 min-h-screen relative z-10">
                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sticky top-4 z-40 glass-strong p-4 rounded-3xl border border-white/5 shadow-lg shadow-black/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Activity className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Analytics</h1>
                            <p className="text-xs text-muted-foreground">Deep dive into performance</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="rounded-full h-9 bg-background/50 border-white/10">
                            <Calendar className="w-4 h-4 mr-2" />
                            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Button>
                    </div>
                </header>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Revenue"
                        value={`MAD ${stats?.totalRevenue?.toLocaleString()}`}
                        change="+12.5%"
                        trend="up"
                        icon={CreditCard}
                    />
                    <StatCard
                        title="Conversion Rate"
                        value="3.2%"
                        change="+0.4%"
                        trend="up"
                        icon={TrendingUp}
                    />
                    <StatCard
                        title="Active Sessions"
                        value="1,284"
                        change="-2.1%"
                        trend="down"
                        icon={Users}
                    />
                    <StatCard
                        title="Avg. Order Value"
                        value={`MAD ${(stats?.totalRevenue / (stats?.totalOrders || 1))?.toFixed(0)}`}
                        change="+5.2%"
                        trend="up"
                        icon={ShoppingBag}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Revenue Trends */}
                    <div className="lg:col-span-2 glass-strong rounded-3xl p-6 h-[450px]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-foreground">Revenue Over Time</h3>
                        </div>
                        <div className="h-[340px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                        tickFormatter={(val) => `MAD ${val}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '16px', border: 'none', color: '#fff' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="var(--primary)"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorRev)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Products */}
                    <div className="glass-strong rounded-3xl p-6 h-[450px]">
                        <h3 className="text-lg font-bold text-foreground mb-6">Top Products</h3>
                        <div className="space-y-6">
                            {topProducts.map((product, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-foreground truncate">{product.name}</p>
                                        <p className="text-xs text-muted-foreground">{product.sales} sales</p>
                                    </div>
                                    <p className="font-bold text-foreground">MAD {product.revenue.toLocaleString()}</p>
                                </div>
                            ))}
                            {topProducts.length === 0 && (
                                <div className="py-12 text-center text-muted-foreground italic">No sales data yet</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Secondary Charts Slot */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="glass-strong rounded-3xl p-6 h-[400px]">
                        <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                            Channel Performance
                        </h3>
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                    { name: 'Direct', value: 400 },
                                    { name: 'Social', value: 300 },
                                    { name: 'Search', value: 200 },
                                    { name: 'Referral', value: 278 }
                                ]}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                    <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="glass-strong rounded-3xl p-6 h-[400px] flex flex-col justify-center items-center text-center">
                        <div className="p-4 bg-primary/10 rounded-full mb-4">
                            <Globe className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">Visitor Locality</h3>
                        <p className="text-sm text-muted-foreground max-w-[300px]">
                            Implement session tracking to see real-time visitor geographic data.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    )
}

function StatCard({ title, value, change, icon: Icon, trend }: any) {
    return (
        <div className="glass-strong rounded-3xl p-6 relative overflow-hidden group">
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none`} />
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 rounded-xl bg-white/5 text-primary">
                        <Icon className="w-5 h-5" />
                    </div>
                    <BadgeTrend value={change} trend={trend} />
                </div>
                <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">{title}</p>
                    <h3 className="text-2xl font-bold text-foreground">{value}</h3>
                </div>
            </div>
        </div>
    )
}

function BadgeTrend({ value, trend }: any) {
    return (
        <span className={`flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${trend === 'up' ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
            {value}
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3 ml-0.5" /> : <ArrowDownRight className="w-3 h-3 ml-0.5" />}
        </span>
    )
}
