"use client"

import { useState, useRef } from "react"
import { useStore } from "@/components/store-provider"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Database,
  Download,
  Upload,
  FileSpreadsheet,
  HardDrive,
  Users,
  Package,
  Boxes,
  Receipt,
  AlertTriangle,
  Check,
  ShieldCheck,
  FileCode,
  Table2,
} from "lucide-react"

// ── Helpers ──────────────────────────────────────────────

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// CSV helpers
function arrayToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return ""
  const keys = Object.keys(data[0])
  const header = keys.join(",")
  const rows = data.map((row) =>
    keys
      .map((key) => {
        const val = row[key]
        if (val === null || val === undefined) return ""
        const str = String(val)
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      })
      .join(","),
  )
  return [header, ...rows].join("\n")
}

function csvToArray(csv: string): Record<string, string>[] {
  const lines = csv.trim().split("\n")
  if (lines.length < 2) return []
  const headers = parseCsvLine(lines[0])
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? ""
    })
    rows.push(row)
  }
  return rows
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ",") {
        result.push(current)
        current = ""
      } else {
        current += char
      }
    }
  }
  result.push(current)
  return result
}

// ── SQL Generation ───────────────────────────────────────

function escapeSQL(val: unknown): string {
  if (val === null || val === undefined) return "NULL"
  if (typeof val === "boolean") return val ? "1" : "0"
  if (typeof val === "number") return String(val)
  const str = String(val).replace(/'/g, "''")
  return `'${str}'`
}

interface TableDef {
  name: string
  columns: { name: string; type: string; pk?: boolean }[]
}

function getTableDefs(): TableDef[] {
  return [
    {
      name: "users",
      columns: [
        { name: "id", type: "TEXT", pk: true },
        { name: "name", type: "TEXT" },
        { name: "email", type: "TEXT" },
        { name: "passwordHash", type: "TEXT" },
        { name: "role", type: "TEXT" },
        { name: "active", type: "INTEGER" },
        { name: "createdAt", type: "TEXT" },
      ],
    },
    {
      name: "categories",
      columns: [
        { name: "id", type: "TEXT", pk: true },
        { name: "name", type: "TEXT" },
        { name: "description", type: "TEXT" },
      ],
    },
    {
      name: "suppliers",
      columns: [
        { name: "id", type: "TEXT", pk: true },
        { name: "name", type: "TEXT" },
        { name: "contact", type: "TEXT" },
        { name: "phone", type: "TEXT" },
        { name: "email", type: "TEXT" },
        { name: "address", type: "TEXT" },
        { name: "active", type: "INTEGER" },
      ],
    },
    {
      name: "products",
      columns: [
        { name: "id", type: "TEXT", pk: true },
        { name: "name", type: "TEXT" },
        { name: "sku", type: "TEXT" },
        { name: "barcode", type: "TEXT" },
        { name: "categoryId", type: "TEXT" },
        { name: "supplierId", type: "TEXT" },
        { name: "description", type: "TEXT" },
        { name: "costPrice", type: "REAL" },
        { name: "salePrice", type: "REAL" },
        { name: "unit", type: "TEXT" },
        { name: "active", type: "INTEGER" },
        { name: "createdAt", type: "TEXT" },
      ],
    },
    {
      name: "stock",
      columns: [
        { name: "productId", type: "TEXT", pk: true },
        { name: "quantity", type: "INTEGER" },
        { name: "minStock", type: "INTEGER" },
        { name: "lastUpdated", type: "TEXT" },
      ],
    },
    {
      name: "movements",
      columns: [
        { name: "id", type: "TEXT", pk: true },
        { name: "productId", type: "TEXT" },
        { name: "type", type: "TEXT" },
        { name: "quantity", type: "INTEGER" },
        { name: "reason", type: "TEXT" },
        { name: "userId", type: "TEXT" },
        { name: "date", type: "TEXT" },
      ],
    },
    {
      name: "clients",
      columns: [
        { name: "id", type: "TEXT", pk: true },
        { name: "name", type: "TEXT" },
        { name: "ruc", type: "TEXT" },
        { name: "taxId", type: "TEXT" },
        { name: "email", type: "TEXT" },
        { name: "phone", type: "TEXT" },
        { name: "address", type: "TEXT" },
        { name: "allowCredit", type: "INTEGER" },
        { name: "creditLimit", type: "REAL" },
        { name: "active", type: "INTEGER" },
        { name: "createdAt", type: "TEXT" },
      ],
    },
    {
      name: "invoices",
      columns: [
        { name: "id", type: "TEXT", pk: true },
        { name: "number", type: "TEXT" },
        { name: "clientId", type: "TEXT" },
        { name: "clientName", type: "TEXT" },
        { name: "items", type: "TEXT" },
        { name: "subtotal", type: "REAL" },
        { name: "tax", type: "REAL" },
        { name: "taxRate", type: "REAL" },
        { name: "total", type: "REAL" },
        { name: "paymentMethod", type: "TEXT" },
        { name: "status", type: "TEXT" },
        { name: "userId", type: "TEXT" },
        { name: "date", type: "TEXT" },
      ],
    },
    {
      name: "credit_notes",
      columns: [
        { name: "id", type: "TEXT", pk: true },
        { name: "number", type: "TEXT" },
        { name: "invoiceId", type: "TEXT" },
        { name: "reason", type: "TEXT" },
        { name: "items", type: "TEXT" },
        { name: "total", type: "REAL" },
        { name: "userId", type: "TEXT" },
        { name: "date", type: "TEXT" },
      ],
    },
    {
      name: "cash_movements",
      columns: [
        { name: "id", type: "TEXT", pk: true },
        { name: "type", type: "TEXT" },
        { name: "amount", type: "REAL" },
        { name: "concept", type: "TEXT" },
        { name: "reference", type: "TEXT" },
        { name: "userId", type: "TEXT" },
        { name: "date", type: "TEXT" },
      ],
    },
    {
      name: "cash_closings",
      columns: [
        { name: "id", type: "TEXT", pk: true },
        { name: "openAmount", type: "REAL" },
        { name: "closeAmount", type: "REAL" },
        { name: "expectedAmount", type: "REAL" },
        { name: "difference", type: "REAL" },
        { name: "salesCount", type: "INTEGER" },
        { name: "totalSales", type: "REAL" },
        { name: "userId", type: "TEXT" },
        { name: "openDate", type: "TEXT" },
        { name: "closeDate", type: "TEXT" },
        { name: "notes", type: "TEXT" },
      ],
    },
    {
      name: "promotions",
      columns: [
        { name: "id", type: "TEXT", pk: true },
        { name: "productId", type: "TEXT" },
        { name: "discountPercent", type: "REAL" },
        { name: "startDate", type: "TEXT" },
        { name: "endDate", type: "TEXT" },
        { name: "active", type: "INTEGER" },
      ],
    },
    {
      name: "calendar_events",
      columns: [
        { name: "id", type: "TEXT", pk: true },
        { name: "title", type: "TEXT" },
        { name: "description", type: "TEXT" },
        { name: "date", type: "TEXT" },
        { name: "type", type: "TEXT" },
        { name: "completed", type: "INTEGER" },
        { name: "createdBy", type: "TEXT" },
      ],
    },
    {
      name: "settings",
      columns: [
        { name: "key", type: "TEXT", pk: true },
        { name: "value", type: "TEXT" },
      ],
    },
  ]
}

function generateSQL(data: Record<string, unknown[]>): string {
  const defs = getTableDefs()
  const lines: string[] = [
    "-- =============================================",
    "-- Super T - Backup Completo de Base de Datos",
    `-- Fecha: ${new Date().toISOString()}`,
    "-- Formato: SQL (compatible con SQLite/PostgreSQL)",
    "-- =============================================",
    "",
    "PRAGMA foreign_keys = OFF;",
    "BEGIN TRANSACTION;",
    "",
  ]

  for (const def of defs) {
    const pk = def.columns.find((c) => c.pk)?.name || "id"
    lines.push(`-- Tabla: ${def.name}`)
    lines.push(`DROP TABLE IF EXISTS ${def.name};`)
    lines.push(`CREATE TABLE ${def.name} (`)
    const colDefs = def.columns.map((c) => {
      let col = `  ${c.name} ${c.type}`
      if (c.pk) col += " PRIMARY KEY"
      return col
    })
    lines.push(colDefs.join(",\n"))
    lines.push(");")
    lines.push("")

    // Map data key to table name (handle snake_case vs camelCase)
    const dataKey = findDataKey(def.name, data)
    const rows = dataKey ? (data[dataKey] as Record<string, unknown>[]) : []

    if (def.name === "settings" && data["settings"]) {
      // Settings is an object, not an array
      const settings = data["settings"] as unknown as Record<string, unknown>
      for (const [key, value] of Object.entries(settings)) {
        lines.push(
          `INSERT INTO settings (key, value) VALUES (${escapeSQL(key)}, ${escapeSQL(typeof value === "object" ? JSON.stringify(value) : value)});`,
        )
      }
    } else if (rows && rows.length > 0) {
      for (const row of rows) {
        const values = def.columns.map((c) => {
          let val = row[c.name]
          // Handle booleans stored as 0/1 in SQL
          if (typeof val === "boolean") val = val ? 1 : 0
          // Handle objects (like invoice items array)
          if (typeof val === "object" && val !== null) val = JSON.stringify(val)
          return escapeSQL(val)
        })
        lines.push(
          `INSERT INTO ${def.name} (${def.columns.map((c) => c.name).join(", ")}) VALUES (${values.join(", ")});`,
        )
      }
    }
    lines.push("")
  }

  lines.push("COMMIT;")
  lines.push("PRAGMA foreign_keys = ON;")
  lines.push("")

  return lines.join("\n")
}

function findDataKey(tableName: string, data: Record<string, unknown[]>): string | null {
  // Direct match
  if (data[tableName]) return tableName
  // camelCase mapping
  const camelMap: Record<string, string> = {
    credit_notes: "creditNotes",
    cash_movements: "cashMovements",
    cash_closings: "cashClosings",
    calendar_events: "calendarEvents",
    price_history: "priceHistory",
    email_alerts: "emailAlerts",
    alert_config: "alertConfig",
    cash_concepts: "cashConcepts",
  }
  if (camelMap[tableName] && data[camelMap[tableName]]) return camelMap[tableName]
  return null
}

// ── SQL Parser (for import) ──────────────────────────────

function parseSQLInserts(sql: string): Record<string, Record<string, unknown>[]> {
  const result: Record<string, Record<string, unknown>[]> = {}
  const insertRegex = /INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)\s*;/gi
  let match: RegExpExecArray | null

  while ((match = insertRegex.exec(sql)) !== null) {
    const tableName = match[1]
    const columns = match[2].split(",").map((c) => c.trim())
    const valuesStr = match[3]
    const values = parseSQLValues(valuesStr)

    if (!result[tableName]) result[tableName] = []
    const row: Record<string, unknown> = {}
    columns.forEach((col, idx) => {
      let val: unknown = values[idx]
      // Convert SQL types back
      if (val === "NULL" || val === null) {
        val = null
      } else if (typeof val === "string") {
        // Try to parse JSON for complex fields
        if ((val.startsWith("[") || val.startsWith("{")) && col !== "key") {
          try {
            val = JSON.parse(val)
          } catch {
            // keep as string
          }
        }
        // Convert "1"/"0" for boolean-like fields
        if ((col === "active" || col === "allowCredit" || col === "completed") && (val === "1" || val === "0")) {
          val = val === "1"
        }
      }
      row[col] = val
    })
    result[tableName].push(row)
  }

  return result
}

