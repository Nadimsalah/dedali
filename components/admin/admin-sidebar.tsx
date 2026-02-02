"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    ShoppingBag,
    Package,
    Users,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    Image as ImageIcon,
    MessageCircle,
    Phone,
    Briefcase,
    Truck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Image from "next/image"

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
    { icon: ShoppingBag, label: "Orders", href: "/admin/orders" },
    { icon: Package, label: "Products", href: "/admin/products" },
    { icon: Users, label: "Customers", href: "/admin/customers" },
    { icon: Truck, label: "Shipping", href: "/admin/shipping" },
    { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
    { icon: ImageIcon, label: "Hero Carousel", href: "/admin/hero-carousel" },
    // CRM / Marketing
    { icon: MessageCircle, label: "WhatsApp Leads", href: "/admin/whatsapp" },
    { icon: Phone, label: "Contact Messages", href: "/admin/contacts" },
    { icon: Briefcase, label: "Career Applications", href: "/admin/careers" },
    { icon: Settings, label: "Settings", href: "/admin/settings" },
]

export function AdminSidebar() {
    const pathname = usePathname()

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-background/50 backdrop-blur-xl border-r border-white/10">
            <div className="p-6 flex items-center justify-center border-b border-white/10">
                <Image
                    src="/logo.png"
                    alt="Dedali Store"
                    width={160}
                    height={80}
                    className="h-16 w-auto"
                />
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link key={item.href} href={item.href}>
                            <Button
                                variant={isActive ? "default" : "ghost"}
                                className={`w-full justify-start gap-3 h-12 rounded-xl transition-all ${isActive
                                    ? "shadow-lg shadow-primary/20 bg-primary text-primary-foreground"
                                    : "hover:bg-primary/5 hover:text-primary"
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </Button>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-white/10">
                <Link href="/admin/login">
                    <Button variant="outline" className="w-full justify-start gap-3 h-12 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20">
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </Button>
                </Link>
            </div>
        </div>
    )

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-72 fixed inset-y-0 left-0 z-50">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden fixed top-4 left-4 z-50 rounded-full glass-strong">
                        <Menu className="w-6 h-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-80 border-r border-white/10">
                    <SidebarContent />
                </SheetContent>
            </Sheet>
        </>
    )
}
