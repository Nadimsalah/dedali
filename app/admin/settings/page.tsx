"use client"

import { useState, useEffect } from "react"
import { Save, Loader2, RotateCcw, Globe, Bell, Mail, Shield, Smartphone } from "lucide-react"
import { toast } from "sonner"
import { getAdminSettings, updateAdminSettings } from "@/lib/supabase-api"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export default function SettingsPage() {
    const [settings, setSettings] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadSettings()
    }, [])

    async function loadSettings() {
        setLoading(true)
        const data = await getAdminSettings()
        setSettings(data)
        setLoading(false)
    }

    async function handleSave() {
        setSaving(true)
        const result = await updateAdminSettings(settings)
        if (result.success) {
            toast.success("Settings updated successfully")
        } else {
            toast.error("Failed to update settings")
        }
        setSaving(false)
    }

    const handleChange = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }))
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-background">
            <AdminSidebar />

            <main className="flex-1 lg:ml-72 p-4 sm:p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                Store Settings
                            </h1>
                            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                                Manage your store information, promotional text, and system configurations.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={loadSettings}
                                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2 text-sm font-medium whitespace-nowrap"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Reset
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all flex items-center justify-center gap-2 text-sm font-semibold shadow-lg shadow-primary/20"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Store Info Section */}
                        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Globe className="w-5 h-5 text-primary" />
                                </div>
                                <h2 className="text-lg font-bold">Store Information</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground ml-1">Store Name</label>
                                    <input
                                        type="text"
                                        value={settings.store_name || ""}
                                        onChange={(e) => handleChange("store_name", e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 focus:border-primary/50 focus:bg-white/[0.06] focus:outline-none transition-all text-sm placeholder:text-muted-foreground/30"
                                        placeholder="Enter store name"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground ml-1">Support Email</label>
                                    <input
                                        type="email"
                                        value={settings.support_email || ""}
                                        onChange={(e) => handleChange("support_email", e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 focus:border-primary/50 focus:bg-white/[0.06] focus:outline-none transition-all text-sm placeholder:text-muted-foreground/30"
                                        placeholder="support@example.com"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground ml-1">Currency</label>
                                    <input
                                        type="text"
                                        value={settings.currency || ""}
                                        onChange={(e) => handleChange("currency", e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 focus:border-primary/50 focus:bg-white/[0.06] focus:outline-none transition-all text-sm placeholder:text-muted-foreground/30"
                                        placeholder="EGP"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Promotions Section */}
                        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                                    <Bell className="w-5 h-5 text-secondary" />
                                </div>
                                <h2 className="text-lg font-bold">Promotions & Text</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground ml-1">Announcement Bar Text</label>
                                    <textarea
                                        rows={3}
                                        value={settings.announcement_bar || ""}
                                        onChange={(e) => handleChange("announcement_bar", e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 focus:border-primary/50 focus:bg-white/[0.06] focus:outline-none transition-all text-sm resize-none placeholder:text-muted-foreground/30"
                                        placeholder="Free shipping on orders over EGP 500 | Use code ARGAN20 for 20% off"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground ml-1">Announcement Bar (Arabic)</label>
                                    <textarea
                                        rows={3}
                                        value={settings.announcement_bar_ar || ""}
                                        onChange={(e) => handleChange("announcement_bar_ar", e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 focus:border-primary/50 focus:bg-white/[0.06] focus:outline-none transition-all text-sm resize-none placeholder:text-muted-foreground/30 text-right font-arabic"
                                        placeholder="شحن مجاني للطلبات فوق ٥٠٠ ج.م | استخدم كود ARGAN20 لخصم ٢٠٪"
                                        dir="rtl"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground ml-1">Promo Code</label>
                                    <input
                                        type="text"
                                        value={settings.promo_code || ""}
                                        onChange={(e) => handleChange("promo_code", e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 focus:border-primary/50 focus:bg-white/[0.06] focus:outline-none transition-all text-sm placeholder:text-muted-foreground/30"
                                        placeholder="ARGAN20"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground ml-1">Hero Title</label>
                                    <input
                                        type="text"
                                        value={settings.hero_title || ""}
                                        onChange={(e) => handleChange("hero_title", e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 focus:border-primary/50 focus:bg-white/[0.06] focus:outline-none transition-all text-sm placeholder:text-muted-foreground/30"
                                        placeholder="The Beauty of Morocco"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground ml-1">Hero Subtitle</label>
                                    <textarea
                                        rows={2}
                                        value={settings.hero_subtitle || ""}
                                        onChange={(e) => handleChange("hero_subtitle", e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 focus:border-primary/50 focus:bg-white/[0.06] focus:outline-none transition-all text-sm resize-none placeholder:text-muted-foreground/30"
                                        placeholder="Experience the magic of pure argan oil..."
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground ml-1">Hero Title (Arabic)</label>
                                    <input
                                        type="text"
                                        value={settings.hero_title_ar || ""}
                                        onChange={(e) => handleChange("hero_title_ar", e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 focus:border-primary/50 focus:bg-white/[0.06] focus:outline-none transition-all text-sm placeholder:text-muted-foreground/30 text-right font-arabic"
                                        placeholder="سر الجمال المغربي"
                                        dir="rtl"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground ml-1">Hero Subtitle (Arabic)</label>
                                    <textarea
                                        rows={2}
                                        value={settings.hero_subtitle_ar || ""}
                                        onChange={(e) => handleChange("hero_subtitle_ar", e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 focus:border-primary/50 focus:bg-white/[0.06] focus:outline-none transition-all text-sm resize-none placeholder:text-muted-foreground/30 text-right font-arabic"
                                        placeholder="اكتشفي القوة التحويلية لزيت الأرغان النقي..."
                                        dir="rtl"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contact & WhatsApp Section */}
                        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                                    <Smartphone className="w-5 h-5 text-green-500" />
                                </div>
                                <h2 className="text-lg font-bold">WhatsApp & Contact</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground ml-1">WhatsApp Number</label>
                                    <input
                                        type="text"
                                        value={settings.whatsapp_number || ""}
                                        onChange={(e) => handleChange("whatsapp_number", e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 focus:border-primary/50 focus:bg-white/[0.06] focus:outline-none transition-all text-sm placeholder:text-muted-foreground/30"
                                        placeholder="+201234567890"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground ml-1">Contact Phone</label>
                                    <input
                                        type="text"
                                        value={settings.contact_phone || ""}
                                        onChange={(e) => handleChange("contact_phone", e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 focus:border-primary/50 focus:bg-white/[0.06] focus:outline-none transition-all text-sm placeholder:text-muted-foreground/30"
                                        placeholder="+20 123 456 7890"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Security Section */}
                        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-red-500" />
                                </div>
                                <h2 className="text-lg font-bold">Admin Security</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground ml-1">Admin Access PIN</label>
                                    <input
                                        type="password"
                                        value={settings.admin_pin || ""}
                                        onChange={(e) => handleChange("admin_pin", e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 focus:border-primary/50 focus:bg-white/[0.06] focus:outline-none transition-all text-sm placeholder:text-muted-foreground/30"
                                        placeholder="••••••"
                                    />
                                    <p className="text-[10px] text-muted-foreground mt-1 ml-1">used for dashboard entry verification</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