function parseSQLValues(str: string): (string | number | null)[] {
  const result: (string | number | null)[] = []
  let current = ""
  let inString = false
  let i = 0

  while (i < str.length) {
    const char = str[i]
    if (inString) {
      if (char === "'" && str[i + 1] === "'") {
        current += "'"
        i += 2
        continue
      } else if (char === "'") {
        inString = false
        result.push(current)
        current = ""
        i++
        continue
      } else {
        current += char
      }
    } else {
      if (char === "'") {
        inString = true
        current = ""
      } else if (char === ",") {
        const trimmed = current.trim()
        if (trimmed === "NULL") {
          result.push(null)
        } else if (trimmed !== "" && !Number.isNaN(Number(trimmed))) {
          result.push(Number(trimmed))
        }
        current = ""
      } else {
        current += char
      }
    }
    i++
  }
  // Last value
  if (!inString) {
    const trimmed = current.trim()
    if (trimmed === "NULL") {
      result.push(null)
    } else if (trimmed !== "" && !Number.isNaN(Number(trimmed))) {
      result.push(Number(trimmed))
    }
  }

  return result
}

function sqlDataToStoreFormat(tables: Record<string, Record<string, unknown>[]>): Record<string, unknown> {
  const camelMap: Record<string, string> = {
    credit_notes: "creditNotes",
    cash_movements: "cashMovements",
    cash_closings: "cashClosings",
    calendar_events: "calendarEvents",
    price_history: "priceHistory",
    email_alerts: "emailAlerts",
    alert_config: "alertConfig",
    cash_concepts: "cashConcepts",
  }

  const result: Record<string, unknown> = {}
  for (const [tableName, rows] of Object.entries(tables)) {
    if (tableName === "settings") {
      // Convert key-value rows back into settings object
      const settings: Record<string, unknown> = {}
      for (const row of rows) {
        const key = row.key as string
        let val: unknown = row.value
        if (typeof val === "string") {
          try {
            val = JSON.parse(val as string)
          } catch {
            // keep as string
          }
        }
        settings[key] = val
      }
      result.settings = settings
    } else {
      const storeKey = camelMap[tableName] || tableName
      result[storeKey] = rows
    }
  }

  return result
}

