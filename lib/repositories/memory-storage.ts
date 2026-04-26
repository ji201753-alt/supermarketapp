import type {
  User,
  Category,
  Supplier,
  Product,
  Stock,
  InventoryMovement,
  PriceHistory,
  Promotion,
  AlertConfig,
  EmailAlert,
  CashConcept,
  CashMovement,
  CashClosing,
  Client,
  Invoice,
  CreditNote,
  CalendarEvent,
  SystemSettings,
} from "@/lib/types"
import type {
  DataStorage,
  UserRepository,
  CategoryRepository,
  SupplierRepository,
  ProductRepository,
  StockRepository,
  MovementRepository,
  PriceHistoryRepository,
  PromotionRepository,
  AlertRepository,
  CashConceptRepository,
  CashMovementRepository,
  CashClosingRepository,
  ClientRepository,
  InvoiceRepository,
  CreditNoteRepository,
  CalendarEventRepository,
  SystemSettingsRepository,
} from "./types"

function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
}

function getCurrentDate(): string {
  return new Date().toISOString().split("T")[0]
}

function getCurrentTimestamp(): string {
  return new Date().toISOString()
}

// Check if running in development mode
const isDev = process.env.NODE_ENV === "development"

// In-memory data store
class MemoryStore {
  users: User[] = []
  categories: Category[] = []
  suppliers: Supplier[] = []
  products: Product[] = []
  stock: Stock[] = []
  movements: InventoryMovement[] = []
  priceHistory: PriceHistory[] = []
  promotions: Promotion[] = []
  alertConfig: AlertConfig = {
    enabled: false,
    email: "",
    threshold: "immediate",
    notifyLowStock: true,
    notifyNoMovement: false,
  }
  emailAlerts: EmailAlert[] = []
  // POS
  cashConcepts: CashConcept[] = []
  cashMovements: CashMovement[] = []
  cashClosings: CashClosing[] = []
  clients: Client[] = []
  invoices: Invoice[] = []
  creditNotes: CreditNote[] = []
  calendarEvents: CalendarEvent[] = []
  settings: SystemSettings = {
    storeName: "Super T",
    storeAddress: "",
    storePhone: "",
    storeEmail: "",
    taxRate: 16,
    currency: "MXN",
    invoicePrefix: "FAC-",
    creditNotePrefix: "NC-",
    currentInvoiceNumber: 1,
    currentCreditNoteNumber: 1,
  }
  initialized = false

  private listeners: Set<() => void> = new Set()

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  notify(): void {
    this.listeners.forEach((listener) => listener())
  }
}

let storeInstance: MemoryStore | null = null

function getStore(): MemoryStore {
  if (!storeInstance) {
    storeInstance = new MemoryStore()
  }
  return storeInstance
}

// User Repository
class MemoryUserRepository implements UserRepository {
  async getAll(): Promise<User[]> {
    return getStore().users
  }

  async getById(id: string): Promise<User | null> {
    return getStore().users.find((u) => u.id === id) || null
  }

  async findByEmail(email: string): Promise<User | null> {
    return getStore().users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null
  }

  async findActive(): Promise<User[]> {
    return getStore().users.filter((u) => u.active)
  }

  async hasUsers(): Promise<boolean> {
    return getStore().users.length > 0
  }

  async create(data: Omit<User, "id" | "createdAt">): Promise<User> {
    const user: User = {
      ...data,
      id: generateId(),
      createdAt: getCurrentDate(),
    }
    getStore().users.push(user)
    getStore().notify()
    return user
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    const store = getStore()
    const index = store.users.findIndex((u) => u.id === id)
    if (index === -1) return null
    store.users[index] = { ...store.users[index], ...data }
    store.notify()
    return store.users[index]
  }

  async updatePassword(id: string, passwordHash: string): Promise<boolean> {
    const store = getStore()
    const index = store.users.findIndex((u) => u.id === id)
    if (index === -1) return false
    store.users[index].passwordHash = passwordHash
    store.notify()
    return true
  }

  async delete(id: string): Promise<boolean> {
    const store = getStore()
    const initialLength = store.users.length
    store.users = store.users.filter((u) => u.id !== id)
    store.notify()
    return store.users.length < initialLength
  }
}

// Category Repository
class MemoryCategoryRepository implements CategoryRepository {
  async getAll(): Promise<Category[]> {
    return getStore().categories
  }

  async getById(id: string): Promise<Category | null> {
    return getStore().categories.find((c) => c.id === id) || null
  }

