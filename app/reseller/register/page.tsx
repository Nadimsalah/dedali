"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { Loader2, ArrowRight, User, Lock, Mail, Phone, Building2, FileText, Globe } from "lucide-react"
import { toast } from "sonner"

export default function ResellerRegisterPage() {
    const { t, language, dir } = useLanguage()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const isArabic = language === "ar"

    // Form State
    const [formData, setFormData] = useState({
        companyName: "",
        ice: "",
        website: "",
        city: "",
        name: "", // Contact person
        phone: "",
        email: "",
        password: ""
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // 1. Sign up with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.name,
                        role: 'reseller',
                        company_name: formData.companyName,
                        ice: formData.ice,
                        website: formData.website,
                        city: formData.city,
                        phone: formData.phone
                    },
                },
            })

            if (authError) throw authError

            if (authData.user) {
                // 2. Create customer record with Reseller details
                // Note: We need to make sure 'customers' table has these columns.
                // If not, we'll store basic info and put detailed info in metadata or a separate table.
                // For now, assuming you added the columns from my previous SQL script.

                const { error: customerError } = await supabase
                    .from('customers')
                    .insert({
                        id: authData.user.id,
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                        status: 'pending',
                        role: 'reseller',
                        company_name: formData.companyName, // This needs column in DB
                        ice: formData.ice, // This needs column in DB
                        website: formData.website, // This needs column in DB
                        city: formData.city, // This needs column in DB
                        total_orders: 0,
                        total_spent: 0
                    })

                if (customerError) {
                    console.error('Error creating reseller profile:', customerError)
                    // We don't rollback auth for now, but in production you might want to.
                }

                toast.success(
                    isArabic
                        ? "تم إنشاء حسابك بنجاح، وهو قيد المراجعة. سيتم تفعيل حسابك قريبًا."
                        : "Your reseller account has been created and is pending activation. We will activate your account soon."
                )

                // Redirect to login while account awaits activation
                setTimeout(() => {
                    router.push('/login')
                }, 2000)
            }

        } catch (error: any) {
            toast.error(error?.message || (isArabic ? "حدث خطأ أثناء التسجيل" : "Error submitting application"))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex relative overflow-hidden bg-background">
            {/* Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-1000" />

            {/* Left Side */}
            <div className="hidden lg:flex w-5/12 relative p-12 flex-col justify-between z-10">
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
                    <div className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary font-semibold text-sm mb-4 border border-primary/20">
                        {isArabic ? "برنامج الشركاء" : "Partner Program"}
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
                        {isArabic ? "كن شريك نجاح ديدالي" : "Become a Didali Succes Partner"}
                    </h1>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        {isArabic
                            ? "استفد من أسعار الجملة التنافسية، ودعم فني متخصص، وأولوية في التوصيل. انضم لأكبر شبكة موزعين في المغرب."
                            : "Access competitive wholesale pricing, dedicated support, and priority delivery. Join the largest reseller network in Morocco."}
                    </p>
                    <ul className="mt-8 space-y-4">
                        {[
                            isArabic ? "أسعار خاصة للموزعين" : "Special Reseller Pricing",
                            isArabic ? "مدير حساب مخصص" : "Dedicated Account Manager",
                            isArabic ? "شحن سريع لجميع المدن" : "Fast Nationwide Shipping",
                            isArabic ? "ضمان رسمي" : "Official Warranty"
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-foreground/80">
                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="relative z-10 text-sm text-muted-foreground">
                    © 2026 Didali Store Partner Program.
                </div>
                <div className="absolute inset-4 glass-liquid bg-white/10 rounded-[3rem] -z-0" />
            </div>

            {/* Right Side */}
            <div className="w-full lg:w-7/12 flex items-center justify-center p-4 sm:p-8 z-10 overflow-y-auto" dir={dir}>
                <div className="w-full max-w-2xl glass p-8 sm:p-10 rounded-3xl shadow-2xl relative my-8">
                    <Link href="/" className="absolute top-6 right-6 text-muted-foreground hover:text-primary transition-colors">
                        <XIcon className="w-6 h-6" />
                    </Link>
                    <div className="mb-8">
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

                        <h2 className="text-3xl font-bold tracking-tight mb-2">
                            {isArabic ? "تسجيل حساب موزع" : "Register as a Reseller"}
                        </h2>
                        <p className="text-muted-foreground">
                            {isArabic
                                ? "يرجى ملء النموذج أدناه بمعلومات شركتك"
                                : "Please fill out the form below with your company details"}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Company Info */}
                        <div className="md:col-span-2">
                            <h3 className="text-lg font-semibold mb-4 border-b pb-2">{isArabic ? "معلومات الشركة" : "Company Information"}</h3>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="companyName">{isArabic ? "اسم الشركة" : "Company Name"}</Label>
                            <div className="relative">
                                <Building2 className={`absolute top-3 w-5 h-5 text-muted-foreground ${isArabic ? "right-3" : "left-3"}`} />
                                <Input
                                    id="companyName"
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    className={`h-12 rounded-xl bg-white/50 ${isArabic ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ice">{isArabic ? "رقم التعريف الموحد (ICE)" : "ICE Number"}</Label>
                            <div className="relative">
                                <FileText className={`absolute top-3 w-5 h-5 text-muted-foreground ${isArabic ? "right-3" : "left-3"}`} />
                                <Input
                                    id="ice"
                                    value={formData.ice}
                                    onChange={handleChange}
                                    className={`h-12 rounded-xl bg-white/50 ${isArabic ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="website">{isArabic ? "الموقع الإلكتروني (اختياري)" : "Website (Optional)"}</Label>
                            <div className="relative">
                                <Globe className={`absolute top-3 w-5 h-5 text-muted-foreground ${isArabic ? "right-3" : "left-3"}`} />
                                <Input
                                    id="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    className={`h-12 rounded-xl bg-white/50 ${isArabic ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="city">{isArabic ? "المدينة" : "City"}</Label>
                            <div className="relative">
                                <Input
                                    id="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="h-12 rounded-xl bg-white/50"
                                    required
                                />
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="md:col-span-2 pt-4">
                            <h3 className="text-lg font-semibold mb-4 border-b pb-2">{isArabic ? "معلومات الاتصال" : "Contact Person"}</h3>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">{isArabic ? "الاسم الكامل" : "Full Name"}</Label>
                            <div className="relative">
                                <User className={`absolute top-3 w-5 h-5 text-muted-foreground ${isArabic ? "right-3" : "left-3"}`} />
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`h-12 rounded-xl bg-white/50 ${isArabic ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">{isArabic ? "رقم الهاتف" : "Phone Number"}</Label>
                            <div className="relative">
                                <Phone className={`absolute top-3 w-5 h-5 text-muted-foreground ${isArabic ? "right-3" : "left-3"}`} />
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={`h-12 rounded-xl bg-white/50 ${isArabic ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="email">{isArabic ? "البريد الإلكتروني المهني" : "Work Email"}</Label>
                            <div className="relative">
                                <Mail className={`absolute top-3 w-5 h-5 text-muted-foreground ${isArabic ? "right-3" : "left-3"}`} />
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`h-12 rounded-xl bg-white/50 ${isArabic ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="password">{isArabic ? "كلمة المرور" : "Password"}</Label>
                            <div className="relative">
                                <Lock className={`absolute top-3 w-5 h-5 text-muted-foreground ${isArabic ? "right-3" : "left-3"}`} />
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`h-12 rounded-xl bg-white/50 ${isArabic ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                                    required
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2 pt-6">
                            <Button type="submit" className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/20" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        {isArabic ? "جاري إرسال الطلب..." : "Submitting Application..."}
                                    </>
                                ) : (
                                    isArabic ? "إنشاء حساب موزع" : "Create Reseller Account"
                                )}
                            </Button>
                        </div>

                        <div className="md:col-span-2 text-center text-sm pt-2">
                            <Link href="/login" className="font-medium text-primary hover:underline">
                                {isArabic ? "لديك حساب بالفعل؟ تسجيل الدخول" : "Already have an account? Log in"}
                            </Link>
                        </div>

                    </form>
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
