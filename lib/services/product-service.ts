import type { Product, Category, Supplier } from "@/lib/types"
import type { DataStorage } from "@/lib/repositories/types"

export interface ProductService {
  createProduct(data: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product>
  updateProduct(id: string, data: Partial<Product>, userId: string): Promise<Product | null>
  getProductsByCategory(categoryId: string): Promise<Product[]>
  getProductsBySupplier(supplierId: string): Promise<Product[]>
  canDeleteCategory(categoryId: string): Promise<boolean>
  canDeleteSupplier(supplierId: string): Promise<boolean>
  getAllCategories(): Promise<Category[]>
  getAllSuppliers(): Promise<Supplier[]>
}

export function createProductService(storage: DataStorage): ProductService {
  return {
    async createProduct(data: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
      const product = await storage.products.create(data)

      // Initialize stock for new product
      await storage.stock.create({
        productId: product.id,
        quantity: 0,
        minStock: 10,
      })

      return product
    },

    async updateProduct(id: string, data: Partial<Product>, userId: string): Promise<Product | null> {
      const oldProduct = await storage.products.getById(id)

      if (!oldProduct) return null

      // Track price changes
      if (data.salePrice && data.salePrice !== oldProduct.salePrice) {
        await storage.priceHistory.create({
          productId: id,
          oldPrice: oldProduct.salePrice,
          newPrice: data.salePrice,
          changedAt: new Date().toISOString().split("T")[0],
          userId,
        })
      }

      return storage.products.update(id, data)
    },

    async getProductsByCategory(categoryId: string): Promise<Product[]> {
      return storage.products.findByCategory(categoryId)
    },

    async getProductsBySupplier(supplierId: string): Promise<Product[]> {
      return storage.products.findBySupplier(supplierId)
    },

    async canDeleteCategory(categoryId: string): Promise<boolean> {
      const products = await storage.products.findByCategory(categoryId)
      return products.length === 0
    },

    async canDeleteSupplier(supplierId: string): Promise<boolean> {
      const products = await storage.products.findBySupplier(supplierId)
      return products.length === 0
    },

    async getAllCategories(): Promise<Category[]> {
      return storage.categories.getAll()
    },

    async getAllSuppliers(): Promise<Supplier[]> {
      return storage.suppliers.getAll()
    },
  }
}