  async findByName(name: string): Promise<Category | null> {
    return getStore().categories.find((c) => c.name.toLowerCase() === name.toLowerCase()) || null
  }

  async findActive(): Promise<Category[]> {
    return getStore().categories.filter((c) => c.active)
  }

  async create(data: Omit<Category, "id">): Promise<Category> {
    const category: Category = { ...data, id: generateId() }
    getStore().categories.push(category)
    getStore().notify()
    return category
  }

  async update(id: string, data: Partial<Category>): Promise<Category | null> {
    const store = getStore()
    const index = store.categories.findIndex((c) => c.id === id)
    if (index === -1) return null
    store.categories[index] = { ...store.categories[index], ...data }
    store.notify()
    return store.categories[index]
  }

  async delete(id: string): Promise<boolean> {
    const store = getStore()
    const initialLength = store.categories.length
    store.categories = store.categories.filter((c) => c.id !== id)
    store.notify()
    return store.categories.length < initialLength
  }
}

// Supplier Repository
class MemorySupplierRepository implements SupplierRepository {
  async getAll(): Promise<Supplier[]> {
    return getStore().suppliers
  }

  async getById(id: string): Promise<Supplier | null> {
    return getStore().suppliers.find((s) => s.id === id) || null
  }

  async findByName(name: string): Promise<Supplier | null> {
    return getStore().suppliers.find((s) => s.name.toLowerCase() === name.toLowerCase()) || null
  }

  async findActive(): Promise<Supplier[]> {
    return getStore().suppliers.filter((s) => s.active)
  }

  async create(data: Omit<Supplier, "id">): Promise<Supplier> {
    const supplier: Supplier = { ...data, id: generateId() }
    getStore().suppliers.push(supplier)
    getStore().notify()
    return supplier
  }

  async update(id: string, data: Partial<Supplier>): Promise<Supplier | null> {
    const store = getStore()
    const index = store.suppliers.findIndex((s) => s.id === id)
    if (index === -1) return null
    store.suppliers[index] = { ...store.suppliers[index], ...data }
    store.notify()
    return store.suppliers[index]
  }

  async delete(id: string): Promise<boolean> {
    const store = getStore()
    const initialLength = store.suppliers.length
    store.suppliers = store.suppliers.filter((s) => s.id !== id)
    store.notify()
    return store.suppliers.length < initialLength
  }
}

// Product Repository
class MemoryProductRepository implements ProductRepository {
  async getAll(): Promise<Product[]> {
    return getStore().products
  }

  async getById(id: string): Promise<Product | null> {
    return getStore().products.find((p) => p.id === id) || null
  }

  async findBySku(sku: string): Promise<Product | null> {
    return getStore().products.find((p) => p.sku.toLowerCase() === sku.toLowerCase()) || null
  }

  async findByBarcode(barcode: string): Promise<Product | null> {
    return getStore().products.find((p) => p.barcode === barcode) || null
  }

  async findByCategory(categoryId: string): Promise<Product[]> {
    return getStore().products.filter((p) => p.categoryId === categoryId)
  }

  async findBySupplier(supplierId: string): Promise<Product[]> {
    return getStore().products.filter((p) => p.supplierId === supplierId)
  }

  async findActive(): Promise<Product[]> {
    return getStore().products.filter((p) => p.active)
  }

  async search(query: string): Promise<Product[]> {
    const q = query.toLowerCase()
    return getStore().products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q)
    )
  }

  async create(data: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
    const now = getCurrentDate()
    const product: Product = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
    getStore().products.push(product)
    getStore().notify()
    return product
  }

  async update(id: string, data: Partial<Product>): Promise<Product | null> {
    const store = getStore()
    const index = store.products.findIndex((p) => p.id === id)
    if (index === -1) return null
    store.products[index] = {
      ...store.products[index],
      ...data,
      updatedAt: getCurrentDate(),
    }
    store.notify()
    return store.products[index]
  }

  async delete(id: string): Promise<boolean> {
    const store = getStore()
    const initialLength = store.products.length
    store.products = store.products.filter((p) => p.id !== id)
    store.notify()
    return store.products.length < initialLength
  }
}

// Stock Repository
class MemoryStockRepository implements StockRepository {
  async getAll(): Promise<Stock[]> {
    return getStore().stock
  }

  async getByProductId(productId: string): Promise<Stock | null> {
    return getStore().stock.find((s) => s.productId === productId) || null
  }

  async getLowStock(): Promise<Stock[]> {
    return getStore().stock.filter((s) => s.quantity < s.minStock)
  }

