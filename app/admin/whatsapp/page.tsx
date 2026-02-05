"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Phone, Inbox } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { listWhatsappSubscriptions, WhatsappSubscription } from "@/lib/supabase-api"

export default function AdminWhatsappPage() {
  const { t } = useLanguage()
  const [leads, setLeads] = useState<WhatsappSubscription[]>([])

  useEffect(() => {
    listWhatsappSubscriptions().then(setLeads).catch(console.error)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t("admin.whatsapp.back")}</span>
          </Link>
          <span className="text-xs text-muted-foreground uppercase tracking-[0.25em]">
            {t("admin.whatsapp.title")}
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <Card className="p-4 sm:p-6 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              {t("admin.whatsapp.list_title")}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t("admin.whatsapp.subtitle")}
            </p>
          </div>
          <Button variant="outline" size="icon" className="rounded-full" disabled>
            <Inbox className="w-4 h-4" />
          </Button>
        </Card>

        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.whatsapp.table.country")}</TableHead>
                <TableHead>{t("admin.whatsapp.table.phone")}</TableHead>
                <TableHead>{t("admin.whatsapp.table.date")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground text-sm">
                    {t("admin.whatsapp.no_data")}
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>{lead.country_code}</TableCell>
                    <TableCell>{lead.phone}</TableCell>
                    <TableCell>{new Date(lead.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  )
}

