"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/components/language-provider"
import { supabase } from "@/lib/supabase"
import { getProducts, type Product } from "@/lib/supabase-api"
import { cn, formatPrice } from "@/lib/utils"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
    Download,
    FileSpreadsheet,
    Search,
    Loader2,
    RefreshCw,
    Save,
    Printer,
    Undo2,
    Redo2,
    Bold,
    Italic,
    Underline,
    AlignLeft,
    AlignCenter,
    AlignRight,
    HelpCircle,
    ChevronLeft,
    Check,
    Grid
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"

// Definition of spreadsheet columns
const COLUMNS = [
    { key: "id", label: "Product ID", letter: "A", width: "w-80" },
    { key: "sku", label: "SKU / Référence", letter: "B", width: "w-44" },
    { key: "title", label: "Titre (FR/EN)", letter: "C", width: "w-72" },
    { key: "title_ar", label: "Titre (AR)", letter: "D", width: "w-64" },
    { key: "category", label: "Catégorie", letter: "E", width: "w-56" },
    { key: "price", label: "Prix Public (TTC)", letter: "F", width: "w-40" },
    { key: "reseller_price", label: "Prix Revendeur", letter: "G", width: "w-40" },
    { key: "wholesaler_price", label: "Prix Grossiste", letter: "H", width: "w-40" },
    { key: "partner_price", label: "Prix Partenaire", letter: "I", width: "w-40" },
    { key: "compare_at_price", label: "Prix Barré (TTC)", letter: "J", width: "w-40" },
    { key: "stock", label: "Stock", letter: "K", width: "w-28" },
    { key: "status", label: "Statut", letter: "L", width: "w-32" },
    { key: "brand_name", label: "Marque", letter: "M", width: "w-44" },
    { key: "created_at", label: "Date Création", letter: "N", width: "w-52" },
]

