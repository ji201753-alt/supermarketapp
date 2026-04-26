import type { DataStorage } from "@/lib/repositories/types"
import { createAuthService, type AuthService } from "./auth-service"
import { createInventoryService, type InventoryService } from "./inventory-service"
import { createProductService, type ProductService } from "./product-service"
import { createAlertService, type AlertService } from "./alert-service"
import { createPOSService, type POSService } from "./pos-service"

export interface Services {
  auth: AuthService
  inventory: InventoryService
  products: ProductService
  alerts: AlertService
  pos: POSService
}

export function createServices(storage: DataStorage): Services {
  return {
    auth: createAuthService(storage),
    inventory: createInventoryService(storage),
    products: createProductService(storage),
    alerts: createAlertService(storage),
    pos: createPOSService(storage),
  }
}

export type { AuthService, InventoryService, ProductService, AlertService, POSService }
export type { InventoryMetrics, ProductWithStock } from "./inventory-service"
