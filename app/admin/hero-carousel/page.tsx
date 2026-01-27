"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Upload, Save, RotateCcw, Loader2, Image as ImageIcon, GripVertical, Link as LinkIcon, Type } from "lucide-react"
import { toast } from "sonner"
import {
    getHeroCarouselItems,
    updateHeroCarouselItem,
    uploadHeroCarouselImage,
    addHeroCarouselItem,
    deleteHeroCarouselItem,
    type HeroCarouselItem
} from "@/lib/supabase-api"
import { supabase } from "@/lib/supabase"
import { Plus, Trash2, CheckCircle2, XCircle } from "lucide-react"

export default function HeroCarouselPage() {
    const [items, setItems] = useState<HeroCarouselItem[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [products, setProducts] = useState<{ id: string, title: string }[]>([])

    useEffect(() => {
        loadCarouselItems()
        loadProducts()
    }, [])

    async function loadProducts() {
        const { data } = await supabase.from('products').select('id, title').eq('status', 'active')
        if (data) {
            setProducts(data)
        }
    }

    async function loadCarouselItems() {
        setLoading(true)
        const data = await getHeroCarouselItems(true) // Pass true to get all items (active and inactive)
        setItems(data)
        setLoading(false)
    }

    async function handleImageUpload(itemId: string, position: number, file: File) {
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB')
            return
        }

        const uploadToast = toast.loading('Uploading image...')

        const result = await uploadHeroCarouselImage(file, position)

        if (result.success && result.url) {
            const updateResult = await updateHeroCarouselItem(itemId, { image_url: result.url })

            if (updateResult.success) {
                toast.success('Image uploaded successfully', { id: uploadToast })
                loadCarouselItems()
            } else {
                toast.error('Failed to update image', { id: uploadToast })
            }
        } else {
            toast.error(result.error || 'Failed to upload image', { id: uploadToast })
        }
    }

    async function handleAddSlide() {
        const nextPosition = items.length > 0 ? Math.max(...items.map(i => i.position)) + 1 : 1
        const addToast = toast.loading('Adding new slide...')

        const newItem = {
            title: 'New Slide',
            subtitle: 'Add a description',
            image_url: '', // Empty initially, user will upload
            position: nextPosition,
            is_active: false // Inactive by default until image is uploaded
        }

        const result = await addHeroCarouselItem(newItem)

        if (result.success && result.data) {
            toast.success('Slide added! Now upload an image.', { id: addToast })
            setItems(prev => [...prev, result.data!])
            setEditingId(result.data.id)
        } else {
            toast.error(result.error || 'Failed to add slide', { id: addToast })
        }
    }

    async function handleDeleteSlide(id: string) {
        if (!confirm('Are you sure you want to delete this slide?')) return

        const deleteToast = toast.loading('Deleting slide...')
        const result = await deleteHeroCarouselItem(id)

        if (result.success) {
            toast.success('Slide deleted', { id: deleteToast })
            setItems(prev => prev.filter(item => item.id !== id))
        } else {
            toast.error(result.error || 'Failed to delete slide', { id: deleteToast })
        }
    }

    async function handleToggleActive(item: HeroCarouselItem) {
        const newStatus = !item.is_active
        if (newStatus && !item.image_url) {
            toast.error('Cannot activate a slide without an image')
            return
        }

        const updateToast = toast.loading(newStatus ? 'Activating...' : 'Deactivating...')
        const result = await updateHeroCarouselItem(item.id, { is_active: newStatus })

        if (result.success) {
            toast.success(newStatus ? 'Slide activated' : 'Slide deactivated', { id: updateToast })
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: newStatus } : i))
        } else {
            toast.error(result.error || 'Failed to update status', { id: updateToast })
        }
    }

    async function handleSaveItem(item: HeroCarouselItem) {
        setSaving(true)
        const result = await updateHeroCarouselItem(item.id, {
            title: item.title,
            subtitle: item.subtitle,
            link: item.link
        })

        if (result.success) {
            toast.success('Saved successfully')
            setEditingId(null)
        } else {
            toast.error(result.error || 'Failed to save')
        }
        setSaving(false)
    }

    function handleInputChange(id: string, field: 'title' | 'subtitle' | 'link', value: string) {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ))
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Hero Carousel
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
                        Customize your homepage slider. High-quality images (16:9 or 4:3) work best.
                        Link slides to products to drive sales.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleAddSlide}
                        className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all flex items-center justify-center gap-2 text-sm font-semibold shadow-lg shadow-primary/20"
                    >
                        <Plus className="w-4 h-4" />
                        Add Slide
                    </button>
                    <button
                        onClick={loadCarouselItems}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2 text-sm font-medium whitespace-nowrap"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* List View */}
            <div className="space-y-4">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="group relative bg-white/5 border border-white/5 rounded-3xl p-4 sm:p-6 transition-all duration-300 hover:bg-white/[0.07] hover:border-white/10"
                    >
                        <div className="flex flex-col md:flex-row gap-6 items-start">

                            {/* Left: Image & Position */}
                            <div className="relative shrink-0 w-full md:w-64 aspect-[4/3] rounded-2xl overflow-hidden bg-muted/20 border border-white/5">
                                {/* Position Badge */}
                                <div className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                    {item.position}
                                </div>

                                {item.image_url ? (
                                    <Image
                                        src={item.image_url}
                                        alt={item.title}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                                    </div>
                                )}

                                {/* Image Upload Overlay */}
                                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex flex-col items-center justify-center gap-2">
                                    <Upload className="w-6 h-6 text-white" />
                                    <span className="text-xs font-medium text-white px-3 py-1 rounded-full bg-white/10 border border-white/20">
                                        Change Image
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) handleImageUpload(item.id, item.position, file)
                                        }}
                                    />
                                </label>
                            </div>

                            {/* Middle: Content Inputs */}
                            <div className="flex-1 space-y-4 w-full">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Title */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground ml-1">
                                            <Type className="w-3.5 h-3.5" />
                                            Title
                                        </div>
                                        <input
                                            type="text"
                                            value={item.title}
                                            onChange={(e) => handleInputChange(item.id, 'title', e.target.value)}
                                            onFocus={() => setEditingId(item.id)}
                                            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 focus:border-primary/50 focus:bg-white/[0.06] focus:outline-none transition-all text-sm font-medium placeholder:text-muted-foreground/30"
                                            placeholder="Slide Title"
                                        />
                                    </div>

                                    {/* Subtitle */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground ml-1">
                                            <Type className="w-3.5 h-3.5" />
                                            Subtitle
                                        </div>
                                        <input
                                            type="text"
                                            value={item.subtitle || ''}
                                            onChange={(e) => handleInputChange(item.id, 'subtitle', e.target.value)}
                                            onFocus={() => setEditingId(item.id)}
                                            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 focus:border-primary/50 focus:bg-white/[0.06] focus:outline-none transition-all text-sm placeholder:text-muted-foreground/30"
                                            placeholder="Small text above title"
                                        />
                                    </div>
                                </div>

                                {/* Link Selection */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground ml-1">
                                        <LinkIcon className="w-3.5 h-3.5" />
                                        Linked Product
                                    </div>
                                    <div className="relative">
                                        <select
                                            value={item.link || ''}
                                            onChange={(e) => handleInputChange(item.id, 'link', e.target.value)}
                                            onFocus={() => setEditingId(item.id)}
                                            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 focus:border-primary/50 focus:bg-white/[0.06] focus:outline-none transition-all text-sm appearance-none cursor-pointer hover:bg-white/[0.08]"
                                        >
                                            <option value="" className="bg-background text-foreground">No Link (Just Image)</option>
                                            <optgroup label="Select Product" className="bg-background text-foreground">
                                                {products.map(p => (
                                                    <option key={p.id} value={`/product/${p.id}`} className="bg-background">
                                                        {p.title}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                            <GripVertical className="w-4 h-4 rotate-90" />
                                        </div>
                                    </div>
                                    {item.link && (
                                        <div className="text-[10px] text-green-500/80 px-2 flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            Linked to: {products.find(p => `/product/${p.id}` === item.link)?.title || item.link}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex md:flex-col items-center justify-end gap-2 w-full md:w-auto mt-2 md:mt-0">
                                <button
                                    onClick={() => handleToggleActive(item)}
                                    className={`h-10 px-4 md:w-32 rounded-xl border transition-all flex items-center justify-center gap-2 text-sm font-medium ${item.is_active
                                        ? 'bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20'
                                        : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
                                        }`}
                                >
                                    {item.is_active ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                    {item.is_active ? 'Active' : 'Inactive'}
                                </button>

                                {editingId === item.id ? (
                                    <button
                                        onClick={() => handleSaveItem(item)}
                                        disabled={saving}
                                        className="h-10 px-6 md:w-32 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Save
                                    </button>
                                ) : (
                                    <div className="h-10 flex items-center text-sm text-muted-foreground px-4 md:w-32 justify-center italic bg-white/[0.02] rounded-xl border border-white/5">
                                        Saved
                                    </div>
                                )}

                                <button
                                    onClick={() => handleDeleteSlide(item.id)}
                                    className="h-10 px-4 md:w-32 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Helper Footer */}
            <div className="flex flex-wrap gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    Max 5MB images
                </span>
                <span className="w-px h-4 bg-white/10" />
                <span>Recommended: 1920x1080px or 1200x1200px</span>
                <div className="ml-auto">
                    {items.length} Slides configured
                </div>
            </div>
        </div>
    )
}
