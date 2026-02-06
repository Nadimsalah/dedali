"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { useLanguage } from "@/components/language-provider"
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
import Image from "next/image"

export default function EditProductPage() {
    const { t, setLanguage } = useLanguage()
    const router = useRouter()
    const params = useParams()
    const productId = params.id as string

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Set French as default for dashboard
    useEffect(() => {
        const savedLang = localStorage.getItem("language")
        if (!savedLang) {
            setLanguage("fr")
        }
    }, [setLanguage])

    // Form state
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [category, setCategory] = useState("")
    const [price, setPrice] = useState("")
    const [compareAtPrice, setCompareAtPrice] = useState("")
    const [resellerPrice, setResellerPrice] = useState("")
    const [partnerPrice, setPartnerPrice] = useState("")
    const [wholesalerPrice, setWholesalerPrice] = useState("")
    const [resellerMinQty, setResellerMinQty] = useState("")
    const [partnerMinQty, setPartnerMinQty] = useState("")
    const [wholesalerMinQty, setWholesalerMinQty] = useState("")
    const [stock, setStock] = useState("")
    const [sku, setSku] = useState("")
    const [status, setStatus] = useState("active")
    const [benefits, setBenefits] = useState<string[]>([])
    const [ingredients, setIngredients] = useState("")
    const [howToUse, setHowToUse] = useState("")
    const [categories, setCategories] = useState<{ id: string, name: string, slug: string }[]>([])
    const [images, setImages] = useState<string[]>([])
    const [uploading, setUploading] = useState(false)

    // AI Rewrite State
    const [rewriting, setRewriting] = useState<string | null>(null)

    // Load product data
    useEffect(() => {
        async function loadProduct() {
            setLoading(true)
            const [product, categoriesData] = await Promise.all([
                getProductById(productId),
                supabase.from('categories').select('id, name, slug').order('name')
            ])

            if (product) {
                setTitle(product.title)
                setDescription(product.description || "")
                setCategory(product.category)
                setPrice(product.price.toString())
                setCompareAtPrice(product.compare_at_price?.toString() || "")
                setResellerPrice(product.reseller_price?.toString() || "")
                setPartnerPrice(product.partner_price?.toString() || "")
                setWholesalerPrice(product.wholesaler_price?.toString() || "")
                setResellerMinQty(product.reseller_min_qty?.toString() || "")
                setPartnerMinQty(product.partner_min_qty?.toString() || "")
                setWholesalerMinQty(product.wholesaler_min_qty?.toString() || "")
                setStock(product.stock.toString())
                setSku(product.sku)
                setStatus(product.status)
                setBenefits(product.benefits || [])
                setIngredients(product.ingredients || "")
                setHowToUse(product.how_to_use || "")
                setImages(product.images || [])
            }

            if (categoriesData.data) {
                setCategories(categoriesData.data)
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

    const handleSave = async () => {
        setSaving(true)

        const { error } = await supabase
            .from('products')
            .update({
                title,
                description,
                category,
                price: parseFloat(price),
                compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : null,
                reseller_price: resellerPrice ? parseFloat(resellerPrice) : null,
                partner_price: partnerPrice ? parseFloat(partnerPrice) : null,
                wholesaler_price: wholesalerPrice ? parseFloat(wholesalerPrice) : null,
                reseller_min_qty: resellerMinQty ? parseInt(resellerMinQty) : null,
                partner_min_qty: partnerMinQty ? parseInt(partnerMinQty) : null,
                wholesaler_min_qty: wholesalerMinQty ? parseInt(wholesalerMinQty) : null,
                stock: parseInt(stock),
                sku,
                status,
                benefits,
                ingredients,
                how_to_use: howToUse,
                images,
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
    }

    const updateBenefit = (index: number, value: string) => {
        const newBenefits = [...benefits]
        newBenefits[index] = value
        setBenefits(newBenefits)
    }

    const removeBenefit = (index: number) => {
        setBenefits(benefits.filter((_, i) => i !== index))
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setUploading(true)
        const uploadedUrls: string[] = []

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                const fileExt = file.name.split('.').pop()
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
                const filePath = `${fileName}`

                const { data, error } = await supabase.storage
                    .from('product-images')
                    .upload(filePath, file)

                if (error) {
                    console.error('Error uploading image:', error.message)
                    continue
                }

                const publicUrl = supabase.storage.from('product-images').getPublicUrl(data.path).data.publicUrl
                uploadedUrls.push(publicUrl)
            }

            if (uploadedUrls.length > 0) {
                setImages(prev => [...prev, ...uploadedUrls])
            }
        } catch (error) {
            console.error('Upload error:', error)
        } finally {
            setUploading(false)
        }
    }

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index))
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
                                <div className="relative">
                                    <Input
                                        value={title || ""}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g., Dell Latitude 5420 Laptop"
                                        className="h-12 text-base bg-gray-50/50 border-gray-200 focus:bg-white transition-colors pr-12"
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
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-gray-700">Description</label>
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
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Media Gallery */}
                        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                                    Media Gallery
                                </h3>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {images.map((img, i) => (
                                        <div key={i} className="relative aspect-square rounded-2xl overflow-hidden group border border-gray-200 bg-gray-50">
                                            <Image src={img} alt="Product" fill className="object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                <button onClick={() => removeImage(i)} className="p-3 bg-white text-red-500 shadow-lg rounded-full hover:bg-red-50 transition-all transform hover:scale-110">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-blue-600 group">
                                        <div className="p-4 rounded-full bg-gray-50 group-hover:bg-blue-100 transition-colors mb-3">
                                            {uploading ? (
                                                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                                            ) : (
                                                <Upload className="w-6 h-6 text-gray-400 group-hover:text-blue-600" />
                                            )}
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wide">
                                            {uploading ? 'Uploading...' : 'Upload Image'}
                                        </span>
                                        <input type="file" className="hidden" multiple onChange={handleImageUpload} accept="image/*" disabled={uploading} />
                                    </label>
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
                                        <div key={index} className="flex gap-2 p-4 bg-gray-50/50 border border-gray-100 rounded-2xl relative group">
                                            <Input
                                                value={benefit || ""}
                                                onChange={(e) => updateBenefit(index, e.target.value)}
                                                placeholder="Benefit (English)"
                                                className="h-10 text-sm bg-white border-gray-200"
                                            />
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
                                    <label className="text-sm font-semibold text-gray-700">Technical Specifications</label>
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
                                    </div>
                                </div>
                                <Textarea
                                    value={ingredients || ""}
                                    onChange={(e) => setIngredients(e.target.value)}
                                    placeholder="Processor, RAM, Storage, etc."
                                    className="min-h-[100px] text-sm bg-gray-50/50 border-gray-200 focus:bg-white transition-colors resize-none"
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-semibold text-gray-700">Warranty & Support</label>
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
                                    </div>
                                </div>
                                <Textarea
                                    value={howToUse || ""}
                                    onChange={(e) => setHowToUse(e.target.value)}
                                    placeholder="Warranty details and support info..."
                                    className="min-h-[100px] text-sm bg-gray-50/50 border-gray-200 focus:bg-white transition-colors resize-none"
                                />
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
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.slug}>{cat.name}</option>
                                        ))}
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
                                <label className="text-sm font-semibold text-gray-700">Price (MAD)</label>
                                <Input
                                    type="number"
                                    value={price || ""}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="0.00"
                                    className="h-12 text-base bg-gray-50/50 border-gray-200"
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Reseller Price (MAD)</label>
                                    <Input
                                        type="number"
                                        value={resellerPrice || ""}
                                        onChange={(e) => setResellerPrice(e.target.value)}
                                        placeholder="0.00"
                                        className="h-12 text-base bg-blue-50/50 border-blue-200 text-blue-900 focus:bg-white transition-colors"
                                    />
                                    <Input
                                        type="number"
                                        value={resellerMinQty || ""}
                                        onChange={(e) => setResellerMinQty(e.target.value)}
                                        placeholder="Min quantity for reseller pricing"
                                        className="h-10 text-sm bg-blue-50/80 border-blue-200 text-blue-900"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Partner Price (MAD)</label>
                                    <Input
                                        type="number"
                                        value={partnerPrice || ""}
                                        onChange={(e) => setPartnerPrice(e.target.value)}
                                        placeholder="0.00"
                                        className="h-12 text-base bg-purple-50/50 border-purple-200 text-purple-900 focus:bg-white transition-colors"
                                    />
                                    <Input
                                        type="number"
                                        value={partnerMinQty || ""}
                                        onChange={(e) => setPartnerMinQty(e.target.value)}
                                        placeholder="Min quantity for partner pricing"
                                        className="h-10 text-sm bg-purple-50/80 border-purple-200 text-purple-900"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Wholesaler Price (MAD)</label>
                                    <Input
                                        type="number"
                                        value={wholesalerPrice || ""}
                                        onChange={(e) => setWholesalerPrice(e.target.value)}
                                        placeholder="0.00"
                                        className="h-12 text-base bg-emerald-50/50 border-emerald-200 text-emerald-900 focus:bg-white transition-colors"
                                    />
                                    <Input
                                        type="number"
                                        value={wholesalerMinQty || ""}
                                        onChange={(e) => setWholesalerMinQty(e.target.value)}
                                        placeholder="Min quantity for wholesaler pricing"
                                        className="h-10 text-sm bg-emerald-50/80 border-emerald-200 text-emerald-900"
                                    />
                                </div>
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
