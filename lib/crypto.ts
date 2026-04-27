/**
 * Simple hash function using Web Crypto API (SHA-256)
 * For local apps without cloud services
 * In a desktop app with SQLite, this can be replaced with bcrypt
 */

export async function hashPassword(password: string): Promise<string> {
  // Use a more complex and unique salt for the local application
  // In a real production environment with a backend, we would use bcrypt or argon2
  // with a unique salt per user. Since this is a client-side "local" app,
  // we use a fixed but complex system salt.
  const systemSalt = "supert_secure_v2_982347293847"
  const data = new TextEncoder().encode(systemSalt + password + systemSalt.split('').reverse().join(''))

  // Perform multiple rounds of hashing (simple iteration) to increase computational cost
  let hashBuffer = await crypto.subtle.digest("SHA-256", data)

  for (let i = 0; i < 10; i++) {
    hashBuffer = await crypto.subtle.digest("SHA-256", hashBuffer)
  }

  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computedHash = await hashPassword(password)
  return computedHash === hash
}

// Default password for initial users (should be changed on first login)
export const DEFAULT_PASSWORD = "admin123"
