"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useStore } from "@/components/store-provider"
import type { Product } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Check } from "lucide-react"

interface StockConfigFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onSuccess?: () => void
}

export function StockConfigForm({ open, onOpenChange, product, onSuccess }: StockConfigFormProps) {
  const { stock, updateStock, currentUser } = useStore()
  const isViewer = currentUser?.role === "viewer"

  const [minStock, setMinStock] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (product) {
      const stockItem = stock.find((s) => s.productId === product.id)
      setMinStock(String(stockItem?.minStock || 10))
    }
    setError("")
    setSuccess(false)
  }, [product, stock, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const min = Number(minStock)
    if (isNaN(min) || min < 0) {
      setError("El stock mínimo debe ser un número válido")
      return
    }

    if (product) {
      updateStock(product.id, { minStock: min })
    }

    setSuccess(true)
    setTimeout(() => {
      onOpenChange(false)
      onSuccess?.()
    }, 1000)
  }

  const stockItem = product ? stock.find((s) => s.productId === product.id) : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Configurar Stock Mínimo</SheetTitle>
          <SheetDescription>{product?.name}</SheetDescription>
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
              <AlertDescription>Configuración guardada</AlertDescription>
            </Alert>
          )}

          {stockItem && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm">
                <span className="text-muted-foreground">Stock actual: </span>
                <span className="font-medium">{stockItem.quantity}</span>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="minStock">Stock Mínimo</Label>
            <Input
              id="minStock"
              type="number"
              min="0"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              placeholder="10"
              disabled={isViewer}
            />
            <p className="text-xs text-muted-foreground">
              Se mostrará una alerta cuando el stock esté por debajo de este valor
            </p>
          </div>

          <SheetFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isViewer || success}>
              Guardar
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
