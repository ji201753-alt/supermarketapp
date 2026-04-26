"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useStore } from "@/components/store-provider"
import type { Product } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Check } from "lucide-react"

interface ProductFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  onSuccess?: () => void
}

export function ProductForm({ open, onOpenChange, product, onSuccess }: ProductFormProps) {
  const { categories, suppliers, addProduct, updateProduct, currentUser } = useStore()
  const isViewer = currentUser?.role === "viewer"

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    barcode: "",
    categoryId: "",
    supplierId: "",
    purchasePrice: "",
    salePrice: "",
    active: true,
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        categoryId: product.categoryId,
        supplierId: product.supplierId,
        purchasePrice: String(product.purchasePrice),
        salePrice: String(product.salePrice),
        active: product.active,
      })
    } else {
      setFormData({
        name: "",
        sku: "",
        barcode: "",
        categoryId: "",
        supplierId: "",
        purchasePrice: "",
        salePrice: "",
        active: true,
      })
    }
    setError("")
    setSuccess(false)
  }, [product, open])

  const margin =
    formData.purchasePrice && formData.salePrice
      ? (((Number(formData.salePrice) - Number(formData.purchasePrice)) / Number(formData.salePrice)) * 100).toFixed(1)
      : null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.name || !formData.sku || !formData.categoryId || !formData.supplierId) {
      setError("Por favor complete todos los campos requeridos")
      return
    }

    const purchasePrice = Number(formData.purchasePrice)
    const salePrice = Number(formData.salePrice)

    if (isNaN(purchasePrice) || isNaN(salePrice) || purchasePrice < 0 || salePrice < 0) {
      setError("Los precios deben ser números válidos")
      return
    }

    if (salePrice < purchasePrice) {
      setError("El precio de venta no puede ser menor al precio de compra")
      return
    }

    if (product) {
      updateProduct(product.id, {
        ...formData,
        purchasePrice,
        salePrice,
      })
    } else {
      addProduct({
        ...formData,
        purchasePrice,
        salePrice,
      })
    }

    setSuccess(true)
    setTimeout(() => {
      onOpenChange(false)
      onSuccess?.()
    }, 1000)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{product ? "Editar Producto" : "Nuevo Producto"}</SheetTitle>
          <SheetDescription>
            {product ? "Modifica los datos del producto" : "Ingresa los datos del nuevo producto"}
          </SheetDescription>
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
              <AlertDescription>Producto guardado exitosamente</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nombre del producto"
              disabled={isViewer}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="LAC001"
                disabled={isViewer}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">Código de Barras</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="7501234567890"
                disabled={isViewer}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoría *</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              disabled={isViewer}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Proveedor *</Label>
            <Select
              value={formData.supplierId}
              onValueChange={(value) => setFormData({ ...formData, supplierId: value })}
              disabled={isViewer}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar proveedor" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((sup) => (
                  <SelectItem key={sup.id} value={sup.id}>
                    {sup.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Precio de Compra *</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                placeholder="0.00"
                disabled={isViewer}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salePrice">Precio de Venta *</Label>
              <Input
                id="salePrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                placeholder="0.00"
                disabled={isViewer}
              />
            </div>
          </div>

          {margin && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm">
                <span className="text-muted-foreground">Margen calculado: </span>
                <span className={Number(margin) >= 20 ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>
                  {margin}%
                </span>
              </p>
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="active" className="font-medium">
                Estado
              </Label>
              <p className="text-sm text-muted-foreground">
                {formData.active ? "Producto activo" : "Producto inactivo"}
              </p>
            </div>
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              disabled={isViewer}
            />
          </div>

          <SheetFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isViewer || success}>
              {product ? "Guardar Cambios" : "Crear Producto"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
