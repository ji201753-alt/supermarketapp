"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
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
import { getStorage, getServices, getMemoryStore } from "@/lib/storage"
import type { Services } from "@/lib/services"
import type { DataStorage } from "@/lib/repositories/types"

export interface StoreState {
  // Core data
  users: User[]
  categories: Category[]
  suppliers: Supplier[]
  products: Product[]
  stock: Stock[]
  movements: InventoryMovement[]
  priceHistory: PriceHistory[]
  promotions: Promotion[]
  currentUser: User | null
  alertConfig: AlertConfig
  emailAlerts: EmailAlert[]
  // POS data
  cashConcepts: CashConcept[]
  cashMovements: CashMovement[]
  cashClosings: CashClosing[]
  clients: Client[]
  invoices: Invoice[]
  creditNotes: CreditNote[]
  calendarEvents: CalendarEvent[]
  settings: SystemSettings
  // State
  isLoading: boolean
  isInitialized: boolean
}

export interface StoreActions {
  // Auth
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>

  // Users
  addUser: (user: Omit<User, "id" | "createdAt" | "passwordHash">, password: string) => Promise<void>
  updateUser: (id: string, user: Partial<User>) => Promise<void>
  updateUserPassword: (userId: string, newPassword: string) => Promise<boolean>
  deleteUser: (id: string) => Promise<boolean>

  // Categories
  addCategory: (category: Omit<Category, "id">) => Promise<void>
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>

  // Suppliers
  addSupplier: (supplier: Omit<Supplier, "id">) => Promise<void>
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<void>
  deleteSupplier: (id: string) => Promise<void>

