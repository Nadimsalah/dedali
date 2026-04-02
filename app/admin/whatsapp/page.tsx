"use client"

import { useState, useEffect } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
    MessageSquare, 
    Send, 
    Users, 
    FileSpreadsheet, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    Upload, 
    Image as ImageIcon, 
    X,
    FileText,
    Video,
    Plus,
    Briefcase,
    Globe,
    UserCircle,
    Loader2
} from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import { getMarketingRecipients } from "@/app/actions/marketing-recipients"
import { supabase } from "@/lib/supabase"

// Type Definitions
type TargetGroup = 'resellers' | 'digital' | 'commercials' | 'manual' | 'bulk';

interface Recipient {
    id: string;
    name: string;
    phone: string;
    group: string;
}

export default function WhatsAppMarketingPage() {
    const { t, setLanguage } = useLanguage()
    const [activeGroup, setActiveGroup] = useState<TargetGroup>('manual')
    const [recipients, setRecipients] = useState<Recipient[]>([])
    const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set())
    const [message, setMessage] = useState("")
    const [mediaFile, setMediaFile] = useState<File | null>(null)
    const [mediaPreview, setMediaPreview] = useState<string | null>(null)
    const [mediaType, setMediaType] = useState<'image' | 'video' | 'pdf' | null>(null)
    
    // DB Recipients
    const [dbRecipients, setDbRecipients] = useState<{
        resellers: any[],
        customers: any[],
        commercials: any[]
    }>({ resellers: [], customers: [], commercials: [] })
    
    const [loadingDb, setLoadingDb] = useState(false)
    const [manualNumber, setManualNumber] = useState("")
    const [isSending, setIsSending] = useState(false)
    const [sendProgress, setSendProgress] = useState(0)
    const [deliveryLogs, setDeliveryLogs] = useState<{ phone: string, status: 'success' | 'error', time: string }[]>([])

    // Load Recipient Data
    useEffect(() => {
        loadRecipients()
    }, [])

    async function loadRecipients() {
        setLoadingDb(true)
        const res = await getMarketingRecipients()
        if (res.error) {
            toast.error(res.error)
        } else {
            setDbRecipients({
                resellers: res.resellers || [],
                customers: res.customers || [],
                commercials: res.commercials || []
            })
        }
        setLoadingDb(false)
    }

    // Media Handling
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setMediaFile(file)
        const url = URL.createObjectURL(file)
        setMediaPreview(url)

        if (file.type.startsWith('image/')) setMediaType('image')
        else if (file.type.startsWith('video/')) setMediaType('video')
        else if (file.type === 'application/pdf') setMediaType('pdf')
        else setMediaType(null)
    }

    const clearMedia = () => {
        setMediaFile(null)
        setMediaPreview(null)
        setMediaType(null)
    }

    // Excel Parsing
    const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (evt) => {
            const bstr = evt.target?.result
            const wb = XLSX.read(bstr, { type: 'binary' })
            const wsname = wb.SheetNames[0]
            const ws = wb.Sheets[wsname]
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[]

            // Find columns for phone/name (simple heuristic)
            const bulkRecipients: Recipient[] = data.slice(1).map((row, idx) => {
                const phone = row[0]?.toString() || ""
                const name = row[1]?.toString() || `Contact ${idx + 1}`
                return { id: `bulk-${idx}`, name, phone, group: 'bulk' }
            }).filter(r => r.phone.length >= 8)

            setRecipients(prev => [...prev.filter(r => r.group !== 'bulk'), ...bulkRecipients])
            toast.success(`${bulkRecipients.length} contacts importés via Excel.`)
        }
        reader.readAsBinaryString(file)
    }

    // List Logic
    const toggleRecipient = (id: string) => {
        const next = new Set(selectedRecipients)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedRecipients(next)
    }

    const toggleAllRecipients = (list: any[]) => {
        const allSelected = list.every(r => selectedRecipients.has(r.id))
        const next = new Set(selectedRecipients)
        
        list.forEach(r => {
            if (allSelected) next.delete(r.id)
            else next.add(r.id)
        })
        setSelectedRecipients(next)
    }

    const addManualNumber = () => {
        if (!manualNumber || manualNumber.length < 8) {
            toast.error("Format de numéro invalide")
            return
        }
        const id = `manual-${Date.now()}`
        setRecipients(prev => [...prev, { id, name: manualNumber, phone: manualNumber, group: 'manual' }])
        setSelectedRecipients(prev => new Set(prev).add(id))
        setManualNumber("")
    }

    // SUBMIT BLAST
    const handleBlast = async () => {
        if (selectedRecipients.size === 0) {
            toast.error("Veuillez sélectionner au moins un destinataire.")
            return
        }
        if (!message && !mediaFile) {
            toast.error("Veuillez saisir un message ou ajouter un média.")
            return
        }

        setIsSending(true)
        setSendProgress(0)
        setDeliveryLogs([])

        // 1. Prepare Numbers
        const numbersToSend: string[] = []
        recipients.forEach(r => { if (selectedRecipients.has(r.id)) numbersToSend.push(r.phone) })
        dbRecipients.resellers.forEach(r => { if (selectedRecipients.has(r.id)) numbersToSend.push(r.phone) })
        dbRecipients.customers.forEach(r => { if (selectedRecipients.has(r.id)) numbersToSend.push(r.phone) })
        dbRecipients.commercials.forEach(r => { if (selectedRecipients.has(r.id)) numbersToSend.push(r.phone) })

        // 2. Upload Media if present
        let mediaUrl = ""
        if (mediaFile) {
            const fileName = `marketing/${Date.now()}_${mediaFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const { data, error } = await supabase.storage.from('product-images').upload(fileName, mediaFile);
            if (error) {
                console.error("Supabase upload error:", error);
                toast.error("Échec du téléchargement du média. Veuillez réessayer.");
                setIsSending(false);
                return;
            }
            const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
            mediaUrl = publicUrl;
        }

        // 3. LOOP SEND
        let count = 0;
        const uniqueNumbers = [...new Set(numbersToSend)];
        for (const phone of uniqueNumbers) {
            try {
                const res = await fetch('/api/admin/whatsapp/campaign', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: phone,
                        message: message,
                        mediaUrl: mediaUrl,
                        fileName: mediaFile?.name || "attachment"
                    })
                });
                
                const logEntry = { 
                    phone, 
                    status: (res.ok ? 'success' : 'error') as 'success' | 'error', 
                    time: new Date().toLocaleTimeString() 
                };
                setDeliveryLogs(prev => [logEntry, ...prev]);
                if (res.ok) count++;
            } catch (err) {
                setDeliveryLogs(prev => [{ phone, status: 'error', time: new Date().toLocaleTimeString() }, ...prev]);
            }
            count++;
            setSendProgress(Math.floor((count / uniqueNumbers.length) * 100));
            await new Promise(r => setTimeout(r, 500));
        }

        toast.success(`Campagne terminée ! ${count} messages envoyés.`);
        setIsSending(false)
    }

    return (
        <div className="min-h-screen bg-[#FDFDFD] relative overflow-hidden font-sans">
            {/* Background Aesthetic */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[140px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[140px]" />
            </div>

            <AdminSidebar />

            <main className="lg:pl-72 p-4 sm:p-6 lg:p-8 relative z-10 transition-all duration-300">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 glass-strong p-6 rounded-[2.5rem] border border-white/40 shadow-xl shadow-black/5">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-primary/10 rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                            <MessageSquare className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">WhatsApp Marketing</h1>
                            <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mt-1">Gérez vos campagnes de diffusion WhatsApp</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="h-10 px-4 rounded-full bg-white/50 border-white/20 text-slate-500 font-bold gap-2">
                           <Clock className="w-3.5 h-3.5" /> Automatisé via Maytapi
                        </Badge>
                        <Button 
                            onClick={handleBlast} 
                            disabled={isSending}
                            className="rounded-full h-12 px-8 gap-3 font-black text-lg shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all bg-primary"
                        >
                            {isSending ? <Loader2 className="animate-spin" /> : <Send className="w-5 h-5" />}
                            {isSending ? `Envoi... ${sendProgress}%` : "Lancer la Campagne"}
                        </Button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* LEFT COLUMN: Recipient Selection */}
                    <div className="lg:col-span-12 xl:col-span-7 space-y-8">
                        
                        <div className="glass-strong rounded-[2.5rem] p-8 border border-white/40 shadow-2xl relative overflow-hidden">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex flex-col">
                                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Destinataires</h3>
                                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Sélectionnez qui recevra votre message</p>
                                </div>
                                <div className="p-2 bg-slate-100 rounded-full flex gap-1">
                                    {(['manual', 'resellers', 'digital', 'commercials', 'bulk'] as TargetGroup[]).map((tab) => (
                                        <Button
                                            key={tab}
                                            variant={activeGroup === tab ? "default" : "ghost"}
                                            size="sm"
                                            onClick={() => setActiveGroup(tab)}
                                            className={`rounded-full px-4 font-bold text-xs capitalize ${activeGroup === tab ? 'shadow-md' : 'text-slate-500'}`}
                                        >
                                            {tab === 'resellers' ? <Briefcase className="w-3.5 h-3.5 mr-1" /> :
                                             tab === 'digital' ? <Globe className="w-3.5 h-3.5 mr-1" /> :
                                             tab === 'bulk' ? <FileSpreadsheet className="w-3.5 h-3.5 mr-1" /> :
                                             <Plus className="w-3.5 h-3.5 mr-1" />}
                                            {tab === 'digital' ? 'Clients' : tab}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="min-h-[400px]">
                                {/* MANUAL INPUT */}
                                {activeGroup === 'manual' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="flex gap-4 p-4 bg-slate-50/50 rounded-3xl border border-slate-100 items-end">
                                            <div className="flex-1 space-y-2">
                                                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nouveau Numéro</label>
                                                <Input 
                                                    placeholder="Ex: 06XXXXXXXX" 
                                                    value={manualNumber}
                                                    onChange={e => setManualNumber(e.target.value)}
                                                    className="h-12 rounded-2xl border-none bg-white shadow-inner focus:ring-2 ring-primary/20"
                                                />
                                            </div>
                                            <Button onClick={addManualNumber} className="h-12 rounded-2xl px-6 gap-2 font-black transition-all">
                                                <Plus className="w-4 h-4" /> Ajouter
                                            </Button>
                                        </div>
                                        
                                        <div className="bg-white/40 p-1 rounded-[2rem] border border-slate-100 ring-1 ring-slate-100/50">
                                            <div className="flex items-center justify-between p-4 border-b border-slate-100">
                                                <span className="text-xs font-black text-slate-400">NUMÉROS MANUELS ({recipients.filter(r => r.group === 'manual').length})</span>
                                                <Button variant="ghost" size="sm" onClick={() => toggleAllRecipients(recipients.filter(r => r.group === 'manual'))} className="text-primary font-bold">Tout Sélectionner</Button>
                                            </div>
                                            <div className="max-h-[300px] overflow-auto p-4 space-y-2">
                                                {recipients.filter(r => r.group === 'manual').length > 0 ? (
                                                    recipients.filter(r => r.group === 'manual').map(r => (
                                                        <RecipientItem key={r.id} r={r} selected={selectedRecipients.has(r.id)} onToggle={toggleRecipient} />
                                                    ))
                                                ) : (
                                                    <EmptyPlaceholder icon={Plus} text="Aucun numéro manuel" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* DATABASE SELECTORS (RESELLERS, DIGITAL, COMMERCIALS) */}
                                {(['resellers', 'digital', 'commercials'] as TargetGroup[]).includes(activeGroup) && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="bg-white/40 p-1 rounded-[2rem] border border-slate-100 shadow-sm">
                                            <div className="flex items-center justify-between p-5 border-b border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><Users className="w-4 h-4" /></div>
                                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Base de Données {activeGroup}</span>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => toggleAllRecipients(
                                                    activeGroup === 'resellers' ? dbRecipients.resellers :
                                                    activeGroup === 'digital' ? dbRecipients.customers :
                                                    dbRecipients.commercials
                                                )} className="text-primary font-bold bg-primary/5 rounded-full px-4">Tout Sélectionner</Button>
                                            </div>
                                            <div className="max-h-[500px] overflow-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {loadingDb ? (
                                                    <div className="col-span-full py-20 flex flex-col items-center"><Loader2 className="w-10 h-10 animate-spin text-primary/20" /></div>
                                                ) : (
                                                    (activeGroup === 'resellers' ? dbRecipients.resellers :
                                                     activeGroup === 'digital' ? dbRecipients.customers :
                                                     dbRecipients.commercials).filter(item => item.phone).map(item => (
                                                        <RecipientItem key={item.id} r={{
                                                            id: item.id,
                                                            name: item.company_name || item.name,
                                                            phone: item.phone,
                                                            group: activeGroup
                                                        }} selected={selectedRecipients.has(item.id)} onToggle={toggleRecipient} />
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* BULK EXCEL */}
                                {activeGroup === 'bulk' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                         <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 group hover:border-primary/50 transition-all cursor-pointer relative">
                                            <input type="file" accept=".xlsx, .xls" onChange={handleExcelUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            <div className="p-5 bg-white rounded-3xl shadow-lg border border-slate-100 group-hover:scale-110 transition-transform mb-4">
                                                <FileSpreadsheet className="w-8 h-8 text-emerald-500" />
                                            </div>
                                            <p className="font-black text-slate-800">Cliquez pour importer un fichier Excel</p>
                                            <p className="text-slate-400 text-xs mt-2 font-medium">Colonne A: Numéro | Colonne B: Nom (Optionnel)</p>
                                        </div>

                                        <div className="bg-white/40 p-1 rounded-[2rem] border border-slate-100">
                                            <div className="flex items-center justify-between p-4 border-b border-slate-100">
                                                <span className="text-xs font-black text-slate-400">CONTACTS IMPORTÉS ({recipients.filter(r => r.group === 'bulk').length})</span>
                                                <Button variant="ghost" size="sm" onClick={() => toggleAllRecipients(recipients.filter(r => r.group === 'bulk'))} className="text-primary font-bold">Tout Sélectionner</Button>
                                            </div>
                                            <div className="max-h-[300px] overflow-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {recipients.filter(r => r.group === 'bulk').map(r => (
                                                    <RecipientItem key={r.id} r={r} selected={selectedRecipients.has(r.id)} onToggle={toggleRecipient} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Message Builder */}
                    <div className="lg:col-span-12 xl:col-span-5 space-y-8">
                        
                        <div className="glass-strong rounded-[2.5rem] p-8 border border-white/40 shadow-2xl relative">
                            <h3 className="text-lg font-black text-slate-800 tracking-tight mb-6">Contenu du Message</h3>
                            
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-[0.2em]">Votre Message</label>
                                    <Textarea 
                                        placeholder="Bonjour ! C'est Didali Store. Nos nouvelles promotions sont là..."
                                        className="min-h-[200px] rounded-[1.5rem] p-6 border-none bg-slate-50/50 shadow-inner resize-none focus:ring-4 ring-primary/5 text-slate-700 leading-relaxed font-medium"
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                    />
                                </div>

                                {/* Media Attachment Area */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-[0.2em]">Média (Optionnel)</label>
                                    
                                    {!mediaFile ? (
                                        <div className="flex items-center justify-center p-8 bg-slate-50/30 rounded-3xl border border-dashed border-slate-200 group hover:border-primary/50 cursor-pointer relative transition-all overflow-hidden">
                                            <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            <div className="flex flex-col items-center text-center">
                                                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 group-hover:-translate-y-1 transition-transform mb-3">
                                                    <Upload className="w-5 h-5 text-slate-400" />
                                                </div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Image, Video ou PDF</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative group p-1.5 bg-slate-50 rounded-3xl border border-slate-200 ring-4 ring-slate-100 shadow-lg">
                                            {/* Preview Overlay */}
                                            <div className="absolute top-4 right-4 z-20">
                                                <Button size="icon" variant="destructive" onClick={clearMedia} className="h-8 w-8 rounded-full shadow-lg hover:scale-110 active:scale-90 transition-all">
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            
                                            <div className="rounded-2xl overflow-hidden bg-white max-h-[250px] flex items-center justify-center">
                                                {mediaType === 'image' && <img src={mediaPreview!} alt="Preview" className="w-full object-cover" />}
                                                {mediaType === 'video' && <video src={mediaPreview!} controls className="w-full" />}
                                                {mediaType === 'pdf' && (
                                                    <div className="p-10 flex flex-col items-center">
                                                        <FileText className="w-12 h-12 text-emerald-500 mb-2" />
                                                        <span className="text-[10px] font-black text-slate-800 uppercase truncate max-w-full">{mediaFile.name}</span>
                                                    </div>
                                                )}
                                                {!mediaType && (
                                                    <div className="p-10 flex flex-col items-center">
                                                        <ImageIcon className="w-12 h-12 text-slate-300 mb-2" />
                                                        <span className="text-[10px] font-black text-slate-800 uppercase">{mediaFile.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                         {/* Recent Status Logs */}
                         {deliveryLogs.length > 0 && (
                            <div className="glass-strong rounded-[2.5rem] p-6 border border-white/40 shadow-xl max-h-[300px] overflow-auto animate-in slide-in-from-right-4">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Statut des Envois</h3>
                                <div className="space-y-2">
                                    {deliveryLogs.map((log, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-slate-100 text-[10px]">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                                                <span className="font-bold text-slate-700">{log.phone}</span>
                                            </div>
                                            <span className="text-slate-400">{log.time}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Summary View */}
                        <div className="glass-strong rounded-[2.5rem] p-8 border border-white/40 shadow-xl bg-gradient-to-br from-primary/5 to-transparent">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Résumé de l'Envoi</h3>
                            <div className="space-y-4">
                                <SummaryItem icon={Users} label="Total Destinataires" value={selectedRecipients.size.toString()} />
                                <SummaryItem icon={TargetGroupIcon(activeGroup)} label="Segment Actif" value={activeGroup === 'digital' ? 'Clients Digitals' : activeGroup.charAt(0).toUpperCase() + activeGroup.slice(1)} />
                                <SummaryItem icon={ImageIcon} label="Type de Média" value={mediaType ? mediaType.toUpperCase() : "Texte uniquement"} />
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    )
}

// SUB-COMPONENTS
function RecipientItem({ r, selected, onToggle }: { r: any, selected: boolean, onToggle: (id: string) => void }) {
    return (
        <div 
            onClick={() => onToggle(r.id)}
            className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${selected ? 'bg-primary/5 border-primary shadow-sm scale-[1.02]' : 'bg-slate-50/50 border-slate-100 hover:border-slate-200'}`}
        >
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${selected ? 'bg-primary text-white' : 'bg-white text-slate-300'}`}>
                    {selected ? <CheckCircle2 className="w-4 h-4" /> : r.name?.[0]?.toUpperCase() || '#'}
                </div>
                <div>
                   <p className={`font-black text-xs leading-none mb-1 ${selected ? 'text-primary' : 'text-slate-800'}`}>{r.name}</p>
                   <p className="text-[9px] text-slate-400 font-bold">{r.phone}</p>
                </div>
            </div>
        </div>
    )
}

function EmptyPlaceholder({ icon: Icon, text }: { icon: any, text: string }) {
    return (
        <div className="py-20 flex flex-col items-center justify-center text-slate-300">
            <Icon className="w-12 h-12 mb-2 opacity-20" />
            <p className="font-bold text-sm tracking-tight">{text}</p>
        </div>
    )
}

function SummaryItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="flex items-center justify-between bg-white/50 p-4 rounded-2xl border border-white/40 shadow-sm transition-transform hover:scale-[1.01]">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600"><Icon className="w-5 h-5" /></div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
            </div>
            <span className="text-base font-black text-slate-800">{value}</span>
        </div>
    )
}

function TargetGroupIcon(g: string) {
    if (g === 'resellers') return Briefcase;
    if (g === 'digital') return Globe;
    if (g === 'commercials') return UserCircle;
    if (g === 'bulk') return FileSpreadsheet;
    return Plus;
}
