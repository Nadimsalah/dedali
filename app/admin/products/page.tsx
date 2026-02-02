"use client"

import { useState, useEffect } from "react"
import { getProducts, type Product } from "@/lib/supabase-api"
import { supabase } from "@/lib/supabase"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Search,
    Filter,
    Plus,
    MoreVertical,
    Edit,
    Trash2,
    Package,
    AlertCircle,
    Tag,
    X,
    Bell
} from "lucide-react"
import { Notifications } from "@/components/admin/notifications"
import Link from "next/link"
import Image from "next/image"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

// Mock Products Data
const allProducts = [
    {
        id: "PROD-001",
        name: "Pure Argan Oil",
        category: "Face Care",
        price: "MAD 450.00",
        stock: 124,
        status: "In Stock",
        sales: 1205,
        image: "/placeholder.svg?height=80&width=80"
    },
    {
        id: "PROD-002",
        name: "Body Butter Set",
        category: "Body Care",
        price: "MAD 420.00",
        stock: 45,
        status: "In Stock",
        sales: 850,
        image: "/placeholder.svg?height=80&width=80"
    },
    {
        id: "PROD-003",
        name: "Hair Repair Mask",
        category: "Hair Care",
        price: "MAD 280.00",
        stock: 8,
        status: "Low Stock",
        sales: 432,
        image: "/placeholder.svg?height=80&width=80"
    },
    {
        id: "PROD-004",
        name: "Gift Box Premium",
        category: "Gift Sets",
        price: "MAD 1,200.00",
        stock: 0,
        status: "Out of Stock",
        sales: 156,
        image: "/placeholder.svg?height=80&width=80"
    },
    {
        id: "PROD-005",
        name: "Face Serum",
        category: "Face Care",
        price: "MAD 580.00",
        stock: 67,
        status: "In Stock",
        sales: 980,
        image: "/placeholder.svg?height=80&width=80"
    },
    {
        id: "PROD-006",
        name: "Argan Soap Trio",
        category: "Body Care",
        price: "MAD 150.00",
        stock: 200,
        status: "In Stock",
        sales: 2100,
        image: "/placeholder.svg?height=80&width=80"
    },
]

