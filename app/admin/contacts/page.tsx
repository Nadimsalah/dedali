"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, User } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ContactMessage, listContactMessages } from "@/lib/supabase-api"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function AdminContactsPage() {
  const { t } = useLanguage()
  const [rows, setRows] = useState<ContactMessage[]>([])
  const [active, setActive] = useState<ContactMessage | null>(null)

  useEffect(() => {
    listContactMessages().then(setRows).catch(console.error)
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
            <span>{t("admin.contacts.back")}</span>
          </Link>
          <span className="text-xs text-muted-foreground uppercase tracking-[0.25em]">
            {t("admin.contacts.title")}
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <Card className="p-4 sm:p-6">
          <h1 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            {t("admin.contacts.list_title")}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">
            {t("admin.contacts.subtitle")}
          </p>
        </Card>

        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.contacts.table.name")}</TableHead>
                <TableHead>{t("admin.contacts.table.email")}</TableHead>
                <TableHead>{t("admin.contacts.table.phone")}</TableHead>
                <TableHead>{t("admin.contacts.table.type")}</TableHead>
                <TableHead>{t("admin.contacts.table.message")}</TableHead>
                <TableHead>{t("admin.contacts.table.date")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground text-sm">
                    {t("admin.contacts.no_messages")}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{row.phone}</TableCell>
                    <TableCell>{row.type}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="flex items-center justify-between gap-2">
                        <p className="flex-1 text-xs sm:text-sm text-muted-foreground line-clamp-2">
                          {row.message}
                        </p>
                        <Dialog open={active?.id === row.id} onOpenChange={(open) => setActive(open ? row : null)}>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="whitespace-nowrap"
                            onClick={() => setActive(row)}
                          >
                            {t("admin.contacts.view")}
                          </Button>
                          <DialogContent className="max-w-xl">
                            <DialogHeader>
                              <DialogTitle>
                                {t("admin.contacts.details_title")}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-2 text-sm">
                              <p><strong>{t("admin.contacts.label.name")}</strong> {row.name}</p>
                              {row.email && <p><strong>{t("admin.contacts.label.email")}</strong> {row.email}</p>}
                              <p><strong>{t("admin.contacts.label.phone")}</strong> {row.phone}</p>
                              {row.company && <p><strong>{t("admin.contacts.label.company")}</strong> {row.company}</p>}
                              {row.type && <p><strong>{t("admin.contacts.label.type")}</strong> {row.type}</p>}
                              <p className="mt-4 whitespace-pre-line break-words">
                                {row.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-3">
                                {new Date(row.created_at).toLocaleString()}
                              </p>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(row.created_at).toLocaleString()}</TableCell>
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

