"use client"

import { useState, useEffect } from "react"
import { Save, Loader2, RotateCcw, Globe, Bell, Mail, Shield, Smartphone, Send, CreditCard } from "lucide-react"
import { toast } from "sonner"
import { getAdminSettings, updateAdminSettings } from "@/lib/supabase-api"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
    const [settings, setSettings] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [testing, setTesting] = useState(false)

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

    async function handleTestNotification() {
        setTesting(true)
        try {
            const response = await fetch('/api/admin/push/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: "Test Connection 📡",
                    body: "System check: Your device is now connected to Dedali Store alerts!",
                    tag: 'test-push'
                })
            })
            const data = await response.json()
            if (data.sent > 0) {
                toast.success(`Sent to ${data.sent} device(s)`)
            } else {
                toast.error("No active subscriptions found for this store.")
            }
        } catch (error) {
            toast.error("Failed to trigger test notification")
        } finally {
            setTesting(false)
        }
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
                                        placeholder="MAD"
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
                                        placeholder="Free shipping on orders over MAD 500 | Use code ARGAN20 for 20% off"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground ml-1">Announcement Bar (Arabic)</label>
                                    <textarea
                                        rows={3}
                                        value={settings.announcement_bar_ar || ""}
                                        onChange={(e) => handleChange("announcement_bar_ar", e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 focus:border-primary/50 focus:bg-white/[0.06] focus:outline-none transition-all text-sm resize-none placeholder:text-muted-foreground/30 text-right font-arabic"
                                        placeholder="شحن مجاني للطلبات فوق ٧٥٠ د.م | استخدم كود ARGAN20 لخصم ٢٠٪"
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
                                        placeholder="+212600000000"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground ml-1">Contact Phone</label>
                                    <input
                                        type="text"
                                        value={settings.contact_phone || ""}
                                        onChange={(e) => handleChange("contact_phone", e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 focus:border-primary/50 focus:bg-white/[0.06] focus:outline-none transition-all text-sm placeholder:text-muted-foreground/30"
                                        placeholder="+212 600 000 000"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Payment Methods Section */}
                        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                    <CreditCard className="w-5 h-5 text-purple-500" />
                                </div>
                                <h2 className="text-lg font-bold">Payment Methods</h2>
                            </div>

                            <div className="space-y-6">
                                {/* Cash on Delivery */}
                                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <label className="text-sm font-semibold text-foreground">Cash on Delivery (COD)</label>
                                            <p className="text-[10px] text-muted-foreground">Standard payment on delivery.</p>
                                        </div>
                                        <Switch
                                            checked={settings.payment_cod_enabled !== "false"}
                                            onCheckedChange={(checked) => handleChange("payment_cod_enabled", checked ? "true" : "false")}
                                        />
                                    </div>
                                </div>

                                {/* Bank Transfer (Virement) */}
                                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <label className="text-sm font-semibold text-foreground">Bank Transfer (Virement)</label>
                                            <p className="text-[10px] text-muted-foreground">Enable direct bank transfers.</p>
                                        </div>
                                        <Switch
                                            checked={settings.payment_virement_enabled === "true"}
                                            onCheckedChange={(checked) => handleChange("payment_virement_enabled", checked ? "true" : "false")}
                                        />
                                    </div>
                                    {settings.payment_virement_enabled === "true" && (
                                        <div className="animate-in fade-in slide-in-from-top-2 pt-2">
                                            <label className="text-xs font-semibold text-muted-foreground ml-1 mb-1.5 block">Bank Details & Instructions</label>
                                            <textarea
                                                rows={4}
                                                value={settings.payment_virement_details || ""}
                                                onChange={(e) => handleChange("payment_virement_details", e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 focus:border-primary/50 focus:outline-none transition-all text-sm resize-none"
                                                placeholder="Bank Name: ...&#10;Account Number: ...&#10;SWIFT/BIC: ..."
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Cheque */}
                                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <label className="text-sm font-semibold text-foreground">Cheque Payment</label>
                                            <p className="text-[10px] text-muted-foreground">Accept cheques from valid banks.</p>
                                        </div>
                                        <Switch
                                            checked={settings.payment_cheque_enabled === "true"}
                                            onCheckedChange={(checked) => handleChange("payment_cheque_enabled", checked ? "true" : "false")}
                                        />
                                    </div>
                                    {settings.payment_cheque_enabled === "true" && (
                                        <div className="animate-in fade-in slide-in-from-top-2 pt-2">
                                            <label className="text-xs font-semibold text-muted-foreground ml-1 mb-1.5 block">Cheque Payee & Info</label>
                                            <textarea
                                                rows={3}
                                                value={settings.payment_cheque_details || ""}
                                                onChange={(e) => handleChange("payment_cheque_details", e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 focus:border-primary/50 focus:outline-none transition-all text-sm resize-none"
                                                placeholder="Make cheques payable to: ...&#10;Send to address: ..."
                                            />
                                        </div>
                                    )}
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

                        {/* Notifications Section */}
                        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Bell className="w-5 h-5 text-primary" />
                                </div>
                                <h2 className="text-lg font-bold">System Notifications</h2>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                    <div className="space-y-0.5">
                                        <label className="text-sm font-semibold text-foreground">Mobile Push Notifications</label>
                                        <p className="text-xs text-muted-foreground">Receive real-time alerts for new orders on your mobile device.</p>
                                    </div>
                                    <Switch
                                        checked={settings.push_notifications_enabled === "true"}
                                        onCheckedChange={(checked) => handleChange("push_notifications_enabled", checked ? "true" : "false")}
                                    />
                                </div>

                                <div className="space-y-3 p-4 rounded-xl bg-white/[0.03] border border-white/5">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-semibold text-foreground">Device Status</p>
                                            <p className="text-[10px] text-muted-foreground">Subscribe your current phone/PC to receive alerts.</p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 rounded-lg text-[10px] border-white/10 hover:bg-white/5"
                                            onClick={() => window.dispatchEvent(new CustomEvent('show-push-prompt'))}
                                        >
                                            Subscribe Device
                                        </Button>
                                    </div>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="w-full h-8 rounded-lg text-[10px] bg-primary/10 hover:bg-primary/20 text-primary border-none"
                                        onClick={handleTestNotification}
                                        disabled={testing}
                                    >
                                        {testing ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Send className="w-3 h-3 mr-2" />}
                                        Send Test Notification
                                    </Button>
                                </div>

                                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                    <h4 className="text-[10px] font-bold text-blue-500 mb-1 flex items-center gap-1">
                                        <Shield className="w-3 h-3" /> Mobile Requirements
                                    </h4>
                                    <ul className="text-[9px] text-blue-400/80 list-disc list-inside space-y-1 leading-normal">
                                        <li><b>Android</b>: Works in modern Chrome.</li>
                                        <li><b>iOS (iPhone)</b>: You MUST "Add to Home Screen" first.</li>
                                        <li>Subscriptions are device-specific; you must enable them on each phone.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
