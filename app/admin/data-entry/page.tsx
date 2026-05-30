"use client"

import { useState, useRef, useEffect } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Database,
    UploadCloud,
    FileText,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Trash2,
    Sparkles,
    Search,
    Download,
    Check,
    RefreshCw,
    Info,
    Clipboard,
    ChevronLeft,
    ChevronRight
} from "lucide-react"
import { toast } from "sonner"
import Papa from "papaparse"
import { supabase } from "@/lib/supabase"

interface CSVProduct {
    id: string
    artcode: string
    artdesignation: string
    artcollection: string
    price_ht: string
    stock: string
    status: "pending" | "generating" | "generated" | "imported" | "error"
    error?: string
    // AI Generated details
    title?: string
    description?: string
    benefits?: string[]
    technicalSpecs?: string[]
    category?: string
    productType?: string
    images?: string[]
    isFallback?: boolean
    reseller_price?: string
    partner_price?: string
    wholesaler_price?: string
    price?: string
    compare_at_price?: string
    reseller_min_qty?: string
    partner_min_qty?: string
    wholesaler_min_qty?: string
    brand_id?: string
}

export default function DataEntryPage() {
    const { t } = useLanguage()
    const fileInputRef = useRef<HTMLInputElement>(null)

    // State
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [csvProducts, setCsvProducts] = useState<CSVProduct[]>([])
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    
    const [isGenerating, setIsGenerating] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [activeDetailId, setActiveDetailId] = useState<string | null>(null)
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)
    const [categories, setCategories] = useState<any[]>([])
    const [brands, setBrands] = useState<{ id: string; name: string; logo: string | null }[]>([])
    const [viewMode, setViewMode] = useState<"wizard" | "table">("wizard")

    // Load categories & brands on mount
    useEffect(() => {
        const fetchResources = async () => {
            try {
                const { data: catData } = await supabase
                    .from("categories")
                    .select("id, name, slug")
                    .order("name")
                if (catData) setCategories(catData)

                const { data: brandData } = await supabase
                    .from("brands")
                    .select("id, name, logo")
                    .order("name")
                if (brandData) setBrands(brandData)
            } catch (err) {
                console.error("Failed to load initial resources:", err)
            }
        }
        fetchResources()
    }, [])

    // Process and parse CSV file
    const processCSVFile = (file: File) => {
        if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
            toast.error("Veuillez sélectionner un fichier au format CSV.")
            return
        }

        setSelectedFile(file)

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                // Flexible header mapper helper
                const findVal = (row: any, keywords: string[]) => {
                    const matchKey = Object.keys(row).find(k => 
                        keywords.some(kw => k.toLowerCase().trim() === kw.toLowerCase())
                    )
                    return matchKey ? row[matchKey]?.trim() : ""
                }

                const products: CSVProduct[] = results.data.map((row: any, idx) => {
                    const artcode = findVal(row, ["artcode", "sku", "reference", "code"])
                    const artdesignation = findVal(row, ["artdesignation", "name", "title", "designation", "nom"])
                    const artcollection = findVal(row, ["artcollection", "brand", "marque", "collection"])
                    const priceHt = findVal(row, ["prix ht p", "reseller price ht", "price ht", "prix ht", "prix"])
                    const stock = findVal(row, ["stock", "qty", "quantite"])

                    return {
                        id: `csv-${idx}-${Date.now()}`,
                        artcode: artcode || `SKU-G-${idx}`,
                        artdesignation: artdesignation || "Produit sans nom",
                        artcollection: artcollection || "Generique",
                        price_ht: priceHt || "",
                        stock: stock || "",
                        status: "pending"
                    }
                })

                if (products.length === 0) {
                    toast.error("Le fichier CSV semble vide ou corrompu.")
                    setSelectedFile(null)
                    return
                }

                setCsvProducts(products)
                // Select all products by default
                setSelectedIds(new Set(products.map(p => p.id)))
                if (products.length > 0) {
                    setActiveDetailId(products[0].id)
                }
                toast.success(`${products.length} produits importés depuis le CSV. Prêt pour la génération IA !`)
            },
            error: (error) => {
                console.error("CSV Parse error:", error)
                toast.error(`Erreur d'analyse du CSV : ${error.message}`)
            }
        })
    }

    // Handlers
    const handleClearFile = () => {
        setSelectedFile(null)
        setCsvProducts([])
        setSelectedIds(new Set())
        setActiveDetailId(null)
        setImageDimensions(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const toggleSelectAll = () => {
        if (selectedIds.size === csvProducts.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(csvProducts.map(p => p.id)))
        }
    }

    const toggleSelectProduct = (id: string) => {
        const next = new Set(selectedIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedIds(next)
    }

    // Call AI Generation API
    const handleGenerateAI = async () => {
        const pendingIds = csvProducts
            .filter(p => selectedIds.has(p.id) && (p.status === "pending" || p.status === "error"))
            .map(p => p.id)

        if (pendingIds.length === 0) {
            toast.error("Veuillez sélectionner au moins un produit en attente.")
            return
        }

        setIsGenerating(true)
        
        // Mark selected as generating in UI
        setCsvProducts(prev => prev.map(p => pendingIds.includes(p.id) ? { ...p, status: "generating" } : p))

        const batchToGenerate = csvProducts.filter(p => pendingIds.includes(p.id)).map(p => ({
            artcode: p.artcode,
            artdesignation: p.artdesignation,
            artcollection: p.artcollection,
            price_ht: p.price_ht,
            stock: p.stock
        }))

        try {
            const res = await fetch("/api/admin/products/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ products: batchToGenerate })
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || "Generation endpoint failed")
            }

            const data = await res.json()
            const generatedList: any[] = data.products || []

            setCsvProducts(prev => prev.map(p => {
                const match = generatedList.find(g => g.sku === p.artcode)
                if (match) {
                    return {
                        ...p,
                        status: match.success ? "generated" : "error",
                        title: match.title,
                        description: match.description,
                        benefits: match.benefits,
                        technicalSpecs: match.technicalSpecs,
                        category: match.category,
                        productType: match.productType,
                        images: match.images,
                        isFallback: match.isFallback,
                        error: match.error
                    }
                }
                return p
            }))

            const successCount = generatedList.filter(g => g.success).length
            const fallbackCount = generatedList.filter(g => g.isFallback).length
            
            if (fallbackCount > 0) {
                toast.warning(`Votre clé OpenAI a dépassé son quota (crédits épuisés). Didali a utilisé le générateur local de secours pour ${fallbackCount} fiches produits.`, { duration: 10000 })
            } else {
                toast.success(`${successCount} fiches produits générées avec succès par l'IA !`)
            }
        } catch (err: any) {
            console.error("AI Generation failure:", err)
            toast.error(`Échec de la génération : ${err.message || err}`)
            // Reset state back to pending on fail
            setCsvProducts(prev => prev.map(p => p.status === "generating" ? { ...p, status: "error", error: err.message } : p))
        } finally {
            setIsGenerating(false)
        }
    }

    // Call Saving API
    const handleImportSelected = async () => {
        const generatedProducts = csvProducts.filter(p => 
            selectedIds.has(p.id) && p.status === "generated"
        )

        if (generatedProducts.length === 0) {
            toast.error("Veuillez d'abord générer des fiches produits avec l'IA.")
            return
        }

        setIsSaving(true)
        try {
            const res = await fetch("/api/admin/products/save-batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ products: generatedProducts })
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || "Save endpoint failed")
            }

            const data = await res.json()
            
            // Update UI status to imported
            const importedIds = generatedProducts.map(p => p.id)
            setCsvProducts(prev => prev.map(p => importedIds.includes(p.id) ? { ...p, status: "imported" } : p))
            
            toast.success(`${data.count} produits importés comme brouillons (Draft) dans le webstore !`)
        } catch (err: any) {
            console.error("Import failure:", err)
            toast.error(`Échec de l'importation : ${err.message || err}`)
        } finally {
            setIsSaving(false)
        }
    }

    const handleImagePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
        if (!activeDetailId) {
            toast.error("Veuillez sélectionner un produit dans la liste pour y associer l'image.")
            return
        }

        const items = e.clipboardData.items
        let imageFile: File | null = null
        let imageUrlText = ""

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                imageFile = items[i].getAsFile()
                break
            } else if (items[i].type === "text/plain") {
                imageUrlText = e.clipboardData.getData("text/plain")
            }
        }

        if (imageFile) {
            const toastId = toast.loading("Téléchargement de l'image collée...")
            try {
                const fileExt = imageFile.type.split("/")[1] || "png"
                const fileName = `products/paste-${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`
                
                const { data, error } = await supabase.storage
                    .from("product-images")
                    .upload(fileName, imageFile, { upsert: true })

                if (error) throw error

                const { data: { publicUrl } } = supabase.storage
                    .from("product-images")
                    .getPublicUrl(fileName)

                setCsvProducts(prev => prev.map(p => 
                    p.id === activeDetailId ? { ...p, images: [publicUrl] } : p
                ))
                toast.success("Image collée et enregistrée avec succès !", { id: toastId })
            } catch (err: any) {
                console.error("Paste upload failed:", err)
                toast.error(`Erreur d'import : ${err.message}`, { id: toastId })
            }
        } else if (imageUrlText && (imageUrlText.startsWith("http") || imageUrlText.startsWith("data:"))) {
            const toastId = toast.loading("Importation de l'image depuis l'adresse...")
            try {
                const res = await fetch("/api/admin/products/upload-url", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url: imageUrlText })
                })
                
                if (!res.ok) {
                    const errData = await res.json()
                    throw new Error(errData.error || "Failed to download URL")
                }
                
                const data = await res.json()
                setCsvProducts(prev => prev.map(p => 
                    p.id === activeDetailId ? { ...p, images: [data.url] } : p
                ))
                toast.success("Image importée avec succès !", { id: toastId })
            } catch (err: any) {
                console.error("URL paste failed:", err)
                toast.error(`Erreur : ${err.message}`, { id: toastId })
            }
        } else {
            toast.error("Aucune image ou URL d'image valide détectée dans le presse-papiers.")
        }
    }

    const [isPublishingSingle, setIsPublishingSingle] = useState<string | null>(null)

    const handlePublishProduct = async (product: CSVProduct) => {
        setIsPublishingSingle(product.id)
        const toastId = toast.loading(`Publication du produit "${product.title || product.artdesignation}"...`)
        try {
            // Re-calculate the prices to guarantee they are fallback-safe if not loaded
            const cost = product.price_ht !== undefined && product.price_ht !== null && product.price_ht !== "" ? Number(product.price_ht) : 0
            
            const payload = {
                ...product,
                price_ht: cost.toString(),
                reseller_price: product.reseller_price !== undefined && product.reseller_price !== null ? product.reseller_price : cost.toString(),
                partner_price: product.partner_price !== undefined && product.partner_price !== null ? product.partner_price : (cost * 0.95).toFixed(2),
                wholesaler_price: product.wholesaler_price !== undefined && product.wholesaler_price !== null ? product.wholesaler_price : (cost * 0.90).toFixed(2),
                price: product.price !== undefined && product.price !== null ? product.price : (cost * 1.20).toFixed(2),
                stock: product.stock || "0",
                statusOverride: "active" // Save as active directly!
            }

            const res = await fetch("/api/admin/products/save-batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ products: [payload] })
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || "Save endpoint failed")
            }

            // Update UI status to imported and advance to the next generated product
            setCsvProducts(prev => {
                const nextProducts = prev.map(p => 
                    p.id === product.id ? { ...p, status: "imported" } : p
                )
                
                // Find the next product after current that is generated (ready)
                const currentIndex = nextProducts.findIndex(p => p.id === product.id)
                let nextProduct = nextProducts.slice(currentIndex + 1).find(p => p.status === "generated")
                
                // If none found after, wrap around and check from the beginning
                if (!nextProduct) {
                    nextProduct = nextProducts.find(p => p.status === "generated")
                }
                
                if (nextProduct) {
                    setActiveDetailId(nextProduct.id)
                    setImageDimensions(null)
                } else {
                    setActiveDetailId(null)
                }
                
                return nextProducts
            })

            toast.success(`Le produit "${product.title || product.artdesignation}" a été publié en ligne !`, { id: toastId })
        } catch (err: any) {
            console.error("Publish product failure:", err)
            toast.error(`Échec de publication : ${err.message || err}`, { id: toastId })
        } finally {
            setIsPublishingSingle(null)
        }
    }

    const activeProduct = csvProducts.find(p => p.id === activeDetailId)

    const updateActiveProduct = (fields: Partial<CSVProduct>) => {
        setCsvProducts(prev => prev.map(p => 
            p.id === activeDetailId ? { ...p, ...fields } : p
        ))
    }

    const activeProductIndex = csvProducts.findIndex(p => p.id === activeDetailId)
    const isFirstProduct = activeProductIndex === 0
    const isLastProduct = activeProductIndex === csvProducts.length - 1

    const handlePrevProduct = () => {
        if (activeProductIndex > 0) {
            setActiveDetailId(csvProducts[activeProductIndex - 1].id)
            setImageDimensions(null)
        }
    }

    const handleNextProduct = () => {
        if (activeProductIndex < csvProducts.length - 1) {
            setActiveDetailId(csvProducts[activeProductIndex + 1].id)
            setImageDimensions(null)
        }
    }

    // 1. Progress Step Ribbon for Wizard mode
    const renderProgressRibbon = () => {
        return (
            <div className="glass-strong rounded-[2rem] p-5 border border-white/40 shadow-xl mb-6 bg-white/50 backdrop-blur-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100/80 mb-4">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Progression de la session</span>
                        <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                            {activeProductIndex + 1} / {csvProducts.length}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handlePrevProduct}
                            disabled={isFirstProduct}
                            className="h-8 text-[10px] font-bold rounded-xl px-3 border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-all flex items-center gap-1"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" /> Précédent
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleNextProduct}
                            disabled={isLastProduct}
                            className="h-8 text-[10px] font-bold rounded-xl px-3 border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-all flex items-center gap-1"
                        >
                            Suivant <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4 overflow-hidden">
                    <div 
                        className="bg-primary h-full transition-all duration-300 rounded-full" 
                        style={{ width: `${csvProducts.length > 0 ? ((activeProductIndex + 1) / csvProducts.length) * 100 : 0}%` }}
                    />
                </div>

                {/* Steps dots horizontal scroller */}
                <div className="flex items-center gap-2 overflow-x-auto py-2 pr-4 scrollbar-hide">
                    {csvProducts.map((p, idx) => {
                        const isSelected = p.id === activeDetailId
                        let statusColor = "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 border-slate-200"
                        
                        if (p.status === "generating") {
                            statusColor = "bg-blue-100 text-blue-600 border-blue-200 animate-pulse"
                        } else if (p.status === "generated") {
                            statusColor = "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-200"
                        } else if (p.status === "imported") {
                            statusColor = "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200"
                        } else if (p.status === "error") {
                            statusColor = "bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
                        }

                        return (
                            <button
                                key={p.id}
                                onClick={() => {
                                    setActiveDetailId(p.id)
                                    setImageDimensions(null)
                                }}
                                className={`flex-shrink-0 w-8 h-8 rounded-full border text-[10px] font-black flex items-center justify-center transition-all ${statusColor} ${
                                    isSelected ? "ring-2 ring-primary ring-offset-2 scale-110 shadow-sm" : ""
                                }`}
                                title={`${p.artcode} - ${p.artdesignation}`}
                            >
                                {idx + 1}
                            </button>
                        )
                    })}
                </div>
            </div>
        )
    }

    // 2. Main Premium Product Editor Card (Wide or Narrow Sidebar layout)
    const renderEditorCard = (isSidebar: boolean) => {
        if (!activeProduct) {
            return (
                <div className="glass-strong rounded-[2.5rem] p-8 border border-white/40 shadow-2xl relative py-20 flex flex-col items-center justify-center text-center text-slate-400">
                    <Sparkles className="w-12 h-12 mb-3 text-indigo-500 opacity-30 animate-pulse" />
                    <h4 className="text-sm font-black text-slate-700">Aucun produit actif</h4>
                    <p className="text-[10px] text-slate-400 max-w-xs mt-1 leading-relaxed font-semibold">
                        Glissez un fichier CSV et sélectionnez ou générez des produits pour commencer.
                    </p>
                </div>
            )
        }

        const containerClasses = isSidebar 
            ? "glass-strong rounded-[2.5rem] p-6 border border-white/40 shadow-2xl relative space-y-5 animate-in fade-in duration-300 max-h-[85vh] overflow-y-auto"
            : "glass-strong rounded-[2.5rem] p-8 border border-white/40 shadow-2xl relative space-y-6 animate-in fade-in duration-300 bg-white/80 backdrop-blur-md"

        const layoutGridClasses = isSidebar
            ? "space-y-4"
            : "grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"

        return (
            <div className={containerClasses}>
                {/* Header Sticky Control Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur z-20">
                    <div>
                        <h3 className="text-xs sm:text-sm font-black text-slate-800 tracking-tight leading-tight uppercase flex items-center gap-1.5 flex-wrap">
                            {isSidebar ? "Modifier la Fiche" : "Fiche Produit Active"}
                            {activeProduct.status === "pending" && (
                                <Badge className="bg-slate-100 text-slate-600 border border-slate-200 text-[8px] sm:text-[9px] uppercase font-bold tracking-wide">
                                    Attente
                                </Badge>
                            )}
                            {activeProduct.status === "generating" && (
                                <Badge className="bg-blue-100 text-blue-700 border border-blue-200 text-[8px] sm:text-[9px] uppercase font-bold tracking-wide animate-pulse">
                                    IA...
                                </Badge>
                            )}
                            {activeProduct.status === "generated" && (
                                <Badge className="bg-indigo-100 text-indigo-700 border border-indigo-200 text-[8px] sm:text-[9px] uppercase font-bold tracking-wide">
                                    Prêt IA ✨
                                </Badge>
                            )}
                            {activeProduct.status === "imported" && (
                                <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[8px] sm:text-[9px] uppercase font-bold tracking-wide">
                                    En ligne 🚀
                                </Badge>
                            )}
                            {activeProduct.status === "error" && (
                                <Badge className="bg-red-100 text-red-700 border border-red-200 text-[8px] sm:text-[9px] uppercase font-bold tracking-wide">
                                    Erreur ⚠️
                                </Badge>
                            )}
                        </h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                            SKU : {activeProduct.artcode} • Original : {activeProduct.artdesignation}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Single Action Button */}
                        {activeProduct.status === "imported" ? (
                            <Badge className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-bold py-1.5 px-3 gap-1 rounded-xl shadow-inner">
                                <Check className="w-3.5 h-3.5" /> En ligne 🚀
                            </Badge>
                        ) : (
                            <Button
                                onClick={() => handlePublishProduct(activeProduct)}
                                disabled={isPublishingSingle === activeProduct.id || (activeProduct.status !== "generated" && activeProduct.status !== "pending")}
                                className="h-9 px-4 rounded-xl font-bold text-[10px] gap-1 shadow bg-blue-600 hover:bg-blue-700 text-white border-none transition-all"
                            >
                                {isPublishingSingle === activeProduct.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Check className="w-3.5 h-3.5" />
                                )}
                                Publier 🚀
                            </Button>
                        )}
                    </div>
                </div>

                {/* Content body */}
                <div className={layoutGridClasses}>
                    
                    {/* Column 1 / Left Hand Side (Visuals & Info) */}
                    <div className="space-y-5">
                        {/* Image Preview & Google Search Helper */}
                        {activeProduct.images && activeProduct.images.length > 0 && activeProduct.images[0] !== "/placeholder.png" ? (
                            <div className="relative group p-1.5 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="rounded-2xl overflow-hidden max-h-[250px] flex items-center justify-center bg-slate-50/50 relative">
                                    <img 
                                        src={activeProduct.images[0]} 
                                        alt={activeProduct.title} 
                                        onLoad={(e) => {
                                            const img = e.currentTarget
                                            setImageDimensions({
                                                width: img.naturalWidth,
                                                height: img.naturalHeight
                                            })
                                        }}
                                        className="max-h-[250px] w-auto h-auto object-contain transition-transform duration-500 hover:scale-105" 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                                    <Badge className="absolute bottom-2 right-2 bg-white/90 backdrop-blur text-emerald-700 font-bold border border-emerald-200 text-[8px] uppercase tracking-wider gap-1 shadow-sm">
                                        Réel {imageDimensions ? `(${imageDimensions.width}×${imageDimensions.height}px)` : ""} 📸
                                    </Badge>
                                </div>
                            </div>
                        ) : (
                            <div className="border border-dashed border-slate-200 bg-slate-50/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                                <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Aucune Illustration Produit</span>
                                <p className="text-[9px] text-slate-400 max-w-xs mt-1 font-semibold leading-relaxed">
                                    Recherchez ci-dessous et collez l'image copiée depuis Google.
                                </p>
                            </div>
                        )}

                        {activeProduct.isFallback && (
                            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100/50 flex items-start gap-2.5 text-[10px] text-amber-700 leading-normal font-semibold animate-in fade-in duration-300">
                                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    Clé OpenAI épuisée. Fiche générée localement. Utilisez Google Images ci-dessous pour l'illustration.
                                </div>
                            </div>
                        )}

                        {/* General Section */}
                        <div className="space-y-3.5 p-4 bg-slate-50/30 rounded-2xl border border-slate-100">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-1 flex items-center gap-1">
                                <Info className="w-3 h-3 text-slate-400" /> Informations Générales
                            </h4>
                            
                            {/* Title input */}
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                                    Titre Produit
                                </label>
                                <Input
                                    value={activeProduct.title || activeProduct.artdesignation || ""}
                                    onChange={(e) => updateActiveProduct({ title: e.target.value })}
                                    placeholder="Titre du produit"
                                    className="bg-white border-slate-200 h-10 text-xs font-semibold rounded-xl text-slate-800 shadow-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Category input */}
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                                        Catégorie
                                    </label>
                                    <select
                                        value={activeProduct.category || ""}
                                        onChange={(e) => updateActiveProduct({ category: e.target.value })}
                                        className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none shadow-sm"
                                    >
                                        <option value="" disabled>Choisir la catégorie</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.slug || cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Product type input */}
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                                        Type de Produit
                                    </label>
                                    <Input
                                        value={activeProduct.productType || ""}
                                        onChange={(e) => updateActiveProduct({ productType: e.target.value })}
                                        placeholder="ex: Laptop"
                                        className="bg-white border-slate-200 h-10 text-xs font-semibold rounded-xl text-slate-800 shadow-sm"
                                    />
                                </div>
                            </div>

                            {/* Brand Selector */}
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                                    Marque (Brand)
                                </label>
                                <select
                                    value={activeProduct.brand_id || ""}
                                    onChange={(e) => updateActiveProduct({ brand_id: e.target.value })}
                                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none shadow-sm"
                                >
                                    <option value="">Sélectionner une marque</option>
                                    {brands.map((b) => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Google Image Helper & paste box */}
                        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200/50 space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-white rounded-xl text-primary border border-slate-100 shadow-sm">
                                    <Search className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-slate-800">
                                        Illustration produit
                                    </h4>
                                    <p className="text-[10px] text-slate-400 leading-normal font-semibold mt-0.5">
                                        Cliquez sur le bouton ci-dessous, copiez l'image réelle de votre choix puis collez-la dans la zone de texte.
                                    </p>
                                </div>
                            </div>

                            <a 
                                href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${activeProduct.artcollection} ${activeProduct.title || activeProduct.artdesignation}`)}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-full inline-flex h-10 items-center justify-center rounded-xl font-black text-xs bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all gap-2 shadow-sm"
                            >
                                Rechercher sur Google Images 🔍
                            </a>

                            <div 
                                onPaste={handleImagePaste}
                                className="w-full p-4 border border-dashed border-slate-200 hover:border-primary/50 bg-white/50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-white text-center focus:ring-2 focus:ring-primary/20 outline-none group"
                                tabIndex={0}
                            >
                                <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 mb-2 group-hover:scale-105 transition-transform duration-300 flex items-center justify-center">
                                    <Clipboard className="w-4 h-4 text-primary" />
                                </div>
                                <Badge className="bg-slate-100 text-slate-600 border border-slate-200 text-[8px] uppercase tracking-wider font-bold mb-1">
                                    Zone de Coller (Ctrl+V)
                                </Badge>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                    Cliquez ici et collez l'image ou son adresse
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Column 2 / Right Hand Side (Pricing, SEO & Description Specs) */}
                    <div className="space-y-5">
                        {/* Pricing & Stock Section */}
                        <div className="space-y-3.5 p-4 bg-slate-50/30 rounded-2xl border border-slate-100">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-1">
                                Tarification & Stock
                            </h4>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Cost Price HT */}
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                                        Prix d'achat HT (MAD)
                                    </label>
                                    <Input
                                        type="number"
                                        value={activeProduct.price_ht !== undefined && activeProduct.price_ht !== null ? activeProduct.price_ht : ""}
                                        onChange={(e) => {
                                            const val = e.target.value
                                            const cost = Number(val) || 0
                                            updateActiveProduct({
                                                price_ht: val,
                                                reseller_price: val,
                                                partner_price: cost !== 0 ? (cost * 0.95).toFixed(2) : "0.00",
                                                wholesaler_price: cost !== 0 ? (cost * 0.90).toFixed(2) : "0.00",
                                                price: cost !== 0 ? (cost * 1.20).toFixed(2) : "0.00"
                                            })
                                        }}
                                        placeholder="0.00"
                                        className="bg-white border-blue-200 focus:border-blue-500 focus:ring-blue-500/10 h-10 text-xs font-mono font-bold text-blue-900 rounded-xl shadow-sm"
                                    />
                                </div>

                                {/* Stock Input */}
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                                        Stock Quantité
                                    </label>
                                    <Input
                                        type="number"
                                        value={activeProduct.stock !== undefined && activeProduct.stock !== null ? activeProduct.stock : ""}
                                        onChange={(e) => updateActiveProduct({ stock: e.target.value })}
                                        placeholder="0"
                                        className="bg-white border-slate-200 h-10 text-xs font-mono font-semibold rounded-xl text-slate-800 shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 pt-1">
                                {/* Partner HT */}
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">
                                        Partenaire HT
                                    </label>
                                    <Input
                                        type="number"
                                        value={activeProduct.partner_price || ""}
                                        onChange={(e) => updateActiveProduct({ partner_price: e.target.value })}
                                        placeholder="0.00"
                                        className="bg-white border-purple-100 focus:border-purple-300 h-9 text-[11px] font-mono text-purple-900 rounded-xl"
                                    />
                                </div>

                                {/* Wholesaler HT */}
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">
                                        Grossiste HT
                                    </label>
                                    <Input
                                        type="number"
                                        value={activeProduct.wholesaler_price || ""}
                                        onChange={(e) => updateActiveProduct({ wholesaler_price: e.target.value })}
                                        placeholder="0.00"
                                        className="bg-white border-emerald-100 focus:border-emerald-300 h-9 text-[11px] font-mono text-emerald-900 rounded-xl"
                                    />
                                </div>

                                {/* Retail price TTC */}
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">
                                        Invité TTC (20%)
                                    </label>
                                    <Input
                                        type="number"
                                        value={activeProduct.price || ""}
                                        onChange={(e) => updateActiveProduct({ price: e.target.value })}
                                        placeholder="0.00"
                                        className="bg-white border-slate-200 h-9 text-[11px] font-mono text-slate-800 rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SEO Description */}
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                                Description SEO
                            </label>
                            <textarea
                                value={activeProduct.description || ""}
                                onChange={(e) => updateActiveProduct({ description: e.target.value })}
                                className="w-full min-h-[90px] rounded-xl bg-white border border-slate-200 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 resize-none font-medium shadow-sm leading-relaxed"
                                placeholder="Description SEO en français"
                            />
                        </div>

                        {/* Key Benefits */}
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                                Avantages Clés (Un par ligne)
                            </label>
                            <textarea
                                value={activeProduct.benefits ? activeProduct.benefits.join("\n") : ""}
                                onChange={(e) => updateActiveProduct({ benefits: e.target.value.split("\n") })}
                                className="w-full min-h-[80px] rounded-xl bg-white border border-slate-200 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 resize-none font-mono"
                                placeholder="Avantage 1&#10;Avantage 2&#10;Avantage 3"
                            />
                        </div>

                        {/* Technical Specifications */}
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                                Spécifications Techniques (Une par ligne)
                            </label>
                            <textarea
                                value={activeProduct.technicalSpecs ? activeProduct.technicalSpecs.join("\n") : ""}
                                onChange={(e) => updateActiveProduct({ technicalSpecs: e.target.value.split("\n") })}
                                className="w-full min-h-[90px] rounded-xl bg-white border border-slate-200 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 resize-none font-mono"
                                placeholder="Processeur: Intel i7&#10;RAM: 16 Go&#10;Stockage: 512 Go SSD"
                            />
                        </div>
                    </div>

                </div>
            </div>
        )
    }

    // 3. Table Card for Side-by-side mode (Mode Tableau)
    const renderTableCard = () => {
        return (
            <div className="glass-strong rounded-[2.5rem] p-6 sm:p-8 border border-white/40 shadow-xl space-y-6 bg-white/80 backdrop-blur-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                        <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                            Produits du catalogue CSV
                            <Badge className="bg-slate-100 text-slate-600 border border-slate-200">
                                {csvProducts.length} articles
                            </Badge>
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                            {selectedIds.size} / {csvProducts.length} sélectionnés pour génération/import
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                <th className="pb-3 text-center pl-2 w-[40px]">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.size === csvProducts.length}
                                        onChange={toggleSelectAll}
                                        className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                                    />
                                </th>
                                <th className="pb-3">SKU (artcode)</th>
                                <th className="pb-3">Nom (artdesignation)</th>
                                <th className="pb-3">Marque</th>
                                <th className="pb-3 text-right">Prix HT (P)</th>
                                <th className="pb-3 text-center">Stock</th>
                                <th className="pb-3 text-center pr-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {csvProducts.map((p) => {
                                const isChecked = selectedIds.has(p.id)
                                const isSelectedRow = p.id === activeDetailId
                                return (
                                    <tr 
                                        key={p.id}
                                        onClick={() => {
                                            setActiveDetailId(p.id)
                                            setImageDimensions(null)
                                        }}
                                        className={`border-b border-slate-100/50 hover:bg-slate-50/50 text-xs text-slate-700 transition-colors cursor-pointer ${
                                            isSelectedRow ? "bg-primary/5 border-primary/20" : ""
                                        }`}
                                    >
                                        <td className="py-4 text-center pl-2" onClick={e => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => toggleSelectProduct(p.id)}
                                                className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                                            />
                                        </td>
                                        <td className="py-4 font-bold">{p.artcode}</td>
                                        <td className="py-4 font-medium truncate max-w-[200px]" title={p.artdesignation}>
                                            {p.artdesignation}
                                        </td>
                                        <td className="py-4 font-semibold text-slate-500">{p.artcollection}</td>
                                        <td className="py-4 text-right font-black">
                                            {p.price_ht ? `${p.price_ht} MAD` : <span className="text-slate-300 font-bold">N/A</span>}
                                        </td>
                                        <td className="py-4 text-center font-bold">
                                            {p.stock ? p.stock : <span className="text-slate-300">N/A</span>}
                                        </td>
                                        <td className="py-4 text-center pr-2">
                                            {p.status === "pending" && (
                                                <Badge className="bg-slate-100 text-slate-400 border border-slate-200 text-[9px] uppercase font-bold tracking-wide">
                                                    Attente
                                                </Badge>
                                            )}
                                            {p.status === "generating" && (
                                                <Badge className="bg-blue-50 text-blue-600 border border-blue-100 text-[9px] uppercase font-bold tracking-wide animate-pulse">
                                                    IA...
                                                </Badge>
                                            )}
                                            {p.status === "generated" && (
                                                <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[9px] uppercase font-bold tracking-wide">
                                                    Prêt IA ✨
                                                </Badge>
                                            )}
                                            {p.status === "imported" && (
                                                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] uppercase font-bold tracking-wide">
                                                    En ligne 🚀
                                                </Badge>
                                            )}
                                            {p.status === "error" && (
                                                <Badge className="bg-red-50 text-red-600 border border-red-100 text-[9px] uppercase font-bold tracking-wide" title={p.error}>
                                                    Erreur ⚠️
                                                </Badge>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#FDFDFD] relative overflow-hidden font-sans pb-16">
            {/* Ambient Lighting Blur */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[140px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[140px]" />
            </div>

            <AdminSidebar />

            <main className="lg:pl-72 min-h-screen flex flex-col relative z-10 transition-all duration-300">
                
                {/* Header */}
                <div className="p-4 sm:p-6 lg:p-8 pb-0">
                    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-strong p-6 rounded-[2.5rem] border border-white/40 shadow-xl shadow-black/5 bg-white/60 backdrop-blur-md">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-primary/10 rounded-2xl shadow-inner">
                                <Database className="w-7 h-7 text-primary animate-pulse" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">Saisie de données assistée</h1>
                                <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mt-1">Saisie Automatique & Importation Assistée par l'IA</p>
                            </div>
                        </div>
                    </header>
                </div>

                {/* Unified Toolbar for CSV Actions */}
                {selectedFile && (
                    <div className="p-4 sm:p-6 lg:p-8 pb-0">
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 glass-strong p-4 rounded-2xl border border-white/40 shadow-lg bg-white/70 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs font-black text-slate-800">{selectedFile.name}</div>
                                    <div className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">
                                        {csvProducts.length} articles • {selectedIds.size} sélectionnés
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3">
                                {/* Mode Switcher */}
                                <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200">
                                    <button
                                        onClick={() => setViewMode("wizard")}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5 ${
                                            viewMode === "wizard" 
                                            ? "bg-white text-primary shadow-sm" 
                                            : "text-slate-500 hover:text-slate-800"
                                        }`}
                                    >
                                        <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-500" />
                                        Mode Assistant 🪄
                                    </button>
                                    <button
                                        onClick={() => setViewMode("table")}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5 ${
                                            viewMode === "table" 
                                            ? "bg-white text-primary shadow-sm" 
                                            : "text-slate-500 hover:text-slate-800"
                                        }`}
                                    >
                                        <Database className="w-3.5 h-3.5" />
                                        Mode Tableau 📊
                                    </button>
                                </div>

                                <div className="h-6 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

                                {/* Global Batch Actions */}
                                <Button
                                    onClick={handleGenerateAI}
                                    disabled={isGenerating || selectedIds.size === 0}
                                    className="h-9 px-4 rounded-xl font-bold text-[10px] gap-1.5 shadow bg-primary text-white"
                                >
                                    {isGenerating ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-3.5 h-3.5" />
                                    )}
                                    {isGenerating ? "Génération..." : "Générer avec l'IA"}
                                </Button>

                                <Button
                                    onClick={handleImportSelected}
                                    disabled={isSaving || csvProducts.filter(p => p.status === "generated" && selectedIds.has(p.id)).length === 0}
                                    className="h-9 px-4 rounded-xl font-bold text-[10px] gap-1.5 shadow bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    {isSaving ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Download className="w-3.5 h-3.5" />
                                    )}
                                    {isSaving ? "Sauvegarde..." : "Importer sélectionnés"}
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleClearFile}
                                    className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl border border-red-100 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col justify-start">
                    
                    {!selectedFile ? (
                        /* UPLOADER INITIAL STATE */
                        <div className="max-w-xl mx-auto w-full glass-strong rounded-[2.5rem] p-8 sm:p-12 border border-white/40 shadow-2xl relative overflow-hidden flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300 bg-white/70 backdrop-blur-md">
                            
                            <div
                                onDragOver={e => { e.preventDefault() }}
                                onDrop={e => {
                                    e.preventDefault()
                                    const file = e.dataTransfer.files?.[0]
                                    if (file) processCSVFile(file)
                                }}
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-16 px-6 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50/20 hover:border-primary/50 hover:bg-slate-50/50 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer group"
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={e => {
                                        const file = e.target.files?.[0]
                                        if (file) processCSVFile(file)
                                    }}
                                    accept=".csv"
                                    className="hidden"
                                />

                                <div className="p-6 bg-white rounded-3xl shadow-lg border border-slate-100 mb-6 group-hover:-translate-y-1 transition-transform">
                                    <UploadCloud className="w-10 h-10 text-primary animate-pulse" />
                                </div>

                                <h3 className="text-lg font-black text-slate-800 tracking-tight mb-2">
                                    Importer votre catalogue produits CSV
                                </h3>
                                <p className="text-slate-400 text-xs font-semibold max-w-xs leading-relaxed uppercase tracking-wider">
                                    Glissez-déposez votre fichier ici, ou cliquez pour parcourir
                                </p>
                            </div>

                            <div className="mt-8 flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                <Info className="w-4 h-4 text-slate-300" />
                                <span>Colonnes mappées : artcode, artdesignation, artcollection, PRIX HT P, stock</span>
                            </div>
                        </div>
                    ) : (
                        /* CSV PREVIEW & GENERATION SPLIT WORKSPACE */
                        <div className="w-full">
                            
                            {viewMode === "wizard" ? (
                                /* WIZARD MODE: Centered wizard sheet & progress dots */
                                <div className="max-w-5xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    {renderProgressRibbon()}
                                    {renderEditorCard(false)}
                                </div>
                            ) : (
                                /* TABLE MODE: Two columns grid list + details panel */
                                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 w-full items-start animate-in fade-in slide-in-from-bottom-6 duration-500">
                                    <div className="xl:col-span-7 space-y-6">
                                        {renderTableCard()}
                                    </div>
                                    <div className="xl:col-span-5">
                                        {renderEditorCard(true)}
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
