import { createMemoryStorage, getMemoryStore } from "./repositories/memory-storage"
import { createServices, type Services } from "./services"
import type { DataStorage } from "./repositories/types"

// Storage type configuration
export type StorageType = "memory" | "sqlite"

let currentStorage: DataStorage | null = null
let currentServices: Services | null = null

export function initializeStorage(type: StorageType = "memory"): { storage: DataStorage; services: Services } {
  switch (type) {
    case "memory":
      currentStorage = createMemoryStorage()
      break
    case "sqlite":
      // SQLite will be implemented for desktop app
      // For now, fall back to memory
      console.warn("SQLite storage not yet implemented, using memory storage")
      currentStorage = createMemoryStorage()
      break
    default:
      currentStorage = createMemoryStorage()
  }

  currentServices = createServices(currentStorage)

  return {
    storage: currentStorage,
    services: currentServices,
  }
}

export function getStorage(): DataStorage {
  if (!currentStorage) {
    const { storage } = initializeStorage("memory")
    return storage
  }
  return currentStorage
}

export function getServices(): Services {
  if (!currentServices) {
    const { services } = initializeStorage("memory")
    return services
  }
  return currentServices
}

export { getMemoryStore }
