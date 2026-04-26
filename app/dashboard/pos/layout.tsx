"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useStore } from "@/components/store-provider"
import {
  ShoppingCart,
  LayoutDashboard,
  Receipt,
  Coins,
  Package,
  Boxes,
  FileBarChart,
  Settings,
  LogOut,
  X,
  Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const quickNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, key: "D" },
  { name: "Facturas", href: "/dashboard/invoices", icon: Receipt, key: "F" },
  { name: "Caja", href: "/dashboard/cash", icon: Coins, key: "C" },
  { name: "Productos", href: "/dashboard/products", icon: Package, key: "P" },
  { name: "Inventario", href: "/dashboard/inventory", icon: Boxes, key: "I" },
  { name: "Reportes", href: "/dashboard/reports", icon: FileBarChart, key: "R" },
]

export default function POSLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, logout, settings } = useStore()
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    if (!currentUser) {
      router.push("/")
    }
  }, [currentUser, router])

  // Keyboard shortcut: Alt+M to toggle menu
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Alt+M = Toggle menu
      if (e.altKey && e.key.toLowerCase() === "m") {
        e.preventDefault()
        setShowMenu((prev) => !prev)
        return
      }

      // Escape closes menu
      if (e.key === "Escape" && showMenu) {
        setShowMenu(false)
        return
      }

      // Quick nav with Alt+Key when menu is open
      if (showMenu && e.altKey) {
        const nav = quickNav.find((n) => n.key.toLowerCase() === e.key.toLowerCase())
        if (nav) {
          e.preventDefault()
          router.push(nav.href)
          setShowMenu(false)
        }
      }
    }

    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [showMenu, router])

  if (!currentUser) return null

  return (
    <div className="relative min-h-screen bg-background">
      {/* Floating menu button */}
      <Button
        variant="default"
        size="icon"
        className={cn(
          "fixed top-3 left-3 z-50 h-12 w-12 rounded-full shadow-lg transition-all",
          showMenu ? "bg-destructive hover:bg-destructive/90" : ""
        )}
        onClick={() => setShowMenu(!showMenu)}
        style={!showMenu ? { backgroundColor: "#1a3a2a" } : {}}
      >
        {showMenu ? (
          <X className="h-6 w-6" />
        ) : (
          <ShoppingCart className="h-6 w-6" />
        )}
      </Button>

      {/* Quick access menu overlay */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu panel */}
          <div className="fixed top-0 left-0 z-40 h-full w-72 shadow-2xl flex flex-col" style={{ backgroundColor: "#1a3a2a" }}>
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/10">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                <ShoppingCart className="h-6 w-6" style={{ color: "#1a3a2a" }} />
              </div>
              <div>
                <p className="font-bold text-white">{settings?.storeName || "Super T"}</p>
                <p className="text-xs text-white/60">Punto de Venta</p>
              </div>
            </div>

            {/* User info */}
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-sm font-medium text-white">{currentUser.name}</p>
              <p className="text-xs text-white/60 capitalize">
                {currentUser.role === "admin" ? "Administrador" : "Encargado"}
              </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
              <p className="px-3 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
                Navegacion Rapida (Alt+Tecla)
              </p>
              {quickNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-white/10"
                  style={{ color: "#ffffff" }}
                >
                  <item.icon className="h-5 w-5" style={{ color: "#ffffff" }} />
                  <span className="flex-1" style={{ color: "#ffffff" }}>{item.name}</span>
                  <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-xs font-mono text-white/60">
                    Alt+{item.key}
                  </kbd>
                </Link>
              ))}

              {currentUser.role === "admin" && (
                <>
                  <div className="my-2 border-t border-white/10" />
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-white/10"
                    style={{ color: "#ffffff" }}
                  >
                    <Settings className="h-5 w-5" style={{ color: "#ffffff" }} />
                    <span style={{ color: "#ffffff" }}>Configuracion</span>
                  </Link>
                </>
              )}
            </nav>

            {/* Keyboard hints */}
            <div className="p-3 border-t border-white/10 bg-white/5">
              <p className="text-xs text-white/40 mb-2">Atajos de teclado POS:</p>
              <div className="grid grid-cols-2 gap-1 text-xs text-white/60">
                <span><kbd className="border border-white/20 px-1 rounded">F2</kbd> Buscar</span>
                <span><kbd className="border border-white/20 px-1 rounded">F4</kbd> Cobrar</span>
                <span><kbd className="border border-white/20 px-1 rounded">F5</kbd> Cliente</span>
                <span><kbd className="border border-white/20 px-1 rounded">F8</kbd> Limpiar</span>
                <span><kbd className="border border-white/20 px-1 rounded">Esc</kbd> Cancelar</span>
                <span><kbd className="border border-white/20 px-1 rounded">Alt+M</kbd> Menu</span>
              </div>
            </div>

            {/* Logout */}
            <div className="p-2 border-t border-white/10">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 hover:bg-red-600/20"
                style={{ color: "#fca5a5" }}
                onClick={() => {
                  logout()
                  setShowMenu(false)
                }}
              >
                <LogOut className="h-5 w-5" style={{ color: "#fca5a5" }} />
                <span style={{ color: "#fca5a5" }}>Cerrar Sesion</span>
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Main content - full screen */}
      <main className="min-h-screen">{children}</main>
    </div>
  )
}
