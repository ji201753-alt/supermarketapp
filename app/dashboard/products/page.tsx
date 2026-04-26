"use client"

import { useState } from "react"
import { useStore } from "@/components/store-provider"
import { DashboardHeader } from "@/components/dashboard-header"
import { DataTable } from "@/components/data-table"
import { ProductForm } from "@/components/product-form"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Pencil, Tag } from "lucide-react"
import type { Product } from "@/lib/types"

export default function ProductsPage() {
  const { products, categories, suppliers, stock, promotions, currentUser } = useStore()
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [supplierFilter, setSupplierFilter] = useState<string>("all")

  const isViewer = currentUser?.role === "viewer"

  // Filter products
  let filteredProducts = products
  if (categoryFilter !== "all") {
    filteredProducts = filteredProducts.filter((p) => p.categoryId === categoryFilter)
  }
  if (supplierFilter !== "all") {
    filteredProducts = filteredProducts.filter((p) => p.supplierId === supplierFilter)
  }

  // Check for active promotions
  const today = new Date().toISOString().split("T")[0]
  const activePromoIds = new Set(
    promotions.filter((p) => p.active && p.startDate <= today && p.endDate >= today).map((p) => p.productId),
  )

  const columns = [
    {
      key: "name",
      header: "Producto",
      cell: (product: Product) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{product.name}</span>
          {activePromoIds.has(product.id) && <Tag className="h-4 w-4 text-emerald-600" />}
        </div>
      ),
    },
    {
      key: "sku",
      header: "SKU",
      cell: (product: Product) => <span className="font-mono text-sm">{product.sku}</span>,
    },
    {
      key: "category",
      header: "Categoría",
      cell: (product: Product) => {
        const category = categories.find((c) => c.id === product.categoryId)
        return <span>{category?.name || "-"}</span>
      },
    },
    {
      key: "stock",
      header: "Stock",
      cell: (product: Product) => {
        const stockItem = stock.find((s) => s.productId === product.id)
        const isLow = stockItem && stockItem.quantity < stockItem.minStock
        return <Badge variant={isLow ? "destructive" : "secondary"}>{stockItem?.quantity || 0}</Badge>
      },
    },
    {
      key: "price",
      header: "Precio Venta",
      cell: (product: Product) => {
        const promo = promotions.find(
          (p) => p.productId === product.id && p.active && p.startDate <= today && p.endDate >= today,
        )
        if (promo) {
          return (
            <div className="flex items-center gap-2">
              <span className="line-through text-muted-foreground text-sm">${product.salePrice}</span>
              <span className="font-medium text-emerald-600">${promo.promoPrice}</span>
            </div>
          )
        }
        return <span>${product.salePrice}</span>
      },
    },
    {
      key: "margin",
      header: "Margen",
      cell: (product: Product) => {
        const margin = (((product.salePrice - product.purchasePrice) / product.salePrice) * 100).toFixed(1)
        return <span className={Number(margin) >= 20 ? "text-emerald-600" : "text-amber-600"}>{margin}%</span>
      },
    },
    {
      key: "status",
      header: "Estado",
      cell: (product: Product) => (
        <Badge variant={product.active ? "default" : "outline"}>{product.active ? "Activo" : "Inactivo"}</Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (product: Product) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            setEditingProduct(product)
            setFormOpen(true)
          }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  return (
    <div className="flex flex-col">
      <DashboardHeader title="Productos" description="Gestiona tu catálogo de productos" />

      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Proveedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los proveedores</SelectItem>
                {suppliers.map((sup) => (
                  <SelectItem key={sup.id} value={sup.id}>
                    {sup.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isViewer && (
            <Button
              onClick={() => {
                setEditingProduct(null)
                setFormOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          )}
        </div>

        <DataTable
          data={filteredProducts}
          columns={columns}
          searchPlaceholder="Buscar por nombre, SKU o código..."
          searchKey="name"
        />
      </div>

      <ProductForm open={formOpen} onOpenChange={setFormOpen} product={editingProduct} />
    </div>
  )
}
