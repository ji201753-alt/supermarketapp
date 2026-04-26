"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useStore } from "@/components/store-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Building2,
  Receipt,
  Barcode,
  X,
  Check,
  User,
  Printer,
  Keyboard,
  Coins,
} from "lucide-react"
import type { Product, Stock, InvoiceItem, Client, Invoice } from "@/lib/types"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface CartItem extends InvoiceItem {
  stock: number
  promoPrice?: number
}

export default function POSPage() {
  const {
    products,
    stock,
    promotions,
    clients,
    currentUser,
    settings,
    updateSettings,
    getServices,
    refreshData,
  } = useStore()

  const [searchQuery, setSearchQuery] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<Invoice["paymentMethod"]>("cash")
  const [notes, setNotes] = useState("")
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showClientDialog, setShowClientDialog] = useState(false)
  const [clientSearch, setClientSearch] = useState("")
  const [cashReceived, setCashReceived] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastInvoice, setLastInvoice] = useState<Invoice | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [selectedProductIndex, setSelectedProductIndex] = useState(0)
  const [selectedCartIndex, setSelectedCartIndex] = useState(-1) // -1 = no selection, focus on products
  const [editingTaxRate, setEditingTaxRate] = useState(false)
  const [tempTaxRate, setTempTaxRate] = useState("")
  const [lastChange, setLastChange] = useState(0)
  const [focusArea, setFocusArea] = useState<"products" | "cart">("products")

  const searchInputRef = useRef<HTMLInputElement>(null)
  const cashReceivedRef = useRef<HTMLInputElement>(null)
  const productListRef = useRef<HTMLDivElement>(null)
  const cartListRef = useRef<HTMLDivElement>(null)

  // Barcode buffer - auto-submits after scanner sends data rapidly
  const barcodeBuffer = useRef("")
  const barcodeTimeout = useRef<NodeJS.Timeout | null>(null)

  // Focus search on mount
  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  // Re-focus search after dialogs close
  useEffect(() => {
    if (!showPaymentDialog && !showSuccessDialog && !showClientDialog) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [showPaymentDialog, showSuccessDialog, showClientDialog])

  // Focus cash received input when payment dialog opens
  useEffect(() => {
    if (showPaymentDialog && paymentMethod === "cash") {
      setTimeout(() => cashReceivedRef.current?.focus(), 100)
    }
  }, [showPaymentDialog, paymentMethod])

  // Filter products based on search
  const filteredProducts = searchQuery.length > 0
    ? products.filter((p) => {
        if (!p.active) return false
        const q = searchQuery.toLowerCase()
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.includes(q)
        )
      })
    : []

  // Filter clients - search by name, cedula, RUC/taxId, email
  const filteredClients = clients.filter((c) => {
    if (!c.active) return false
    const q = clientSearch.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      (c.cedula && c.cedula.toLowerCase().includes(q)) ||
      (c.ruc && c.ruc.toLowerCase().includes(q)) ||
      (c.taxId && c.taxId.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    )
  })

  // Stock helpers
  const getProductStock = useCallback(
    (productId: string): Stock | undefined => stock.find((s) => s.productId === productId),
    [stock],
  )

  const getActivePromotion = useCallback(
    (productId: string) => {
      const today = new Date().toISOString().split("T")[0]
      return promotions.find(
        (p) => p.productId === productId && p.active && p.startDate <= today && p.endDate >= today,
      )
    },
    [promotions],
  )

  // Totals
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const discountAmount = (subtotal * discount) / 100
  const taxableAmount = subtotal - discountAmount
  const taxAmount = taxableAmount * (settings.taxRate / 100)
  const total = taxableAmount + taxAmount
  const change =
    paymentMethod === "cash" && cashReceived ? parseFloat(cashReceived) - total : 0

  // Add product to cart
  const addToCart = useCallback(
    (product: Product) => {
      const productStock = getProductStock(product.id)
      const promo = getActivePromotion(product.id)
      const unitPrice = promo?.promoPrice || product.salePrice
      const availableStock = productStock?.quantity || 0

      setCart((prev) => {
        const idx = prev.findIndex((item) => item.productId === product.id)
        if (idx >= 0) {
          const existing = prev[idx]
          if (existing.quantity >= availableStock) return prev
          const qty = existing.quantity + 1
          const sub = qty * unitPrice
          const tax = sub * (settings.taxRate / 100)
          const newCart = [...prev]
          newCart[idx] = { ...existing, quantity: qty, subtotal: sub, tax, total: sub + tax }
          return newCart
        }
        if (availableStock <= 0) return prev
        return [
          ...prev,
          {
            id: `cart-${Date.now()}`,
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantity: 1,
            unitPrice,
            discount: 0,
            subtotal: unitPrice,
            tax: unitPrice * (settings.taxRate / 100),
            total: unitPrice * (1 + settings.taxRate / 100),
            stock: availableStock,
            promoPrice: promo?.promoPrice,
          },
        ]
      })

      setSearchQuery("")
      setSelectedProductIndex(0)
    },
    [getProductStock, getActivePromotion, settings.taxRate],
  )

  // Update quantity
  const updateQuantity = useCallback(
    (itemId: string, delta: number) => {
      setCart((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item
          const qty = Math.max(1, Math.min(item.stock, item.quantity + delta))
          const sub = qty * item.unitPrice
          const tax = sub * (settings.taxRate / 100)
          return { ...item, quantity: qty, subtotal: sub, tax, total: sub + tax }
        }),
      )
    },
    [settings.taxRate],
  )

  const removeFromCart = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    setSelectedClient(null)
    setDiscount(0)
    setNotes("")
    setPaymentMethod("cash")
    setCashReceived("")
    setLastChange(0)
  }, [])

  // Process payment
  const processPayment = async () => {
    if (cart.length === 0 || !currentUser) return
    setIsProcessing(true)
    try {
      const services = getServices()
      const items = cart.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        subtotal: item.subtotal,
        tax: item.tax,
        total: item.total,
      }))
      const invoice = await services.pos.createInvoice({
        clientId: selectedClient?.id,
        clientName: selectedClient?.name || "Publico General",
        clientTaxId: selectedClient?.taxId,
        items,
        paymentMethod,
        discount,
        notes,
        cashierId: currentUser.id,
        cashierName: currentUser.name,
      })
      const result = await services.pos.issueAndPayInvoice(invoice.id)
      if (result) {
        setLastInvoice(result.invoice)
        setLastChange(change > 0 ? change : 0)
        setShowPaymentDialog(false)
        setShowSuccessDialog(true)
        clearCart()
        await refreshData()
      }
    } catch (error) {
      console.error("Error processing payment:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Print thermal receipt
  const printReceipt = useCallback(() => {
    if (!lastInvoice) return
    const receiptWindow = window.open("", "_blank", "width=320,height=600")
    if (!receiptWindow) return

    const itemsHtml = lastInvoice.items
      .map(
        (item) => `
      <tr>
        <td style="text-align:left;padding:2px 0;">${item.productName}</td>
        <td style="text-align:center;padding:2px 4px;">${item.quantity}</td>
        <td style="text-align:right;padding:2px 0;">$${item.subtotal.toFixed(2)}</td>
      </tr>`,
      )
      .join("")

    receiptWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Recibo - ${lastInvoice.number}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            width: 80mm;
            padding: 4mm;
            color: #000;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .line { display: flex; justify-content: space-between; padding: 1px 0; }
          .big { font-size: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; border-bottom: 1px solid #000; padding: 2px 0; font-size: 11px; }
          th:nth-child(2) { text-align: center; }
          th:last-child { text-align: right; }
        </style>
      </head>
      <body>
        <div class="center bold big">${settings.storeName || "Super T"}</div>
        ${settings.storeAddress ? `<div class="center" style="font-size:10px;">${settings.storeAddress}</div>` : ""}
        ${settings.storePhone ? `<div class="center" style="font-size:10px;">Tel: ${settings.storePhone}</div>` : ""}
        <div class="divider"></div>
        <div class="line"><span>Factura:</span><span class="bold">${lastInvoice.number}</span></div>
        <div class="line"><span>Fecha:</span><span>${new Date(lastInvoice.createdAt).toLocaleString("es")}</span></div>
        <div class="line"><span>Cliente:</span><span>${lastInvoice.clientName}</span></div>
        <div class="line"><span>Cajero:</span><span>${lastInvoice.cashierName}</span></div>
        <div class="divider"></div>
        <table>
          <thead>
            <tr><th>Producto</th><th>Cant</th><th>Total</th></tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div class="divider"></div>
        <div class="line"><span>Subtotal:</span><span>$${lastInvoice.subtotal.toFixed(2)}</span></div>
        ${lastInvoice.discount > 0 ? `<div class="line"><span>Descuento (${lastInvoice.discount}%):</span><span>-$${((lastInvoice.subtotal * lastInvoice.discount) / 100).toFixed(2)}</span></div>` : ""}
        <div class="line"><span>IVA (${lastInvoice.taxRate}%):</span><span>$${lastInvoice.taxAmount.toFixed(2)}</span></div>
        <div class="divider"></div>
        <div class="line bold big"><span>TOTAL:</span><span>$${lastInvoice.total.toFixed(2)}</span></div>
        <div class="divider"></div>
        <div class="line"><span>Pago:</span><span>${lastInvoice.paymentMethod === "cash" ? "Efectivo" : lastInvoice.paymentMethod === "card" ? "Tarjeta" : lastInvoice.paymentMethod === "transfer" ? "Transferencia" : "Credito"}</span></div>
        ${lastChange > 0 ? `<div class="line bold"><span>Cambio:</span><span>$${lastChange.toFixed(2)}</span></div>` : ""}
        <div class="divider"></div>
        <div class="center" style="margin-top:8px;font-size:11px;">Gracias por su compra</div>
        <div class="center" style="font-size:10px;margin-top:4px;">${settings.storeName || "Super T"}</div>
        <script>window.onload=function(){window.print();}</script>
      </body>
      </html>
    `)
    receiptWindow.document.close()
  }, [lastInvoice, lastChange, settings])

  // Save IVA
  const saveTaxRate = async () => {
    const rate = parseFloat(tempTaxRate)
    if (!isNaN(rate) && rate >= 0 && rate <= 100) {
      await updateSettings({ taxRate: rate })
      // Recalculate cart with new rate
      setCart((prev) =>
        prev.map((item) => {
          const sub = item.quantity * item.unitPrice
          const tax = sub * (rate / 100)
          return { ...item, subtotal: sub, tax, total: sub + tax }
        }),
      )
    }
    setEditingTaxRate(false)
  }

  // ========== GLOBAL KEYBOARD HANDLER ==========
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      // Don't intercept if inside a dialog textarea or specific inputs
      const target = e.target as HTMLElement
      const isInDialog = target.closest("[role='dialog']")

      // F2 = Focus search / barcode input
      if (e.key === "F2") {
        e.preventDefault()
        searchInputRef.current?.focus()
        return
      }

      // F4 = Open payment
      if (e.key === "F4" && cart.length > 0) {
        e.preventDefault()
        setShowPaymentDialog(true)
        return
      }

      // F5 = Select client
      if (e.key === "F5") {
        e.preventDefault()
        setShowClientDialog(true)
        return
      }

      // F8 = Clear cart
      if (e.key === "F8") {
        e.preventDefault()
        clearCart()
        return
      }

      // F9 = Print last receipt
      if (e.key === "F9" && lastInvoice) {
        e.preventDefault()
        printReceipt()
        return
      }

      // Tab = Switch focus between products and cart
      if (e.key === "Tab" && !isInDialog) {
        e.preventDefault()
        if (focusArea === "products") {
          setFocusArea("cart")
          setSelectedCartIndex(cart.length > 0 ? 0 : -1)
        } else {
          setFocusArea("products")
          setSelectedCartIndex(-1)
          searchInputRef.current?.focus()
        }
        return
      }

      // Cart navigation when focused on cart
      if (focusArea === "cart" && cart.length > 0 && !isInDialog) {
        if (e.key === "ArrowUp") {
          e.preventDefault()
          setSelectedCartIndex((prev) => Math.max(0, prev - 1))
          const el = cartListRef.current?.querySelector(`[data-cart-index="${Math.max(0, selectedCartIndex - 1)}"]`)
          el?.scrollIntoView({ block: "nearest" })
          return
        }
        if (e.key === "ArrowDown") {
          e.preventDefault()
          setSelectedCartIndex((prev) => Math.min(cart.length - 1, prev + 1))
          const el = cartListRef.current?.querySelector(`[data-cart-index="${Math.min(cart.length - 1, selectedCartIndex + 1)}"]`)
          el?.scrollIntoView({ block: "nearest" })
          return
        }
        // + or = to increase quantity
        if ((e.key === "+" || e.key === "=") && selectedCartIndex >= 0) {
          e.preventDefault()
          const item = cart[selectedCartIndex]
          if (item && item.quantity < item.stock) {
            updateQuantity(item.id, 1)
          }
          return
        }
        // - to decrease quantity
        if (e.key === "-" && selectedCartIndex >= 0) {
          e.preventDefault()
          const item = cart[selectedCartIndex]
          if (item && item.quantity > 1) {
            updateQuantity(item.id, -1)
          }
          return
        }
        // Delete or Backspace to remove item
        if ((e.key === "Delete" || e.key === "Backspace") && selectedCartIndex >= 0) {
          e.preventDefault()
          const item = cart[selectedCartIndex]
          if (item) {
            removeFromCart(item.id)
            setSelectedCartIndex((prev) => Math.min(prev, cart.length - 2))
          }
          return
        }
      }

      // Escape = close dialogs or clear search
      if (e.key === "Escape") {
        if (showPaymentDialog) {
          setShowPaymentDialog(false)
        } else if (showSuccessDialog) {
          setShowSuccessDialog(false)
        } else if (showClientDialog) {
          setShowClientDialog(false)
        } else if (searchQuery) {
          setSearchQuery("")
        }
        return
      }

      // In payment dialog: Enter = confirm payment
      if (isInDialog && showPaymentDialog && e.key === "Enter") {
        const canPay = paymentMethod !== "cash" || (cashReceived && parseFloat(cashReceived) >= total)
        if (canPay && !isProcessing) {
          e.preventDefault()
          processPayment()
        }
        return
      }

      // In success dialog: Enter = new sale, P = print
      if (isInDialog && showSuccessDialog) {
        if (e.key === "Enter") {
          e.preventDefault()
          setShowSuccessDialog(false)
        } else if (e.key.toLowerCase() === "p") {
          e.preventDefault()
          printReceipt()
        }
        return
      }

      // In payment dialog: 1-4 = select payment method
      if (isInDialog && showPaymentDialog && !target.matches("input,textarea")) {
        if (e.key === "1") { setPaymentMethod("cash"); return }
        if (e.key === "2") { setPaymentMethod("card"); return }
        if (e.key === "3") { setPaymentMethod("transfer"); return }
        if (e.key === "4") { setPaymentMethod("credit"); return }
      }
    }

    window.addEventListener("keydown", handleGlobalKey)
    return () => window.removeEventListener("keydown", handleGlobalKey)
  }, [
    cart,
    searchQuery,
    showPaymentDialog,
    showSuccessDialog,
    showClientDialog,
    paymentMethod,
    cashReceived,
    total,
    isProcessing,
    lastInvoice,
    clearCart,
    printReceipt,
    processPayment,
    focusArea,
    selectedCartIndex,
    updateQuantity,
    removeFromCart,
  ])

  // Handle barcode scanner input (rapid keystrokes)
  useEffect(() => {
    const handleBarcodeInput = (e: KeyboardEvent) => {
      // Barcode scanners type very fast and end with Enter
      if (e.target !== searchInputRef.current) return

      if (e.key === "Enter") {
        if (barcodeBuffer.current.length > 3) {
          // Likely a barcode scan
          const code = barcodeBuffer.current
          const product = products.find(
            (p) => p.active && (p.barcode === code || p.sku === code),
          )
          if (product) {
            addToCart(product)
          }
          barcodeBuffer.current = ""
          return
        }
        barcodeBuffer.current = ""
        // Normal Enter - select first product
        if (filteredProducts.length > 0) {
          addToCart(filteredProducts[selectedProductIndex] || filteredProducts[0])
        }
        return
      }

      // Accumulate characters for barcode
      if (e.key.length === 1) {
        barcodeBuffer.current += e.key
        if (barcodeTimeout.current) clearTimeout(barcodeTimeout.current)
        barcodeTimeout.current = setTimeout(() => {
          barcodeBuffer.current = ""
        }, 200) // Barcode scanners type within 200ms
      }
    }

    window.addEventListener("keydown", handleBarcodeInput)
    return () => window.removeEventListener("keydown", handleBarcodeInput)
  }, [products, filteredProducts, selectedProductIndex, addToCart])

  // Search keyboard navigation
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedProductIndex((prev) => Math.min(prev + 1, filteredProducts.length - 1))
      // Scroll selected item into view
      const el = productListRef.current?.querySelector(`[data-index="${selectedProductIndex + 1}"]`)
      el?.scrollIntoView({ block: "nearest" })
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedProductIndex((prev) => Math.max(prev - 1, 0))
      const el = productListRef.current?.querySelector(`[data-index="${selectedProductIndex - 1}"]`)
      el?.scrollIntoView({ block: "nearest" })
    }
  }

  // Reset selected product index when search changes
  useEffect(() => {
    setSelectedProductIndex(0)
  }, [searchQuery])

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left: Product search + list */}
      <div className="flex flex-1 flex-col border-r ml-16">
        {/* Search bar with barcode indicator */}
        <div className={cn(
          "flex items-center gap-2 border-b p-3 transition-colors",
          focusArea === "products" ? "bg-primary/5" : "bg-muted/30"
        )}>
          <div className="relative flex-1">
            <Search className={cn(
              "absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transition-colors",
              focusArea === "products" ? "text-primary" : "text-muted-foreground"
            )} />
            <Input
              ref={searchInputRef}
              placeholder="Escanear codigo de barras o buscar producto... (F2)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => setFocusArea("products")}
              className={cn(
                "h-12 pl-10 pr-10 text-lg font-mono bg-background transition-all",
                focusArea === "products" ? "ring-2 ring-primary/30" : ""
              )}
              autoComplete="off"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => {
                  setSearchQuery("")
                  searchInputRef.current?.focus()
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Barcode className="h-4 w-4" />
            <span className="hidden lg:inline">Lector activo</span>
          </div>
        </div>

        {/* Shortcut bar */}
        <div className="flex items-center gap-2 border-b bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground overflow-x-auto">
          <div className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded",
            focusArea === "products" ? "bg-primary/20 text-primary font-medium" : ""
          )}>
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono">F2</kbd>
            <span>Buscar</span>
          </div>
          <span className="text-border">|</span>
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono">Tab</kbd>
          <span>Cambiar Area</span>
          <span className="text-border">|</span>
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono">F4</kbd>
          <span>Cobrar</span>
          <span className="text-border">|</span>
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono">F5</kbd>
          <span>Cliente</span>
          <span className="text-border">|</span>
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono">F8</kbd>
          <span>Limpiar</span>
          <span className="text-border">|</span>
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono">Alt+M</kbd>
          <span>Menu</span>
        </div>

        {/* Product list */}
        <ScrollArea className="flex-1" ref={productListRef}>
          {searchQuery.length > 0 ? (
            filteredProducts.length > 0 ? (
              <div className="divide-y">
                {filteredProducts.map((product, index) => {
                  const productStock = getProductStock(product.id)
                  const promo = getActivePromotion(product.id)
                  const isOutOfStock = !productStock || productStock.quantity <= 0
                  const isSelected = index === selectedProductIndex

                  return (
                    <button
                      key={product.id}
                      data-index={index}
                      onClick={() => addToCart(product)}
                      disabled={isOutOfStock}
                      className={`flex w-full items-center gap-4 px-4 py-3 text-left transition-colors disabled:opacity-40 ${
                        isSelected
                          ? "bg-primary/10 border-l-4 border-l-primary"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{product.name}</span>
                          {promo && (
                            <Badge variant="destructive" className="text-xs shrink-0">
                              Oferta
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span className="font-mono">{product.sku}</span>
                          {product.barcode && (
                            <>
                              <span>|</span>
                              <span className="font-mono">{product.barcode}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {promo ? (
                          <div>
                            <span className="text-lg font-bold text-primary">
                              ${promo.promoPrice.toFixed(2)}
                            </span>
                            <span className="ml-1 text-sm text-muted-foreground line-through">
                              ${product.salePrice.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-lg font-bold">${product.salePrice.toFixed(2)}</span>
                        )}
                      </div>
                      <Badge
                        variant={isOutOfStock ? "destructive" : "secondary"}
                        className="shrink-0 font-mono min-w-[3rem] justify-center"
                      >
                        {productStock?.quantity || 0}
                      </Badge>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Barcode className="mb-2 h-12 w-12" />
                <p className="text-lg">No se encontraron productos</p>
                <p className="text-sm">{"Verifica el codigo o nombre"}</p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Barcode className="mb-4 h-16 w-16" />
              <p className="text-lg">Escanea un codigo o escribe para buscar</p>
              <p className="text-sm mt-1">
                El lector de codigos de barras esta activo
              </p>
              <div className="flex items-center gap-2 mt-4 text-xs">
                <Keyboard className="h-4 w-4" />
                <span>Usa las flechas para navegar y Enter para agregar</span>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right: Ticket */}
      <div className="flex w-[420px] flex-col bg-card border-l shadow-lg">
        {/* Store header */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b px-4 py-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-lg">{settings?.storeName || "Super T"}</h1>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString("es", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>Cajero: {currentUser?.name}</p>
              <p>{new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>
        </div>

        {/* Ticket header */}
        <div className="border-b p-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold text-sm">
              <Receipt className="h-4 w-4" />
              Ticket de Venta
              {focusArea === "cart" && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  Navegando
                </Badge>
              )}
            </h2>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive hover:text-destructive">
                <Trash2 className="mr-1 h-4 w-4" />
                Limpiar
              </Button>
            )}
          </div>
          {/* Client selector */}
          <Button
            variant="outline"
            className="mt-2 w-full justify-start bg-transparent text-sm"
            onClick={() => setShowClientDialog(true)}
          >
            <User className="mr-2 h-4 w-4" />
            {selectedClient ? selectedClient.name : "Publico General"}
            <kbd className="ml-auto rounded border bg-muted px-1 py-0.5 text-xs font-mono text-muted-foreground">
              F5
            </kbd>
          </Button>
        </div>

        {/* Cart items */}
        <ScrollArea className="flex-1 p-3" ref={cartListRef}>
          {cart.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-muted-foreground">
              <Receipt className="mb-2 h-8 w-8" />
              <p className="text-sm">Sin productos en el ticket</p>
              <p className="text-xs mt-1">Presiona Tab para navegar entre areas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item, index) => (
                <div 
                  key={item.id} 
                  data-cart-index={index}
                  className={cn(
                    "rounded-lg border p-2.5 transition-all cursor-pointer",
                    focusArea === "cart" && selectedCartIndex === index
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "bg-muted/20 hover:bg-muted/40"
                  )}
                  onClick={() => {
                    setFocusArea("cart")
                    setSelectedCartIndex(index)
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-tight truncate">{item.productName}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                    </div>
                    <p className="font-bold text-sm shrink-0">${item.subtotal.toFixed(2)}</p>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>${item.unitPrice.toFixed(2)} x {item.quantity}</span>
                      {item.promoPrice && (
                        <Badge variant="destructive" className="text-[10px] px-1 py-0">
                          Oferta
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 bg-transparent"
                        onClick={() => updateQuantity(item.id, -1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-7 text-center text-sm font-bold">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 bg-transparent"
                        onClick={() => updateQuantity(item.id, 1)}
                        disabled={item.quantity >= item.stock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-1 text-destructive hover:text-destructive"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Cart navigation hints */}
        {cart.length > 0 && focusArea === "cart" && (
          <div className="border-t bg-primary/5 px-3 py-2 flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <span><kbd className="border rounded px-1 bg-muted">↑↓</kbd> Navegar</span>
            <span><kbd className="border rounded px-1 bg-muted">+/-</kbd> Cantidad</span>
            <span><kbd className="border rounded px-1 bg-muted">Del</kbd> Eliminar</span>
            <span><kbd className="border rounded px-1 bg-muted">Tab</kbd> Productos</span>
          </div>
        )}

        {/* Totals */}
        <div className="border-t bg-muted/30 p-3">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono">${subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Descuento ({discount}%)</span>
                <span className="font-mono">-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <span>IVA</span>
                {editingTaxRate ? (
                  <div className="flex items-center gap-1">
                    <span>(</span>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={tempTaxRate}
                      onChange={(e) => setTempTaxRate(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveTaxRate()
                        if (e.key === "Escape") setEditingTaxRate(false)
                      }}
                      onBlur={saveTaxRate}
                      className="h-6 w-16 text-xs px-1"
                      autoFocus
                    />
                    <span>%)</span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setTempTaxRate(String(settings.taxRate))
                      setEditingTaxRate(true)
                    }}
                    className="text-primary hover:underline cursor-pointer"
                    title="Clic para editar IVA"
                  >
                    ({settings.taxRate}%)
                  </button>
                )}
              </div>
              <span className="font-mono">${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-lg font-bold">
              <span>TOTAL</span>
              <span className="font-mono">${total.toFixed(2)}</span>
            </div>
          </div>
          <Button
            className="mt-3 h-12 w-full text-lg font-bold"
            disabled={cart.length === 0}
            onClick={() => setShowPaymentDialog(true)}
          >
            <CreditCard className="mr-2 h-5 w-5" />
            Cobrar ${total.toFixed(2)}
            <kbd className="ml-2 rounded border border-primary-foreground/30 bg-primary-foreground/10 px-1.5 py-0.5 text-xs font-mono">
              F4
            </kbd>
          </Button>
        </div>
      </div>

      {/* ========== PAYMENT DIALOG ========== */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Procesar Pago</DialogTitle>
            <DialogDescription>Total a cobrar: ${total.toFixed(2)}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Metodo de Pago (teclas 1-4)</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "1", method: "cash" as const, icon: Banknote, label: "Efectivo" },
                  { key: "2", method: "card" as const, icon: CreditCard, label: "Tarjeta" },
                  { key: "3", method: "transfer" as const, icon: Building2, label: "Transferencia" },
                  { key: "4", method: "credit" as const, icon: Receipt, label: "Credito" },
                ].map(({ key, method, icon: Icon, label }) => (
                  <Button
                    key={method}
                    variant={paymentMethod === method ? "default" : "outline"}
                    onClick={() => setPaymentMethod(method)}
                    className={`h-14 flex-col gap-1 ${paymentMethod !== method ? "bg-transparent" : ""}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs">
                      {label}{" "}
                      <kbd className="ml-0.5 rounded border px-1 py-0.5 text-[10px] font-mono opacity-60">
                        {key}
                      </kbd>
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            {paymentMethod === "cash" && (
              <div className="space-y-2">
                <Label>Efectivo Recibido</Label>
                <Input
                  ref={cashReceivedRef}
                  type="number"
                  min={0}
                  step="0.01"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="0.00"
                  className="h-12 text-lg font-mono"
                />
                {cashReceived && parseFloat(cashReceived) >= total && (
                  <p className="text-lg font-bold text-primary">
                    Cambio: ${(parseFloat(cashReceived) - total).toFixed(2)}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Descuento (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={discount}
                onChange={(e) =>
                  setDiscount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)} className="bg-transparent">
              Cancelar
              <kbd className="ml-1 rounded border bg-muted px-1 py-0.5 text-[10px] font-mono">Esc</kbd>
            </Button>
            <Button
              onClick={processPayment}
              disabled={
                isProcessing ||
                (paymentMethod === "cash" &&
                  (!cashReceived || parseFloat(cashReceived) < total))
              }
            >
              {isProcessing ? "Procesando..." : "Confirmar Pago"}
              <kbd className="ml-1 rounded border border-primary-foreground/30 bg-primary-foreground/10 px-1 py-0.5 text-[10px] font-mono">
                Enter
              </kbd>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== CLIENT DIALOG ========== */}
      <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Seleccionar Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Buscar por nombre, cedula, RUC..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              autoFocus
            />
            <ScrollArea className="h-64">
              <div className="space-y-2">
                <Button
                  variant={!selectedClient ? "default" : "outline"}
                  className={`w-full justify-start ${selectedClient ? "bg-transparent" : ""}`}
                  onClick={() => {
                    setSelectedClient(null)
                    setShowClientDialog(false)
                  }}
                >
                  <User className="mr-2 h-4 w-4" />
                  Publico General
                </Button>
                {filteredClients.map((client) => (
                  <Button
                    key={client.id}
                    variant={selectedClient?.id === client.id ? "default" : "outline"}
                    className={`w-full justify-start ${selectedClient?.id !== client.id ? "bg-transparent" : ""}`}
                    onClick={() => {
                      setSelectedClient(client)
                      setShowClientDialog(false)
                    }}
                  >
                    <div className="flex flex-col items-start">
                      <span>{client.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {client.cedula && `CC: ${client.cedula}`}
                        {client.cedula && (client.ruc || client.taxId) && " | "}
                        {(client.ruc || client.taxId) && `NIT: ${client.ruc || client.taxId}`}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========== SUCCESS DIALOG ========== */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-sm text-center">
          <div className="flex flex-col items-center py-4">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-xl">Venta Completada</DialogTitle>
            {lastInvoice && (
              <div className="mt-4 w-full rounded-lg border bg-muted/30 p-4 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Factura:</span>
                  <span className="font-bold">{lastInvoice.number}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-bold">${lastInvoice.total.toFixed(2)}</span>
                </div>
                {lastChange > 0 && (
                  <div className="flex justify-between mt-1 text-primary font-bold">
                    <span>Cambio:</span>
                    <span>${lastChange.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row sm:justify-center gap-2">
            <Button
              variant="outline"
              onClick={printReceipt}
              className="bg-transparent"
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
              <kbd className="ml-1 rounded border bg-muted px-1 py-0.5 text-[10px] font-mono">P</kbd>
            </Button>
            <Link href="/dashboard/cash">
              <Button variant="outline" className="bg-transparent w-full">
                <Coins className="mr-2 h-4 w-4" />
                Nuevo Movimiento
              </Button>
            </Link>
            <Button
              onClick={() => setShowSuccessDialog(false)}
              autoFocus
            >
              Nueva Venta
              <kbd className="ml-1 rounded border border-primary-foreground/30 bg-primary-foreground/10 px-1 py-0.5 text-[10px] font-mono">
                Enter
              </kbd>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