export default function AdminProductsPage() {
    const [activeTab, setActiveTab] = useState("All")
    const [searchQuery, setSearchQuery] = useState("")
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [categories, setCategories] = useState<{ id: string, name: string, slug: string, name_ar?: string }[]>([])
    const [newCategoryName, setNewCategoryName] = useState("")
    const [newCategoryNameAr, setNewCategoryNameAr] = useState("")
    const [isTranslating, setIsTranslating] = useState(false)
    const [showCategoryDialog, setShowCategoryDialog] = useState(false)

    // Fetch products from Supabase
    useEffect(() => {
        loadProducts()
        loadCategories()
    }, [])

    async function loadCategories() {
        const { data } = await supabase
            .from('categories')
            .select('*')
            .order('name')

        if (data) {
            setCategories(data)
        }
    }

    // Auto-translate when English name changes (debounced or on blur)
    async function handleAutoTranslate() {
        if (!newCategoryName.trim() || newCategoryNameAr.trim()) return

        setIsTranslating(true)
        try {
            const response = await fetch('/api/admin/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: newCategoryName, targetLang: 'ar' })
            })
            const data = await response.json()
            if (data.translatedText) {
                setNewCategoryNameAr(data.translatedText)
            }
        } catch (error) {
            console.error("Translation failed", error)
        } finally {
            setIsTranslating(false)
        }
    }

    async function handleAddCategory() {
        if (!newCategoryName.trim()) return

        const slug = newCategoryName.toLowerCase().replace(/\s+/g, '-')

        const { error } = await supabase
            .from('categories')
            .insert({
                name: newCategoryName,
                slug,
                name_ar: newCategoryNameAr || newCategoryName // Fallback to English if no Arabic provided
            })

        if (error) {
            alert('Error adding category: ' + error.message)
        } else {
            setNewCategoryName("")
            setNewCategoryNameAr("")
            loadCategories()
        }
    }

    async function handleDeleteCategory(id: string) {
        if (!confirm('Delete this category? Products using it will need to be recategorized.')) return

        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id)

        if (error) {
            alert('Error deleting category: ' + error.message)
        } else {
            loadCategories()
        }
    }

    async function loadProducts() {
        setLoading(true)
        const data = await getProducts({ limit: 100 }) // Get all products
        setProducts(data)
        setLoading(false)
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this product?')) return

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)

        if (error) {
            alert('Error deleting product: ' + error.message)
        } else {
            // Reload products
            loadProducts()
        }
    }

    const tabs = ["All", ...categories.map(c => c.slug)]

    const getCategoryName = (slug: string) => {
        if (slug === "All") return "All"
        const category = categories.find(c => c.slug === slug)
        return category?.name || slug
    }

    const filteredProducts = products.filter(product => {
        const matchesTab = activeTab === "All" || product.category === activeTab
        const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesTab && matchesSearch
    })

    const getStockStatus = (stock: number) => {
        if (stock === 0) return "Out of Stock"
        if (stock < 10) return "Low Stock"
        return "In Stock"
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "In Stock": return "bg-green-500/10 text-green-500 border-green-500/20"
            case "Low Stock": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
            case "Out of Stock": return "bg-red-500/10 text-red-500 border-red-500/20"
            default: return "bg-secondary text-secondary-foreground"
        }
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Background gradients */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px]" />
            </div>

            <AdminSidebar />

            <main className="lg:pl-72 p-4 sm:p-6 lg:p-8 min-h-screen relative z-10 transition-all duration-300">
                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sticky top-4 z-40 glass-strong p-4 rounded-3xl border border-white/5 shadow-lg shadow-black/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Products</h1>
                            <p className="text-xs text-muted-foreground">Manage your inventory</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="rounded-full h-9">
                                    <Tag className="w-4 h-4 sm:mr-2" />
                                    <span className="hidden sm:inline">Manage Categories</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Manage Categories</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    {/* Add Category */}
                                    <div className="flex flex-col gap-3">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Category Name (English)"
                                                value={newCategoryName}
                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                onBlur={handleAutoTranslate}
                                                className="flex-1"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Input
                                                    placeholder="اسم القسم (Arabic)"
                                                    value={newCategoryNameAr}
                                                    onChange={(e) => setNewCategoryNameAr(e.target.value)}
                                                    className="flex-1 text-right"
                                                    dir="rtl"
                                                />
                                                {isTranslating && (
                                                    <div className="absolute left-2 top-1/2 -translate-y-1/2">
                                                        <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin block" />
                                                    </div>
                                                )}
                                            </div>
                                            <Button onClick={handleAddCategory}>
                                                <Plus className="w-4 h-4 mr-1" /> Add
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Categories List */}
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto mt-4">
                                        {categories.map((category) => (
                                            <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-sm">{category.name}</p>
                                                    {category.name_ar && <p className="text-xs text-muted-foreground font-arabic">{category.name_ar}</p>}
                                                    <p className="text-[10px] text-muted-foreground/70">{category.slug}</p>
                                                </div>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => handleDeleteCategory(category.id)}
                                                    className="h-8 w-8 text-red-500 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Link href="/admin/products/new">
                            <Button className="rounded-full h-9 shadow-lg shadow-primary/20">
                                <Plus className="w-4 h-4 sm:mr-2" />
                                <span className="hidden sm:inline">Add Product</span>
                            </Button>
                        </Link>
                        <Notifications />
                    </div>
                </header>

                {/* Inventory Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="glass-strong rounded-2xl p-4 flex flex-col">
                        <span className="text-sm text-muted-foreground font-medium">Total Products</span>
                        <span className="text-2xl font-bold text-foreground mt-1">{products.length}</span>
                    </div>
                    <div className="glass-strong rounded-2xl p-4 flex flex-col">
                        <span className="text-sm text-muted-foreground font-medium">Total Inventory</span>
                        <span className="text-2xl font-bold text-foreground mt-1">
                            {products.reduce((acc, curr) => acc + curr.stock, 0).toLocaleString()}
                        </span>
                    </div>
                    <div className="glass-strong rounded-2xl p-4 flex flex-col">
                        <span className="text-sm text-muted-foreground font-medium">Low Stock</span>
                        <span className="text-2xl font-bold text-orange-500 mt-1">
                            {products.filter(p => p.stock < 10 && p.stock > 0).length}
                        </span>
                    </div>
                    <div className="glass-strong rounded-2xl p-4 flex flex-col">
                        <span className="text-sm text-muted-foreground font-medium">Out of Stock</span>
                        <span className="text-2xl font-bold text-red-500 mt-1">
                            {products.filter(p => p.stock === 0).length}
                        </span>
                    </div>
                </div>

                {/* Filters & Controls */}
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-background/40 backdrop-blur-md p-1 rounded-2xl border border-white/5">
                        {/* Tabs */}
                        <div className="flex p-1 bg-white/5 rounded-xl overflow-x-auto max-w-full no-scrollbar w-full sm:w-auto">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab
                                        ? "bg-primary text-primary-foreground shadow-md"
                                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                        }`}
                                >
                                    {getCategoryName(tab)}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 rounded-xl bg-white/5 border-white/10 focus:bg-white/10 h-10"
                            />
                        </div>
                    </div>

                    {/* Products Grid/List */}
                    <div className="glass-strong rounded-3xl overflow-hidden min-h-[500px] flex flex-col">
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10 bg-white/5 text-left">
                                        <th className="py-4 pl-4 sm:pl-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
                                        <th className="py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Category</th>
                                        <th className="py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price</th>
                                        <th className="py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Stock</th>
                                        <th className="py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                        <th className="py-4 pr-6 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredProducts.length > 0 ? (
                                        filteredProducts.map((product) => (
                                            <tr key={product.id} className="group hover:bg-white/5 transition-colors">
                                                <td className="py-4 pl-4 sm:pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-12 w-12 bg-white rounded-lg overflow-hidden flex-shrink-0 relative">
                                                            {product.images && product.images.length > 0 ? (
                                                                <Image
                                                                    src={product.images[0]}
                                                                    alt={product.title}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            ) : (
                                                                <div className="absolute inset-0 bg-secondary/20 flex items-center justify-center">
                                                                    <Package className="w-5 h-5 text-muted-foreground" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-foreground text-sm">{product.title}</p>
                                                            <p className="text-xs text-muted-foreground md:hidden">
                                                                Qty: {product.stock}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-foreground/80 hidden sm:table-cell">{product.category}</td>
                                                <td className="py-4 px-4 text-sm font-bold text-foreground">MAD {product.price}</td>
                                                <td className="py-4 px-4 text-sm text-muted-foreground hidden md:table-cell font-medium">
                                                    {product.stock} units
                                                </td>
                                                <td className="py-4 px-4">
                                                    <Badge className={getStatusColor(getStockStatus(product.stock))}>
                                                        {getStockStatus(product.stock)}
                                                    </Badge>
                                                </td>
                                                <td className="py-4 pr-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link href={`/admin/products/edit/${product.id}`}>
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-foreground/60 hover:text-blue-500 hover:bg-blue-500/10">
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-foreground/60 hover:text-red-500 hover:bg-red-500/10"
                                                            onClick={() => handleDelete(product.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-muted-foreground">
                                                No products found matching your criteria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main >
        </div >
    )
}
