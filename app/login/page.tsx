"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/supabase"
import { Loader2, ArrowLeft, ArrowRight, User, Lock, Mail } from "lucide-react"
import { toast } from "sonner"
import { getCurrentUserRole } from "@/lib/supabase-api"

export default function LoginPage() {
    const { t, language, dir } = useLanguage()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const isArabic = language === "ar"

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const normalizedEmail = email.trim().toLowerCase()

            console.log('[Login Debug] Attempting login:', {
                url: process.env.NEXT_PUBLIC_SUPABASE_URL,
                email: normalizedEmail,
                passwordLength: password.length,
                timestamp: new Date().toISOString()
            })

            const { data, error } = await supabase.auth.signInWithPassword({
                email: normalizedEmail,
                password,
            })

            if (error) {
                console.error('[Login Debug] Auth error:', error)
                throw error
            }

            if (data.user) {
                console.log('[Login Debug] Login successful:', data.user.id)
                toast.success(isArabic ? "تم تسجيل الدخول بنجاح" : "Logged in successfully")

                // Fetch role for redirect
                const role = await getCurrentUserRole()
                console.log('Fetched user role:', role)

                const normalizedRole = role?.toUpperCase()

                if (normalizedRole === 'RESELLER') {
                    console.log('Redirecting to reseller dashboard')
                    router.push('/reseller/dashboard')
                } else if (normalizedRole === 'ACCOUNT_MANAGER') {
                    console.log('Redirecting to manager resellers')
                    router.push('/manager/resellers')
                } else if (normalizedRole === 'ADMIN') {
                    console.log('Redirecting to admin dashboard')
                    router.push('/admin/dashboard')
                } else {
                    console.log('Unknown role or customer, redirecting to home')
                    router.push('/')
                }
                router.refresh()
            }
        } catch (error: any) {
            console.error('Login error:', error)
            const projectId = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] || 'Unknown'
            const errorMessage = `${error.message || (isArabic ? "فشل تسجيل الدخول" : "Login failed")} (Target: ${projectId})`
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex relative overflow-hidden bg-background">
            {/* Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/30 rounded-full blur-[120px] animate-pulse delay-1000" />

            {/* Left Side - Image/Brand */}
            <div className="hidden lg:flex w-1/2 relative p-12 flex-col justify-between z-10">
                <div className="relative z-10">
                    <Link href="/">
                        <Image
                            src={"/logo.png"}
                            alt={"Didali Store"}
                            width={178}
                            height={50}
                            className={"h-12 w-auto"}
                        />
                    </Link>
                </div>
                <div className="relative z-10 max-w-lg">
                    <h1 className="text-5xl font-bold text-foreground mb-6 leading-tight">
                        {isArabic ? "مرحباً بك في عالم التكنولوجيا" : "Welcome to the Future of IT"}
                    </h1>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        {isArabic
                            ? "انضم إلى شبكة ديدالي واستمتع بأفضل عروض الأجهزة وحلول الأعمال في المغرب."
                            : "Join the Didali network and access the best hardware deals and business solutions in Morocco."}
                    </p>
                </div>
                <div className="relative z-10 text-sm text-muted-foreground">
                    © 2026 Didali Store. {isArabic ? "جميع الحقوق محفوظة." : "All rights reserved."}
                </div>

                {/* Glass Card Background for Left Side */}
                <div className="absolute inset-4 glass-liquid bg-white/10 rounded-[3rem] -z-0" />
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 z-10" dir={dir}>
                <div className="w-full max-w-md space-y-8 glass p-8 sm:p-10 rounded-3xl shadow-2xl relative">
                    <Link href="/" className="absolute top-6 right-6 text-muted-foreground hover:text-primary transition-colors">
                        <XIcon className="w-6 h-6" />
                    </Link>
                    <div className="text-center space-y-2">
                        {/* Mobile Logo */}
                        <div className="lg:hidden flex justify-center mb-6">
                            <Image
                                src={"/logo.png"}
                                alt={"Didali Store"}
                                width={140}
                                height={40}
                                className={"h-10 w-auto"}
                            />
                        </div>

                        <div className="text-[10px] text-muted-foreground opacity-30 mt-2 font-mono">
                            Supabase Context: {process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] || 'ewrelkbdqzywdjrgsadt'}
                        </div>

                        <h2 className="text-3xl font-bold tracking-tight">
                            {isArabic ? "تسجيل الدخول" : "Sign In"}
                        </h2>
                        <p className="text-muted-foreground">
                            {isArabic
                                ? "أدخل بياناتك للوصول إلى حسابك"
                                : "Enter your credentials to access your account"}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">{isArabic ? "البريد الإلكتروني" : "Email"}</Label>
                            <div className="relative">
                                <Mail className={`absolute top-3 w-5 h-5 text-muted-foreground ${isArabic ? "right-3" : "left-3"}`} />
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={isArabic ? "name@example.com" : "name@example.com"}
                                    className={`pl-10 h-12 rounded-xl bg-white/50 border-primary/10 focus:border-primary/50 focus:ring-primary/20 ${isArabic ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">{isArabic ? "كلمة المرور" : "Password"}</Label>
                                <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                                    {isArabic ? "نسيت كلمة المرور؟" : "Forgot password?"}
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className={`absolute top-3 w-5 h-5 text-muted-foreground ${isArabic ? "right-3" : "left-3"}`} />
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className={`pl-10 h-12 rounded-xl bg-white/50 border-primary/10 focus:border-primary/50 focus:ring-primary/20 ${isArabic ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                                    required
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-12 rounded-xl text-lg font-semibold shadow-lg shadow-primary/20" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    {isArabic ? "جاري التحميل..." : "Loading..."}
                                </>
                            ) : (
                                isArabic ? "تسجيل الدخول" : "Sign In"
                            )}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border/50" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background/50 backdrop-blur-md px-2 text-muted-foreground rounded-full">
                                {isArabic ? "أو" : "Or"}
                            </span>
                        </div>
                    </div>



                    <div className="text-center text-sm pt-2 space-y-4">
                        <Link href="/reseller/register" className="font-semibold text-secondary-foreground hover:text-primary transition-colors flex items-center justify-center gap-2">
                            {isArabic ? "التسجيل كموزع معتمد" : "Register as a Reseller"} <ArrowRight className={`w-4 h-4 ${isArabic ? "rotate-180" : ""}`} />
                        </Link>


                    </div>

                    {/* Debug Info (Only visible in development) */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-8 pt-4 border-t border-dashed border-slate-200 text-[10px] text-slate-400 font-mono text-center">
                            <p>Supabase Project: {process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}</p>
                            <p>Anon Key Loaded: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'YES' : 'NO'}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function XIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
    )
}
