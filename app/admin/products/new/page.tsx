"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    ArrowLeft,
    Upload,
    X,
    Plus,
    Save,
    Image as ImageIcon,
    Check,
    Wand2,
    RefreshCw,
    ChevronDown,
    Layers,
    DollarSign,
    Package,
    Tags,
    Sparkles,
    Loader2
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

// Mock Data for "You May Also Like"
// replaced by DB call

export default function NewProductPage() {
    const [title, setTitle] = useState("")
    const [sku, setSku] = useState("")
    const [images, setImages] = useState<string[]>([])
    const [uploading, setUploading] = useState(false)
    const [benefits, setBenefits] = useState<string[]>([])
    const [newBenefit, setNewBenefit] = useState("")
    const [selectedRelated, setSelectedRelated] = useState<string[]>([])
    const [status, setStatus] = useState("Active")
    const [category, setCategory] = useState("")
    const [isPublishing, setIsPublishing] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const router = useRouter()

    // Form fields
    const [description, setDescription] = useState("")
    const [price, setPrice] = useState("")
    const [compareAtPrice, setCompareAtPrice] = useState("")
    const [resellerPrice, setResellerPrice] = useState("")
    const [stock, setStock] = useState("")
    const [ingredients, setIngredients] = useState("")
    const [howToUse, setHowToUse] = useState("")
    const [categories, setCategories] = useState<any[]>([])

    // AI Rewrite State
    const [rewriting, setRewriting] = useState<string | null>(null)
    const [relatedProducts, setRelatedProducts] = useState<any[]>([])

    // Fetch related products & categories
    useEffect(() => {
        const fetchData = async () => {
            // Products for cross-sell
            const { data: prodData } = await supabase
                .from('products')
                .select('id, title, images')
                .eq('status', 'active')
                .limit(10)

            if (prodData) setRelatedProducts(prodData)

            // Categories
            const { data: catData } = await supabase
                .from('categories')
                .select('id, name, slug')
                .order('name')

            if (catData) setCategories(catData)
        }
        fetchData()
    })

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
                // Smart Error Handling
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
            // Only show alert for non-rate-limit errors if truly needed, or keep silent for better UX
            if (error.message !== "Unknown error") {
                alert(`AI Assistant: ${error.message}`)
            }
        } finally {
            setRewriting(null)
        }
    }

    const handleAutoRecommend = async () => {
        if (!title && !description) {
            alert("Please add a title or description first so AI can understand the product.")
            return
        }

        setRewriting('recommend')
        try {
            const res = await fetch('/api/admin/products/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    category,
                    availableProducts: relatedProducts
                })
            })

            const data = await res.json()
            if (data.recommendedIds && Array.isArray(data.recommendedIds)) {
                setSelectedRelated(data.recommendedIds)
            }
        } catch (error) {
            console.error(error)
            alert("Failed to get recommendations")
        } finally {
            setRewriting(null)
        }
    }

    const handleGenerateBenefits = async () => {
        if (!newBenefit.trim()) return

        setRewriting('benefits')
        try {
            const res = await fetch('/api/admin/products/generate-benefits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: newBenefit })
            })

            const data = await res.json()
            if (data.benefits && Array.isArray(data.benefits)) {
                // Add unique new benefits
                const newBenefits = data.benefits.filter((b: string) => !benefits.includes(b))
                setBenefits([...benefits, ...newBenefits])
                setNewBenefit("") // Clear input
            }
        } catch (error) {
            console.error('Generate benefits error:', error)
            alert("Failed to generate benefits")
        } finally {
            setRewriting(null)
        }
    }

    const handlePublish = async () => {
        // Validation
        if (!title.trim()) {
            alert('Please enter a product title')
            return
        }
        if (!category) {
            alert('Please select a category')
            return
        }
        if (!price || parseFloat(price) <= 0) {
            alert('Please enter a valid price')
            return
        }
        if (!sku.trim()) {
            alert('Please enter a SKU')
            return
        }

        setIsPublishing(true)

        try {
            const { data, error } = await supabase
                .from('products')
                .insert({
                    title,
                    price: parseFloat(price),
                    compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : null,
                    reseller_price: resellerPrice ? parseFloat(resellerPrice) : null,
                    stock: stock ? parseInt(stock) : 0,
                    status: status.toLowerCase(),
                    images,
                    benefits,
                    ingredients,
                    how_to_use: howToUse,
                })
                .select()

            if (error) {
                console.error('Error creating product:', error)
                alert('Error creating product: ' + error.message)
                setIsPublishing(false)
                return
            }

            setShowSuccess(true)
            setTimeout(() => {
                router.push('/admin/products')
            }, 1500)
        } catch (error) {
            console.error('Error:', error)
            alert('Error creating product')
            setIsPublishing(false)
        }
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
                    console.error('Upload error:', error)
                    alert(`Error uploading ${file.name}: ${error.message}`)
                    continue
                }

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(filePath)

                uploadedUrls.push(publicUrl)
            }

            setImages([...images, ...uploadedUrls])
        } catch (error) {
            console.error('Upload error:', error)
            alert('Error uploading images')
        } finally {
            setUploading(false)
        }
    }

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index))
    }

    const addBenefit = () => {
        if (newBenefit.trim()) {
            setBenefits([...benefits, newBenefit])
            setNewBenefit("")
        }
    }

    const removeBenefit = (index: number) => {
        setBenefits(benefits.filter((_, i) => i !== index))
    }

    const toggleRelated = (id: string) => {
        if (selectedRelated.includes(id)) {
            setSelectedRelated(selectedRelated.filter(i => i !== id))
        } else {
            setSelectedRelated([...selectedRelated, id])
        }
    }

    const generateSku = () => {
        const base = title.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4) || "PROD"
        const random = Math.floor(1000 + Math.random() * 9000)
        setSku(`${base}-${random}`)
    }

    return (
        <div className="min-h-screen bg-gray-50/50 relative overflow-hidden text-gray-900">
            {/* Subtle Background Gradients - Light Mode */}
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
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Add Product</h1>
                            <p className="text-xs text-gray-500 font-medium">Dedicated to IT excellence</p>
                        </div>
                    </div>



                    <div className="flex items-center gap-3">
                        <Link href="/admin/products">
                            <Button variant="ghost" className="rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-900">
                                Discard
                            </Button>
                        </Link>
                        <Button
                            onClick={handlePublish}
                            disabled={isPublishing || showSuccess}
                            className="rounded-full px-6 shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white border-none transition-all"
                        >
                            {isPublishing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publishing...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" /> Publish Product
                                </>
                            )}
                        </Button>
                    </div>
                </header>

                {/* Publishing Overlay */}
                {(isPublishing || showSuccess) && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm transition-all duration-500">
                        <div className="bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center justify-center text-center border border-gray-100 max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-300">
                            {showSuccess ? (
                                <div className="flex flex-col items-center animate-in zoom-in duration-300">
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                                        <Check className="w-10 h-10" strokeWidth={3} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Published!</h3>
                                    <p className="text-gray-500">Redirecting to products...</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <div className="relative w-20 h-20 mb-6">
                                        <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                                        <Package className="absolute inset-0 m-auto w-8 h-8 text-blue-600 animate-pulse" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Publishing Product</h3>
                                    <p className="text-gray-500">Optimizing images & syncing...</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Main Info */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Basic Details */}
                        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                    Basic Information
                                </h3>
                                <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Essential</Badge>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-gray-700">Product Title</label>
                                    <div className="relative">
                                        <Input
                                            value={title || ""}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="e.g. Dell Latitude 5420 Laptop"
                                            className="bg-white border-gray-200 h-12 text-base focus:ring-blue-500/20 focus:border-blue-500 rounded-xl shadow-sm text-gray-900 placeholder:text-gray-400 pr-12"
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
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="w-full min-h-[180px] rounded-xl bg-white border border-gray-200 p-4 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-gray-700 resize-none placeholder:text-gray-400 transition-all shadow-sm"
                                            placeholder="Description in English"
                                        />
                                        <div className="absolute right-2 top-2 flex flex-col gap-2">
                                            {description.trim() && (
                                                <button
                                                    onClick={() => handleRewrite('description', description, setDescription)}
                                                    disabled={rewriting === 'description'}
                                                    className="text-purple-400 hover:text-purple-600 p-1 rounded-full transition-all bg-white/50 backdrop-blur-sm shadow-sm"
                                                    title="Improve with AI"
                                                >
                                                    {rewriting === 'description' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Media */}
                        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                                    <ImageIcon className="w-4 h-4 text-purple-500" />
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

                        {/* Detailed Attributes */}
                        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                                    <Layers className="w-4 h-4 text-emerald-500" />
                                    Specifics
                                </h3>
                            </div>
                            <div className="p-6 space-y-8">
                                {/* Key Benefits */}
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 block mb-3">Key Benefits</label>
                                    <div className="flex gap-2 mb-4">
                                        <div className="relative flex-1">
                                            <Input
                                                value={newBenefit || ""}
                                                onChange={(e) => setNewBenefit(e.target.value)}
                                                placeholder="Benefit description (English)"
                                                className="bg-white border-gray-200 h-11 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                                                onKeyDown={(e) => e.key === 'Enter' && addBenefit()}
                                            />
                                        </div>
                                        <Button onClick={addBenefit} className="h-11 w-11 bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-sm">
                                            <Plus className="w-5 h-5" />
                                        </Button>
                                        {newBenefit.trim() && (
                                            <Button
                                                onClick={handleGenerateBenefits}
                                                disabled={rewriting === 'benefits'}
                                                className="h-11 px-4 bg-purple-600 hover:bg-purple-700 text-white shadow-sm flex items-center gap-2"
                                            >
                                                {rewriting === 'benefits' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                                Polish
                                            </Button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {benefits.map((benefit, i) => (
                                            <div key={i} className="flex flex-col gap-1 p-3 px-4 rounded-xl bg-gray-50 border border-gray-200 group hover:border-gray-300 transition-colors relative">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                                        <Check className="w-3 h-3 text-emerald-600" />
                                                    </div>
                                                    <span className="text-sm text-gray-700 flex-1">{benefit}</span>
                                                </div>
                                                <button onClick={() => removeBenefit(i)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        {benefits.length === 0 && <div className="col-span-full p-6 rounded-xl border border-dashed border-gray-200 text-center text-sm text-gray-500 bg-gray-50/50">No benefits added yet.</div>}
                                    </div>
                                </div>

                                {/* Ingredients */}
                                {/* Ingredients & How to Use */}
                                <div className="space-y-8">
                                    {/* Specifications section */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Technical Specifications</label>
                                            <div className="flex items-center gap-2">
                                                {ingredients.trim() && (
                                                    <button
                                                        onClick={() => handleRewrite('ingredients', ingredients, setIngredients)}
                                                        disabled={rewriting === 'ingredients'}
                                                        className="text-xs flex items-center gap-1 text-purple-500 hover:text-purple-700 transition-colors bg-purple-50 px-2 py-1 rounded-md"
                                                    >
                                                        {rewriting === 'ingredients' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                        <span>Polish</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <textarea
                                            value={ingredients || ""}
                                            onChange={(e) => setIngredients(e.target.value)}
                                            className="w-full min-h-[120px] rounded-xl bg-white border border-gray-200 p-4 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-gray-700 resize-none shadow-sm"
                                            placeholder="Processor, RAM, Storage, etc."
                                        />
                                    </div>

                                    {/* Warranty section */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Warranty & Support</label>
                                            <div className="flex items-center gap-2">
                                                {howToUse.trim() && (
                                                    <button
                                                        onClick={() => handleRewrite('how_to_use', howToUse, setHowToUse)}
                                                        disabled={rewriting === 'how_to_use'}
                                                        className="text-xs flex items-center gap-1 text-purple-500 hover:text-purple-700 transition-colors bg-purple-50 px-2 py-1 rounded-md"
                                                    >
                                                        {rewriting === 'how_to_use' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                        <span>Polish</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <textarea
                                            value={howToUse || ""}
                                            onChange={(e) => setHowToUse(e.target.value)}
                                            className="w-full min-h-[120px] rounded-xl bg-white border border-gray-200 p-4 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-gray-700 resize-none shadow-sm"
                                            placeholder="Warranty details and support info"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                    </div>

                    {/* Right Column: Organization */}
                    <div className="space-y-8">

                        {/* Organization */}
                        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 space-y-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-gray-700">Status</label>
                                    <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl border border-gray-200">
                                        {['Draft', 'Active'].map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setStatus(s)}
                                                className={`py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${status === s ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 shadow-none'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-gray-700">Category</label>
                                    <div className="relative">
                                        <select
                                            value={category || ""}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 appearance-none shadow-sm">
                                            <option value="" disabled>Select Category</option>
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.slug || cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-gray-700">Product Type</label>
                                    <div className="relative">
                                        <Tags className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input placeholder="e.g. Serum" className="bg-white border-gray-200 h-12 pl-11 text-base rounded-xl shadow-sm focus:ring-blue-500/20 focus:border-blue-500" />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Pricing */}
                        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                                    <DollarSign className="w-4 h-4 text-green-500" />
                                    Pricing
                                </h3>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-gray-700">Price (MAD)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">MAD</span>
                                        <Input
                                            type="number"
                                            value={price || ""}
                                            onChange={(e) => setPrice(e.target.value)}
                                            placeholder="0.00"
                                            className="bg-white border-gray-200 h-12 pl-14 text-lg font-mono rounded-xl shadow-sm focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-gray-700">Reseller Price (MAD)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">MAD</span>
                                        <Input
                                            type="number"
                                            value={resellerPrice || ""}
                                            onChange={(e) => setResellerPrice(e.target.value)}
                                            placeholder="0.00"
                                            className="bg-white border-blue-200 h-12 pl-14 text-lg font-mono rounded-xl shadow-sm focus:ring-blue-500/20 focus:border-blue-500 text-blue-900"
                                        />
                                    </div>
                                    <p className="text-xs text-blue-600/80">Only visible to approved reseller accounts</p>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-gray-700">Compare at Price (Optional)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">MAD</span>
                                        <Input
                                            type="number"
                                            value={compareAtPrice || ""}
                                            onChange={(e) => setCompareAtPrice(e.target.value)}
                                            placeholder="0.00"
                                            className="bg-white border-gray-200 h-12 pl-14 text-lg font-mono rounded-xl shadow-sm focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Inventory */}
                        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                                    <Package className="w-4 h-4 text-blue-500" />
                                    Inventory
                                </h3>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-gray-700">Stock</label>
                                    <Input
                                        type="number"
                                        value={stock || ""}
                                        onChange={(e) => setStock(e.target.value)}
                                        placeholder="0" className="bg-white border-gray-200 h-12 text-lg font-mono rounded-xl shadow-sm focus:ring-blue-500/20 focus:border-blue-500 text-gray-900" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-gray-700">SKU</label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={sku || ""}
                                            onChange={(e) => setSku(e.target.value)}
                                            placeholder="Auto-generated"
                                            className="bg-white border-gray-200 h-12 text-base font-mono rounded-xl uppercase tracking-wider shadow-sm focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                                        />
                                        <Button onClick={generateSku} type="button" className="h-12 w-12 shrink-0 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-indigo-600">
                                            <Wand2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Cross-Sell */}
                        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                                    <RefreshCw className="w-4 h-4 text-pink-500" />
                                    Cross-Sells
                                </h3>
                                <button
                                    onClick={handleAutoRecommend}
                                    disabled={rewriting === 'recommend'}
                                    className="text-xs flex items-center gap-1 text-pink-600 hover:text-pink-700 font-medium px-2 py-1 rounded-lg hover:bg-pink-50 transition-colors"
                                >
                                    {rewriting === 'recommend' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                    Auto-Select
                                </button>
                            </div>
                            <div className="p-6">
                                <p className="text-xs text-gray-500 mb-4">Recommended products based on description.</p>
                                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                                    {relatedProducts.map(prod => {
                                        const isSelected = selectedRelated.includes(prod.id)
                                        const imgUrl = prod.images?.[0] || null
                                        return (
                                            <div
                                                key={prod.id}
                                                onClick={() => toggleRelated(prod.id)}
                                                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${isSelected ? "bg-blue-50 border-blue-200" : "bg-gray-50 hover:bg-gray-100 border-transparent"}`}
                                            >
                                                <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white flex-shrink-0 border border-gray-100 shadow-sm">
                                                    {imgUrl ? (
                                                        <Image src={imgUrl} alt={prod.title} fill className="object-cover" />
                                                    ) : (
                                                        <div className="absolute inset-0 bg-gray-100" />
                                                    )}
                                                </div>
                                                <span className={`text-sm flex-1 font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>{prod.title}</span>
                                                {isSelected && <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </section>

                    </div>
                </div>
            </main>
        </div>
    )
}