// ── CSV import helper for individual tables ──────────────

const TABLE_CONFIG: {
  key: string
  label: string
  storeKey: string
  boolFields: string[]
  numFields: string[]
  jsonFields: string[]
}[] = [
  { key: "products", label: "Productos", storeKey: "products", boolFields: ["active"], numFields: ["costPrice", "salePrice"], jsonFields: [] },
  { key: "stock", label: "Stock", storeKey: "stock", boolFields: [], numFields: ["quantity", "minStock"], jsonFields: [] },
  { key: "categories", label: "Categorias", storeKey: "categories", boolFields: [], numFields: [], jsonFields: [] },
  { key: "suppliers", label: "Proveedores", storeKey: "suppliers", boolFields: ["active"], numFields: [], jsonFields: [] },
  { key: "clients", label: "Clientes", storeKey: "clients", boolFields: ["active", "allowCredit"], numFields: ["creditLimit"], jsonFields: [] },
  { key: "invoices", label: "Facturas", storeKey: "invoices", boolFields: [], numFields: ["subtotal", "tax", "taxRate", "total"], jsonFields: ["items"] },
  { key: "movements", label: "Movimientos", storeKey: "movements", boolFields: [], numFields: ["quantity"], jsonFields: [] },
  { key: "users", label: "Usuarios", storeKey: "users", boolFields: ["active"], numFields: [], jsonFields: [] },
]

