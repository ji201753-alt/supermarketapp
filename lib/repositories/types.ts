// Repository interfaces for Super T - enables swapping storage backends (Memory, SQLite, API)

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

// Generic repository interface
export interface Repository<T, CreateDTO = Omit<T, "id">, UpdateDTO = Partial<T>> {
  getAll(): Promise<T[]>
  getById(id: string): Promise<T | null>
  create(data: CreateDTO): Promise<T>
  update(id: string, data: UpdateDTO): Promise<T | null>
  delete(id: string): Promise<boolean>
}

// User Repository
export interface UserRepository extends Repository<User, Omit<User, "id" | "createdAt">> {
  findByEmail(email: string): Promise<User | null>
  findActive(): Promise<User[]>
  hasUsers(): Promise<boolean>
  updatePassword(id: string, passwordHash: string): Promise<boolean>
}

// Category Repository
export interface CategoryRepository extends Repository<Category, Omit<Category, "id">> {
  findByName(name: string): Promise<Category | null>
  findActive(): Promise<Category[]>
}

// Supplier Repository
export interface SupplierRepository extends Repository<Supplier, Omit<Supplier, "id">> {
  findByName(name: string): Promise<Supplier | null>
  findActive(): Promise<Supplier[]>
}

// Product Repository
export interface ProductRepository extends Repository<Product, Omit<Product, "id" | "createdAt" | "updatedAt">> {
  findBySku(sku: string): Promise<Product | null>
  findByBarcode(barcode: string): Promise<Product | null>
  findByCategory(categoryId: string): Promise<Product[]>
  findBySupplier(supplierId: string): Promise<Product[]>
  findActive(): Promise<Product[]>
  search(query: string): Promise<Product[]>
}

// Stock Repository
export interface StockRepository {
  getAll(): Promise<Stock[]>
  getByProductId(productId: string): Promise<Stock | null>
  getLowStock(): Promise<Stock[]>
  create(data: Stock): Promise<Stock>
  update(productId: string, data: Partial<Stock>): Promise<Stock | null>
}

// Movement Repository
export interface MovementRepository extends Repository<InventoryMovement, Omit<InventoryMovement, "id" | "createdAt">> {
  findByProduct(productId: string): Promise<InventoryMovement[]>
  findByUser(userId: string): Promise<InventoryMovement[]>
  findByDateRange(startDate: string, endDate: string): Promise<InventoryMovement[]>
}

// Price History Repository
export interface PriceHistoryRepository extends Repository<PriceHistory, Omit<PriceHistory, "id">> {
  findByProduct(productId: string): Promise<PriceHistory[]>
}

// Promotion Repository
export interface PromotionRepository extends Repository<Promotion, Omit<Promotion, "id">> {
  findByProduct(productId: string): Promise<Promotion[]>
  findActive(): Promise<Promotion[]>
}

// Alert Repository
export interface AlertRepository {
  getConfig(): Promise<AlertConfig>
  updateConfig(config: Partial<AlertConfig>): Promise<AlertConfig>
  getAlerts(): Promise<EmailAlert[]>
  addAlert(alert: Omit<EmailAlert, "id">): Promise<EmailAlert>
  markRead(id: string): Promise<void>
  clearAll(): Promise<void>
}

// === POS Repositories ===

// Cash Concept Repository
export interface CashConceptRepository extends Repository<CashConcept, Omit<CashConcept, "id" | "createdAt">> {
  findByName(name: string): Promise<CashConcept | null>
  findByType(type: "income" | "expense"): Promise<CashConcept[]>
  findActive(): Promise<CashConcept[]>
}

// Cash Movement Repository
export interface CashMovementRepository extends Repository<CashMovement, Omit<CashMovement, "id">> {
  findByDateRange(startDate: string, endDate: string): Promise<CashMovement[]>
  findByConcept(conceptId: string): Promise<CashMovement[]>
  findByCashier(cashierId: string): Promise<CashMovement[]>
  findByInvoice(invoiceId: string): Promise<CashMovement[]>
  getLastBalance(): Promise<number>
  getDailyMovements(date: string): Promise<CashMovement[]>
}

// Cash Closing Repository
export interface CashClosingRepository extends Repository<CashClosing, Omit<CashClosing, "id" | "createdAt">> {
  findByDate(date: string): Promise<CashClosing | null>
  findByDateRange(startDate: string, endDate: string): Promise<CashClosing[]>
  findOpen(): Promise<CashClosing | null>
  close(id: string, actualBalance: number, notes?: string): Promise<CashClosing | null>
}

// Client Repository
export interface ClientRepository extends Repository<Client, Omit<Client, "id" | "createdAt">> {
  findByTaxId(taxId: string): Promise<Client | null>
  findByName(name: string): Promise<Client[]>
  findActive(): Promise<Client[]>
  search(query: string): Promise<Client[]>
}

// Invoice Repository
export interface InvoiceRepository extends Repository<Invoice, Omit<Invoice, "id" | "number" | "createdAt">> {
  findByNumber(number: string): Promise<Invoice | null>
  findByClient(clientId: string): Promise<Invoice[]>
  findByStatus(status: Invoice["status"]): Promise<Invoice[]>
  findByDateRange(startDate: string, endDate: string): Promise<Invoice[]>
  getNextNumber(): Promise<string>
  issue(id: string): Promise<Invoice | null>
  markPaid(id: string): Promise<Invoice | null>
  cancel(id: string): Promise<Invoice | null>
}

// Credit Note Repository
export interface CreditNoteRepository extends Repository<CreditNote, Omit<CreditNote, "id" | "number" | "createdAt">> {
  findByNumber(number: string): Promise<CreditNote | null>
  findByInvoice(invoiceId: string): Promise<CreditNote[]>
  findByClient(clientId: string): Promise<CreditNote[]>
  findByStatus(status: CreditNote["status"]): Promise<CreditNote[]>
  getNextNumber(): Promise<string>
  issue(id: string): Promise<CreditNote | null>
  apply(id: string): Promise<CreditNote | null>
}

// Calendar Event Repository
export interface CalendarEventRepository extends Repository<CalendarEvent, Omit<CalendarEvent, "id" | "createdAt">> {
  findByDate(date: string): Promise<CalendarEvent[]>
  findByDateRange(startDate: string, endDate: string): Promise<CalendarEvent[]>
  findByUser(userId: string): Promise<CalendarEvent[]>
  findPending(): Promise<CalendarEvent[]>
  markComplete(id: string): Promise<CalendarEvent | null>
}

// System Settings Repository
export interface SystemSettingsRepository {
  get(): Promise<SystemSettings>
  update(settings: Partial<SystemSettings>): Promise<SystemSettings>
  incrementInvoiceNumber(): Promise<number>
  incrementCreditNoteNumber(): Promise<number>
}

// Complete Data Storage interface
export interface DataStorage {
  users: UserRepository
  categories: CategoryRepository
  suppliers: SupplierRepository
  products: ProductRepository
  stock: StockRepository
  movements: MovementRepository
  priceHistory: PriceHistoryRepository
  promotions: PromotionRepository
  alerts: AlertRepository
  // POS
  cashConcepts: CashConceptRepository
  cashMovements: CashMovementRepository
  cashClosings: CashClosingRepository
  clients: ClientRepository
  invoices: InvoiceRepository
  creditNotes: CreditNoteRepository
  calendarEvents: CalendarEventRepository
  settings: SystemSettingsRepository
  // Database management
  isInitialized(): Promise<boolean>
  initialize(): Promise<void>
  exportData(): Promise<string>
  importData(data: string): Promise<void>
}
