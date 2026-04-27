"use client"

import { useEffect, useState, useCallback } from "react"
import { useStore } from "@/components/store-provider"
import { DashboardHeader } from "@/components/dashboard-header"
import { MetricCard } from "@/components/metric-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Package, 
  AlertTriangle, 
  TrendingDown, 
  DollarSign, 
  ArrowRight, 
  Boxes, 
  Tag,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"
import { cn } from "@/lib/utils"
import { navigationItems } from "@/lib/navigation-items"

export default function DashboardPage() {
  const { products, stock, categories, movements, promotions, currentUser, settings } = useStore()
  const router = useRouter()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const activeProducts = products.filter((p) => p.active)
  const lowStockProducts = stock.filter((s) => {
    const product = products.find((p) => p.id === s.productId && p.active)
    return product && s.quantity < s.minStock
  })

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentMovementProductIds = new Set(
    movements.filter((m) => new Date(m.createdAt) >= thirtyDaysAgo).map((m) => m.productId),
  )
  const noMovementProducts = activeProducts.filter((p) => !recentMovementProductIds.has(p.id))

  const totalInventoryValue = stock.reduce((acc, s) => {
    const product = products.find((p) => p.id === s.productId && p.active)
    if (product) {
      return acc + s.quantity * product.salePrice
    }
    return acc
  }, 0)

  const productsByCategory = categories
    .map((cat) => ({
      name: cat.name.length > 10 ? cat.name.substring(0, 10) + "..." : cat.name,
      cantidad: activeProducts.filter((p) => p.categoryId === cat.id).length,
    }))
    .filter((c) => c.cantidad > 0)

  const today = new Date().toISOString().split("T")[0]
  const activePromotions = promotions.filter((p) => p.active && p.startDate <= today && p.endDate >= today)
  const totalStockUnits = stock.reduce((acc, s) => acc + s.quantity, 0)

  const isManager = currentUser?.role === "manager"
  const isViewer = currentUser?.role === "viewer"
  const isAdmin = currentUser?.role === "admin"

  // Filter menu items based on role
  const availableMenuItems = navigationItems.filter(item =>
    currentUser && item.roles.includes(currentUser.role)
  )

  // Keyboard navigation for manager/viewer icon grid
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isAdmin) return // Admin uses full dashboard, no icon grid nav

    // Direct key shortcuts (1-9, 0, U, C, D)
    const keyUpper = e.key.toUpperCase()
    const directItem = availableMenuItems.find(item => item.key === keyUpper)
    if (directItem) {
      router.push(directItem.href)
      return
    }

    // Arrow navigation
    const cols = 4
    if (e.key === "ArrowRight") {
      setSelectedIndex(prev => Math.min(prev + 1, availableMenuItems.length - 1))
    } else if (e.key === "ArrowLeft") {
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === "ArrowDown") {
      setSelectedIndex(prev => Math.min(prev + cols, availableMenuItems.length - 1))
    } else if (e.key === "ArrowUp") {
      setSelectedIndex(prev => Math.max(prev - cols, 0))
    } else if (e.key === "Enter") {
      const item = availableMenuItems[selectedIndex]
      if (item) router.push(item.href)
    }
  }, [isAdmin, availableMenuItems, selectedIndex, router])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  const chartColors = ["#2d8a4e", "#e67e22", "#3498db", "#9b59b6", "#1abc9c"]

  const dashboardTitle = isViewer 
    ? "Vista General" 
    : isManager 
      ? "Panel de Control" 
      : "Dashboard"
  
  const dashboardDesc = isViewer
    ? "Resumen de inventario (solo lectura)"
    : isManager
      ? `Bienvenido, ${currentUser?.name}. Usa las teclas 1-8 o flechas para navegar.`
      : "Resumen general del inventario y operaciones"

  // Manager/Viewer: Icon Grid Layout
  if (isManager || isViewer) {
    return (
      <div className="flex flex-col min-h-full">
        <DashboardHeader title={dashboardTitle} description={dashboardDesc} />

        <div className="p-6 space-y-6 flex-1">
          {/* Quick Metrics */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <MetricCard
              title="Alertas Stock"
              value={lowStockProducts.length}
              icon={AlertTriangle}
              variant={lowStockProducts.length > 0 ? "warning" : "default"}
            />
            <MetricCard
              title="Productos"
              value={activeProducts.length}
              icon={Package}
            />
            <MetricCard
              title="Unidades"
              value={totalStockUnits.toLocaleString()}
              icon={Boxes}
            />
            <MetricCard
              title="Promociones"
              value={activePromotions.length}
              icon={Tag}
              variant={activePromotions.length > 0 ? "accent" : "default"}
            />
          </div>

          {/* Icon Grid Navigation */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Menu Rapido</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Teclas: 1-9, 0, U, C, D | Flechas + Enter
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {availableMenuItems.map((item, index) => {
                  const Icon = item.icon
                  const isSelected = index === selectedIndex
                  return (
                    <Link key={item.key} href={item.href}>
                      <div
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer hover:bg-muted/50 hover:border-primary/50",
                          isSelected && "ring-2 ring-primary ring-offset-2 border-primary bg-muted/30"
                        )}
                      >
                        <div className={cn("p-3 rounded-lg bg-muted", item.color)}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <span className="text-sm font-medium text-center">{item.name}</span>
                        <kbd className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{item.key}</kbd>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          {lowStockProducts.length > 0 && (
            <Card className="border-warning/50">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning-foreground" />
                  Productos por Reabastecer ({lowStockProducts.length})
                </CardTitle>
                <Link href="/dashboard/inventory">
                  <Button variant="ghost" size="sm">
                    Ver todo <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2">
                  {lowStockProducts.slice(0, 6).map((s) => {
                    const product = products.find((p) => p.id === s.productId)
                    return (
                      <div
                        key={s.productId}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <span className="font-medium text-sm truncate">{product?.name}</span>
                        <Badge variant="destructive" className="font-mono ml-2">
                          {s.quantity}/{s.minStock}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  // Admin: Full Dashboard with Charts
  return (
    <div className="flex flex-col">
      <DashboardHeader title={dashboardTitle} description={dashboardDesc} />

      <div className="p-6 space-y-6">
        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total de Productos"
            value={activeProducts.length}
            description={`${products.length - activeProducts.length} inactivos`}
            icon={Package}
          />
          <MetricCard
            title="Productos con Bajo Stock"
            value={lowStockProducts.length}
            description="Requieren reabastecimiento"
            icon={AlertTriangle}
            variant={lowStockProducts.length > 0 ? "warning" : "default"}
          />
          <MetricCard
            title="Sin Movimiento (30d)"
            value={noMovementProducts.length}
            description="Productos sin rotacion"
            icon={TrendingDown}
          />
          <MetricCard
            title="Valor del Inventario"
            value={`$${totalInventoryValue.toLocaleString()}`}
            description="Precio de venta total"
            icon={DollarSign}
            variant="success"
          />
        </div>

        {/* Charts and Alerts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Productos por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={productsByCategory}>
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                    {productsByCategory.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className={lowStockProducts.length > 0 ? "border-warning/50" : ""}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Alertas de Stock Bajo</CardTitle>
              <Link href="/dashboard/inventory">
                <Button variant="ghost" size="sm">
                  Ver todo <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No hay productos con stock bajo</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Minimo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockProducts.slice(0, 5).map((s) => {
                      const product = products.find((p) => p.id === s.productId)
                      return (
                        <TableRow key={s.productId}>
                          <TableCell className="font-medium">{product?.name}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="destructive">{s.quantity}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">{s.minStock}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Promotions */}
        {activePromotions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Tag className="h-4 w-4 text-accent" />
                Promociones Activas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {activePromotions.map((promo) => {
                  const product = products.find((p) => p.id === promo.productId)
                  return (
                    <div
                      key={promo.id}
                      className="flex items-center gap-3 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-sm">{product?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          <span className="line-through">${product?.salePrice}</span>
                          {" -> "}
                          <span className="text-primary font-semibold">${promo.promoPrice}</span>
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Hasta {promo.endDate}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
