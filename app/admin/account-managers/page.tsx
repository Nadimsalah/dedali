"use client"

import { useState, useEffect } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Search,
    UserPlus,
    Users,
    Briefcase,
    Shield,
    MoreHorizontal,
    Mail,
    PlusCircle,
    UserCheck,
    Link as LinkIcon,
    Unlink,
    Loader2,
    CheckCircle2,
    XCircle,
    Phone,
    MapPin,
    Trash2,
    Copy,
    Lock
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AccountManager {
    id: string
    name: string
    email: string
    phone?: string
    reseller_count?: number
}

interface Reseller {
    id: string
    company_name: string
    name: string
    email?: string
    phone?: string
    city?: string
    assigned_to_id?: string
}

export default function AccountManagersPage() {
    const { t, setLanguage } = useLanguage()
    const [managers, setManagers] = useState<AccountManager[]>([])
    const [resellers, setResellers] = useState<Reseller[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [copiedUrl, setCopiedUrl] = useState(false)

    // Set French as default for dashboard
    useEffect(() => {
        const savedLang = localStorage.getItem("language")
        if (!savedLang) {
            setLanguage("fr")
        }
    }, [setLanguage])

    // Create AM Modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [newManager, setNewManager] = useState({ name: '', email: '', password: '', phone: '' })
    const [isCreating, setIsCreating] = useState(false)

    // Goal Edit Modal
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
    const [editingGoalManager, setEditingGoalManager] = useState<AccountManager | null>(null)
    const [newGoalValue, setNewGoalValue] = useState("")
    const [isUpdatingGoal, setIsUpdatingGoal] = useState(false)

    // Password Reset Modal
    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false)
    const [resettingManager, setResettingManager] = useState<AccountManager | null>(null)
    const [newPasswordInput, setNewPasswordInput] = useState("")
    const [isResettingPassword, setIsResettingPassword] = useState(false)

    // Assignment Modal
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
    const [selectedManager, setSelectedManager] = useState<AccountManager | null>(null)
    const [isAssigning, setIsAssigning] = useState(false)
    const [assigningId, setAssigningId] = useState<string | null>(null)
    const [resellerSearchQuery, setResellerSearchQuery] = useState("")

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            // Fetch Account Managers
            const { data: amData, error: amError } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'ACCOUNT_MANAGER')

            if (amError) throw amError

            // Fetch Assignments to get counts
            const { data: assignments, error: assignError } = await supabase
                .from('account_manager_assignments')
                .select('account_manager_id, reseller_id')
                .is('soft_deleted_at', null)

            if (assignError) throw assignError

            const managersWithCount = amData.map(am => ({
                ...am,
                reseller_count: assignments.filter(a => a.account_manager_id === am.id).length
            }))

            setManagers(managersWithCount)

            // Fetch all resellers via admin API (bypasses RLS on resellers)
            const res = await fetch("/api/admin/resellers/list")
            const json = await res.json()
            if (!res.ok) {
                throw new Error(json.error || "Failed to load resellers")
            }
            const resellerData = json.resellers as any[]

            // Fetch customers to get correct company names (source of truth)
            const { data: customerData } = await supabase
                .from('customers')
                .select('id, company_name, phone, city')

            // Map assignments to resellers
            const resellersWithAssignments = resellerData.map((r: any) => {
                const activeAssignment = assignments.find(a => a.reseller_id === r.id)
                const customer = customerData?.find(c => c.id === r.user_id)

                return {
                    id: r.id,
                    company_name: customer?.company_name || r.company_name,
                    name: (r.user as any)?.name || t("common.unknown"),
                    email: (r.user as any)?.email || '',
                    phone: customer?.phone || (r.user as any)?.phone || '',
                    city: customer?.city || r.city || '',
                    assigned_to_id: activeAssignment?.account_manager_id
                }
            })

            setResellers(resellersWithAssignments)

        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateManager = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsCreating(true)
        try {
            const res = await fetch('/api/admin/account-managers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newManager)
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            toast.success(t("account_managers.created_success"))
            setIsCreateModalOpen(false)
            setNewManager({ name: '', email: '', password: '', phone: '' })
            loadData()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsCreating(false)
        }
    }

    const handleAssignReseller = async (resellerId: string, accountManagerId?: string) => {
        setIsAssigning(true)
        setAssigningId(resellerId)
        try {
            const res = await fetch('/api/admin/assign-reseller', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resellerId, accountManagerId })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            toast.success(accountManagerId ? t("account_managers.assignment_updated") : t("account_managers.reseller_unassigned"))
            loadData()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsAssigning(false)
            setAssigningId(null)
        }
    }

    const handleUpdateGoal = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingGoalManager) return
        setIsUpdatingGoal(true)

        try {
            const res = await fetch('/api/admin/manager-goal', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    managerId: editingGoalManager.id,
                    newGoal: parseFloat(newGoalValue)
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            toast.success(t("account_managers.goal_updated"))
            setIsGoalModalOpen(false)
            setEditingGoalManager(null)
            loadData()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsUpdatingGoal(false)
        }
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!resettingManager || !newPasswordInput) return
        setIsResettingPassword(true)

        try {
            const res = await fetch(`/api/admin/account-managers/${resettingManager.id}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPasswordInput })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            toast.success("Mot de passe mis à jour avec succès.")
            setIsResetPasswordModalOpen(false)
            setResettingManager(null)
            setNewPasswordInput("")
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsResettingPassword(false)
        }
    }

    const handleDeleteManager = async (id: string, name: string) => {
        if (!confirm(t("account_managers.delete_confirm").replace("{name}", name))) return

        try {
            const res = await fetch(`/api/admin/account-managers/${id}`, {
                method: 'DELETE'
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            toast.success(t("account_managers.deleted_success"))
            loadData()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const filteredManagers = managers.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // URL de connexion pour les Gestionnaires de Compte
    const managerLoginPath = "/login"

    const handleCopyDashboardUrl = async () => {
        try {
            const fullUrl = typeof window !== "undefined"
                ? `${window.location.origin}${managerLoginPath}`
                : managerLoginPath
            await navigator.clipboard.writeText(fullUrl)
            setCopiedUrl(true)
            setTimeout(() => setCopiedUrl(false), 2000)
            toast.success("Lien de connexion Gestionnaire copié.")
        } catch {
            toast.error("Impossible de copier le lien de connexion.")
        }
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden font-sans">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px]" />
            </div>

            <AdminSidebar />

            <main className="lg:pl-72 p-4 sm:p-6 lg:p-8 min-h-screen relative z-10">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 glass-strong p-5 rounded-[2rem] border border-white/10 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">{t("account_managers.title")}</h1>
                            <p className="text-sm text-muted-foreground font-medium">{t("account_managers.subtitle")}</p>
                        </div>
                    </div>
                    <div className="w-full sm:w-auto flex flex-col gap-2 sm:items-end">
                        <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                            URL de connexion Gestionnaire
                        </span>
                        <div className="flex items-center gap-2">
                            <Input
                                readOnly
                                value={managerLoginPath}
                                className="h-9 rounded-xl bg-background/60 border-border/60 text-xs w-48 sm:w-64"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 rounded-xl"
                                onClick={handleCopyDashboardUrl}
                            >
                                <Copy className="w-4 h-4" />
                            </Button>
                        </div>
                        {copiedUrl && (
                            <span className="text-[11px] text-emerald-500">
                                Lien copié dans le presse-papiers.
                            </span>
                        )}
                    </div>
                    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="rounded-2xl h-12 px-6 gap-2 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                <UserPlus className="w-5 h-5" />
                                {t("account_managers.add_manager")}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-strong border-white/10 rounded-[2rem]">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black">{t("account_managers.create_title")}</DialogTitle>
                                <DialogDescription>{t("account_managers.create_desc")}</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateManager} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">{t("account_managers.full_name")}</label>
                                    <Input
                                        required
                                        value={newManager.name}
                                        onChange={e => setNewManager({ ...newManager, name: e.target.value })}
                                        className="h-12 rounded-xl bg-white/5 border-white/10 focus:ring-primary"
                                        placeholder={t("account_managers.full_name")}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">{t("account_managers.work_email")}</label>
                                    <Input
                                        required
                                        type="email"
                                        value={newManager.email}
                                        onChange={e => setNewManager({ ...newManager, email: e.target.value })}
                                        className="h-12 rounded-xl bg-white/5 border-white/10 focus:ring-primary"
                                        placeholder="john@company.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">{t("account_managers.password")}</label>
                                    <Input
                                        required
                                        type="password"
                                        value={newManager.password}
                                        onChange={e => setNewManager({ ...newManager, password: e.target.value })}
                                        className="h-12 rounded-xl bg-white/5 border-white/10 focus:ring-primary"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">{t("account_managers.phone")}</label>
                                    <Input
                                        value={newManager.phone}
                                        onChange={e => setNewManager({ ...newManager, phone: e.target.value })}
                                        className="h-12 rounded-xl bg-white/5 border-white/10 focus:ring-primary"
                                        placeholder="+212 6XX XXX XXX"
                                    />
                                </div>
                                <DialogFooter className="pt-4">
                                    <Button type="submit" disabled={isCreating} className="w-full h-12 rounded-xl font-bold">
                                        {isCreating ? <Loader2 className="animate-spin" /> : t("account_managers.create_account")}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </header>

                <div className="flex flex-col xl:flex-row gap-4 items-center justify-between mb-8">
                    <div className="relative flex-1 xl:w-[400px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder={t("account_managers.search_managers")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-11 h-12 rounded-2xl bg-white/5 border-white/10 focus:bg-white/10 focus:border-primary transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        Array(3).fill(0).map((_, i) => (
                            <div key={i} className="h-64 glass-strong rounded-[2.5rem] animate-pulse" />
                        ))
                    ) : filteredManagers.length > 0 ? (
                        filteredManagers.map((m: any) => (
                            <div key={m.id} className="glass-strong rounded-[2.5rem] border border-white/10 p-8 hover:border-white/20 transition-all group">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary font-black text-2xl border border-white/10 shadow-inner">
                                        {m.name.charAt(0)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-primary/10 text-primary border-primary/20 rounded-lg px-3 py-1 font-bold">
                                            {t("account_managers.manager")}
                                        </Badge>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="glass-strong rounded-xl border-white/10">
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setEditingGoalManager(m)
                                                        setNewGoalValue(m.prime_target_revenue || "200000")
                                                        setIsGoalModalOpen(true)
                                                    }}
                                                >
                                                    <Shield className="w-4 h-4 mr-2" />
                                                    {t("account_managers.set_prime_goal")}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setResettingManager(m)
                                                        setNewPasswordInput("")
                                                        setIsResetPasswordModalOpen(true)
                                                    }}
                                                >
                                                    <Lock className="w-4 h-4 mr-2" />
                                                    Modifier le mot de passe
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => handleDeleteManager(m.id, m.name)}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    {t("account_managers.delete_account")}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                <h3 className="text-xl font-black text-foreground mb-1 tracking-tight">{m.name}</h3>
                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Mail className="w-4 h-4" />
                                        {m.email}
                                    </div>
                                    {m.phone && (
                                        <div className="flex items-center gap-2 text-sm text-primary font-bold">
                                            <Phone className="w-4 h-4" />
                                            {m.phone}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 mb-6">
                                    <div>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">{t("account_managers.assigned_partners")}</p>
                                        <p className="text-lg font-black text-foreground">{m.reseller_count || 0}</p>
                                    </div>
                                    <Users className="w-8 h-8 text-primary/40" />
                                </div>

                                {/* Prime Goal Display */}
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 rounded-2xl border border-violet-500/20 mb-6">
                                    <div>
                                        <p className="text-[10px] font-black text-violet-500 uppercase tracking-widest mb-0.5">{t("account_managers.prime_goal")}</p>
                                        <p className="text-lg font-black text-foreground">{(m.prime_target_revenue || 200000).toLocaleString()} {t("common.currency")}</p>
                                    </div>
                                    <Shield className="w-8 h-8 text-violet-500/40" />
                                </div>

                                <Dialog open={isAssignModalOpen && selectedManager?.id === m.id} onOpenChange={(open) => {
                                    setIsAssignModalOpen(open)
                                    if (open) setSelectedManager(m)
                                }}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="w-full h-12 rounded-xl font-bold bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/40 transition-all flex gap-2">
                                            <LinkIcon className="w-4 h-4" />
                                            {t("account_managers.manage_assignments")}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="glass-strong border-white/10 rounded-[2.5rem] max-w-2xl max-h-[80vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle className="text-2xl font-black">{t("account_managers.assign_resellers")} - {m.name}</DialogTitle>
                                            <DialogDescription>{t("account_managers.select_resellers")}</DialogDescription>
                                        </DialogHeader>

                                        <div className="mt-4 relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                placeholder={t("account_managers.find_reseller")}
                                                value={resellerSearchQuery}
                                                onChange={(e) => setResellerSearchQuery(e.target.value)}
                                                className="pl-11 h-12 rounded-2xl bg-white/5 border-white/10 focus:bg-white/10 focus:border-primary transition-all"
                                            />
                                        </div>

                                        <div className="py-6 space-y-4">
                                            <div className="space-y-3">
                                                {resellers
                                                    .filter(r =>
                                                        r.company_name.toLowerCase().includes(resellerSearchQuery.toLowerCase()) ||
                                                        r.name.toLowerCase().includes(resellerSearchQuery.toLowerCase())
                                                    )
                                                    .map((r) => (
                                                        <div key={r.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center \${r.assigned_to_id === m.id ? 'bg-primary/20 text-primary' : 'bg-white/10 text-muted-foreground'}`}>
                                                                    <Briefcase className="w-6 h-6" />
                                                                </div>
                                                                <div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-0.5">{t("account_managers.company")}</span>
                                                                        <p className="font-black text-foreground leading-tight text-lg mb-2">{r.company_name}</p>

                                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                                                            <div>
                                                                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-0.5">{t("account_managers.contact")}</span>
                                                                                <p className="text-sm font-bold text-foreground/80 leading-none">{r.name}</p>
                                                                            </div>
                                                                            <div className="h-6 w-px bg-white/10 hidden sm:block" />
                                                                            <div>
                                                                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-0.5">{t("account_managers.email")}</span>
                                                                                <p className="text-sm font-medium text-muted-foreground leading-none">{r.email}</p>
                                                                            </div>
                                                                            {r.phone && (
                                                                                <>
                                                                                    <div className="h-6 w-px bg-white/10 hidden sm:block" />
                                                                                    <div>
                                                                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-0.5">{t("account_managers.phone_label")}</span>
                                                                                        <div className="flex items-center gap-1.5 text-sm font-bold text-primary leading-none">
                                                                                            <Phone className="w-3 h-3" />
                                                                                            {r.phone}
                                                                                        </div>
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                            {r.city && (
                                                                                <>
                                                                                    <div className="h-6 w-px bg-white/10 hidden sm:block" />
                                                                                    <div>
                                                                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-0.5">{t("account_managers.city")}</span>
                                                                                        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground leading-none">
                                                                                            <MapPin className="w-3 h-3" />
                                                                                            {r.city}
                                                                                        </div>
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {r.assigned_to_id === m.id ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 rounded-lg">{t("account_managers.active")}</Badge>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        disabled={isAssigning}
                                                                        className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                                        onClick={() => handleAssignReseller(r.id)}
                                                                        title={t("account_managers.unassign")}
                                                                    >
                                                                        {assigningId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink className="w-4 h-4" />}
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <Button
                                                                    size="sm"
                                                                    disabled={isAssigning}
                                                                    className="rounded-lg font-bold gap-2"
                                                                    onClick={() => handleAssignReseller(r.id, m.id)}
                                                                >
                                                                    {assigningId === r.id ? (
                                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                                    ) : (
                                                                        <PlusCircle className="w-4 h-4" />
                                                                    )}
                                                                    {r.assigned_to_id ? t("account_managers.reassign") : t("account_managers.assign")}
                                                                </Button>
                                                            )
                                                            }
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="p-6 bg-white/5 rounded-full text-muted-foreground/20">
                                    <Shield className="w-16 h-16" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">{t("account_managers.no_managers")}</h3>
                                <p className="text-muted-foreground max-w-xs mx-auto">{t("account_managers.no_managers_desc")}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Edit Goal Dialog */}
                <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
                    <DialogContent className="glass-strong border-white/10 rounded-[2rem]">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black">{t("account_managers.set_prime_goal")}</DialogTitle>
                            <DialogDescription>
                                {t("account_managers.set_goal_desc")} <strong>{editingGoalManager?.name}</strong>.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdateGoal} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">{t("account_managers.target_revenue")}</label>
                                <Input
                                    required
                                    type="number"
                                    value={newGoalValue}
                                    onChange={e => setNewGoalValue(e.target.value)}
                                    className="h-12 rounded-xl bg-white/5 border-white/10 focus:ring-primary text-lg font-bold"
                                    placeholder="200000"
                                />
                                <p className="text-xs text-muted-foreground">{t("account_managers.default_revenue")}</p>
                            </div>
                            <DialogFooter className="pt-4">
                                <Button type="submit" disabled={isUpdatingGoal} className="w-full h-12 rounded-xl font-bold bg-violet-600 hover:bg-violet-700 text-white">
                                    {isUpdatingGoal ? <Loader2 className="animate-spin" /> : t("account_managers.update")}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Reset Password Dialog */}
                <Dialog open={isResetPasswordModalOpen} onOpenChange={setIsResetPasswordModalOpen}>
                    <DialogContent className="glass-strong border-white/10 rounded-[2rem]">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black">Modifier le mot de passe</DialogTitle>
                            <DialogDescription>
                                Définir un nouveau mot de passe pour <strong>{resettingManager?.name}</strong>.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleResetPassword} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Nouveau mot de passe</label>
                                <Input
                                    required
                                    type="password"
                                    value={newPasswordInput}
                                    onChange={e => setNewPasswordInput(e.target.value)}
                                    className="h-12 rounded-xl bg-white/5 border-white/10 focus:ring-primary"
                                    placeholder="••••••••"
                                />
                            </div>
                            <DialogFooter className="pt-4">
                                <Button type="submit" disabled={isResettingPassword} className="w-full h-12 rounded-xl font-bold bg-primary text-white">
                                    {isResettingPassword ? <Loader2 className="animate-spin mr-2" /> : "Mettre à jour"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </main >
        </div >
    )
}

