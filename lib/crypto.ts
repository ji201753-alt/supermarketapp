/**
 * Simple hash function using Web Crypto API (SHA-256)
 * For local apps without cloud services
 * In a desktop app with SQLite, this can be replaced with bcrypt
 */

export async function hashPassword(password: string): Promise<string> {
  // Add a salt prefix for basic security
  const salt = "superstock_local_salt_v1"
  const data = new TextEncoder().encode(salt + password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computedHash = await hashPassword(password)
  return computedHash === hash
}

// Default password for initial users (should be changed on first login)
export const DEFAULT_PASSWORD = "admin123"
