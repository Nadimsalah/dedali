"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    ArrowLeft,
    Save,
    Sparkles,
    Upload,
    X,
    ChevronDown,
    Loader2,
    RefreshCw
} from "lucide-react"
import Link from "next/link"
import { getProductById } from "@/lib/supabase-api"
import { supabase } from "@/lib/supabase"

export default function EditProductPage() {
    const router = useRouter()
    const params = useParams()
    const productId = params.id as string

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Form state
    const [title, setTitle] = useState("")
    const [titleAr, setTitleAr] = useState("")
    const [description, setDescription] = useState("")
    const [descriptionAr, setDescriptionAr] = useState("")
    const [category, setCategory] = useState("")
    const [price, setPrice] = useState("")
    const [compareAtPrice, setCompareAtPrice] = useState("")
    const [stock, setStock] = useState("")
    const [sku, setSku] = useState("")
    const [status, setStatus] = useState("active")
    const [benefits, setBenefits] = useState<string[]>([])
    const [benefitsAr, setBenefitsAr] = useState<string[]>([])
    const [ingredients, setIngredients] = useState("")
    const [ingredientsAr, setIngredientsAr] = useState("")
    const [howToUse, setHowToUse] = useState("")
    const [howToUseAr, setHowToUseAr] = useState("")

    // AI Rewrite State
    const [rewriting, setRewriting] = useState<string | null>(null)

    // Load product data
    useEffect(() => {
        async function loadProduct() {
            setLoading(true)
            const product = await getProductById(productId)

            if (product) {
                setTitle(product.title)
                setTitleAr(product.title_ar || "")
                setDescription(product.description || "")
                setDescriptionAr(product.description_ar || "")
                setCategory(product.category)
                setPrice(product.price.toString())
                setCompareAtPrice(product.compare_at_price?.toString() || "")
                setStock(product.stock.toString())
                setSku(product.sku)
                setStatus(product.status)
                setBenefits(product.benefits || [])
                setBenefitsAr(product.benefits_ar || [])
                setIngredients(product.ingredients || "")
                setIngredientsAr(product.ingredients_ar || "")
                setHowToUse(product.how_to_use || "")
                setHowToUseAr(product.how_to_use_ar || "")
            }

            setLoading(false)
        }

        if (productId) {
            loadProduct()
        }
    }, [productId])

    const handleRewrite = async (field: string, currentText: string, setter: (val: string) => void) => {
        if (!currentText.trim()) return

        setRewriting(field)
        try {
            const res = await fetch('/api/admin/products/rewrite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: currentText, field })
            })

            const data = await res.json()

            if (!res.ok) {
                if (data.error_code === "RATE_LIMIT_DAILY") {
                    alert("⚠️ Daily Free AI Quota Exceeded\n\nPlease wait until tomorrow or add your own OpenRouter key in settings.")
                    return
                }
                throw new Error(data.message || data.error || "Unknown error")
            }

            if (data.text) {
                setter(data.text)
            }
        } catch (error: any) {
            console.error('Rewrite error:', error)
            if (error.message !== "Unknown error") {
                alert(`AI Assistant: ${error.message}`)
            }
        } finally {
            setRewriting(null)
        }
    }

    const handleTranslate = async (text: string, setter: (val: string) => void, field: string) => {
        if (!text.trim()) return
        setRewriting(field)
        try {
            const res = await fetch('/api/admin/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, targetLang: 'ar' })
            })
            const data = await res.json()
            if (data.translatedText) {
                setter(data.translatedText)
            }
        } catch (error) {
            console.error('Translation error:', error)
        } finally {
            setRewriting(null)
        }
    }

    const handleSave = async () => {
        setSaving(true)

        const { error } = await supabase
            .from('products')
            .update({
                title,
                title_ar: titleAr,
                description,
                description_ar: descriptionAr,
                category,
                price: parseFloat(price),
                compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : null,
                stock: parseInt(stock),
                sku,
                status,
                benefits,
                benefits_ar: benefitsAr,
                ingredients,
                ingredients_ar: ingredientsAr,
                how_to_use: howToUse,
                how_to_use_ar: howToUseAr,
                updated_at: new Date().toISOString()
            })
            .eq('id', productId)

        setSaving(false)

        if (error) {
            alert('Error updating product: ' + error.message)
        } else {
            router.push('/admin/products')
        }
    }

    const addBenefit = () => {
        setBenefits([...benefits, ""])
        setBenefitsAr([...benefitsAr, ""])
    }

    const updateBenefit = (index: number, value: string) => {
        const newBenefits = [...benefits]
        newBenefits[index] = value
        setBenefits(newBenefits)
    }

    const updateBenefitAr = (index: number, value: string) => {
        const newBenefits = [...benefitsAr]
        newBenefits[index] = value
        setBenefitsAr(newBenefits)
    }

    const removeBenefit = (index: number) => {
        setBenefits(benefits.filter((_, i) => i !== index))
        setBenefitsAr(benefitsAr.filter((_, i) => i !== index))
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
                <AdminSidebar />
                <div className="text-center">
                    <p className="text-gray-500">Loading product...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50/50 relative overflow-hidden text-gray-900">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-100/40 rounded-full blur-[120px]" />
            </div>

            <AdminSidebar />

            <main className="lg:pl-72 p-4 sm:p-6 lg:p-8 min-h-screen relative z-10 pb-24">
                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sticky top-4 z-40 bg-white/80 backdrop-blur-xl p-4 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/products">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Edit Product</h1>
                            <p className="text-xs text-gray-500 font-medium">Update product information</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/admin/products">
                            <Button variant="outline" className="rounded-full border-gray-200 hover:bg-gray-100 text-gray-600">
                                Discard
                            </Button>
                        </Link>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="rounded-full px-6 shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white border-none transition-all"
                        >
                            {saving ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                        </Button>
                    </div>
                </header>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Column */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* General Information */}
                        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
                            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-4">General Information</h3>

                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-gray-700">Product Title</label>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <Input
                                            value={title || ""}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="e.g., Pure Argan Oil"
                                            className="h-12 text-base bg-gray-50/50 border-gray-200 focus:bg-white transition-colors pr-20"
                                        />
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                            {title.trim() && (
                                                <button
                                                    onClick={() => handleRewrite('title', title, setTitle)}
                                                    disabled={rewriting === 'title'}
                                                    className="text-purple-400 hover:text-purple-600 p-1 rounded-full transition-all"
                                                    title="Improve with AI"
                                                >
                                                    {rewriting === 'title' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                                </button>
                                            )}
                                            {title.trim() && (
                                                <button
                                                    onClick={() => handleTranslate(title, setTitleAr, 'title_ar')}
                                                    disabled={rewriting === 'title_ar'}
                                                    className="text-blue-400 hover:text-blue-600 p-1 rounded-full transition-all"
                                                    title="Translate to Arabic"
                                                >
                                                    {rewriting === 'title_ar' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            value={titleAr || ""}
                                            onChange={(e) => setTitleAr(e.target.value)}
                                            placeholder="اسم المنتج بالعربية"
                                            dir="rtl"
                                            className="h-12 text-base bg-gray-50/50 border-gray-200 focus:bg-white transition-colors font-arabic"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-gray-700">Description</label>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <Textarea
                                            value={description || ""}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Describe your product (English)..."
                                            className="min-h-[150px] text-base bg-gray-50/50 border-gray-200 focus:bg-white transition-colors resize-none pr-10"
                                        />
                                        <div className="absolute right-2 top-2 flex flex-col gap-2">
                                            {description.trim() && (
                                                <button
                                                    onClick={() => handleRewrite('description', description, setDescription)}
                                                    disabled={rewriting === 'description'}
                                                    className="text-purple-400 hover:text-purple-600 p-1 rounded-full transition-all bg-white/50 backdrop-blur-sm"
                                                    title="Improve with AI"
                                                >
                                                    {rewriting === 'description' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                                </button>
                                            )}
                                            {description.trim() && (
                                                <button
                                                    onClick={() => handleTranslate(description, setDescriptionAr, 'description_ar')}
                                                    disabled={rewriting === 'description_ar'}
                                                    className="text-blue-400 hover:text-blue-600 p-1 rounded-full transition-all bg-white/50 backdrop-blur-sm"
                                                    title="Translate to Arabic"
                                                >
                                                    {rewriting === 'description_ar' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <Textarea
                                            value={descriptionAr || ""}
                                            onChange={(e) => setDescriptionAr(e.target.value)}
                                            placeholder="وصف المنتج بالعربية..."
                                            dir="rtl"
                                            className="min-h-[150px] text-base bg-gray-50/50 border-gray-200 focus:bg-white transition-colors resize-none font-arabic"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Product Attributes */}
                        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
                            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-4">Product Attributes</h3>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-gray-700">Key Benefits</label>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={addBenefit}
                                        className="h-8 text-xs rounded-lg"
                                    >
                                        <Sparkles className="w-3 h-3 mr-1" /> Add Benefit
                                    </Button>
                                </div>
                                <div className="space-y-4">
                                    {benefits.map((benefit, index) => (
                                        <div key={index} className="flex flex-col gap-2 p-4 bg-gray-50/50 border border-gray-100 rounded-2xl relative group">
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <Input
                                                        value={benefit || ""}
                                                        onChange={(e) => updateBenefit(index, e.target.value)}
                                                        placeholder="Benefit (English)"
                                                        className="h-10 text-sm bg-white border-gray-200 pr-10"
                                                    />
                                                    {benefit.trim() && (
                                                        <button
                                                            onClick={() => handleTranslate(benefit, (val) => updateBenefitAr(index, val), `benefit_ar_${index}`)}
                                                            disabled={rewriting === `benefit_ar_${index}`}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-600"
                                                        >
                                                            {rewriting === `benefit_ar_${index}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                                        </button>
                                                    )}
                                                </div>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => removeBenefit(index)}
                                                    className="h-10 w-10 text-red-500 hover:bg-red-50 shrink-0"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <Input
                                                value={benefitsAr[index] || ""}
                                                onChange={(e) => updateBenefitAr(index, e.target.value)}
                                                placeholder="الميزة بالعربية"
                                                dir="rtl"
                                                className="h-10 text-sm bg-white border-gray-200 font-arabic"
                                            />
                                        </div>
                                    ))}
                                    {benefits.length === 0 && (
                                        <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 text-sm">
                                            No benefits added yet.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-semibold text-gray-700">Ingredients</label>
                                    <div className="flex gap-2">
                                        {ingredients.trim() && (
                                            <button
                                                onClick={() => handleRewrite('ingredients', ingredients, setIngredients)}
                                                disabled={rewriting === 'ingredients'}
                                                className="text-xs text-purple-500 hover:text-purple-700 flex items-center gap-1"
                                            >
                                                {rewriting === 'ingredients' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Polish
                                            </button>
                                        )}
                                        {ingredients.trim() && (
                                            <button
                                                onClick={() => handleTranslate(ingredients, setIngredientsAr, 'ingredients_ar')}
                                                disabled={rewriting === 'ingredients_ar'}
                                                className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
                                            >
                                                {rewriting === 'ingredients_ar' ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Translate
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <Textarea
                                        value={ingredients || ""}
                                        onChange={(e) => setIngredients(e.target.value)}
                                        placeholder="Ingredients (English)..."
                                        className="min-h-[100px] text-sm bg-gray-50/50 border-gray-200 focus:bg-white transition-colors resize-none"
                                    />
                                    <Textarea
                                        value={ingredientsAr || ""}
                                        onChange={(e) => setIngredientsAr(e.target.value)}
                                        placeholder="المكونات بالعربية..."
                                        dir="rtl"
                                        className="min-h-[100px] text-sm bg-gray-50/50 border-gray-200 focus:bg-white transition-colors resize-none font-arabic"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-semibold text-gray-700">How to Use</label>
                                    <div className="flex gap-2">
                                        {howToUse.trim() && (
                                            <button
                                                onClick={() => handleRewrite('how_to_use', howToUse, setHowToUse)}
                                                disabled={rewriting === 'how_to_use'}
                                                className="text-xs text-purple-500 hover:text-purple-700 flex items-center gap-1"
                                            >
                                                {rewriting === 'how_to_use' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Polish
                                            </button>
                                        )}
                                        {howToUse.trim() && (
                                            <button
                                                onClick={() => handleTranslate(howToUse, setHowToUseAr, 'how_to_use_ar')}
                                                disabled={rewriting === 'how_to_use_ar'}
                                                className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
                                            >
                                                {rewriting === 'how_to_use_ar' ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Translate
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <Textarea
                                        value={howToUse || ""}
                                        onChange={(e) => setHowToUse(e.target.value)}
                                        placeholder="Usage Instructions (English)..."
                                        className="min-h-[100px] text-sm bg-gray-50/50 border-gray-200 focus:bg-white transition-colors resize-none"
                                    />
                                    <Textarea
                                        value={howToUseAr || ""}
                                        onChange={(e) => setHowToUseAr(e.target.value)}
                                        placeholder="طريقة الاستخدام بالعربية..."
                                        dir="rtl"
                                        className="min-h-[100px] text-sm bg-gray-50/50 border-gray-200 focus:bg-white transition-colors resize-none font-arabic"
                                    />
                                </div>
                            </div>
                        </section>

                    </div>

                    {/* Sidebar Column */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* Organization */}
                        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
                            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-4">Organization</h3>

                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-gray-700">Category</label>
                                <div className="relative">
                                    <select
                                        value={category || ""}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 appearance-none shadow-sm"
                                    >
                                        <option value="" disabled>Select Category</option>
                                        <option value="face">Face Care</option>
                                        <option value="body">Body Care</option>
                                        <option value="hair">Hair Care</option>
                                        <option value="gift">Gift Sets</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-gray-700">Status</label>
                                <div className="relative">
                                    <select
                                        value={status || "draft"}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 appearance-none shadow-sm"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="active">Active</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </section>

                        {/* Pricing */}
                        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
                            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-4">Pricing</h3>

                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-gray-700">Price (EGP)</label>
                                <Input
                                    type="number"
                                    value={price || ""}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="0.00"
                                    className="h-12 text-base bg-gray-50/50 border-gray-200"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-gray-700">Compare at Price (Optional)</label>
                                <Input
                                    type="number"
                                    value={compareAtPrice || ""}
                                    onChange={(e) => setCompareAtPrice(e.target.value)}
                                    placeholder="0.00"
                                    className="h-12 text-base bg-gray-50/50 border-gray-200"
                                />
                            </div>
                        </section>

                        {/* Inventory */}
                        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
                            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-4">Inventory</h3>

                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-gray-700">Stock Quantity</label>
                                <Input
                                    type="number"
                                    value={stock || ""}
                                    onChange={(e) => setStock(e.target.value)}
                                    placeholder="0"
                                    className="h-12 text-base bg-gray-50/50 border-gray-200"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-gray-700">SKU</label>
                                <Input
                                    value={sku || ""}
                                    onChange={(e) => setSku(e.target.value)}
                                    placeholder="PROD-001"
                                    className="h-12 text-base bg-gray-50/50 border-gray-200"
                                />
                            </div>
                        </section>

                    </div>

                </div>

            </main>
        </div>
    )
}
