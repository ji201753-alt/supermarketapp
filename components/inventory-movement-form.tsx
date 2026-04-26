"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useStore } from "@/components/store-provider"
import type { Product } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Check, ArrowDownToLine, ArrowUpFromLine, Settings2 } from "lucide-react"

interface InventoryMovementFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  onSuccess?: () => void
}

export function InventoryMovementForm({ open, onOpenChange, product, onSuccess }: InventoryMovementFormProps) {
  const { products, stock, addMovement, currentUser } = useStore()
  const isViewer = currentUser?.role === "viewer"

  const [formData, setFormData] = useState({
    productId: "",
    type: "entry" as "entry" | "exit" | "adjustment",
    quantity: "",
    reason: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (product) {
      setFormData((prev) => ({ ...prev, productId: product.id }))
    } else {
      setFormData({
        productId: "",
        type: "entry",
        quantity: "",
        reason: "",
      })
    }
    setError("")
    setSuccess(false)
  }, [product, open])

  const selectedStock = stock.find((s) => s.productId === formData.productId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.productId || !formData.quantity || !formData.reason) {
      setError("Por favor complete todos los campos")
      return
    }

    const quantity = Number(formData.quantity)
    if (isNaN(quantity) || quantity <= 0) {
      setError("La cantidad debe ser un número positivo")
      return
    }

    if (formData.type === "exit" && selectedStock && quantity > selectedStock.quantity) {
      setError(`No hay suficiente stock. Disponible: ${selectedStock.quantity}`)
      return
    }

    addMovement({
      productId: formData.productId,
      type: formData.type,
      quantity: formData.type === "adjustment" ? quantity : quantity,
      reason: formData.reason,
      userId: currentUser?.id || "1",
    })

    setSuccess(true)
    setTimeout(() => {
      onOpenChange(false)
      onSuccess?.()
    }, 1000)
  }

  const movementTypes = [
    { value: "entry", label: "Entrada", icon: ArrowDownToLine, description: "Compra o recepción de mercancía" },
    { value: "exit", label: "Salida", icon: ArrowUpFromLine, description: "Venta o despacho de productos" },
    { value: "adjustment", label: "Ajuste", icon: Settings2, description: "Ajuste manual por inventario" },
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Registrar Movimiento</SheetTitle>
          <SheetDescription>Registra una entrada, salida o ajuste de inventario</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              <Check className="h-4 w-4" />
              <AlertDescription>Movimiento registrado exitosamente</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="product">Producto</Label>
            <Select
              value={formData.productId}
              onValueChange={(value) => setFormData({ ...formData, productId: value })}
              disabled={isViewer || !!product}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar producto" />
              </SelectTrigger>
              <SelectContent>
                {products
                  .filter((p) => p.active)
                  .map((prod) => (
                    <SelectItem key={prod.id} value={prod.id}>
                      {prod.name} ({prod.sku})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {selectedStock && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm">
                <span className="text-muted-foreground">Stock actual: </span>
                <span className="font-medium">{selectedStock.quantity}</span>
                <span className="text-muted-foreground"> (mínimo: {selectedStock.minStock})</span>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Tipo de Movimiento</Label>
            <div className="grid gap-2">
              {movementTypes.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.value as "entry" | "exit" | "adjustment" })}
                    disabled={isViewer}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      formData.type === type.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${formData.type === type.value ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <div>
                      <p className="font-medium text-sm">{type.label}</p>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Cantidad</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="0"
              disabled={isViewer}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo / Descripción</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Ej: Compra a proveedor, Venta cliente, Ajuste por inventario físico..."
              rows={3}
              disabled={isViewer}
            />
          </div>

          <SheetFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isViewer || success}>
              Registrar Movimiento
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