  // Products
  addProduct: (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => Promise<void>
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>
  searchProducts: (query: string) => Promise<Product[]>

  // Inventory
  addMovement: (movement: Omit<InventoryMovement, "id" | "createdAt">) => Promise<void>
  updateStock: (productId: string, stock: Partial<Stock>) => Promise<void>

  // Promotions
  addPromotion: (promotion: Omit<Promotion, "id">) => Promise<void>
  updatePromotion: (id: string, promotion: Partial<Promotion>) => Promise<void>
  deletePromotion: (id: string) => Promise<void>

  // Alerts
  updateAlertConfig: (config: Partial<AlertConfig>) => Promise<void>
  sendTestAlert: () => Promise<void>
  markAlertRead: (id: string) => Promise<void>
  clearAlerts: () => Promise<void>

  // Cash Concepts
  addCashConcept: (concept: Omit<CashConcept, "id" | "createdAt">) => Promise<void>
  updateCashConcept: (id: string, concept: Partial<CashConcept>) => Promise<void>
  deleteCashConcept: (id: string) => Promise<void>

  // Clients
  addClient: (client: Omit<Client, "id" | "createdAt">) => Promise<void>
  updateClient: (id: string, client: Partial<Client>) => Promise<void>
  deleteClient: (id: string) => Promise<void>
  searchClients: (query: string) => Promise<Client[]>

  // Calendar Events
  addCalendarEvent: (event: Omit<CalendarEvent, "id" | "createdAt">) => Promise<void>
  updateCalendarEvent: (id: string, event: Partial<CalendarEvent>) => Promise<void>
  deleteCalendarEvent: (id: string) => Promise<void>
  markEventComplete: (id: string) => Promise<void>

  // Settings
  updateSettings: (settings: Partial<SystemSettings>) => Promise<void>

  // Data management
  exportData: () => Promise<string>
  importData: (data: string) => Promise<void>
  refreshData: () => Promise<void>

  // Services access
  getServices: () => Services
  getStorage: () => DataStorage
}

export type Store = StoreState & StoreActions

const defaultSettings: SystemSettings = {
  storeName: "Super T",
  storeSlogan: "Sistema POS e Inventario",
  storeAddress: "",
  storePhone: "",
  storeEmail: "",
  storeNit: "",
  taxRate: 19,
  currency: "MXN",
  invoicePrefix: "FAC-",
  creditNotePrefix: "NC-",
  cashMovementPrefix: "MOV-",
  currentInvoiceNumber: 1,
  currentCreditNoteNumber: 1,
  currentCashMovementNumber: 1,
}

const defaultAlertConfig: AlertConfig = {
  enabled: false,
  email: "",
  threshold: "immediate",
  notifyLowStock: true,
  notifyNoMovement: false,
}

const defaultStore: Store = {
  users: [],
  categories: [],
  suppliers: [],
  products: [],
  stock: [],
  movements: [],
  priceHistory: [],
  promotions: [],
  currentUser: null,
  alertConfig: defaultAlertConfig,
  emailAlerts: [],
  cashConcepts: [],
  cashMovements: [],
  cashClosings: [],
  clients: [],
  invoices: [],
  creditNotes: [],
  calendarEvents: [],
  settings: defaultSettings,
  isLoading: true,
  isInitialized: false,

  login: async () => false,
  logout: () => {},
  changePassword: async () => false,
  addUser: async () => {},
  updateUser: async () => {},
  updateUserPassword: async () => false,
  deleteUser: async () => false,
  addCategory: async () => {},
  updateCategory: async () => {},
  deleteCategory: async () => {},
  addSupplier: async () => {},
  updateSupplier: async () => {},
  deleteSupplier: async () => {},
  addProduct: async () => {},
  updateProduct: async () => {},
  searchProducts: async () => [],
  addMovement: async () => {},
  updateStock: async () => {},
  addPromotion: async () => {},
  updatePromotion: async () => {},
  deletePromotion: async () => {},
  updateAlertConfig: async () => {},
  sendTestAlert: async () => {},
  markAlertRead: async () => {},
  clearAlerts: async () => {},
  addCashConcept: async () => {},
  updateCashConcept: async () => {},
  deleteCashConcept: async () => {},
  addClient: async () => {},
  updateClient: async () => {},
  deleteClient: async () => {},
  searchClients: async () => [],
  addCalendarEvent: async () => {},
  updateCalendarEvent: async () => {},
  deleteCalendarEvent: async () => {},
  markEventComplete: async () => {},
  updateSettings: async () => {},
  exportData: async () => "",
  importData: async () => {},
  refreshData: async () => {},
  getServices,
  getStorage,
}

export const StoreContext = createContext<Store>(defaultStore)

export function useStore() {
  return useContext(StoreContext)
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>({
    users: [],
    categories: [],
    suppliers: [],
    products: [],
    stock: [],
    movements: [],
    priceHistory: [],
    promotions: [],
    currentUser: null,
    alertConfig: defaultAlertConfig,
    emailAlerts: [],
    cashConcepts: [],
    cashMovements: [],
    cashClosings: [],
    clients: [],
    invoices: [],
    creditNotes: [],
    calendarEvents: [],
    settings: defaultSettings,
    isLoading: true,
    isInitialized: false,
  })

  const loadData = useCallback(async () => {
    const storage = getStorage()
    
    // Initialize storage if needed
    const isInit = await storage.isInitialized()
    if (!isInit) {
      await storage.initialize()
    }

    const [
      users,
      categories,
      suppliers,
      products,
      stock,
      movements,
      priceHistory,
      promotions,
      alertConfig,
      emailAlerts,
      cashConcepts,
      cashMovements,
      cashClosings,
      clients,
      invoices,
      creditNotes,
      calendarEvents,
      settings,
    ] = await Promise.all([
      storage.users.getAll(),
      storage.categories.getAll(),
      storage.suppliers.getAll(),
      storage.products.getAll(),
      storage.stock.getAll(),
      storage.movements.getAll(),
      storage.priceHistory.getAll(),
      storage.promotions.getAll(),
      storage.alerts.getConfig(),
      storage.alerts.getAlerts(),
      storage.cashConcepts.getAll(),
      storage.cashMovements.getAll(),
      storage.cashClosings.getAll(),
      storage.clients.getAll(),
      storage.invoices.getAll(),
      storage.creditNotes.getAll(),
      storage.calendarEvents.getAll(),
      storage.settings.get(),
    ])

    setState((prev) => ({
      ...prev,
      users,
      categories,
      suppliers,
      products,
      stock,
      movements,
      priceHistory,
      promotions,
      alertConfig,
      emailAlerts,
      cashConcepts,
      cashMovements,
      cashClosings,
      clients,
      invoices,
      creditNotes,
      calendarEvents,
      settings,
      isLoading: false,
      isInitialized: true,
    }))
  }, [])

  useEffect(() => {
    loadData()
    const memoryStore = getMemoryStore()
    const unsubscribe = memoryStore.subscribe(() => {
      loadData()
    })
    return unsubscribe
  }, [loadData])

  // Auth
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const services = getServices()
    const user = await services.auth.login(email, password)
    if (user) {
      setState((prev) => ({ ...prev, currentUser: user }))
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    const services = getServices()
    services.auth.setCurrentUser(null)
    setState((prev) => ({ ...prev, currentUser: null }))
  }, [])

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<boolean> => {
      if (!state.currentUser) return false
      const services = getServices()
      return services.auth.changePassword(state.currentUser.id, currentPassword, newPassword)
    },
    [state.currentUser],
  )

  // Users
  const addUser = useCallback(async (user: Omit<User, "id" | "createdAt" | "passwordHash">, password: string) => {
    const services = getServices()
    await services.auth.createUserWithPassword(user, password)
  }, [])

  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    const storage = getStorage()
    await storage.users.update(id, updates)
  }, [])

  const updateUserPassword = useCallback(async (userId: string, newPassword: string): Promise<boolean> => {
    const { hashPassword } = await import("@/lib/crypto")
    const storage = getStorage()
    const hash = await hashPassword(newPassword)
    return storage.users.updatePassword(userId, hash)
  }, [])

  const deleteUser = useCallback(async (id: string): Promise<boolean> => {
    const storage = getStorage()
    return storage.users.delete(id)
  }, [])

  // Categories
  const addCategory = useCallback(async (category: Omit<Category, "id">) => {
    const storage = getStorage()
    await storage.categories.create(category)
  }, [])

  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    const storage = getStorage()
    await storage.categories.update(id, updates)
  }, [])

  const deleteCategory = useCallback(async (id: string) => {
    const storage = getStorage()
    await storage.categories.delete(id)
  }, [])

  // Suppliers
  const addSupplier = useCallback(async (supplier: Omit<Supplier, "id">) => {
    const storage = getStorage()
    await storage.suppliers.create(supplier)
  }, [])

  const updateSupplier = useCallback(async (id: string, updates: Partial<Supplier>) => {
    const storage = getStorage()
    await storage.suppliers.update(id, updates)
  }, [])

  const deleteSupplier = useCallback(async (id: string) => {
    const storage = getStorage()
    await storage.suppliers.delete(id)
  }, [])

  // Products
  const addProduct = useCallback(async (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    const services = getServices()
    await services.products.createProduct(product)
  }, [])

  const updateProduct = useCallback(
    async (id: string, updates: Partial<Product>) => {
      const services = getServices()
      await services.products.updateProduct(id, updates, state.currentUser?.id || "1")
    },
    [state.currentUser],
  )

  const searchProducts = useCallback(async (query: string): Promise<Product[]> => {
    const storage = getStorage()
    return storage.products.search(query)
  }, [])

  // Inventory
  const addMovement = useCallback(
    async (movement: Omit<InventoryMovement, "id" | "createdAt">) => {
      const services = getServices()
      await services.inventory.addMovement(
        movement.productId,
        movement.type,
        movement.quantity,
        movement.reason,
        movement.userId || state.currentUser?.id || "1",
      )
    },
    [state.currentUser],
  )

  const updateStock = useCallback(async (productId: string, updates: Partial<Stock>) => {
    const storage = getStorage()
    await storage.stock.update(productId, updates)
  }, [])

  // Promotions
  const addPromotion = useCallback(async (promotion: Omit<Promotion, "id">) => {
    const storage = getStorage()
    await storage.promotions.create(promotion)
  }, [])

  const updatePromotion = useCallback(async (id: string, updates: Partial<Promotion>) => {
    const storage = getStorage()
    await storage.promotions.update(id, updates)
  }, [])

  const deletePromotion = useCallback(async (id: string) => {
    const storage = getStorage()
    await storage.promotions.delete(id)
  }, [])

  // Alerts
  const updateAlertConfig = useCallback(async (config: Partial<AlertConfig>) => {
    const services = getServices()
    await services.alerts.updateConfig(config)
  }, [])

  const sendTestAlert = useCallback(async () => {
    const services = getServices()
    await services.alerts.checkAndSendAlerts()
  }, [])

  const markAlertRead = useCallback(async (id: string) => {
    const services = getServices()
    await services.alerts.markRead(id)
  }, [])

  const clearAlerts = useCallback(async () => {
    const services = getServices()
    await services.alerts.clearAll()
  }, [])

  // Cash Concepts
  const addCashConcept = useCallback(async (concept: Omit<CashConcept, "id" | "createdAt">) => {
    const storage = getStorage()
    await storage.cashConcepts.create(concept)
  }, [])

  const updateCashConcept = useCallback(async (id: string, updates: Partial<CashConcept>) => {
    const storage = getStorage()
    await storage.cashConcepts.update(id, updates)
  }, [])

  const deleteCashConcept = useCallback(async (id: string) => {
    const storage = getStorage()
    await storage.cashConcepts.delete(id)
  }, [])

  // Clients
  const addClient = useCallback(async (client: Omit<Client, "id" | "createdAt">) => {
    const storage = getStorage()
    await storage.clients.create(client)
  }, [])

  const updateClient = useCallback(async (id: string, updates: Partial<Client>) => {
    const storage = getStorage()
    await storage.clients.update(id, updates)
  }, [])

  const deleteClient = useCallback(async (id: string) => {
    const storage = getStorage()
    await storage.clients.delete(id)
  }, [])

  const searchClients = useCallback(async (query: string): Promise<Client[]> => {
    const storage = getStorage()
    return storage.clients.search(query)
  }, [])

  // Calendar Events
  const addCalendarEvent = useCallback(async (event: Omit<CalendarEvent, "id" | "createdAt">) => {
    const storage = getStorage()
    await storage.calendarEvents.create(event)
  }, [])

  const updateCalendarEvent = useCallback(async (id: string, updates: Partial<CalendarEvent>) => {
    const storage = getStorage()
    await storage.calendarEvents.update(id, updates)
  }, [])

  const deleteCalendarEvent = useCallback(async (id: string) => {
    const storage = getStorage()
    await storage.calendarEvents.delete(id)
  }, [])

  const markEventComplete = useCallback(async (id: string) => {
    const storage = getStorage()
    await storage.calendarEvents.markComplete(id)
  }, [])

  // Settings
  const updateSettings = useCallback(async (settings: Partial<SystemSettings>) => {
    const storage = getStorage()
    await storage.settings.update(settings)
  }, [])

  // Data management
  const exportData = useCallback(async (): Promise<string> => {
    const storage = getStorage()
    return storage.exportData()
  }, [])

  const importData = useCallback(async (data: string) => {
    const storage = getStorage()
    await storage.importData(data)
  }, [])

  const refreshData = useCallback(async () => {
    await loadData()
  }, [loadData])

  const store: Store = {
    ...state,
    login,
    logout,
    changePassword,
    addUser,
    updateUser,
    updateUserPassword,
    deleteUser,
    addCategory,
    updateCategory,
    deleteCategory,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addProduct,
    updateProduct,
    searchProducts,
    addMovement,
    updateStock,
    addPromotion,
    updatePromotion,
    deletePromotion,
    updateAlertConfig,
    sendTestAlert,
    markAlertRead,
    clearAlerts,
    addCashConcept,
    updateCashConcept,
    deleteCashConcept,
    addClient,
    updateClient,
    deleteClient,
    searchClients,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    markEventComplete,
    updateSettings,
    exportData,
    importData,
    refreshData,
    getServices,
    getStorage,
  }

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}
