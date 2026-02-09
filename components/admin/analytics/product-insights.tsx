
"use client"

import { useLanguage } from "@/components/language-provider"
import { AlertTriangle, TrendingDown, Package } from "lucide-react"

export function ProductInsights({
    lowStock,
    lowSales
}: {
    lowStock: any[],
    lowSales: any[]
}) {
    const { t } = useLanguage()

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Low Stock Alert */}
            <div className="glass-strong rounded-3xl p-6 relative overflow-hidden flex flex-col h-full">
                <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />

                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="p-3 rounded-xl bg-red-500/10 text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-800">
                        {t("admin.analytics.low_stock_alerts")}
                    </h3>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {lowStock.map((product, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/40 border border-red-100/50 hover:bg-red-50/50 transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden relative">
                                {product.images?.[0] ? (
                                    <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 absolute inset-0">
                                        <Package className="w-4 h-4" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">{product.title}</p>
                                <p className="text-xs text-red-500 font-medium">
                                    {product.stock} {t("admin.analytics.in_stock")}
                                </p>
                            </div>
                        </div>
                    ))}
                    {lowStock.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            {t("admin.analytics.no_low_stock")}
                        </div>
                    )}
                </div>
            </div>

            {/* Low Sales Warning */}
            <div className="glass-strong rounded-3xl p-6 relative overflow-hidden flex flex-col h-full">
                <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="p-3 rounded-xl bg-orange-500/10 text-orange-600">
                        <TrendingDown className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-800">
                        {t("admin.analytics.low_performing_products")}
                    </h3>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {lowSales.map((product, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/40 border border-orange-100/50 hover:bg-orange-50/50 transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden relative">
                                {product.images?.[0] ? (
                                    <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 absolute inset-0">
                                        <Package className="w-4 h-4" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">{product.title}</p>
                                <p className="text-xs text-orange-500 font-medium">
                                    {product.sales_count || 0} {t("admin.analytics.sales")}
                                </p>
                            </div>
                        </div>
                    ))}
                    {lowSales.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            {t("admin.analytics.no_low_sales")}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
