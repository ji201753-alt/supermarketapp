import type { Product, Stock, InventoryMovement, Promotion } from "@/lib/types"
import type { DataStorage } from "@/lib/repositories/types"

export interface InventoryMetrics {
  totalProducts: number
  activeProducts: number
  totalStockValue: number
  lowStockCount: number
  outOfStockCount: number
}

export interface ProductWithStock extends Product {
  stock: Stock | null
  hasLowStock: boolean
  currentPromotion: Promotion | null
  effectivePrice: number
  margin: number
}

export interface InventoryService {
  getMetrics(): Promise<InventoryMetrics>
  getProductsWithStock(): Promise<ProductWithStock[]>
  getLowStockProducts(): Promise<ProductWithStock[]>
  addMovement(
    productId: string,
    type: "entry" | "exit" | "adjustment",
    quantity: number,
    reason: string,
    userId: string,
  ): Promise<{ success: boolean; error?: string }>
  updateMinStock(productId: string, minStock: number): Promise<boolean>
  getMovementHistory(productId?: string): Promise<InventoryMovement[]>
}

export function createInventoryService(storage: DataStorage): InventoryService {
  return {
    async getMetrics(): Promise<InventoryMetrics> {
      const products = await storage.products.getAll()
      const stocks = await storage.stock.getAll()
      const activeProducts = products.filter((p) => p.active)

      let totalStockValue = 0
      let lowStockCount = 0
      let outOfStockCount = 0

      for (const stock of stocks) {
        const product = products.find((p) => p.id === stock.productId)
        if (product && product.active) {
          totalStockValue += stock.quantity * product.salePrice
          if (stock.quantity === 0) {
            outOfStockCount++
          } else if (stock.quantity < stock.minStock) {
            lowStockCount++
          }
        }
      }

      return {
        totalProducts: products.length,
        activeProducts: activeProducts.length,
        totalStockValue,
        lowStockCount,
        outOfStockCount,
      }
    },

    async getProductsWithStock(): Promise<ProductWithStock[]> {
      const products = await storage.products.getAll()
      const stocks = await storage.stock.getAll()
      const promotions = await storage.promotions.findActive()
      const today = new Date().toISOString().split("T")[0]

      return products.map((product) => {
        const stock = stocks.find((s) => s.productId === product.id) || null
        const currentPromotion =
          promotions.find(
            (p) => p.productId === product.id && p.active && p.startDate <= today && p.endDate >= today,
          ) || null

        const effectivePrice = currentPromotion ? currentPromotion.promoPrice : product.salePrice
        const margin = ((effectivePrice - product.purchasePrice) / product.purchasePrice) * 100

        return {
          ...product,
          stock,
          hasLowStock: stock ? stock.quantity < stock.minStock : false,
          currentPromotion,
          effectivePrice,
          margin,
        }
      })
    },

    async getLowStockProducts(): Promise<ProductWithStock[]> {
      const productsWithStock = await this.getProductsWithStock()
      return productsWithStock.filter((p) => p.active && p.hasLowStock)
    },

    async addMovement(
      productId: string,
      type: "entry" | "exit" | "adjustment",
      quantity: number,
      reason: string,
      userId: string,
    ): Promise<{ success: boolean; error?: string }> {
      const stock = await storage.stock.getByProductId(productId)

      if (!stock) {
        return { success: false, error: "Producto no encontrado en inventario" }
      }

      // Validate exit doesn't exceed available stock
      if (type === "exit" && quantity > stock.quantity) {
        return { success: false, error: "Stock insuficiente para esta salida" }
      }

      // Calculate new quantity
      let newQuantity = stock.quantity
      if (type === "entry") {
        newQuantity += quantity
      } else if (type === "exit") {
        newQuantity -= quantity
      } else {
        newQuantity += quantity // adjustment can be positive or negative
      }

      // Create movement record
      await storage.movements.create({
        productId,
        type,
        quantity: type === "adjustment" ? quantity : Math.abs(quantity),
        reason,
        userId,
      })

      // Update stock
      await storage.stock.update(productId, { quantity: Math.max(0, newQuantity) })

      return { success: true }
    },

    async updateMinStock(productId: string, minStock: number): Promise<boolean> {
      const result = await storage.stock.update(productId, { minStock })
      return result !== null
    },

    async getMovementHistory(productId?: string): Promise<InventoryMovement[]> {
      if (productId) {
        return storage.movements.findByProduct(productId)
      }
      return storage.movements.getAll()
    },
  }
}
