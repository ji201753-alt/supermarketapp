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
  Coins,
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  Calendar,
  Clock,
  Filter,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import type { CashMovement, CashConcept } from "@/lib/types"

export default function CashPage() {
  const { cashMovements, cashConcepts, cashClosings, currentUser, getServices, refreshData } = useStore()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [conceptFilter, setConceptFilter] = useState<string>("all")
  const [showMovementDialog, setShowMovementDialog] = useState(false)
  const [showOpenCashDialog, setShowOpenCashDialog] = useState(false)
  const [showCloseCashDialog, setShowCloseCashDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Movement form state
  const [movementType, setMovementType] = useState<"income" | "expense">("income")
  const [movementConceptId, setMovementConceptId] = useState("")
  const [movementAmount, setMovementAmount] = useState("")
  const [movementNotes, setMovementNotes] = useState("")

  // Cash register state
  const [openingBalance, setOpeningBalance] = useState("")
  const [actualBalance, setActualBalance] = useState("")
  const [closingNotes, setClosingNotes] = useState("")

  // Get current open cash closing
  const currentCashClosing = cashClosings.find((c) => c.status === "open")

  // Filter movements by date
  const dailyMovements = useMemo(() => {
    return cashMovements
      .filter((m) => m.timestamp.startsWith(selectedDate))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }, [cashMovements, selectedDate])

  // Filter by concept
  const filteredMovements = useMemo(() => {
    if (conceptFilter === "all") return dailyMovements
    return dailyMovements.filter((m) => m.conceptId === conceptFilter)
  }, [dailyMovements, conceptFilter])

  // Calculate daily totals
  const dailyTotals = useMemo(() => {
    const totals = { income: 0, expense: 0, balance: 0 }
    dailyMovements.forEach((m) => {
      totals.income += m.income
      totals.expense += m.expense
    })
    totals.balance = totals.income - totals.expense
    return totals
  }, [dailyMovements])

  // Get concepts by type
  const incomeConcepts = cashConcepts.filter((c) => c.type === "income" && c.active)
  const expenseConcepts = cashConcepts.filter((c) => c.type === "expense" && c.active)

  // Get last balance
  const lastBalance = cashMovements.length > 0 
    ? cashMovements.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0].balance
    : 0

  // Open cash register
  const handleOpenCash = async () => {
    if (!currentUser || !openingBalance) return
    setIsProcessing(true)
    try {
      const services = getServices()
      await services.pos.openCashRegister({
        openingBalance: parseFloat(openingBalance),
        cashierId: currentUser.id,
        cashierName: currentUser.name,
      })
      await refreshData()
      setShowOpenCashDialog(false)
      setOpeningBalance("")
    } catch (error) {
      console.error("[v0] Error opening cash:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Close cash register
  const handleCloseCash = async () => {
    if (!currentCashClosing || !actualBalance) return
    setIsProcessing(true)
    try {
      const services = getServices()
      await services.pos.closeCashRegister(
        currentCashClosing.id,
        parseFloat(actualBalance),
        closingNotes
      )
      await refreshData()
      setShowCloseCashDialog(false)
      setActualBalance("")
      setClosingNotes("")
    } catch (error) {
      console.error("[v0] Error closing cash:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Add manual movement
  const handleAddMovement = async () => {
    if (!currentUser || !movementConceptId || !movementAmount) return
    setIsProcessing(true)
    try {
      const services = getServices()
      const amount = parseFloat(movementAmount)
      
      await services.pos.addCashMovement({
        conceptId: movementConceptId,
        income: movementType === "income" ? amount : 0,
        expense: movementType === "expense" ? amount : 0,
        documentType: "Movimiento Manual",
        notes: movementNotes,
        isAutomatic: false,
        cashierId: currentUser.id,
        cashierName: currentUser.name,
      })
      
      await refreshData()
      setShowMovementDialog(false)
      setMovementConceptId("")
      setMovementAmount("")
      setMovementNotes("")
    } catch (error) {
      console.error("[v0] Error adding movement:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const expectedBalance = currentCashClosing
    ? currentCashClosing.openingBalance + dailyTotals.income - dailyTotals.expense
    : lastBalance + dailyTotals.balance

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Movimientos de Caja</h1>
          <p className="text-muted-foreground">Gestión de entradas y salidas de efectivo</p>
        </div>
        <div className="flex gap-2">
          {!currentCashClosing ? (
            <Button onClick={() => setShowOpenCashDialog(true)}>
              <Unlock className="mr-2 h-4 w-4" />
              Abrir Caja
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setShowMovementDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Movimiento
              </Button>
              <Button variant="destructive" onClick={() => setShowCloseCashDialog(true)}>
                <Lock className="mr-2 h-4 w-4" />
                Cerrar Caja
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Cash Status */}
      {currentCashClosing ? (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Caja Abierta</p>
              <p className="text-sm text-muted-foreground">
                Cajero: {currentCashClosing.cashierName} | 
                Apertura: ${currentCashClosing.openingBalance.toFixed(2)} |
                Desde: {new Date(currentCashClosing.createdAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
              <AlertCircle className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="font-medium">Caja Cerrada</p>
              <p className="text-sm text-muted-foreground">
                Debe abrir la caja para registrar movimientos
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo Actual</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${lastBalance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Último saldo registrado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del Día</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">+${dailyTotals.income.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{dailyMovements.filter((m) => m.income > 0).length} movimientos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Egresos del Día</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">-${dailyTotals.expense.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{dailyMovements.filter((m) => m.expense > 0).length} movimientos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Balance del Día</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${dailyTotals.balance >= 0 ? "text-primary" : "text-destructive"}`}>
              {dailyTotals.balance >= 0 ? "+" : ""}${dailyTotals.balance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">{dailyMovements.length} movimientos totales</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={conceptFilter} onValueChange={setConceptFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por concepto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los conceptos</SelectItem>
              {cashConcepts.map((concept) => (
                <SelectItem key={concept.id} value={concept.id}>
                  {concept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Movements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Movimientos del Día</CardTitle>
          <CardDescription>
            {selectedDate === new Date().toISOString().split("T")[0] 
              ? "Hoy" 
              : new Date(selectedDate).toLocaleDateString("es-MX", { dateStyle: "full" })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Cajero</TableHead>
                  <TableHead className="text-right text-primary">Entrada</TableHead>
                  <TableHead className="text-right text-destructive">Salida</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      No hay movimientos para esta fecha
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMovements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground">
                          {movement.registerId || movement.id.slice(0, 8)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {formatTime(movement.timestamp)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {movement.income > 0 ? (
                            <ArrowUpCircle className="h-4 w-4 text-primary" />
                          ) : (
                            <ArrowDownCircle className="h-4 w-4 text-destructive" />
                          )}
                          {movement.conceptName}
                          {movement.isAutomatic && (
                            <Badge variant="secondary" className="text-xs">Auto</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {movement.documentType && (
                          <span className="text-sm">
                            {movement.documentType}
                            {movement.documentNumber && ` - ${movement.documentNumber}`}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{movement.cashierName}</TableCell>
                      <TableCell className="text-right font-medium text-primary">
                        {movement.income > 0 && `+$${movement.income.toFixed(2)}`}
                      </TableCell>
                      <TableCell className="text-right font-medium text-destructive">
                        {movement.expense > 0 && `-$${movement.expense.toFixed(2)}`}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ${movement.balance.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Open Cash Dialog */}
      <Dialog open={showOpenCashDialog} onOpenChange={setShowOpenCashDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir Caja</DialogTitle>
            <DialogDescription>
              Ingrese el monto inicial con el que abre la caja
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Fondo de Caja Inicial</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOpenCashDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleOpenCash} disabled={isProcessing || !openingBalance}>
              {isProcessing ? "Abriendo..." : "Abrir Caja"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Cash Dialog */}
      <Dialog open={showCloseCashDialog} onOpenChange={setShowCloseCashDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar Caja</DialogTitle>
            <DialogDescription>
              Saldo esperado: ${expectedBalance.toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Efectivo en Caja (conteo real)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={actualBalance}
                onChange={(e) => setActualBalance(e.target.value)}
                placeholder="0.00"
              />
              {actualBalance && (
                <p className={`text-sm font-medium ${
                  parseFloat(actualBalance) === expectedBalance 
                    ? "text-primary" 
                    : "text-destructive"
                }`}>
                  Diferencia: ${(parseFloat(actualBalance) - expectedBalance).toFixed(2)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Textarea
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                placeholder="Observaciones del cierre..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseCashDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCloseCash} 
              disabled={isProcessing || !actualBalance}
            >
              {isProcessing ? "Cerrando..." : "Cerrar Caja"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Movement Dialog */}
      <Dialog open={showMovementDialog} onOpenChange={setShowMovementDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Movimiento Manual</DialogTitle>
            <DialogDescription>
              Registre una entrada o salida de efectivo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Movimiento</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={movementType === "income" ? "default" : "outline"}
                  onClick={() => setMovementType("income")}
                  className="gap-2"
                >
                  <ArrowUpCircle className="h-4 w-4" />
                  Entrada
                </Button>
                <Button
                  variant={movementType === "expense" ? "default" : "outline"}
                  onClick={() => setMovementType("expense")}
                  className="gap-2"
                >
                  <ArrowDownCircle className="h-4 w-4" />
                  Salida
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Concepto</Label>
              <Select value={movementConceptId} onValueChange={setMovementConceptId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un concepto" />
                </SelectTrigger>
                <SelectContent>
                  {(movementType === "income" ? incomeConcepts : expenseConcepts).map((concept) => (
                    <SelectItem key={concept.id} value={concept.id}>
                      {concept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Monto</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={movementAmount}
                onChange={(e) => setMovementAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Textarea
                value={movementNotes}
                onChange={(e) => setMovementNotes(e.target.value)}
                placeholder="Descripción del movimiento..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMovementDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddMovement} 
              disabled={isProcessing || !movementConceptId || !movementAmount}
            >
              {isProcessing ? "Registrando..." : "Registrar Movimiento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
