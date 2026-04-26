"use client"

import { useStore } from "@/components/store-provider"
import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface DashboardHeaderProps {
  title: string
  description?: string
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  const { stock, products } = useStore()

  const lowStockCount = stock.filter((s) => {
    const product = products.find((p) => p.id === s.productId && p.active)
    return product && s.quantity < s.minStock
  }).length

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar..." className="w-64 pl-9" />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {lowStockCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                >
                  {lowStockCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            {lowStockCount > 0 ? (
              <>
                <div className="px-3 py-2 text-sm font-medium">Alertas de Stock Bajo</div>
                {stock
                  .filter((s) => {
                    const product = products.find((p) => p.id === s.productId && p.active)
                    return product && s.quantity < s.minStock
                  })
                  .slice(0, 5)
                  .map((s) => {
                    const product = products.find((p) => p.id === s.productId)
                    return (
                      <DropdownMenuItem key={s.productId} className="flex flex-col items-start">
                        <span className="font-medium">{product?.name}</span>
                        <span className="text-xs text-destructive">
                          Stock: {s.quantity} / Mínimo: {s.minStock}
                        </span>
                      </DropdownMenuItem>
                    )
                  })}
              </>
            ) : (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">No hay alertas pendientes</div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
