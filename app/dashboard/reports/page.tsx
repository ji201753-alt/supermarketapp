"use client"

import { useState, useMemo } from "react"
import { useStore } from "@/components/store-provider"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, Package, AlertTriangle, TrendingUp, FileSpreadsheet } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"

export default function ReportsPage() {
  const { products, stock, movements, categories, suppliers } = useStore()
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [supplierFilter, setSupplierFilter] = useState<string>("all")

  // Filter products
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => p.active)
    if (categoryFilter !== "all") {
      result = result.filter((p) => p.categoryId === categoryFilter)
    }
    if (supplierFilter !== "all") {
      result = result.filter((p) => p.supplierId === supplierFilter)
    }
    return result
  }, [products, categoryFilter, supplierFilter])

  // Inventory report data
  const inventoryReport = useMemo(() => {
    return filteredProducts.map((product) => {
      const stockItem = stock.find((s) => s.productId === product.id)
      const category = categories.find((c) => c.id === product.categoryId)
      const supplier = suppliers.find((s) => s.id === product.supplierId)
      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: category?.name || "-",
        supplier: supplier?.name || "-",
        quantity: stockItem?.quantity || 0,
        minStock: stockItem?.minStock || 0,
        purchasePrice: product.purchasePrice,
        salePrice: product.salePrice,
        stockValue: (stockItem?.quantity || 0) * product.salePrice,
        isLow: stockItem ? stockItem.quantity < stockItem.minStock : false,
      }
    })
  }, [filteredProducts, stock, categories, suppliers])

  // Low stock report
  const lowStockReport = useMemo(() => {
    return inventoryReport.filter((item) => item.isLow).sort((a, b) => a.quantity - b.quantity)
  }, [inventoryReport])

  // Most sold products (based on exit movements)
  const mostSoldReport = useMemo(() => {
    const salesMap = new Map<string, number>()
    movements
      .filter((m) => m.type === "exit")
      .forEach((m) => {
        salesMap.set(m.productId, (salesMap.get(m.productId) || 0) + m.quantity)
      })

    return filteredProducts
      .map((product) => {
        const category = categories.find((c) => c.id === product.categoryId)
        return {
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: category?.name || "-",
          totalSold: salesMap.get(product.id) || 0,
          salePrice: product.salePrice,
          revenue: (salesMap.get(product.id) || 0) * product.salePrice,
        }
      })
      .filter((p) => p.totalSold > 0)
      .sort((a, b) => b.totalSold - a.totalSold)
  }, [filteredProducts, movements, categories])

  // Chart data for top 10 most sold
  const chartData = mostSoldReport.slice(0, 10).map((item) => ({
    name: item.name.length > 15 ? item.name.substring(0, 15) + "..." : item.name,
    vendido: item.totalSold,
  }))

  // Download CSV function
  const downloadCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) return

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((header) => `"${String(row[header as keyof typeof row]).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  return (
    <div className="flex flex-col">
      <DashboardHeader title="Reportes" description="Genera y descarga reportes del inventario" />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtros</CardTitle>
            <CardDescription>Filtra los reportes por categoría o proveedor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="w-48">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
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
              </div>
              <div className="w-48">
                <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                  <SelectTrigger>
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
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList>
            <TabsTrigger value="inventory" className="gap-2">
              <Package className="h-4 w-4" />
              Inventario Actual
            </TabsTrigger>
            <TabsTrigger value="lowstock" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Bajo Stock
            </TabsTrigger>
            <TabsTrigger value="sales" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Más Vendidos
            </TabsTrigger>
          </TabsList>

          {/* Inventory Report */}
          <TabsContent value="inventory">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Reporte de Inventario Actual</CardTitle>
                  <CardDescription>{inventoryReport.length} productos</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    downloadCSV(
                      inventoryReport.map((item) => ({
                        Nombre: item.name,
                        SKU: item.sku,
                        Categoría: item.category,
                        Proveedor: item.supplier,
                        Stock: item.quantity,
                        "Stock Mínimo": item.minStock,
                        "Precio Compra": item.purchasePrice,
                        "Precio Venta": item.salePrice,
                        "Valor Stock": item.stockValue,
                      })),
                      "inventario",
                    )
                  }
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryReport.slice(0, 20).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={item.isLow ? "destructive" : "secondary"}>{item.quantity}</Badge>
                          </TableCell>
                          <TableCell className="text-right">${item.salePrice}</TableCell>
                          <TableCell className="text-right font-medium">${item.stockValue.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {inventoryReport.length > 20 && (
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    Mostrando 20 de {inventoryReport.length} productos. Descarga el CSV para ver todos.
                  </p>
                )}
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">
                    Valor Total del Inventario:{" "}
                    <span className="text-lg">
                      ${inventoryReport.reduce((acc, item) => acc + item.stockValue, 0).toLocaleString()}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Low Stock Report */}
          <TabsContent value="lowstock">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Productos con Bajo Stock</CardTitle>
                  <CardDescription>{lowStockReport.length} productos requieren reabastecimiento</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    downloadCSV(
                      lowStockReport.map((item) => ({
                        Nombre: item.name,
                        SKU: item.sku,
                        Categoría: item.category,
                        Proveedor: item.supplier,
                        "Stock Actual": item.quantity,
                        "Stock Mínimo": item.minStock,
                        Faltante: item.minStock - item.quantity,
                      })),
                      "bajo_stock",
                    )
                  }
                  disabled={lowStockReport.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar CSV
                </Button>
              </CardHeader>
              <CardContent>
                {lowStockReport.length === 0 ? (
                  <div className="text-center py-12">
                    <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No hay productos con stock bajo</p>
                  </div>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Proveedor</TableHead>
                          <TableHead className="text-right">Stock Actual</TableHead>
                          <TableHead className="text-right">Stock Mínimo</TableHead>
                          <TableHead className="text-right">Faltante</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lowStockReport.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                            <TableCell>{item.supplier}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="destructive">{item.quantity}</Badge>
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">{item.minStock}</TableCell>
                            <TableCell className="text-right font-medium text-destructive">
                              {item.minStock - item.quantity}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sales Report */}
          <TabsContent value="sales">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Productos Más Vendidos</CardTitle>
                  <CardDescription>Basado en movimientos de salida registrados</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    downloadCSV(
                      mostSoldReport.map((item) => ({
                        Nombre: item.name,
                        SKU: item.sku,
                        Categoría: item.category,
                        "Unidades Vendidas": item.totalSold,
                        "Precio Unitario": item.salePrice,
                        "Ingresos Totales": item.revenue,
                      })),
                      "mas_vendidos",
                    )
                  }
                  disabled={mostSoldReport.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar CSV
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {mostSoldReport.length === 0 ? (
                  <div className="text-center py-12">
                    <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No hay datos de ventas registrados</p>
                  </div>
                ) : (
                  <>
                    {/* Chart */}
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical">
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={120} fontSize={12} />
                          <Tooltip />
                          <Bar dataKey="vendido" radius={[0, 4, 4, 0]}>
                            {chartData.map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={index === 0 ? "hsl(var(--chart-1))" : "hsl(var(--primary))"}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Table */}
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Producto</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead className="text-right">Vendidos</TableHead>
                            <TableHead className="text-right">Ingresos</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mostSoldReport.slice(0, 10).map((item, index) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Badge variant={index < 3 ? "default" : "secondary"}>{index + 1}</Badge>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <span className="font-medium">{item.name}</span>
                                  <p className="text-xs text-muted-foreground">{item.sku}</p>
                                </div>
                              </TableCell>
                              <TableCell>{item.category}</TableCell>
                              <TableCell className="text-right font-medium">{item.totalSold}</TableCell>
                              <TableCell className="text-right font-medium text-emerald-600">
                                ${item.revenue.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
