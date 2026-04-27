export type UserRole = "admin" | "manager" | "viewer"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  active: boolean
  createdAt: string
  passwordHash?: string
}

export interface Category {
  id: string
  name: string
  description?: string
  active: boolean
}

export interface Supplier {
  id: string
  name: string
  nit?: string
  contact?: string
  phone?: string
  email?: string
  address?: string
  active: boolean
}

export interface Product {
  id: string
  name: string
  sku: string
  barcode: string
  categoryId: string
  supplierId: string
  purchasePrice: number
  salePrice: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface Stock {
  productId: string
  quantity: number
  minStock: number
}

export interface InventoryMovement {
  id: string
  productId: string
  type: "entry" | "exit" | "adjustment"
  quantity: number
  reason: string
  userId: string
  createdAt: string
}

export interface PriceHistory {
  id: string
  productId: string
  oldPrice: number
  newPrice: number
  changedAt: string
  userId: string
}

export interface Promotion {
  id: string
  productId: string
  promoPrice: number
  startDate: string
  endDate: string
  active: boolean
}

export interface AlertConfig {
  enabled: boolean
  email: string
  threshold: "immediate" | "daily" | "weekly"
  notifyLowStock: boolean
  notifyNoMovement: boolean
}

export interface EmailAlert {
  id: string
  type: "low_stock" | "no_movement"
  message: string
  createdAt: string
  read: boolean
}

export interface CashConcept {
  id: string
  name: string
  type: "income" | "expense"
  description?: string
  active: boolean
  createdAt: string
}

export interface CashMovement {
  id: string
  type: "income" | "expense"
  conceptId: string
  amount: number
  balance: number
  description?: string
  reference?: string
  invoiceId?: string
  cashierId: string
  timestamp: string
}

export interface CashClosing {
  id: string
  date: string
  openTime: string
  closedAt?: string
  openedBy: string
  closedBy?: string
  initialBalance: number
  expectedBalance: number
  actualBalance?: number
  difference?: number
  status: "open" | "closed"
  notes?: string
  createdAt: string
}

export interface Client {
  id: string
  name: string
  taxId?: string
  email?: string
  phone?: string
  address?: string
  active: boolean
  createdAt: string
}

export interface InvoiceItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Invoice {
  id: string
  number: string
  clientId: string
  clientName: string
  items: InvoiceItem[]
  subtotal: number
  tax: number
  total: number
  paymentMethod: "cash" | "card" | "transfer"
  status: "pending" | "paid" | "cancelled" | "issued"
  issuedAt?: string
  paidAt?: string
  cancelledAt?: string
  createdAt: string
}

export interface CreditNote {
  id: string
  number: string
  invoiceId: string
  clientId: string
  items: InvoiceItem[]
  total: number
  reason: string
  status: "pending" | "issued" | "applied"
  issuedAt?: string
  appliedAt?: string
  createdAt: string
}

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  date: string
  type: "task" | "reminder" | "meeting" | "promotion"
  completed: boolean
  userId: string
  createdAt: string
}

export interface SystemSettings {
  storeName: string
  storeSlogan?: string
  storeAddress?: string
  storePhone?: string
  storeEmail?: string
  storeNit?: string
  taxRate: number
  currency: string
  invoicePrefix: string
  creditNotePrefix: string
  cashMovementPrefix?: string
  currentInvoiceNumber: number
  currentCreditNoteNumber: number
  currentCashMovementNumber?: number
}
