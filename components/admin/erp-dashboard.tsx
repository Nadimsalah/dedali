"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Package, RefreshCw, AlertTriangle, CheckCircle2,
  XCircle, Clock, Loader2, Server, Wifi, WifiOff
} from "lucide-react"
import { Button } from "@/components/ui/button"

const API_BASE = "/api/erp"


// --- Types ---
interface Article {
  reference: string
  designation: string
  category: string
  price: number
  price_label?: string
}

interface StockInfo {
  reference: string
  available: number
  lastUpdated: string
  loading: boolean
  error?: string
}

interface OrderStatus {
  trsId: string
  etat: string
  statusMessage: string
  logs?: string
  timestamps?: { modified: string }
}

// --- Helpers ---
const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  T: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "Intégré" },
  A: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", icon: <XCircle className="w-3.5 h-3.5" />, label: "Erreur" },
  I: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: <Clock className="w-3.5 h-3.5" />, label: "En attente" },
  E: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, label: "En cours" },
}

function StockBadge({ available }: { available: number }) {
  if (available <= 0) return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">Rupture</span>
  if (available <= 5) return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">{available} restant(s)</span>
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{available} en stock</span>
}

// --- Main Component ---
export function ErpDashboard() {
  const [articles, setArticles] = useState<Article[]>([])
  const [stocks, setStocks] = useState<Record<string, StockInfo>>({})
  const [orderStatuses, setOrderStatuses] = useState<OrderStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [apiOnline, setApiOnline] = useState<boolean | null>(null)
  const [orderInput, setOrderInput] = useState("")

  // Health check + catalog load
  const loadCatalog = useCallback(async () => {
    setLoading(true)
    try {
      const health = await fetch(`${API_BASE}/health`).then(r => r.json())
      setApiOnline(health?.status === "ok")

      const catalog = await fetch(`${API_BASE}/articles?limit=20`).then(r => r.json())
      const items: Article[] = catalog?.data || []
      setArticles(items)

      // Init stock states as loading
      const initStocks: Record<string, StockInfo> = {}
      items.forEach(a => { initStocks[a.reference] = { reference: a.reference, available: 0, lastUpdated: "", loading: true } })
      setStocks(initStocks)

      // Fetch stocks in parallel
      await Promise.all(items.map(async (a) => {
        try {
          const s = await fetch(`${API_BASE}/stock/${encodeURIComponent(a.reference)}`).then(r => r.json())
          setStocks(prev => ({
            ...prev,
            [a.reference]: { reference: a.reference, available: s.available ?? 0, lastUpdated: s.lastUpdated ?? "", loading: false }
          }))
        } catch {
          setStocks(prev => ({
            ...prev,
            [a.reference]: { ...prev[a.reference], loading: false, error: "Indisponible" }
          }))
        }
      }))
    } catch {
      setApiOnline(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadCatalog() }, [loadCatalog])

  const refreshStock = async (reference: string) => {
    setStocks(prev => ({ ...prev, [reference]: { ...prev[reference], loading: true } }))
    try {
      const s = await fetch(`${API_BASE}/stock/${encodeURIComponent(reference)}`).then(r => r.json())
      setStocks(prev => ({ ...prev, [reference]: { reference, available: s.available ?? 0, lastUpdated: s.lastUpdated ?? "", loading: false } }))
    } catch {
      setStocks(prev => ({ ...prev, [reference]: { ...prev[reference], loading: false, error: "Erreur" } }))
    }
  }

  const checkOrderStatus = async () => {
    if (!orderInput.trim()) return
    try {
      const data = await fetch(`${API_BASE}/commandes/status/${orderInput.trim()}`).then(r => r.json())
      setOrderStatuses(prev => {
        const exists = prev.find(o => o.trsId === data.trsId)
        if (exists) return prev.map(o => o.trsId === data.trsId ? data : o)
        return [data, ...prev].slice(0, 10)
      })
      setOrderInput("")
    } catch { /* noop */ }
  }

  const lowStockArticles = articles.filter(a => {
    const s = stocks[a.reference]
    return s && !s.loading && s.available <= 5
  })

  // --- Offline State ---
  if (apiOnline === false) {
    return (
      <div className="lg:col-span-4 glass-strong rounded-3xl p-8 flex flex-col items-center justify-center gap-4 text-center border border-red-500/10">
        <WifiOff className="w-10 h-10 text-red-400" />
        <div>
          <h3 className="text-lg font-bold text-foreground">Middleware WaveSoft hors ligne</h3>
          <p className="text-sm text-muted-foreground mt-1">L'API de proxy Next.js n'a pas pu joindre le middleware ERP. Vérifiez les logs du serveur Next.js ou la variable d'environnement <code className="text-primary bg-primary/10 px-1 rounded">ERP_MIDDLEWARE_URL</code>.</p>
        </div>
        <Button variant="outline" onClick={loadCatalog} className="gap-2"><RefreshCw className="w-4 h-4" /> Réessayer</Button>
      </div>
    )
  }

  return (
    <div className="lg:col-span-4 space-y-6">
      {/* Header */}
      <div className="glass-strong rounded-3xl p-5 flex items-center justify-between border border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Server className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">WaveSoft ERP Live</h2>
            <p className="text-xs text-muted-foreground">Données en temps réel depuis l&apos;ERP</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${apiOnline ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-red-400 bg-red-500/10 border-red-500/20"}`}>
            {apiOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {apiOnline ? "Connecté" : "Hors ligne"}
          </span>
          <Button size="sm" variant="outline" onClick={loadCatalog} className="gap-2 rounded-xl" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Tout actualiser
          </Button>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockArticles.length > 0 && (
        <div className="glass-strong rounded-3xl p-5 border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-amber-400">{lowStockArticles.length} Article(s) en stock bas</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockArticles.map(a => (
              <div key={a.reference} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                <Package className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold text-amber-300">{a.reference}</span>
                <StockBadge available={stocks[a.reference]?.available ?? 0} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Table */}
      <div className="glass-strong rounded-3xl overflow-hidden border border-white/5">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" /> Catalogue WaveSoft
          </h3>
          <span className="text-xs text-muted-foreground">{articles.length} références</span>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : articles.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Aucun article trouvé</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Référence</th>
                  <th className="text-left px-5 py-3">Désignation</th>
                  <th className="text-left px-5 py-3">Famille</th>
                  <th className="text-right px-5 py-3">Prix</th>
                  <th className="text-center px-5 py-3">Stock ERP</th>
                  <th className="text-center px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((a, i) => {
                  const stock = stocks[a.reference]
                  return (
                    <tr key={a.reference} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
                      <td className="px-5 py-3 font-mono text-xs text-primary">{a.reference}</td>
                      <td className="px-5 py-3 text-foreground font-medium max-w-[200px] truncate">{a.designation}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-md text-xs bg-white/5 text-muted-foreground">{a.category || "–"}</span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-foreground">
                        {a.price != null ? `${a.price.toLocaleString("fr-MA")} MAD` : "–"}
                        {a.price_label && <span className="ml-1 text-xs text-muted-foreground">{a.price_label}</span>}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {stock?.loading ? (
                          <Loader2 className="w-4 h-4 animate-spin mx-auto text-muted-foreground" />
                        ) : stock?.error ? (
                          <span className="text-xs text-muted-foreground">{stock.error}</span>
                        ) : (
                          <StockBadge available={stock?.available ?? 0} />
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Button size="sm" variant="ghost" onClick={() => refreshStock(a.reference)} disabled={stock?.loading} className="h-7 w-7 p-0 rounded-lg hover:bg-primary/10">
                          <RefreshCw className={`w-3.5 h-3.5 ${stock?.loading ? "animate-spin" : ""}`} />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Order Status Tracker */}
      <div className="glass-strong rounded-3xl overflow-hidden border border-white/5">
        <div className="p-5 border-b border-white/5">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" /> Suivi Automate WaveSoft
          </h3>
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              value={orderInput}
              onChange={e => setOrderInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && checkOrderStatus()}
              placeholder="Entrez un TRS ID..."
              className="flex-1 px-3 py-2 text-sm rounded-xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <Button size="sm" onClick={checkOrderStatus} disabled={!orderInput.trim()} className="rounded-xl">
              Vérifier
            </Button>
          </div>
        </div>
        <div>
          {orderStatuses.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Aucune commande suivie</div>
          ) : (
            <div className="divide-y divide-white/5">
              {orderStatuses.map(o => {
                const cfg = STATUS_CONFIG[o.etat] || STATUS_CONFIG["I"]
                return (
                  <div key={o.trsId} className="px-5 py-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">TRS #{o.trsId}</span>
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground">{o.statusMessage}</p>
                      {o.etat === "A" && o.logs && (
                        <p className="text-xs text-red-400 mt-1 font-mono bg-red-500/5 rounded-lg px-2 py-1">{o.logs}</p>
                      )}
                    </div>
                    {o.timestamps?.modified && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(o.timestamps.modified).toLocaleTimeString("fr-MA")}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