  async create(data: Stock): Promise<Stock> {
    getStore().stock.push(data)
    getStore().notify()
    return data
  }

  async update(productId: string, data: Partial<Stock>): Promise<Stock | null> {
    const store = getStore()
    const index = store.stock.findIndex((s) => s.productId === productId)
    if (index === -1) return null
    store.stock[index] = { ...store.stock[index], ...data }
    store.notify()
    return store.stock[index]
  }
}

// Movement Repository
class MemoryMovementRepository implements MovementRepository {
  async getAll(): Promise<InventoryMovement[]> {
    return getStore().movements
  }

  async getById(id: string): Promise<InventoryMovement | null> {
    return getStore().movements.find((m) => m.id === id) || null
  }

  async findByProduct(productId: string): Promise<InventoryMovement[]> {
    return getStore().movements.filter((m) => m.productId === productId)
  }

  async findByUser(userId: string): Promise<InventoryMovement[]> {
    return getStore().movements.filter((m) => m.userId === userId)
  }

  async findByDateRange(startDate: string, endDate: string): Promise<InventoryMovement[]> {
    return getStore().movements.filter((m) => m.createdAt >= startDate && m.createdAt <= endDate)
  }

  async create(data: Omit<InventoryMovement, "id" | "createdAt">): Promise<InventoryMovement> {
    const movement: InventoryMovement = {
      ...data,
      id: generateId(),
      createdAt: getCurrentTimestamp(),
    }
    getStore().movements.push(movement)
    getStore().notify()
    return movement
  }

  async update(id: string, data: Partial<InventoryMovement>): Promise<InventoryMovement | null> {
    const store = getStore()
    const index = store.movements.findIndex((m) => m.id === id)
    if (index === -1) return null
    store.movements[index] = { ...store.movements[index], ...data }
    store.notify()
    return store.movements[index]
  }

  async delete(id: string): Promise<boolean> {
    const store = getStore()
    const initialLength = store.movements.length
    store.movements = store.movements.filter((m) => m.id !== id)
    store.notify()
    return store.movements.length < initialLength
  }
}

// Price History Repository
class MemoryPriceHistoryRepository implements PriceHistoryRepository {
  async getAll(): Promise<PriceHistory[]> {
    return getStore().priceHistory
  }

  async getById(id: string): Promise<PriceHistory | null> {
    return getStore().priceHistory.find((h) => h.id === id) || null
  }

  async findByProduct(productId: string): Promise<PriceHistory[]> {
    return getStore().priceHistory.filter((h) => h.productId === productId)
  }

  async create(data: Omit<PriceHistory, "id">): Promise<PriceHistory> {
    const history: PriceHistory = { ...data, id: generateId() }
    getStore().priceHistory.push(history)
    getStore().notify()
    return history
  }

  async update(id: string, data: Partial<PriceHistory>): Promise<PriceHistory | null> {
    const store = getStore()
    const index = store.priceHistory.findIndex((h) => h.id === id)
    if (index === -1) return null
    store.priceHistory[index] = { ...store.priceHistory[index], ...data }
    store.notify()
    return store.priceHistory[index]
  }

  async delete(id: string): Promise<boolean> {
    const store = getStore()
    const initialLength = store.priceHistory.length
    store.priceHistory = store.priceHistory.filter((h) => h.id !== id)
    store.notify()
    return store.priceHistory.length < initialLength
  }
}

// Promotion Repository
class MemoryPromotionRepository implements PromotionRepository {
  async getAll(): Promise<Promotion[]> {
    return getStore().promotions
  }

  async getById(id: string): Promise<Promotion | null> {
    return getStore().promotions.find((p) => p.id === id) || null
  }

  async findByProduct(productId: string): Promise<Promotion[]> {
    return getStore().promotions.filter((p) => p.productId === productId)
  }

  async findActive(): Promise<Promotion[]> {
    const today = getCurrentDate()
    return getStore().promotions.filter((p) => p.active && p.startDate <= today && p.endDate >= today)
  }

  async create(data: Omit<Promotion, "id">): Promise<Promotion> {
    const promotion: Promotion = { ...data, id: generateId() }
    getStore().promotions.push(promotion)
    getStore().notify()
    return promotion
  }

  async update(id: string, data: Partial<Promotion>): Promise<Promotion | null> {
    const store = getStore()
    const index = store.promotions.findIndex((p) => p.id === id)
    if (index === -1) return null
    store.promotions[index] = { ...store.promotions[index], ...data }
    store.notify()
    return store.promotions[index]
  }

