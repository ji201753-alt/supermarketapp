"use client"

import { useState } from "react"
import { useStore } from "@/components/store-provider"
import { DashboardHeader } from "@/components/dashboard-header"
import { DataTable } from "@/components/data-table"
import { InventoryMovementForm } from "@/components/inventory-movement-form"
import { StockConfigForm } from "@/components/stock-config-form"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Settings, ArrowDownToLine, ArrowUpFromLine, Settings2 } from "lucide-react"
import type { Product } from "@/lib/types"

export default function InventoryPage() {
  const { products, stock, movements, users, currentUser } = useStore()
  const [movementFormOpen, setMovementFormOpen] = useState(false)
  const [stockConfigOpen, setStockConfigOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const isViewer = currentUser?.role === "viewer"

  // Combine products with their stock
  const inventoryData = products
    .filter((p) => p.active)
    .map((product) => {
      const stockItem = stock.find((s) => s.productId === product.id)
      return {
        ...product,
        quantity: stockItem?.quantity || 0,
        minStock: stockItem?.minStock || 0,
        isLow: stockItem ? stockItem.quantity < stockItem.minStock : false,
      }
    })

  const columns = [
    {
      key: "name",
      header: "Producto",
      cell: (item: (typeof inventoryData)[0]) => (
        <div>
          <span className="font-medium">{item.name}</span>
          <p className="text-xs text-muted-foreground">{item.sku}</p>
        </div>
      ),
    },
    {
      key: "quantity",
      header: "Stock Actual",
      cell: (item: (typeof inventoryData)[0]) => (
        <Badge variant={item.isLow ? "destructive" : "secondary"} className="font-mono">
          {item.quantity}
        </Badge>
      ),
    },
    {
      key: "minStock",
      header: "Stock Mínimo",
      cell: (item: (typeof inventoryData)[0]) => <span className="text-muted-foreground">{item.minStock}</span>,
    },
    {
      key: "status",
      header: "Estado",
      cell: (item: (typeof inventoryData)[0]) => (
        <Badge variant={item.isLow ? "destructive" : "outline"} className="text-xs">
          {item.isLow ? "Bajo Stock" : "Normal"}
        </Badge>
      ),
    },
    {
      key: "value",
      header: "Valor",
      cell: (item: (typeof inventoryData)[0]) => (
        <span className="font-medium">${(item.quantity * item.salePrice).toLocaleString()}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (item: (typeof inventoryData)[0]) => (
        <div className="flex items-center gap-1">
          {!isViewer && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedProduct(item)
                  setMovementFormOpen(true)
                }}
                title="Registrar movimiento"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedProduct(item)
                  setStockConfigOpen(true)
                }}
                title="Configurar stock mínimo"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]

  // Sorted movements by date
  const sortedMovements = [...movements].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const movementColumns = [
    {
      key: "date",
      header: "Fecha",
      cell: (m: (typeof movements)[0]) => <span>{new Date(m.createdAt).toLocaleDateString("es-MX")}</span>,
    },
    {
      key: "product",
      header: "Producto",
      cell: (m: (typeof movements)[0]) => {
        const product = products.find((p) => p.id === m.productId)
        return <span className="font-medium">{product?.name || "-"}</span>
      },
    },
    {
      key: "type",
      header: "Tipo",
      cell: (m: (typeof movements)[0]) => {
        const config = {
          entry: { label: "Entrada", icon: ArrowDownToLine, class: "text-emerald-600" },
          exit: { label: "Salida", icon: ArrowUpFromLine, class: "text-red-600" },
          adjustment: { label: "Ajuste", icon: Settings2, class: "text-amber-600" },
        }
        const c = config[m.type]
        const Icon = c.icon
        return (
          <div className={`flex items-center gap-1.5 ${c.class}`}>
            <Icon className="h-4 w-4" />
            <span className="text-sm font-medium">{c.label}</span>
          </div>
        )
      },
    },
    {
      key: "quantity",
      header: "Cantidad",
      cell: (m: (typeof movements)[0]) => (
        <span className={`font-mono ${m.type === "exit" ? "text-red-600" : "text-emerald-600"}`}>
          {m.type === "exit" ? "-" : "+"}
          {m.quantity}
        </span>
      ),
    },
    {
      key: "reason",
      header: "Motivo",
      cell: (m: (typeof movements)[0]) => <span className="text-muted-foreground">{m.reason}</span>,
    },
    {
      key: "user",
      header: "Usuario",
      cell: (m: (typeof movements)[0]) => {
        const user = users.find((u) => u.id === m.userId)
        return <span className="text-sm">{user?.name || "-"}</span>
      },
    },
  ]

  return (
    <div className="flex flex-col">
      <DashboardHeader title="Inventario" description="Control de stock y movimientos" />

      <div className="p-6">
        <Tabs defaultValue="stock" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="stock">Stock Actual</TabsTrigger>
              <TabsTrigger value="movements">Historial de Movimientos</TabsTrigger>
            </TabsList>

            {!isViewer && (
              <Button
                onClick={() => {
                  setSelectedProduct(null)
                  setMovementFormOpen(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Movimiento
              </Button>
            )}
          </div>

          <TabsContent value="stock" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total en Stock</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{inventoryData.reduce((acc, item) => acc + item.quantity, 0)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Productos con Bajo Stock</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-amber-600">{inventoryData.filter((i) => i.isLow).length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Valor Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    ${inventoryData.reduce((acc, item) => acc + item.quantity * item.salePrice, 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>

            <DataTable data={inventoryData} columns={columns} searchPlaceholder="Buscar producto..." searchKey="name" />
          </TabsContent>

          <TabsContent value="movements">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Historial de Movimientos</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {movementColumns.map((col) => (
                        <TableHead key={col.key}>{col.header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedMovements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={movementColumns.length} className="h-24 text-center text-muted-foreground">
                          No hay movimientos registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedMovements.map((movement) => (
                        <TableRow key={movement.id}>
                          {movementColumns.map((col) => (
                            <TableCell key={col.key}>{col.cell(movement)}</TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <InventoryMovementForm open={movementFormOpen} onOpenChange={setMovementFormOpen} product={selectedProduct} />

      <StockConfigForm open={stockConfigOpen} onOpenChange={setStockConfigOpen} product={selectedProduct} />
    </div>
  )
}
