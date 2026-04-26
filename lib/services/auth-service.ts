import type { User, UserRole } from "@/lib/types"
import type { DataStorage } from "@/lib/repositories/types"
import { hashPassword, verifyPassword } from "@/lib/crypto"

export interface AuthService {
  login(email: string, password: string): Promise<User | null>
  getCurrentUser(): User | null
  setCurrentUser(user: User | null): void
  hasPermission(user: User | null, requiredRole: UserRole): boolean
  canEdit(user: User | null): boolean
  canManageUsers(user: User | null): boolean
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean>
  createInitialAdmin(name: string, email: string, password: string): Promise<User | null>
  hasUsers(): Promise<boolean>
  createUserWithPassword(data: Omit<User, "id" | "createdAt" | "passwordHash">, password: string): Promise<User>
}

export function createAuthService(storage: DataStorage): AuthService {
  let currentUser: User | null = null

  return {
    async login(email: string, password: string): Promise<User | null> {
      const user = await storage.users.findByEmail(email)
      if (!user || !user.active) {
        return null
      }

      // Validate password
      if (!user.passwordHash) {
        // Legacy user without password - allow login but recommend password change
        currentUser = user
        return user
      }

      const isValid = await verifyPassword(password, user.passwordHash)
      if (!isValid) {
        return null
      }

      currentUser = user
      return user
    },

    getCurrentUser(): User | null {
      return currentUser
    },

    setCurrentUser(user: User | null): void {
      currentUser = user
    },

    hasPermission(user: User | null, requiredRole: UserRole): boolean {
      if (!user) return false
      const roleHierarchy: Record<UserRole, number> = {
        admin: 3,
        manager: 2,
        viewer: 1,
      }
      return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
    },

    canEdit(user: User | null): boolean {
      return this.hasPermission(user, "manager")
    },

    canManageUsers(user: User | null): boolean {
      return this.hasPermission(user, "admin")
    },

    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
      const user = await storage.users.getById(userId)
      if (!user) return false

      // Verify current password
      if (user.passwordHash) {
        const isValid = await verifyPassword(currentPassword, user.passwordHash)
        if (!isValid) return false
      }

      // Hash and save new password
      const newHash = await hashPassword(newPassword)
      return storage.users.updatePassword(userId, newHash)
    },

    async hasUsers(): Promise<boolean> {
      return storage.users.hasUsers()
    },

    async createInitialAdmin(name: string, email: string, password: string): Promise<User | null> {
      const hasExistingUsers = await storage.users.hasUsers()
      if (hasExistingUsers) {
        return null // Already has users, cannot create initial admin
      }

      const passwordHash = await hashPassword(password)
      const user = await storage.users.create({
        name,
        email,
        role: "admin",
        active: true,
        passwordHash,
      })

      return user
    },

    async createUserWithPassword(
      data: Omit<User, "id" | "createdAt" | "passwordHash">,
      password: string,
    ): Promise<User> {
      const passwordHash = await hashPassword(password)
      return storage.users.create({
        ...data,
        passwordHash,
      })
    },
  }
}