  async delete(id: string): Promise<boolean> {
    const store = getStore()
    const initialLength = store.promotions.length
    store.promotions = store.promotions.filter((p) => p.id !== id)
    store.notify()
    return store.promotions.length < initialLength
  }
}

// Alert Repository
class MemoryAlertRepository implements AlertRepository {
  async getConfig(): Promise<AlertConfig> {
    return getStore().alertConfig
  }

  async updateConfig(config: Partial<AlertConfig>): Promise<AlertConfig> {
    const store = getStore()
    store.alertConfig = { ...store.alertConfig, ...config }
    store.notify()
    return store.alertConfig
  }

  async getAlerts(): Promise<EmailAlert[]> {
    return getStore().emailAlerts
  }

  async addAlert(alert: Omit<EmailAlert, "id">): Promise<EmailAlert> {
    const emailAlert: EmailAlert = { ...alert, id: generateId() }
    getStore().emailAlerts.unshift(emailAlert)
    getStore().notify()
    return emailAlert
  }

  async markRead(id: string): Promise<void> {
    const store = getStore()
    const alert = store.emailAlerts.find((a) => a.id === id)
    if (alert) {
      alert.read = true
      store.notify()
    }
  }

  async clearAll(): Promise<void> {
    getStore().emailAlerts = []
    getStore().notify()
  }
}

// === POS Repositories ===

// Cash Concept Repository
class MemoryCashConceptRepository implements CashConceptRepository {
  async getAll(): Promise<CashConcept[]> {
    return getStore().cashConcepts
  }

  async getById(id: string): Promise<CashConcept | null> {
    return getStore().cashConcepts.find((c) => c.id === id) || null
  }

  async findByName(name: string): Promise<CashConcept | null> {
    return getStore().cashConcepts.find((c) => c.name.toLowerCase() === name.toLowerCase()) || null
  }

  async findByType(type: "income" | "expense"): Promise<CashConcept[]> {
    return getStore().cashConcepts.filter((c) => c.type === type)
  }

  async findActive(): Promise<CashConcept[]> {
    return getStore().cashConcepts.filter((c) => c.active)
  }

  async create(data: Omit<CashConcept, "id" | "createdAt">): Promise<CashConcept> {
    const concept: CashConcept = { ...data, id: generateId(), createdAt: getCurrentTimestamp() }
    getStore().cashConcepts.push(concept)
    getStore().notify()
    return concept
  }

  async update(id: string, data: Partial<CashConcept>): Promise<CashConcept | null> {
    const store = getStore()
    const index = store.cashConcepts.findIndex((c) => c.id === id)
    if (index === -1) return null
    store.cashConcepts[index] = { ...store.cashConcepts[index], ...data }
    store.notify()
    return store.cashConcepts[index]
  }

  async delete(id: string): Promise<boolean> {
    const store = getStore()
    const initialLength = store.cashConcepts.length
    store.cashConcepts = store.cashConcepts.filter((c) => c.id !== id)
    store.notify()
    return store.cashConcepts.length < initialLength
  }
}

// Cash Movement Repository
class MemoryCashMovementRepository implements CashMovementRepository {
  async getAll(): Promise<CashMovement[]> {
    return getStore().cashMovements.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }

  async getById(id: string): Promise<CashMovement | null> {
    return getStore().cashMovements.find((m) => m.id === id) || null
  }

