"use client"

import { useStore } from "@/components/store-provider"
import { Bell, Search, Menu, ShoppingCart, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet"
import { navigationItems } from "@/lib/navigation-items"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface DashboardHeaderProps {
  title: string
  description?: string
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  const { stock, products, currentUser, logout } = useStore()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const lowStockCount = stock.filter((s) => {
    const product = products.find((p) => p.id === s.productId && p.active)
    return product && s.quantity < s.minStock
  }).length

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center gap-4">
        {/* Unified Menu Trigger (Icon) */}
        <div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 flex flex-col" style={{ backgroundColor: "#1a3a2a" }}>
              <SheetHeader className="h-16 border-b border-white/10 px-4 flex items-center justify-start flex-row gap-2 space-y-0 shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
                  <ShoppingCart className="h-5 w-5" style={{ color: "#1a3a2a" }} />
                </div>
                <SheetTitle className="text-white">Super T</SheetTitle>
              </SheetHeader>

              <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
                {navigationItems
                  .filter((item) => currentUser && item.roles.includes(currentUser.role))
                  .map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          isActive ? "bg-white/20" : "hover:bg-white/10",
                        )}
                        style={{ color: "#ffffff" }}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" style={{ color: "#ffffff" }} />
                        <span>{item.name}</span>
                      </Link>
                    )
                  })}
              </nav>

              <div className="border-t border-white/10 p-2 shrink-0">
                {currentUser && (
                  <div className="mb-2 px-3 py-2 rounded-lg bg-white/10">
                    <p className="text-sm font-medium text-white">{currentUser.name}</p>
                    <p className="text-xs text-white/60 capitalize">
                      {currentUser.role === "admin"
                        ? "Administrador"
                        : currentUser.role === "manager"
                          ? "Encargado"
                          : "Visualizador"}
                    </p>
                  </div>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 hover:bg-red-600/20"
                  style={{ color: "#fca5a5" }}
                  onClick={() => {
                    setOpen(false)
                    logout()
                  }}
                >
                  <LogOut className="h-5 w-5" style={{ color: "#fca5a5" }} />
                  <span style={{ color: "#fca5a5" }}>Cerrar Sesión</span>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div>
          <h1 className="text-lg md:text-xl font-semibold text-foreground truncate max-w-[150px] sm:max-w-none">{title}</h1>
          {description && <p className="text-sm text-muted-foreground hidden sm:block">{description}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
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
