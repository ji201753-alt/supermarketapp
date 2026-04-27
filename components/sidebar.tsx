"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useStore } from "@/components/store-provider"
import {
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { navigationItems } from "@/lib/navigation-items"

export function Sidebar() {
  const pathname = usePathname()
  const { currentUser, logout } = useStore()
  const [collapsed, setCollapsed] = useState(false)

  const filteredNav = navigationItems.filter((item) => {
    if (!currentUser) return false
    return item.roles.includes(currentUser.role)
  })

  return (
    <div
      className={cn(
        "flex flex-col shrink-0 transition-all duration-300 z-50",
        collapsed ? "w-16" : "w-64",
        "fixed inset-y-0 left-0 lg:static lg:inset-auto"
      )}
      style={{
        backgroundColor: "#1a3a2a",
        minHeight: "100%",
      }}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
              <ShoppingCart className="h-5 w-5" style={{ color: "#1a3a2a" }} />
            </div>
            <span className="font-bold text-white">Super T</span>
          </div>
        )}
        {collapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white mx-auto">
            <ShoppingCart className="h-5 w-5" style={{ color: "#1a3a2a" }} />
          </div>
        )}
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {collapsed && (
        <div className="p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full h-8 text-white/70 hover:text-white hover:bg-white/10"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/20"
                  : "hover:bg-white/10",
              )}
              style={{ color: "#ffffff" }}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" style={{ color: "#ffffff" }} />
              {!collapsed && <span style={{ color: "#ffffff" }}>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-2">
        {!collapsed && currentUser && (
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
          className={cn(
            "w-full justify-start gap-3 hover:bg-red-600/20",
            collapsed && "justify-center",
          )}
          style={{ color: "#fca5a5" }}
          onClick={logout}
        >
          <LogOut className="h-5 w-5" style={{ color: "#fca5a5" }} />
          {!collapsed && <span style={{ color: "#fca5a5" }}>Cerrar Sesion</span>}
        </Button>
      </div>
    </div>
  )
}