  async findByDateRange(startDate: string, endDate: string): Promise<CashMovement[]> {
    return getStore().cashMovements.filter((m) => {
      const date = m.timestamp.split("T")[0]
      return date >= startDate && date <= endDate
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }

  async findByConcept(conceptId: string): Promise<CashMovement[]> {
    return getStore().cashMovements.filter((m) => m.conceptId === conceptId)
  }

  async findByCashier(cashierId: string): Promise<CashMovement[]> {
    return getStore().cashMovements.filter((m) => m.cashierId === cashierId)
  }

  async findByInvoice(invoiceId: string): Promise<CashMovement[]> {
    return getStore().cashMovements.filter((m) => m.invoiceId === invoiceId)
  }

  async getLastBalance(): Promise<number> {
    const movements = getStore().cashMovements
    if (movements.length === 0) return 0
    const sorted = [...movements].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    return sorted[0].balance
  }

  async getDailyMovements(date: string): Promise<CashMovement[]> {
    return getStore().cashMovements.filter((m) => m.timestamp.startsWith(date))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }

  async create(data: Omit<CashMovement, "id">): Promise<CashMovement> {
    const movement: CashMovement = { ...data, id: generateId() }
    getStore().cashMovements.push(movement)
    getStore().notify()
    return movement
  }

  async update(id: string, data: Partial<CashMovement>): Promise<CashMovement | null> {
    const store = getStore()
    const index = store.cashMovements.findIndex((m) => m.id === id)
    if (index === -1) return null
    store.cashMovements[index] = { ...store.cashMovements[index], ...data }
    store.notify()
    return store.cashMovements[index]
  }

  async delete(id: string): Promise<boolean> {
    const store = getStore()
    const initialLength = store.cashMovements.length
    store.cashMovements = store.cashMovements.filter((m) => m.id !== id)
    store.notify()
    return store.cashMovements.length < initialLength
  }
}

// Cash Closing Repository
class MemoryCashClosingRepository implements CashClosingRepository {
  async getAll(): Promise<CashClosing[]> {
    return getStore().cashClosings.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }

  async getById(id: string): Promise<CashClosing | null> {
    return getStore().cashClosings.find((c) => c.id === id) || null
  }

  async findByDate(date: string): Promise<CashClosing | null> {
    return getStore().cashClosings.find((c) => c.date === date) || null
  }

  async findByDateRange(startDate: string, endDate: string): Promise<CashClosing[]> {
    return getStore().cashClosings.filter((c) => c.date >= startDate && c.date <= endDate)
  }

  async findOpen(): Promise<CashClosing | null> {
    return getStore().cashClosings.find((c) => c.status === "open") || null
  }

  async close(id: string, actualBalance: number, notes?: string): Promise<CashClosing | null> {
    const store = getStore()
    const index = store.cashClosings.findIndex((c) => c.id === id)
    if (index === -1) return null
    const closing = store.cashClosings[index]
    store.cashClosings[index] = {
      ...closing,
      actualBalance,
      difference: actualBalance - closing.expectedBalance,
      status: "closed",
      closedAt: getCurrentTimestamp(),
      notes: notes || closing.notes,
    }
    store.notify()
    return store.cashClosings[index]
  }

  async create(data: Omit<CashClosing, "id" | "createdAt">): Promise<CashClosing> {
    const closing: CashClosing = { ...data, id: generateId(), createdAt: getCurrentTimestamp() }
    getStore().cashClosings.push(closing)
    getStore().notify()
    return closing
  }

  async update(id: string, data: Partial<CashClosing>): Promise<CashClosing | null> {
    const store = getStore()
    const index = store.cashClosings.findIndex((c) => c.id === id)
    if (index === -1) return null
    store.cashClosings[index] = { ...store.cashClosings[index], ...data }
    store.notify()
    return store.cashClosings[index]
  }

  async delete(id: string): Promise<boolean> {
    const store = getStore()
    const initialLength = store.cashClosings.length
    store.cashClosings = store.cashClosings.filter((c) => c.id !== id)
    store.notify()
    return store.cashClosings.length < initialLength
  }
}

// Client Repository
class MemoryClientRepository implements ClientRepository {
  async getAll(): Promise<Client[]> {
    return getStore().clients
  }

  async getById(id: string): Promise<Client | null> {
    return getStore().clients.find((c) => c.id === id) || null
  }

  async findByTaxId(taxId: string): Promise<Client | null> {
    return getStore().clients.find((c) => c.taxId === taxId) || null
  }

  async findByName(name: string): Promise<Client[]> {
    const q = name.toLowerCase()
    return getStore().clients.filter((c) => c.name.toLowerCase().includes(q))
  }

  async findActive(): Promise<Client[]> {
    return getStore().clients.filter((c) => c.active)
  }

  async search(query: string): Promise<Client[]> {
    const q = query.toLowerCase()
    return getStore().clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.taxId && c.taxId.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
    )
  }

  async create(data: Omit<Client, "id" | "createdAt">): Promise<Client> {
    const client: Client = { ...data, id: generateId(), createdAt: getCurrentTimestamp() }
    getStore().clients.push(client)
    getStore().notify()
    return client
  }

  async update(id: string, data: Partial<Client>): Promise<Client | null> {
    const store = getStore()
    const index = store.clients.findIndex((c) => c.id === id)
    if (index === -1) return null
    store.clients[index] = { ...store.clients[index], ...data }
    store.notify()
    return store.clients[index]
  }

  async delete(id: string): Promise<boolean> {
    const store = getStore()
    const initialLength = store.clients.length
    store.clients = store.clients.filter((c) => c.id !== id)
    store.notify()
    return store.clients.length < initialLength
  }
}

// Invoice Repository
class MemoryInvoiceRepository implements InvoiceRepository {
  async getAll(): Promise<Invoice[]> {
    return getStore().invoices.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  async getById(id: string): Promise<Invoice | null> {
    return getStore().invoices.find((i) => i.id === id) || null
  }

  async findByNumber(number: string): Promise<Invoice | null> {
    return getStore().invoices.find((i) => i.number === number) || null
  }

  async findByClient(clientId: string): Promise<Invoice[]> {
    return getStore().invoices.filter((i) => i.clientId === clientId)
  }

  async findByStatus(status: Invoice["status"]): Promise<Invoice[]> {
    return getStore().invoices.filter((i) => i.status === status)
  }

  async findByDateRange(startDate: string, endDate: string): Promise<Invoice[]> {
    return getStore().invoices.filter((i) => {
      const date = i.createdAt.split("T")[0]
      return date >= startDate && date <= endDate
    })
  }

  async getNextNumber(): Promise<string> {
    const store = getStore()
    const num = store.settings.currentInvoiceNumber
    return `${store.settings.invoicePrefix}${num.toString().padStart(6, "0")}`
  }

  async issue(id: string): Promise<Invoice | null> {
    const store = getStore()
    const index = store.invoices.findIndex((i) => i.id === id)
    if (index === -1) return null
    store.invoices[index] = {
      ...store.invoices[index],
      status: "issued",
      issuedAt: getCurrentTimestamp(),
    }
    store.notify()
    return store.invoices[index]
  }

  async markPaid(id: string): Promise<Invoice | null> {
    const store = getStore()
    const index = store.invoices.findIndex((i) => i.id === id)
    if (index === -1) return null
    store.invoices[index] = {
      ...store.invoices[index],
      status: "paid",
      paidAt: getCurrentTimestamp(),
    }
    store.notify()
    return store.invoices[index]
  }

  async cancel(id: string): Promise<Invoice | null> {
    const store = getStore()
    const index = store.invoices.findIndex((i) => i.id === id)
    if (index === -1) return null
    store.invoices[index] = {
      ...store.invoices[index],
      status: "cancelled",
      cancelledAt: getCurrentTimestamp(),
    }
    store.notify()
    return store.invoices[index]
  }

  async create(data: Omit<Invoice, "id" | "number" | "createdAt">): Promise<Invoice> {
    const store = getStore()
    const number = await this.getNextNumber()
    const invoice: Invoice = {
      ...data,
      id: generateId(),
      number,
      createdAt: getCurrentTimestamp(),
    }
    store.invoices.push(invoice)
    store.settings.currentInvoiceNumber++
    store.notify()
    return invoice
  }

  async update(id: string, data: Partial<Invoice>): Promise<Invoice | null> {
    const store = getStore()
    const index = store.invoices.findIndex((i) => i.id === id)
    if (index === -1) return null
    store.invoices[index] = { ...store.invoices[index], ...data }
    store.notify()
    return store.invoices[index]
  }

  async delete(id: string): Promise<boolean> {
    const store = getStore()
    const initialLength = store.invoices.length
    store.invoices = store.invoices.filter((i) => i.id !== id)
    store.notify()
    return store.invoices.length < initialLength
  }
}

// Credit Note Repository
class MemoryCreditNoteRepository implements CreditNoteRepository {
  async getAll(): Promise<CreditNote[]> {
    return getStore().creditNotes.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  async getById(id: string): Promise<CreditNote | null> {
    return getStore().creditNotes.find((c) => c.id === id) || null
  }

  async findByNumber(number: string): Promise<CreditNote | null> {
    return getStore().creditNotes.find((c) => c.number === number) || null
  }

  async findByInvoice(invoiceId: string): Promise<CreditNote[]> {
    return getStore().creditNotes.filter((c) => c.invoiceId === invoiceId)
  }

  async findByClient(clientId: string): Promise<CreditNote[]> {
    return getStore().creditNotes.filter((c) => c.clientId === clientId)
  }

  async findByStatus(status: CreditNote["status"]): Promise<CreditNote[]> {
    return getStore().creditNotes.filter((c) => c.status === status)
  }

  async getNextNumber(): Promise<string> {
    const store = getStore()
    const num = store.settings.currentCreditNoteNumber
    return `${store.settings.creditNotePrefix}${num.toString().padStart(6, "0")}`
  }

  async issue(id: string): Promise<CreditNote | null> {
    const store = getStore()
    const index = store.creditNotes.findIndex((c) => c.id === id)
    if (index === -1) return null
    store.creditNotes[index] = {
      ...store.creditNotes[index],
      status: "issued",
      issuedAt: getCurrentTimestamp(),
    }
    store.notify()
    return store.creditNotes[index]
  }

  async apply(id: string): Promise<CreditNote | null> {
    const store = getStore()
    const index = store.creditNotes.findIndex((c) => c.id === id)
    if (index === -1) return null
    store.creditNotes[index] = {
      ...store.creditNotes[index],
      status: "applied",
      appliedAt: getCurrentTimestamp(),
    }
    store.notify()
    return store.creditNotes[index]
  }

  async create(data: Omit<CreditNote, "id" | "number" | "createdAt">): Promise<CreditNote> {
    const store = getStore()
    const number = await this.getNextNumber()
    const creditNote: CreditNote = {
      ...data,
      id: generateId(),
      number,
      createdAt: getCurrentTimestamp(),
    }
    store.creditNotes.push(creditNote)
    store.settings.currentCreditNoteNumber++
    store.notify()
    return creditNote
  }

  async update(id: string, data: Partial<CreditNote>): Promise<CreditNote | null> {
    const store = getStore()
    const index = store.creditNotes.findIndex((c) => c.id === id)
    if (index === -1) return null
    store.creditNotes[index] = { ...store.creditNotes[index], ...data }
    store.notify()
    return store.creditNotes[index]
  }

  async delete(id: string): Promise<boolean> {
    const store = getStore()
    const initialLength = store.creditNotes.length
    store.creditNotes = store.creditNotes.filter((c) => c.id !== id)
    store.notify()
    return store.creditNotes.length < initialLength
  }
}

// Calendar Event Repository
class MemoryCalendarEventRepository implements CalendarEventRepository {
  async getAll(): Promise<CalendarEvent[]> {
    return getStore().calendarEvents.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }

