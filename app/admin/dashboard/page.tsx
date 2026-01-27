"use client"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { DashboardStats } from "@/components/admin/dashboard-stats"
import { RecentOrders } from "@/components/admin/recent-orders"
import { RevenueChart } from "@/components/admin/revenue-chart"
import { QuickActions } from "@/components/admin/quick-actions"
import { Notifications } from "@/components/admin/notifications"
import { Search, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PushNotificationManager } from "@/components/admin/push-notification-manager"

export default function AdminDashboard() {
    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            <PushNotificationManager />
            {/* Background gradients */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[10000ms]" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px] mix-blend-screen" />
            </div>

            <AdminSidebar />

            <main className="lg:pl-72 p-4 sm:p-6 lg:p-8 min-h-screen relative z-10 transition-all duration-300">
                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sticky top-4 z-40 glass-strong p-4 rounded-3xl border border-white/5 shadow-lg shadow-black/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
                            <p className="text-xs text-muted-foreground">Detailed overview</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search anything..."
                                className="pl-9 w-64 rounded-full bg-background/50 border-white/10 focus:bg-background transition-all h-10"
                            />
                        </div>
                        <Notifications />

                    </div>
                </header>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                    {/* Top Row: Stats (Spawn across all columns) */}
                    <DashboardStats />

                    {/* Middle Row: Main Chart (Span 3) + Quick Actions (Span 1) */}
                    <div className="lg:col-span-3 min-h-[400px]">
                        <RevenueChart />
                    </div>
                    <div className="lg:col-span-1 min-h-[400px]">
                        <QuickActions />
                    </div>

                    {/* Bottom Row: Recent Orders (Full Width) */}
                    <div className="lg:col-span-4 min-h-[400px]">
                        <RecentOrders />
                    </div>
                </div>
            </main>
        </div>
    )
}
