import type { AlertConfig, EmailAlert } from "@/lib/types"
import type { DataStorage } from "@/lib/repositories/types"

export interface AlertService {
  getConfig(): Promise<AlertConfig>
  updateConfig(config: Partial<AlertConfig>): Promise<AlertConfig>
  getAlerts(): Promise<EmailAlert[]>
  sendLowStockAlert(
    productId: string,
    productName: string,
    currentStock: number,
    minStock: number,
  ): Promise<EmailAlert | null>
  checkAndSendAlerts(): Promise<EmailAlert[]>
  markRead(id: string): Promise<void>
  clearAll(): Promise<void>
}

export function createAlertService(storage: DataStorage): AlertService {
  return {
    async getConfig(): Promise<AlertConfig> {
      return storage.alerts.getConfig()
    },

    async updateConfig(config: Partial<AlertConfig>): Promise<AlertConfig> {
      return storage.alerts.updateConfig(config)
    },

    async getAlerts(): Promise<EmailAlert[]> {
      return storage.alerts.getAlerts()
    },

    async sendLowStockAlert(
      productId: string,
      productName: string,
      currentStock: number,
      minStock: number,
    ): Promise<EmailAlert | null> {
      const config = await storage.alerts.getConfig()

      if (!config.enabled || !config.notifyLowStock) {
        return null
      }

      return storage.alerts.addAlert({
        type: "low_stock",
        productId,
        message: `Alerta de stock bajo: ${productName} tiene solo ${currentStock} unidades (mínimo: ${minStock})`,
        sentAt: new Date().toISOString(),
        read: false,
      })
    },

    async checkAndSendAlerts(): Promise<EmailAlert[]> {
      const config = await storage.alerts.getConfig()

      if (!config.enabled) {
        return []
      }

      const lowStockItems = await storage.stock.getLowStock()
      const products = await storage.products.getAll()
      const alerts: EmailAlert[] = []

      for (const stockItem of lowStockItems) {
        const product = products.find((p) => p.id === stockItem.productId && p.active)
        if (product) {
          const alert = await this.sendLowStockAlert(product.id, product.name, stockItem.quantity, stockItem.minStock)
          if (alert) {
            alerts.push(alert)
          }
        }
      }

      return alerts
    },

    async markRead(id: string): Promise<void> {
      return storage.alerts.markRead(id)
    },

    async clearAll(): Promise<void> {
      return storage.alerts.clearAll()
    },
  }
}