  async getById(id: string): Promise<CalendarEvent | null> {
    return getStore().calendarEvents.find((e) => e.id === id) || null
  }

  async findByDate(date: string): Promise<CalendarEvent[]> {
    return getStore().calendarEvents.filter((e) => e.date === date)
  }

  async findByDateRange(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    return getStore().calendarEvents.filter((e) => e.date >= startDate && e.date <= endDate)
  }

  async findByUser(userId: string): Promise<CalendarEvent[]> {
    return getStore().calendarEvents.filter((e) => e.userId === userId)
  }

  async findPending(): Promise<CalendarEvent[]> {
    const today = getCurrentDate()
    return getStore().calendarEvents.filter((e) => !e.completed && e.date >= today)
  }

  async markComplete(id: string): Promise<CalendarEvent | null> {
    const store = getStore()
    const index = store.calendarEvents.findIndex((e) => e.id === id)
    if (index === -1) return null
    store.calendarEvents[index] = { ...store.calendarEvents[index], completed: true }
    store.notify()
    return store.calendarEvents[index]
  }

  async create(data: Omit<CalendarEvent, "id" | "createdAt">): Promise<CalendarEvent> {
    const event: CalendarEvent = { ...data, id: generateId(), createdAt: getCurrentTimestamp() }
    getStore().calendarEvents.push(event)
    getStore().notify()
    return event
  }

