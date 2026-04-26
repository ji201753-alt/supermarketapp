"use client"

import { useState, useMemo } from "react"
import { useStore } from "@/components/store-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Receipt,
  Search,
  Calendar,
  Filter,
  Eye,
  XCircle,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  FileX,
  Download,
  Printer,
  CreditCard,
  RefreshCw,
} from "lucide-react"
import type { Invoice, CreditNote, InvoiceItem } from "@/lib/types"
import { useSearchParams } from "next/navigation"
import Loading from "./loading"

const statusConfig = {
  draft: { label: "Borrador", variant: "secondary" as const, icon: FileText },
  issued: { label: "Emitida", variant: "default" as const, icon: Clock },
  paid: { label: "Pagada", variant: "default" as const, icon: CheckCircle },
  cancelled: { label: "Cancelada", variant: "destructive" as const, icon: XCircle },
}

const paymentMethodLabels = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  credit: "Crédito",
}

export default function InvoicesPage() {
  const { invoices, creditNotes, clients, settings, getServices, refreshData } = useStore()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("invoices")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [selectedCreditNote, setSelectedCreditNote] = useState<CreditNote | null>(null)
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  const [showCreditNoteDialog, setShowCreditNoteDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showCreateCNDialog, setShowCreateCNDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Credit note form
  const [cnReason, setCnReason] = useState("")
  const [cnItems, setCnItems] = useState<InvoiceItem[]>([])

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.clientName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || inv.status === statusFilter
      const matchesDateFrom = !dateFrom || inv.createdAt.split("T")[0] >= dateFrom
      const matchesDateTo = !dateTo || inv.createdAt.split("T")[0] <= dateTo
      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo
    })
  }, [invoices, searchQuery, statusFilter, dateFrom, dateTo])

  // Filter credit notes
  const filteredCreditNotes = useMemo(() => {
    return creditNotes.filter((cn) => {
      const matchesSearch =
        cn.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cn.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cn.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || cn.status === statusFilter
      const matchesDateFrom = !dateFrom || cn.createdAt.split("T")[0] >= dateFrom
      const matchesDateTo = !dateTo || cn.createdAt.split("T")[0] <= dateTo
      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo
    })
  }, [creditNotes, searchQuery, statusFilter, dateFrom, dateTo])

  // Calculate totals
  const invoiceTotals = useMemo(() => {
    const today = new Date().toISOString().split("T")[0]
    const monthStart = today.substring(0, 7) + "-01"
    
    const todayInvoices = invoices.filter((i) => i.createdAt.startsWith(today) && i.status !== "cancelled")
    const monthInvoices = invoices.filter((i) => i.createdAt >= monthStart && i.status !== "cancelled")
    
    return {
      today: todayInvoices.reduce((sum, i) => sum + i.total, 0),
      todayCount: todayInvoices.length,
      month: monthInvoices.reduce((sum, i) => sum + i.total, 0),
      monthCount: monthInvoices.length,
      pending: invoices.filter((i) => i.status === "issued").reduce((sum, i) => sum + i.total, 0),
      pendingCount: invoices.filter((i) => i.status === "issued").length,
    }
  }, [invoices])

  // View invoice details
  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowInvoiceDialog(true)
  }

  // View credit note details
  const handleViewCreditNote = (creditNote: CreditNote) => {
    setSelectedCreditNote(creditNote)
    setShowCreditNoteDialog(true)
  }

  // Cancel invoice
  const handleCancelInvoice = async () => {
    if (!selectedInvoice) return
    setIsProcessing(true)
    try {
      const services = getServices()
      await services.pos.cancelInvoice(selectedInvoice.id)
      await refreshData()
      setShowCancelDialog(false)
      setShowInvoiceDialog(false)
    } catch (error) {
      console.error("[v0] Error cancelling invoice:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Open create credit note dialog
  const handleOpenCreateCN = () => {
    if (!selectedInvoice) return
    setCnItems(selectedInvoice.items.map((item) => ({ ...item })))
    setCnReason("")
    setShowCreateCNDialog(true)
  }

  // Create and apply credit note
  const handleCreateCreditNote = async () => {
    if (!selectedInvoice || !cnReason) return
    setIsProcessing(true)
    try {
      const services = getServices()
      const creditNote = await services.pos.createCreditNote({
        invoiceId: selectedInvoice.id,
        items: cnItems,
        reason: cnReason,
        cashierId: selectedInvoice.cashierId,
        cashierName: selectedInvoice.cashierName,
      })
      
      if (creditNote) {
        await services.pos.issueAndApplyCreditNote(creditNote.id)
        await refreshData()
        setShowCreateCNDialog(false)
        setShowInvoiceDialog(false)
      }
    } catch (error) {
      console.error("[v0] Error creating credit note:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Facturas y Notas de Crédito</h1>
        <p className="text-muted-foreground">Gestión de documentos fiscales</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ventas de Hoy</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${invoiceTotals.today.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{invoiceTotals.todayCount} facturas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${invoiceTotals.month.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{invoiceTotals.monthCount} facturas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Por Cobrar</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">${invoiceTotals.pending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{invoiceTotals.pendingCount} facturas pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Notas de Crédito</CardTitle>
            <FileX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditNotes.length}</div>
            <p className="text-xs text-muted-foreground">
              ${creditNotes.filter((cn) => cn.status === "applied").reduce((sum, cn) => sum + cn.total, 0).toFixed(2)} aplicadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="invoices" className="gap-2">
            <Receipt className="h-4 w-4" />
            Facturas
          </TabsTrigger>
          <TabsTrigger value="credit-notes" className="gap-2">
            <FileX className="h-4 w-4" />
            Notas de Crédito
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por número o cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="draft">Borrador</SelectItem>
              <SelectItem value="issued">Emitida</SelectItem>
              <SelectItem value="paid">Pagada</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-auto"
            placeholder="Desde"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-auto"
            placeholder="Hasta"
          />
        </div>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                          No se encontraron facturas
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInvoices.map((invoice) => {
                        const status = statusConfig[invoice.status]
                        const StatusIcon = status.icon
                        return (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.number}</TableCell>
                            <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                            <TableCell>
                              <div>
                                <p>{invoice.clientName}</p>
                                {invoice.clientTaxId && (
                                  <p className="text-xs text-muted-foreground">{invoice.clientTaxId}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {paymentMethodLabels[invoice.paymentMethod]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={status.variant} className="gap-1">
                                <StatusIcon className="h-3 w-3" />
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              ${invoice.total.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewInvoice(invoice)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Credit Notes Tab */}
        <TabsContent value="credit-notes">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Factura</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCreditNotes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                          No se encontraron notas de crédito
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCreditNotes.map((cn) => (
                        <TableRow key={cn.id}>
                          <TableCell className="font-medium">{cn.number}</TableCell>
                          <TableCell>{formatDate(cn.createdAt)}</TableCell>
                          <TableCell>{cn.invoiceNumber}</TableCell>
                          <TableCell>{cn.clientName}</TableCell>
                          <TableCell className="max-w-32 truncate">{cn.reason}</TableCell>
                          <TableCell>
                            <Badge variant={cn.status === "applied" ? "default" : "secondary"}>
                              {cn.status === "draft" ? "Borrador" : cn.status === "issued" ? "Emitida" : "Aplicada"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-destructive">
                            -${cn.total.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewCreditNote(cn)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invoice Detail Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Factura {selectedInvoice?.number}
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              {/* Invoice Header */}
              <div className="flex justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedInvoice.clientName}</p>
                  {selectedInvoice.clientTaxId && (
                    <p className="text-sm text-muted-foreground">{selectedInvoice.clientTaxId}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">{formatDate(selectedInvoice.createdAt)}</p>
                  <Badge variant={statusConfig[selectedInvoice.status].variant} className="mt-1">
                    {statusConfig[selectedInvoice.status].label}
                  </Badge>
                </div>
              </div>

              {/* Items Table */}
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInvoice.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p>{item.productName}</p>
                            <p className="text-xs text-muted-foreground">{item.sku}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${item.subtotal.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="space-y-1 rounded-lg border p-4 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${selectedInvoice.subtotal.toFixed(2)}</span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>Descuento ({selectedInvoice.discount}%)</span>
                    <span>-${((selectedInvoice.subtotal * selectedInvoice.discount) / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>IVA ({selectedInvoice.taxRate}%)</span>
                  <span>${selectedInvoice.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-lg font-bold">
                  <span>Total</span>
                  <span>${selectedInvoice.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  <CreditCard className="mr-1 inline h-4 w-4" />
                  {paymentMethodLabels[selectedInvoice.paymentMethod]}
                </span>
                <span>Cajero: {selectedInvoice.cashierName}</span>
              </div>

              {selectedInvoice.notes && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-sm text-muted-foreground">Notas: {selectedInvoice.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            {selectedInvoice?.status === "paid" && (
              <Button variant="outline" onClick={handleOpenCreateCN}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Crear Nota de Crédito
              </Button>
            )}
            {selectedInvoice?.status !== "cancelled" && selectedInvoice?.status !== "paid" && (
              <Button variant="destructive" onClick={() => setShowCancelDialog(true)}>
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar Factura
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowInvoiceDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credit Note Detail Dialog */}
      <Dialog open={showCreditNoteDialog} onOpenChange={setShowCreditNoteDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileX className="h-5 w-5" />
              Nota de Crédito {selectedCreditNote?.number}
            </DialogTitle>
          </DialogHeader>
          {selectedCreditNote && (
            <div className="space-y-4">
              <div className="flex justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedCreditNote.clientName}</p>
                  <p className="text-sm text-muted-foreground">
                    Factura: {selectedCreditNote.invoiceNumber}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">{formatDate(selectedCreditNote.createdAt)}</p>
                  <Badge variant={selectedCreditNote.status === "applied" ? "default" : "secondary"} className="mt-1">
                    {selectedCreditNote.status === "applied" ? "Aplicada" : "Pendiente"}
                  </Badge>
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm">
                  <span className="font-medium">Motivo:</span> {selectedCreditNote.reason}
                </p>
              </div>

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCreditNote.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${item.subtotal.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between border-t pt-4 text-lg font-bold">
                <span>Total a Devolver</span>
                <span className="text-destructive">-${selectedCreditNote.total.toFixed(2)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreditNoteDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Factura</DialogTitle>
            <DialogDescription>
              ¿Está seguro de cancelar la factura {selectedInvoice?.number}?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              No, Mantener
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelInvoice}
              disabled={isProcessing}
            >
              {isProcessing ? "Cancelando..." : "Sí, Cancelar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Credit Note Dialog */}
      <Dialog open={showCreateCNDialog} onOpenChange={setShowCreateCNDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Crear Nota de Crédito</DialogTitle>
            <DialogDescription>
              Para la factura {selectedInvoice?.number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Motivo de la Nota de Crédito</Label>
              <Textarea
                value={cnReason}
                onChange={(e) => setCnReason(e.target.value)}
                placeholder="Explique el motivo de la devolución o crédito..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Productos a Devolver</Label>
              <div className="max-h-48 space-y-2 overflow-auto rounded-lg border p-2">
                {cnItems.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between rounded border p-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">${item.unitPrice.toFixed(2)}</p>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={item.quantity}
                      value={item.quantity}
                      onChange={(e) => {
                        const newQty = parseInt(e.target.value) || 0
                        setCnItems((prev) =>
                          prev.map((i, idx) =>
                            idx === index
                              ? {
                                  ...i,
                                  quantity: newQty,
                                  subtotal: newQty * i.unitPrice,
                                  tax: newQty * i.unitPrice * (settings.taxRate / 100),
                                  total: newQty * i.unitPrice * (1 + settings.taxRate / 100),
                                }
                              : i
                          )
                        )
                      }}
                      className="w-20"
                    />
                  </div>
                ))}
              </div>
              <p className="text-right font-bold">
                Total: ${cnItems.reduce((sum, i) => sum + i.subtotal + i.tax, 0).toFixed(2)}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateCNDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateCreditNote}
              disabled={isProcessing || !cnReason || cnItems.every((i) => i.quantity === 0)}
            >
              {isProcessing ? "Creando..." : "Crear y Aplicar NC"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