// ── Main Component ───────────────────────────────────────

export default function DatabasePage() {
  const {
    currentUser,
    users,
    products,
    stock,
    categories,
    suppliers,
    movements,
    invoices,
    clients,
    creditNotes,
    cashMovements,
    cashClosings,
    promotions,
    calendarEvents,
    exportData,
    importData,
    refreshData,
  } = useStore()

  const [showImportSQLDialog, setShowImportSQLDialog] = useState(false)
  const [showImportCSVDialog, setShowImportCSVDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [importError, setImportError] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [csvImportTarget, setCsvImportTarget] = useState("")
  const sqlFileRef = useRef<HTMLInputElement>(null)
  const csvFileRef = useRef<HTMLInputElement>(null)

  const isAdmin = currentUser?.role === "admin"

  const stats = [
    { label: "Usuarios", count: users.length, icon: Users },
    { label: "Productos", count: products.length, icon: Package },
    { label: "Stock", count: stock.length, icon: Boxes },
    { label: "Categorias", count: categories.length, icon: Database },
    { label: "Proveedores", count: suppliers.length, icon: Database },
    { label: "Movimientos", count: movements.length, icon: Boxes },
    { label: "Facturas", count: invoices.length, icon: Receipt },
    { label: "Clientes", count: clients.length, icon: Users },
    { label: "Notas de Credito", count: creditNotes.length, icon: Receipt },
    { label: "Mov. de Caja", count: cashMovements.length, icon: Database },
    { label: "Cierres de Caja", count: cashClosings.length, icon: Database },
    { label: "Promociones", count: promotions.length, icon: Database },
    { label: "Eventos", count: calendarEvents.length, icon: Database },
  ]

  const totalRecords = stats.reduce((sum, s) => sum + s.count, 0)

  // ── Export full database as SQL ──
  const handleExportSQL = async () => {
    try {
      const jsonStr = await exportData()
      const data = JSON.parse(jsonStr)
      const sql = generateSQL(data)
      const timestamp = new Date().toISOString().split("T")[0]
      const adminId = currentUser?.id || "unknown"
      downloadFile(sql, `supert-backup-${adminId}-${timestamp}.sql`, "application/sql")
      setSuccessMessage("Base de datos exportada exitosamente como SQL. Este archivo preserva toda la estructura, relaciones y tipos de datos.")
      setShowSuccessDialog(true)
    } catch (error) {
      console.error("Export error:", error)
    }
  }

  // ── Export individual table as CSV ──
  const handleExportCSV = (tableName: string) => {
    const timestamp = new Date().toISOString().split("T")[0]
    let data: Record<string, unknown>[] = []

    switch (tableName) {
      case "users":
        data = users.map(({ passwordHash, ...u }) => u as Record<string, unknown>)
        break
      case "products":
        data = products as unknown as Record<string, unknown>[]
        break
      case "stock":
        data = stock.map((s) => {
          const product = products.find((p) => p.id === s.productId)
          return { ...s, productName: product?.name || "" } as Record<string, unknown>
        })
        break
      case "categories":
        data = categories as unknown as Record<string, unknown>[]
        break
      case "suppliers":
        data = suppliers as unknown as Record<string, unknown>[]
        break
      case "movements":
        data = movements as unknown as Record<string, unknown>[]
        break
      case "invoices":
        data = invoices.map((inv) => ({
          ...inv,
          items: JSON.stringify(inv.items),
        })) as unknown as Record<string, unknown>[]
        break
      case "clients":
        data = clients as unknown as Record<string, unknown>[]
        break
      default:
        return
    }

    const csv = arrayToCSV(data)
    downloadFile(csv, `supert-${tableName}-${timestamp}.csv`, "text/csv")
  }

  // ── Import full database from SQL ──
  const handleImportSQL = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportError("")

    try {
      const text = await file.text()

      // Validate it looks like a SQL file
      if (!text.includes("INSERT INTO") && !text.includes("CREATE TABLE")) {
        throw new Error("El archivo no parece ser un respaldo SQL valido de Super T. Debe contener sentencias CREATE TABLE e INSERT INTO.")
      }

      // Parse SQL inserts
      const tables = parseSQLInserts(text)
      const storeData = sqlDataToStoreFormat(tables)

      // Validate admin ownership
      const importedUsers = (storeData.users || []) as { role: string; email: string }[]
      const adminUser = importedUsers.find(
        (u) => u.role === "admin" && u.email === currentUser?.email,
      )

      if (!adminUser && importedUsers.length > 0) {
        setImportError(
          "Esta base de datos pertenece a otro administrador. Solo el administrador original puede importar su propia base de datos.",
        )
        setIsImporting(false)
        if (sqlFileRef.current) sqlFileRef.current.value = ""
        return
      }

      // Convert to JSON and use existing importData
      const jsonStr = JSON.stringify(storeData)
      await importData(jsonStr)
      await refreshData()
      setShowImportSQLDialog(false)
      setSuccessMessage(
        `Base de datos restaurada exitosamente desde SQL. ${importedUsers.length} usuarios, ${(storeData.products as unknown[])?.length || 0} productos cargados.`,
      )
      setShowSuccessDialog(true)
    } catch (error) {
      if (error instanceof Error) {
        setImportError(error.message)
      } else {
        setImportError("Error al procesar el archivo SQL.")
      }
    } finally {
      setIsImporting(false)
      if (sqlFileRef.current) sqlFileRef.current.value = ""
    }
  }

  // ── Import individual table from CSV ──
  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !csvImportTarget) return

    setIsImporting(true)
    setImportError("")

    try {
      const text = await file.text()
      const rows = csvToArray(text)

      if (rows.length === 0) {
        throw new Error("El archivo CSV esta vacio o no tiene formato valido.")
      }

      const config = TABLE_CONFIG.find((t) => t.key === csvImportTarget)
      if (!config) throw new Error("Tabla de destino no reconocida.")

      // Type-cast CSV values
      const typedRows = rows.map((row) => {
        const typed: Record<string, unknown> = { ...row }
        for (const field of config.boolFields) {
          if (field in typed) {
            typed[field] = typed[field] === "true" || typed[field] === "1"
          }
        }
        for (const field of config.numFields) {
          if (field in typed) {
            typed[field] = Number(typed[field]) || 0
          }
        }
        for (const field of config.jsonFields) {
          if (field in typed && typeof typed[field] === "string") {
            try {
              typed[field] = JSON.parse(typed[field] as string)
            } catch {
              // keep as string
            }
          }
        }
        return typed
      })

      // Build partial import with only the target table
      const partialData: Record<string, unknown> = {}
      partialData[config.storeKey] = typedRows
      const jsonStr = JSON.stringify(partialData)
      await importData(jsonStr)
      await refreshData()

      setShowImportCSVDialog(false)
      setCsvImportTarget("")
      setSuccessMessage(`Tabla "${config.label}" importada exitosamente con ${typedRows.length} registros desde CSV.`)
      setShowSuccessDialog(true)
    } catch (error) {
      if (error instanceof Error) {
        setImportError(error.message)
      } else {
        setImportError("Error al procesar el archivo CSV.")
      }
    } finally {
      setIsImporting(false)
      if (csvFileRef.current) csvFileRef.current.value = ""
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col">
        <DashboardHeader
          title="Base de Datos"
          description="Acceso restringido a administradores"
        />
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <ShieldCheck className="h-16 w-16 mb-4" />
          <p className="text-lg">Solo los administradores pueden gestionar la base de datos.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <DashboardHeader
        title="Base de Datos"
        description="Exportar, importar y gestionar los datos del sistema"
      />

      <div className="p-6 space-y-6">
        {/* Database Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <HardDrive className="h-5 w-5 text-primary" />
                  Estado de la Base de Datos
                </CardTitle>
                <CardDescription>
                  Admin: {currentUser?.name} ({currentUser?.email}) - ID: {currentUser?.id}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="font-mono text-sm">
                {totalRecords} registros
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2.5"
                >
                  <stat.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                    <p className="text-sm font-bold">{stat.count}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Export / Import Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* ─── Export ─── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Download className="h-5 w-5 text-primary" />
                Exportar Datos
              </CardTitle>
              <CardDescription>
                Descarga respaldos completos en formato SQL o tablas individuales en CSV.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Full backup SQL */}
              <div className="rounded-lg border bg-muted/20 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">Respaldo Completo (SQL)</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Exporta toda la base de datos como archivo SQL con sentencias CREATE TABLE e INSERT. 
                  Preserva estructura, tipos de datos y relaciones. Compatible con SQLite y PostgreSQL.
                </p>
                <Button onClick={handleExportSQL} className="w-full justify-start gap-2">
                  <FileCode className="h-4 w-4" />
                  Descargar Backup Completo (.sql)
                </Button>
              </div>

              {/* Individual CSV */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Tablas Individuales (CSV)</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Descarga tablas individuales en CSV para uso en Excel, Google Sheets o carga parcial.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {TABLE_CONFIG.map(({ key, label }) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2 bg-transparent"
                      onClick={() => handleExportCSV(key)}
                    >
                      <FileSpreadsheet className="h-3 w-3" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ─── Import ─── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Upload className="h-5 w-5 text-primary" />
                Importar Datos
              </CardTitle>
              <CardDescription>
                Restaura un respaldo SQL completo o carga tablas individuales desde CSV.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Full restore SQL */}
              <div className="rounded-lg border bg-muted/20 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">Restaurar Base Completa (SQL)</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Carga un archivo .sql previamente exportado. Reemplaza TODOS los datos actuales. 
                  Solo el administrador original de la base puede importarla.
                </p>
                <div className="rounded-lg border-2 border-dashed border-warning/50 bg-warning/5 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning-foreground shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-warning-foreground">Atencion:</strong> Esta accion reemplaza todos los datos actuales. Exporta un respaldo antes de continuar.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 bg-transparent"
                  onClick={() => {
                    setImportError("")
                    setShowImportSQLDialog(true)
                  }}
                >
                  <Upload className="h-4 w-4" />
                  Importar desde Archivo SQL
                </Button>
              </div>

              {/* Individual CSV import */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Table2 className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Cargar Tabla Individual (CSV)</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Importa una tabla especifica desde un archivo CSV. Solo reemplaza los datos de la tabla seleccionada.
                </p>
                <div className="flex gap-2">
                  <Select value={csvImportTarget} onValueChange={setCsvImportTarget}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Seleccionar tabla" />
                    </SelectTrigger>
                    <SelectContent>
                      {TABLE_CONFIG.map(({ key, label }) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    className="gap-2 bg-transparent"
                    disabled={!csvImportTarget}
                    onClick={() => {
                      setImportError("")
                      setShowImportCSVDialog(true)
                    }}
                  >
                    <Upload className="h-4 w-4" />
                    Cargar
                  </Button>
                </div>
              </div>

              {/* Rules */}
              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Reglas de importacion:</strong>
                </p>
                <ul className="text-xs text-muted-foreground mt-1 space-y-1 list-disc pl-4">
                  <li>Solo el admin original puede restaurar un backup SQL completo</li>
                  <li>Los CSV individuales reemplazan solo la tabla seleccionada</li>
                  <li>Las columnas del CSV deben coincidir con la estructura de la tabla</li>
                  <li>Se recomienda siempre exportar un respaldo SQL antes de importar</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User hierarchy info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-primary" />
              Jerarquia de Usuarios
            </CardTitle>
            <CardDescription>
              Todos los usuarios estan vinculados al administrador y comparten la misma base de datos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border bg-muted/20 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${user.active ? "bg-primary" : "bg-muted-foreground"}`}
                    />
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        user.role === "admin"
                          ? "default"
                          : user.role === "manager"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {user.role === "admin"
                        ? "Administrador"
                        : user.role === "manager"
                          ? "Encargado"
                          : "Visualizador"}
                    </Badge>
                    {!user.active && (
                      <Badge variant="destructive" className="text-xs">
                        Inactivo
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Import SQL Dialog ─── */}
      <Dialog open={showImportSQLDialog} onOpenChange={setShowImportSQLDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5" />
              Restaurar Base de Datos (SQL)
            </DialogTitle>
            <DialogDescription>
              Selecciona un archivo .sql exportado previamente desde Super T.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border-2 border-dashed p-6 text-center">
              <Database className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                Selecciona un archivo .sql
              </p>
              <input
                ref={sqlFileRef}
                type="file"
                accept=".sql,.txt"
                onChange={handleImportSQL}
                className="hidden"
                id="sql-import"
              />
              <Button
                variant="outline"
                className="bg-transparent"
                onClick={() => sqlFileRef.current?.click()}
                disabled={isImporting}
              >
                {isImporting ? "Importando..." : "Seleccionar Archivo SQL"}
              </Button>
            </div>

            {importError && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{importError}</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowImportSQLDialog(false)
                setImportError("")
              }}
              className="bg-transparent"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Import CSV Dialog ─── */}
      <Dialog open={showImportCSVDialog} onOpenChange={setShowImportCSVDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Cargar Tabla desde CSV
            </DialogTitle>
            <DialogDescription>
              Importar tabla &quot;{TABLE_CONFIG.find((t) => t.key === csvImportTarget)?.label}&quot; desde un archivo CSV.
              Esto reemplazara solo los datos de esta tabla.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border-2 border-dashed p-6 text-center">
              <FileSpreadsheet className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                Selecciona un archivo .csv
              </p>
              <input
                ref={csvFileRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleImportCSV}
                className="hidden"
                id="csv-import"
              />
              <Button
                variant="outline"
                className="bg-transparent"
                onClick={() => csvFileRef.current?.click()}
                disabled={isImporting}
              >
                {isImporting ? "Importando..." : "Seleccionar Archivo CSV"}
              </Button>
            </div>

            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">
                <strong>Formato esperado:</strong> La primera fila debe contener los nombres de las columnas 
                separados por comas. Las filas siguientes son los datos. Puedes usar un archivo CSV previamente exportado desde Super T.
              </p>
            </div>

            {importError && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{importError}</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowImportCSVDialog(false)
                setImportError("")
              }}
              className="bg-transparent"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Success Dialog ─── */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-sm text-center">
          <div className="flex flex-col items-center py-4">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-lg">Operacion Exitosa</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">{successMessage}</p>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setShowSuccessDialog(false)}>Aceptar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