  async update(id: string, data: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    const store = getStore()
    const index = store.calendarEvents.findIndex((e) => e.id === id)
    if (index === -1) return null
    store.calendarEvents[index] = { ...store.calendarEvents[index], ...data }
    store.notify()
    return store.calendarEvents[index]
  }

  async delete(id: string): Promise<boolean> {
    const store = getStore()
    const initialLength = store.calendarEvents.length
    store.calendarEvents = store.calendarEvents.filter((e) => e.id !== id)
    store.notify()
    return store.calendarEvents.length < initialLength
  }
}

// System Settings Repository
class MemorySystemSettingsRepository implements SystemSettingsRepository {
  async get(): Promise<SystemSettings> {
    return getStore().settings
  }

  async update(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const store = getStore()
    store.settings = { ...store.settings, ...settings }
    store.notify()
    return store.settings
  }

  async incrementInvoiceNumber(): Promise<number> {
    const store = getStore()
    store.settings.currentInvoiceNumber++
    store.notify()
    return store.settings.currentInvoiceNumber
  }

  async incrementCreditNoteNumber(): Promise<number> {
    const store = getStore()
    store.settings.currentCreditNoteNumber++
    store.notify()
    return store.settings.currentCreditNoteNumber
  }
}

// Memory Storage Factory
export function createMemoryStorage(): DataStorage {
  return {
    users: new MemoryUserRepository(),
    categories: new MemoryCategoryRepository(),
    suppliers: new MemorySupplierRepository(),
    products: new MemoryProductRepository(),
    stock: new MemoryStockRepository(),
    movements: new MemoryMovementRepository(),
    priceHistory: new MemoryPriceHistoryRepository(),
    promotions: new MemoryPromotionRepository(),
    alerts: new MemoryAlertRepository(),
    // POS
    cashConcepts: new MemoryCashConceptRepository(),
    cashMovements: new MemoryCashMovementRepository(),
    cashClosings: new MemoryCashClosingRepository(),
    clients: new MemoryClientRepository(),
    invoices: new MemoryInvoiceRepository(),
    creditNotes: new MemoryCreditNoteRepository(),
    calendarEvents: new MemoryCalendarEventRepository(),
    settings: new MemorySystemSettingsRepository(),
    // Database management
    async isInitialized(): Promise<boolean> {
      return getStore().initialized
    },
    async initialize(): Promise<void> {
      const store = getStore()
      if (store.initialized) return

      // Create default admin user if no users exist
      if (store.users.length === 0) {
        const { hashPassword } = await import("@/lib/crypto")
        const hash = await hashPassword("admin123")
        store.users.push({
          id: generateId(),
          email: "admin@supert.com",
          name: "Administrador",
          role: "admin",
          active: true,
          createdAt: getCurrentDate(),
          passwordHash: hash,
        })
      }

      // Create default cash concepts
      if (store.cashConcepts.length === 0) {
        const defaultConcepts = [
          { name: "Venta", type: "income" as const, description: "Ingreso por venta de productos", active: true },
          { name: "Devolución", type: "expense" as const, description: "Devolución de dinero al cliente", active: true },
          { name: "Gastos Operativos", type: "expense" as const, description: "Gastos de operación del negocio", active: true },
          { name: "Retiro de Efectivo", type: "expense" as const, description: "Retiro de efectivo de caja", active: true },
          { name: "Fondo de Caja", type: "income" as const, description: "Fondo inicial de caja", active: true },
        ]
        for (const concept of defaultConcepts) {
          store.cashConcepts.push({
            ...concept,
            id: generateId(),
            createdAt: getCurrentTimestamp(),
          })
        }
      }

      store.initialized = true
      store.notify()
    },
    async exportData(): Promise<string> {
      const store = getStore()
      return JSON.stringify({
        users: store.users,
        categories: store.categories,
        suppliers: store.suppliers,
        products: store.products,
        stock: store.stock,
        movements: store.movements,
        priceHistory: store.priceHistory,
        promotions: store.promotions,
        alertConfig: store.alertConfig,
        emailAlerts: store.emailAlerts,
        cashConcepts: store.cashConcepts,
        cashMovements: store.cashMovements,
        cashClosings: store.cashClosings,
        clients: store.clients,
        invoices: store.invoices,
        creditNotes: store.creditNotes,
        calendarEvents: store.calendarEvents,
        settings: store.settings,
      }, null, 2)
    },
    async importData(data: string): Promise<void> {
      const store = getStore()
      const parsed = JSON.parse(data)
      if (parsed.users) store.users = parsed.users
      if (parsed.categories) store.categories = parsed.categories
      if (parsed.suppliers) store.suppliers = parsed.suppliers
      if (parsed.products) store.products = parsed.products
      if (parsed.stock) store.stock = parsed.stock
      if (parsed.movements) store.movements = parsed.movements
      if (parsed.priceHistory) store.priceHistory = parsed.priceHistory
      if (parsed.promotions) store.promotions = parsed.promotions
      if (parsed.alertConfig) store.alertConfig = parsed.alertConfig
      if (parsed.emailAlerts) store.emailAlerts = parsed.emailAlerts
      if (parsed.cashConcepts) store.cashConcepts = parsed.cashConcepts
      if (parsed.cashMovements) store.cashMovements = parsed.cashMovements
      if (parsed.cashClosings) store.cashClosings = parsed.cashClosings
      if (parsed.clients) store.clients = parsed.clients
      if (parsed.invoices) store.invoices = parsed.invoices
      if (parsed.creditNotes) store.creditNotes = parsed.creditNotes
      if (parsed.calendarEvents) store.calendarEvents = parsed.calendarEvents
      if (parsed.settings) store.settings = { ...store.settings, ...parsed.settings }
      store.initialized = true
      store.notify()
    },
  }
}

// Export store for subscription
export function getMemoryStore(): MemoryStore {
  return getStore()
}