export default function DataExcelPage() {
    const { t } = useLanguage()
    const router = useRouter()
    const [products, setProducts] = useState<Product[]>([])
    const [originalProducts, setOriginalProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [isDirty, setIsDirty] = useState(false)

    // Selection state
    const [selectedCell, setSelectedCell] = useState<{ rowIndex: number; colKey: string } | null>(null)
    const [editingCell, setEditingCell] = useState<{ rowIndex: number; colKey: string } | null>(null)
    const [editValue, setEditValue] = useState("")

    // Export Dialog State
    const [showExportDialog, setShowExportDialog] = useState(false)
    const [selectedColumns, setSelectedColumns] = useState<string[]>(COLUMNS.map(c => c.key))

    const editInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        loadProducts()
    }, [])

    useEffect(() => {
        if (editingCell && editInputRef.current) {
            editInputRef.current.focus()
            editInputRef.current.select()
        }
    }, [editingCell])

    async function loadProducts() {
        setLoading(true)
        try {
            let allData: any[] = []
            let page = 0
            const pageSize = 1000
            let hasMore = true

            while (hasMore) {
                // Fetch in chunks of 1000 to bypass Supabase PostgREST default API cap
                const { data, error } = await supabase
                    .from("products")
                    .select("*, brand:brands(name)")
                    .order("created_at", { ascending: false })
                    .range(page * pageSize, (page + 1) * pageSize - 1)

                if (error) throw error

                if (data && data.length > 0) {
                    allData = [...allData, ...data]
                    page++
                    if (data.length < pageSize) {
                        hasMore = false
                    }
                } else {
                    hasMore = false
                }
            }

            const formatted = allData.map(p => ({
                ...p,
                brand_name: p.brand?.name || "Generique"
            }))

            setProducts(formatted)
            setOriginalProducts(JSON.parse(JSON.stringify(formatted)))
            setIsDirty(false)
            setSelectedCell(null)
        } catch (e: any) {
            console.error("Failed to load products for spreadsheet", e)
            toast.error("Erreur de chargement: " + e.message)
        } finally {
            setLoading(false)
        }
    }

    // Filter products based on search query
    const filteredProducts = products.filter(p => {
        const q = searchQuery.toLowerCase()
        return (
            (p.title?.toLowerCase() || "").includes(q) ||
            (p.sku?.toLowerCase() || "").includes(q) ||
            (p.category?.toLowerCase() || "").includes(q) ||
            (p.brand_name?.toLowerCase() || "").includes(q) ||
            (p.id?.toLowerCase() || "").includes(q)
        )
    })

    // Handler when selecting a cell
    const handleCellClick = (rowIndex: number, colKey: string) => {
        if (editingCell && (editingCell.rowIndex !== rowIndex || editingCell.colKey !== colKey)) {
            commitCellEdit()
        }
        setSelectedCell({ rowIndex, colKey })
    }

    // Double click to start inline edit
    const handleCellDoubleClick = (rowIndex: number, colKey: string) => {
        setSelectedCell({ rowIndex, colKey })
        setEditingCell({ rowIndex, colKey })
        const val = getCellValue(rowIndex, colKey)
        setEditValue(String(val))
    }

    const getCellValue = (rowIndex: number, colKey: string) => {
        const prod = filteredProducts[rowIndex]
        if (!prod) return ""
        return (prod as any)[colKey] ?? ""
    }

    // Save cell value
    const updateCellValue = (rowIndex: number, colKey: string, newValue: string) => {
        // Find index in main products array
        const mainIdx = products.findIndex(p => p.id === filteredProducts[rowIndex].id)
        if (mainIdx === -1) return

        setProducts(prev => {
            const copy = [...prev]
            let val: any = newValue

            // Handle type casts for numbers
            if (["price", "reseller_price", "wholesaler_price", "partner_price", "compare_at_price", "stock"].includes(colKey)) {
                val = newValue === "" ? null : Number(newValue)
                if (isNaN(val)) val = 0
            }

            (copy[mainIdx] as any)[colKey] = val
            return copy
        })
        setIsDirty(true)
    }

    const commitCellEdit = () => {
        if (!editingCell) return
        updateCellValue(editingCell.rowIndex, editingCell.colKey, editValue)
        setEditingCell(null)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!selectedCell) return

        if (e.key === "Enter") {
            if (editingCell) {
                commitCellEdit()
            } else {
                setEditingCell(selectedCell)
                setEditValue(String(getCellValue(selectedCell.rowIndex, selectedCell.colKey)))
            }
            e.preventDefault()
        } else if (e.key === "Escape") {
            setEditingCell(null)
        }
    }

    // Save changes to Database (upsert)
    const handleSaveChanges = async () => {
        setSaving(true)
        try {
            // Filter only modified products to push updates
            const modified = products.filter((p, i) => {
                const orig = originalProducts.find(o => o.id === p.id)
                return JSON.stringify(p) !== JSON.stringify(orig)
            })

            if (modified.length === 0) {
                toast.info("Aucune modification à enregistrer.")
                setSaving(false)
                return
            }

            // Extract the core DB columns (exclude joined brand object/temporary fields)
            const payload = modified.map(p => {
                const { brand_name, brand, ...rest } = p as any
                return rest
            })

            const { error } = await supabase
                .from("products")
                .upsert(payload)

            if (error) throw error

            toast.success(`✅ ${modified.length} produit(s) enregistré(s) avec succès !`)
            setOriginalProducts(JSON.parse(JSON.stringify(products)))
            setIsDirty(false)
        } catch (e: any) {
            console.error("Save failed:", e)
            toast.error("Erreur lors de la sauvegarde: " + e.message)
        } finally {
            setSaving(false)
        }
    }

    // Export to CSV
    const triggerCSVDownload = () => {
        if (selectedColumns.length === 0) {
            toast.warning("Veuillez sélectionner au moins une colonne à exporter.")
            return
        }

        const headers = COLUMNS.filter(col => selectedColumns.includes(col.key)).map(col => col.label)
        const rows = filteredProducts.map(prod => {
            return COLUMNS.filter(col => selectedColumns.includes(col.key)).map(col => {
                const val = (prod as any)[col.key] ?? ""
                const cellStr = typeof val === "object" ? JSON.stringify(val) : String(val)
                const escaped = cellStr.replace(/"/g, '""')
                return `"${escaped}"`
            }).join(",")
        })

        const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n") // UTF-8 BOM for French characters in Excel
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `products_export_${new Date().toISOString().slice(0, 10)}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        setShowExportDialog(false)
        toast.success("CSV Téléchargé avec succès !")
    }

    const toggleColumnSelect = (colKey: string) => {
        setSelectedColumns(prev =>
            prev.includes(colKey)
                ? prev.filter(k => k !== colKey)
                : [...prev, colKey]
        )
    }

    const selectAllColumns = () => setSelectedColumns(COLUMNS.map(c => c.key))
    const deselectAllColumns = () => setSelectedColumns([])

    return (
        <div className="flex min-h-screen bg-[#f8f9fa] dark:bg-[#1a1b1c] text-foreground transition-all duration-300">
            <AdminSidebar />

            <main className="flex-1 lg:ml-72 flex flex-col h-screen overflow-hidden relative z-10">
                {/* Google Sheets Header bar */}
                <div className="bg-white dark:bg-[#202124] border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#0f9d58]/10 rounded-lg text-[#0f9d58] flex items-center justify-center">
                            <FileSpreadsheet className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-base font-bold text-gray-800 dark:text-gray-200">Didali Products Database</span>
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">Google Sheets Mode</span>
                            </div>
                            {/* Live spreadsheet metrics */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1.5 select-none">
                                <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md border border-gray-200/50 dark:border-gray-700/50">
                                    Total Produits: <strong className="text-gray-800 dark:text-gray-200 font-bold">{products.length}</strong>
                                </span>
                                <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md border border-gray-200/50 dark:border-gray-700/50">
                                    Stock Total: <strong className="text-gray-800 dark:text-gray-200 font-bold">{products.reduce((acc, curr) => acc + (curr.stock || 0), 0).toLocaleString("fr-MA")}</strong>
                                </span>
                                <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md border border-gray-200/50 dark:border-gray-700/50">
                                    Actifs: <strong className="text-emerald-600 dark:text-emerald-500 font-bold">{products.filter(p => p.status === 'active').length}</strong>
                                </span>
                                <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md border border-gray-200/50 dark:border-gray-700/50">
                                    Brouillons: <strong className="text-amber-600 dark:text-amber-500 font-bold">{products.filter(p => p.status !== 'active').length}</strong>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Button
                            variant="ghost"
                            onClick={loadProducts}
                            className="h-10 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all text-xs font-bold"
                            disabled={loading}
                        >
                            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                            Actualiser
                        </Button>

                        <Button
                            onClick={handleSaveChanges}
                            disabled={!isDirty || saving}
                            className={cn(
                                "h-10 rounded-xl px-5 text-xs font-bold shadow-md transition-all hover:scale-[1.02] active:scale-95",
                                isDirty
                                    ? "bg-[#0f9d58] hover:bg-[#0b8043] text-white shadow-emerald-500/20"
                                    : "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600"
                            )}
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Enregistrer les Modifs
                        </Button>

                        <Button
                            onClick={() => setShowExportDialog(true)}
                            className="h-10 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground px-5 text-xs font-bold shadow-md shadow-primary/20 transition-all hover:scale-[1.02]"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Exporter CSV
                        </Button>
                    </div>
                </div>

                {/* Google Sheets Toolbar */}
                <div className="bg-[#f1f3f4] dark:bg-[#28292c] border-b border-gray-200 dark:border-gray-800 px-4 py-2 flex flex-wrap items-center gap-2 select-none">
                    <div className="flex items-center gap-0.5 border-r border-gray-300 dark:border-gray-700 pr-2">
                        <Button variant="ghost" size="icon" className="w-7 h-7 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"><Undo2 className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" /></Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"><Redo2 className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" /></Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"><Printer className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" /></Button>
                    </div>

                    <div className="flex items-center gap-0.5 border-r border-gray-300 dark:border-gray-700 pr-2">
                        <Button variant="ghost" size="icon" className="w-7 h-7 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"><Bold className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" /></Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"><Italic className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" /></Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"><Underline className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" /></Button>
                    </div>

                    <div className="flex items-center gap-0.5 border-r border-gray-300 dark:border-gray-700 pr-2">
                        <Button variant="ghost" size="icon" className="w-7 h-7 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"><AlignLeft className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" /></Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"><AlignCenter className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" /></Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"><AlignRight className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" /></Button>
                    </div>

                    {/* Quick Search */}
                    <div className="ml-auto w-72 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher dans la feuille..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-8 text-xs bg-white dark:bg-[#202124] border-gray-300 dark:border-gray-700 rounded-lg w-full"
                        />
                    </div>
                </div>

                {/* Formula Bar */}
                <div className="bg-white dark:bg-[#202124] border-b border-gray-200 dark:border-gray-800 px-4 py-1.5 flex items-center gap-2 select-none">
                    <div className="w-14 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded text-center text-xs font-bold text-gray-500 py-1 font-mono uppercase">
                        {selectedCell ? `${COLUMNS.find(c => c.key === selectedCell.colKey)?.letter}${selectedCell.rowIndex + 1}` : ""}
                    </div>
                    <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-1" />
                    <span className="text-sm font-bold font-mono text-gray-400 italic">fx</span>
                    <input
                        type="text"
                        value={selectedCell ? String(getCellValue(selectedCell.rowIndex, selectedCell.colKey)) : ""}
                        onChange={(e) => selectedCell && updateCellValue(selectedCell.rowIndex, selectedCell.colKey, e.target.value)}
                        disabled={!selectedCell}
                        className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-sm font-mono text-foreground px-2 h-7 disabled:opacity-50"
                        placeholder={selectedCell ? "Entrez du texte ou éditez la valeur..." : "Sélectionnez une cellule pour modifier la donnée"}
                    />
                </div>

                {/* Spreadsheet Body */}
                <div className="flex-1 overflow-auto bg-[#f8f9fa] dark:bg-[#1a1b1c] p-2">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <Loader2 className="w-12 h-12 text-[#0f9d58] animate-spin" />
                            <p className="text-sm text-muted-foreground animate-pulse font-bold">Chargement de la base de données produits...</p>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <Grid className="w-16 h-16 text-gray-300 mb-4 animate-bounce" />
                            <p className="text-gray-500 font-bold">Aucune donnée correspondante</p>
                            <p className="text-xs text-muted-foreground mt-1">Essayez d'ajuster votre recherche dans la feuille.</p>
                        </div>
                    ) : (
                        <div className="inline-block align-middle min-w-full border border-gray-200 dark:border-gray-800 rounded shadow bg-white dark:bg-[#202124] overflow-hidden">
                            <table
                                className="w-full border-collapse text-left font-mono text-xs select-none"
                                onKeyDown={handleKeyDown}
                                tabIndex={0}
                            >
                                {/* Column Letters Header */}
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-[#28292c]">
                                        {/* Row index column header corner */}
                                        <th className="sticky top-0 left-0 z-30 w-10 text-center bg-gray-200 dark:bg-[#343538] border border-gray-300 dark:border-gray-700 h-6 text-gray-500 font-bold">
                                            
                                        </th>
                                        {COLUMNS.map((col) => (
                                            <th
                                                key={col.key}
                                                className={cn(
                                                    "sticky top-0 z-20 text-center bg-gray-100 dark:bg-[#28292c] border border-gray-300 dark:border-gray-700 h-6 text-gray-500 font-bold",
                                                    col.width
                                                )}
                                            >
                                                {col.letter}
                                            </th>
                                        ))}
                                    </tr>

                                    {/* Column Labels Header */}
                                    <tr className="bg-gray-50 dark:bg-[#242527]">
                                        {/* Row index label header */}
                                        <th className="sticky top-6 left-0 z-30 w-10 text-center bg-gray-150 dark:bg-[#2f3033] border border-gray-300 dark:border-gray-700 h-8 text-emerald-600 dark:text-emerald-400 font-bold">
                                            Sheet1
                                        </th>
                                        {COLUMNS.map((col) => (
                                            <th
                                                key={col.key}
                                                className={cn(
                                                    "sticky top-6 z-10 px-3 py-1 bg-gray-50 dark:bg-[#202124] border border-gray-300 dark:border-gray-700 h-8 text-gray-700 dark:text-gray-300 font-bold text-center",
                                                    col.width
                                                )}
                                            >
                                                {col.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                {/* Data Rows */}
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                    {filteredProducts.map((prod, rowIndex) => (
                                        <tr key={prod.id} className="hover:bg-emerald-500/[0.02]">
                                            {/* Row Number (sticky left) */}
                                            <td className="sticky left-0 z-10 w-10 bg-gray-100 dark:bg-[#28292c] border border-gray-300 dark:border-gray-700 text-center h-7 text-gray-400 font-bold">
                                                {rowIndex + 1}
                                            </td>

                                            {/* Data Cells */}
                                            {COLUMNS.map((col) => {
                                                const isSelected = selectedCell?.rowIndex === rowIndex && selectedCell?.colKey === col.key
                                                const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.colKey === col.key
                                                const val = getCellValue(rowIndex, col.key)

                                                return (
                                                    <td
                                                        key={col.key}
                                                        onClick={() => handleCellClick(rowIndex, col.key)}
                                                        onDoubleClick={() => handleCellDoubleClick(rowIndex, col.key)}
                                                        className={cn(
                                                            "px-3 py-1.5 border border-gray-200 dark:border-gray-800 h-7 truncate align-middle cursor-cell select-none relative transition-colors duration-150",
                                                            col.width,
                                                            isSelected && "ring-2 ring-emerald-500 ring-inset bg-emerald-500/[0.04] z-10",
                                                            isEditing && "p-0"
                                                        )}
                                                    >
                                                        {isEditing ? (
                                                            <input
                                                                ref={editInputRef}
                                                                type="text"
                                                                value={editValue}
                                                                onChange={(e) => setEditValue(e.target.value)}
                                                                onBlur={commitCellEdit}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter") commitCellEdit()
                                                                    if (e.key === "Escape") setEditingCell(null)
                                                                }}
                                                                className="w-full h-full bg-white dark:bg-[#121212] text-foreground px-3 focus:outline-none border-0 text-xs font-mono"
                                                            />
                                                        ) : (
                                                            <>
                                                                {col.key === "price" || col.key === "reseller_price" || col.key === "wholesaler_price" || col.key === "partner_price" || col.key === "compare_at_price" ? (
                                                                    val != null && val !== "" ? `${Number(val).toLocaleString("fr-MA")} MAD` : "–"
                                                                ) : col.key === "status" ? (
                                                                    <span className={cn(
                                                                        "px-2 py-0.5 rounded text-[10px] font-bold border uppercase",
                                                                        val === "active"
                                                                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                                                            : "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                                                                    )}>
                                                                        {val}
                                                                    </span>
                                                                ) : col.key === "created_at" ? (
                                                                    new Date(String(val)).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" })
                                                                ) : (
                                                                    String(val)
                                                                )}

                                                                {/* Sheets cell bottom-right select corner drag block */}
                                                                {isSelected && !isEditing && (
                                                                    <div className="absolute bottom-[-3px] right-[-3px] w-[6px] h-[6px] bg-emerald-600 border border-white rounded-none cursor-crosshair z-20" />
                                                                )}
                                                            </>
                                                        )}
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Custom Selective Columns CSV Export Dialog */}
            <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
                <DialogContent className="sm:max-w-xl rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <FileSpreadsheet className="w-6 h-6 text-primary" />
                            Options d'exportation de données
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground pt-1">
                            Sélectionnez les colonnes de votre catalogue de produits que vous souhaitez inclure dans le fichier CSV d'exportation.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="flex items-center justify-between border-b pb-3 border-border/50">
                            <span className="text-xs font-bold text-muted-foreground uppercase">Colonnes ({selectedColumns.length}/{COLUMNS.length})</span>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={selectAllColumns} className="h-8 rounded-lg text-xs font-bold">Tout Sélectionner</Button>
                                <Button variant="outline" size="sm" onClick={deselectAllColumns} className="h-8 rounded-lg text-xs font-bold">Tout Décocher</Button>
                            </div>
                        </div>

                        {/* Columns Selection Grid */}
                        <div className="grid grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto px-1 py-1">
                            {COLUMNS.map((col) => {
                                const isChecked = selectedColumns.includes(col.key)
                                return (
                                    <label
                                        key={col.key}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-2xl border text-xs font-semibold cursor-pointer transition-all hover:bg-muted/50",
                                            isChecked
                                                ? "border-primary/30 bg-primary/5 text-primary"
                                                : "border-border/50 bg-background text-muted-foreground"
                                        )}
                                        onClick={() => toggleColumnSelect(col.key)}
                                    >
                                        <div className={cn(
                                            "w-4 h-4 rounded border flex items-center justify-center transition-all",
                                            isChecked
                                                ? "bg-primary border-primary text-primary-foreground"
                                                : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                                        )}>
                                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold">{col.label}</span>
                                            <span className="text-[10px] opacity-60">Colonne {col.letter}</span>
                                        </div>
                                    </label>
                                )
                            })}
                        </div>
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
                        <Button variant="ghost" onClick={() => setShowExportDialog(false)} className="rounded-xl font-bold h-11">
                            Annuler
                        </Button>
                        <Button
                            onClick={triggerCSVDownload}
                            className="bg-primary text-primary-foreground hover:bg-primary/95 rounded-xl font-bold h-11 shadow-lg shadow-primary/20 flex-1"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Télécharger l'export CSV
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
