"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { Loader2, Phone, Lock, Truck } from "lucide-react"
import { toast } from "sonner"

export default function DeliveryLoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [phone, setPhone] = useState("")
    const [password, setPassword] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const cleanPhone = phone.replace(/\s+/g, '')
            console.log("[Login] Attempting login for:", cleanPhone)

            // Try standard phone login first
            let result = await supabase.auth.signInWithPassword({
                phone: cleanPhone,
                password,
            })

            // Fallback to virtual email if phone auth fails
            if (result.error) {
                console.log("[Login] Phone login failed, trying virtual email:", `${cleanPhone}@delivery.com`)
                const virtualEmail = `${cleanPhone}@delivery.com`
                const resultAlt = await supabase.auth.signInWithPassword({
                    email: virtualEmail,
                    password,
                })

                if (resultAlt.error) {
                    console.error("[Login] All methods failed:", resultAlt.error)
                    throw resultAlt.error
                }
                result = resultAlt
            }

            if (result.data?.user) {
                toast.success("Connexion réussie")
                router.push('/logistique/dashboard')
                router.refresh()
            }
        } catch (error: any) {
            console.error("[Login] Final Error:", error)
            const msg = error.message === "Invalid login credentials"
                ? "Identifiants invalides. Vérifiez le numéro et le mot de passe."
                : "Erreur de connexion : " + error.message
            toast.error(msg)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] p-4 font-sans">
            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-blue-500/5 p-8 sm:p-12 border border-slate-100">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-500/20 mb-6 rotate-3 transform hover:rotate-0 transition-transform duration-300">
                        <Truck className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Espace Logisticien</h1>
                    <p className="text-slate-500 font-medium text-center">Gérez vos expéditions et logistique simplement.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Numéro de téléphone</Label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                                id="phone"
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+212 6..."
                                className="pl-12 h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-blue-500 focus:border-blue-500 transition-all text-lg font-bold"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Mot de passe</Label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="pl-12 h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-blue-500 focus:border-blue-500 transition-all text-lg font-bold"
                                required
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-14 rounded-2xl text-lg font-black bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all active:scale-95 border-none"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : "Se Connecter"}
                    </Button>
                </form>

                <div className="mt-12 text-center">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">DIDAL SERVICE LOGISTIQUE</p>
                </div>
            </div>
        </div>
    )
}
