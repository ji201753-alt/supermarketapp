import type { DataStorage } from "@/lib/repositories/types"
import type {
  CashMovement,
  CashClosing,
  Invoice,
  InvoiceItem,
  CreditNote,
  Currency,
} from "@/lib/types"

export interface POSService {
  // Cash Management
  addCashMovement(params: {
    conceptId: string
    income: number
    expense: number
    documentType?: string
    documentNumber?: string
    clientId?: string
    clientName?: string
    notes?: string
    isAutomatic: boolean
    invoiceId?: string
    creditNoteId?: string
    cashierId: string
    cashierName: string
  }): Promise<CashMovement>

  getDailyBalance(date: string): Promise<{
    openingBalance: number
    totalIncome: number
    totalExpense: number
    closingBalance: number
    movements: CashMovement[]
  }>

  // Cash Closing
  openCashRegister(params: {
    openingBalance: number
    cashierId: string
    cashierName: string
  }): Promise<CashClosing>

  closeCashRegister(
    closingId: string,
    actualBalance: number,
    notes?: string
  ): Promise<CashClosing | null>

  getCurrentCashClosing(): Promise<CashClosing | null>

  // Invoicing
  createInvoice(params: {
    clientId?: string
    clientName: string
    clientTaxId?: string
    items: Omit<InvoiceItem, "id">[]
    paymentMethod: Invoice["paymentMethod"]
    discount?: number
    notes?: string
    cashierId: string
    cashierName: string
  }): Promise<Invoice>

  issueAndPayInvoice(invoiceId: string): Promise<{
    invoice: Invoice
    cashMovement: CashMovement
  } | null>

  cancelInvoice(invoiceId: string): Promise<Invoice | null>

  // Credit Notes
  createCreditNote(params: {
    invoiceId: string
    items: Omit<InvoiceItem, "id">[]
    reason: string
    cashierId: string
    cashierName: string
  }): Promise<CreditNote | null>

  issueAndApplyCreditNote(creditNoteId: string): Promise<{
    creditNote: CreditNote
    cashMovement: CashMovement
  } | null>
}

export function createPOSService(storage: DataStorage): POSService {
  return {
    async addCashMovement(params) {
      const lastBalance = await storage.cashMovements.getLastBalance()
      const concept = await storage.cashConcepts.getById(params.conceptId)
      const settings = await storage.settings.get()

      const movement = await storage.cashMovements.create({
        timestamp: new Date().toISOString(),
        conceptId: params.conceptId,
        conceptName: concept?.name || "Sin concepto",
        documentType: params.documentType,
        documentNumber: params.documentNumber,
        clientId: params.clientId,
        clientName: params.clientName,
        income: params.income,
        expense: params.expense,
        balance: lastBalance + params.income - params.expense,
        currency: settings.currency,
        cashierId: params.cashierId,
        cashierName: params.cashierName,
        notes: params.notes,
        isAutomatic: params.isAutomatic,
        invoiceId: params.invoiceId,
        creditNoteId: params.creditNoteId,
      })

      return movement
    },

    async getDailyBalance(date) {
      const movements = await storage.cashMovements.getDailyMovements(date)
      
      let openingBalance = 0
      const previousMovements = await storage.cashMovements.getAll()
      const sortedPrev = previousMovements
        .filter((m) => m.timestamp.split("T")[0] < date)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      
      if (sortedPrev.length > 0) {
        openingBalance = sortedPrev[0].balance
      }

      const totalIncome = movements.reduce((sum, m) => sum + m.income, 0)
      const totalExpense = movements.reduce((sum, m) => sum + m.expense, 0)
      const closingBalance = openingBalance + totalIncome - totalExpense

      return {
        openingBalance,
        totalIncome,
        totalExpense,
        closingBalance,
        movements,
      }
    },

    async openCashRegister(params) {
      const existingOpen = await storage.cashClosings.findOpen()
      if (existingOpen) {
        throw new Error("Ya existe una caja abierta. Debe cerrarla primero.")
      }

      const today = new Date().toISOString().split("T")[0]
      
      const closing = await storage.cashClosings.create({
        date: today,
        openingBalance: params.openingBalance,
        closingBalance: 0,
        totalIncome: 0,
        totalExpense: 0,
        expectedBalance: params.openingBalance,
        actualBalance: 0,
        difference: 0,
        cashierId: params.cashierId,
        cashierName: params.cashierName,
        status: "open",
      })

      // Add opening balance as cash movement
      const concepts = await storage.cashConcepts.findActive()
      const fondoCaja = concepts.find((c) => c.name === "Fondo de Caja")
      
      if (fondoCaja && params.openingBalance > 0) {
        await this.addCashMovement({
          conceptId: fondoCaja.id,
          income: params.openingBalance,
          expense: 0,
          documentType: "Apertura de Caja",
          notes: "Fondo inicial de caja",
          isAutomatic: true,
          cashierId: params.cashierId,
          cashierName: params.cashierName,
        })
      }

      return closing
    },

    async closeCashRegister(closingId, actualBalance, notes) {
      const closing = await storage.cashClosings.getById(closingId)
      if (!closing || closing.status !== "open") {
        return null
      }

      const dailyBalance = await this.getDailyBalance(closing.date)

      const updated = await storage.cashClosings.close(closingId, actualBalance, notes)
      if (updated) {
        await storage.cashClosings.update(closingId, {
          totalIncome: dailyBalance.totalIncome,
          totalExpense: dailyBalance.totalExpense,
          closingBalance: dailyBalance.closingBalance,
          expectedBalance: dailyBalance.closingBalance,
        })
      }

      return updated
    },

    async getCurrentCashClosing() {
      return storage.cashClosings.findOpen()
    },

    async createInvoice(params) {
      const settings = await storage.settings.get()
      
      const items: InvoiceItem[] = params.items.map((item, index) => ({
        ...item,
        id: `item-${index}`,
      }))

      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
      const discount = params.discount || 0
      const taxableAmount = subtotal - discount
      const taxAmount = taxableAmount * (settings.taxRate / 100)
      const total = taxableAmount + taxAmount

      const invoice = await storage.invoices.create({
        clientId: params.clientId,
        clientName: params.clientName,
        clientTaxId: params.clientTaxId,
        items,
        subtotal,
        taxRate: settings.taxRate,
        taxAmount,
        discount,
        total,
        paymentMethod: params.paymentMethod,
        status: "draft",
        notes: params.notes,
        cashierId: params.cashierId,
        cashierName: params.cashierName,
      })

      return invoice
    },

    async issueAndPayInvoice(invoiceId) {
      const invoice = await storage.invoices.getById(invoiceId)
      if (!invoice || invoice.status !== "draft") {
        return null
      }

      // Issue the invoice
      const issuedInvoice = await storage.invoices.issue(invoiceId)
      if (!issuedInvoice) return null

      // Mark as paid
      const paidInvoice = await storage.invoices.markPaid(invoiceId)
      if (!paidInvoice) return null

      // Create cash movement
      const concepts = await storage.cashConcepts.findActive()
      const ventaConcept = concepts.find((c) => c.name === "Venta")

      if (!ventaConcept) {
        throw new Error("No se encontró el concepto de Venta")
      }

      const cashMovement = await this.addCashMovement({
        conceptId: ventaConcept.id,
        income: paidInvoice.total,
        expense: 0,
        documentType: "Factura",
        documentNumber: paidInvoice.number,
        clientId: paidInvoice.clientId,
        clientName: paidInvoice.clientName,
        notes: `Pago de factura ${paidInvoice.number}`,
        isAutomatic: true,
        invoiceId: paidInvoice.id,
        cashierId: paidInvoice.cashierId,
        cashierName: paidInvoice.cashierName,
      })

      // Update inventory (exit movements for each product)
      for (const item of paidInvoice.items) {
        const stock = await storage.stock.getByProductId(item.productId)
        if (stock) {
          await storage.stock.update(item.productId, {
            quantity: stock.quantity - item.quantity,
          })
          await storage.movements.create({
            productId: item.productId,
            type: "exit",
            quantity: item.quantity,
            reason: `Venta - Factura ${paidInvoice.number}`,
            userId: paidInvoice.cashierId,
          })
        }
      }

      return { invoice: paidInvoice, cashMovement }
    },

    async cancelInvoice(invoiceId) {
      const invoice = await storage.invoices.getById(invoiceId)
      if (!invoice || invoice.status === "cancelled") {
        return null
      }

      return storage.invoices.cancel(invoiceId)
    },

    async createCreditNote(params) {
      const invoice = await storage.invoices.getById(params.invoiceId)
      if (!invoice) {
        return null
      }

      const items: InvoiceItem[] = params.items.map((item, index) => ({
        ...item,
        id: `item-${index}`,
      }))

      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
      const taxAmount = items.reduce((sum, item) => sum + item.tax, 0)
      const total = subtotal + taxAmount

      const creditNote = await storage.creditNotes.create({
        invoiceId: params.invoiceId,
        invoiceNumber: invoice.number,
        clientId: invoice.clientId,
        clientName: invoice.clientName,
        items,
        subtotal,
        taxAmount,
        total,
        reason: params.reason,
        status: "draft",
        cashierId: params.cashierId,
        cashierName: params.cashierName,
      })

      return creditNote
    },

    async issueAndApplyCreditNote(creditNoteId) {
      const creditNote = await storage.creditNotes.getById(creditNoteId)
      if (!creditNote || creditNote.status !== "draft") {
        return null
      }

      // Issue
      const issuedNote = await storage.creditNotes.issue(creditNoteId)
      if (!issuedNote) return null

      // Apply
      const appliedNote = await storage.creditNotes.apply(creditNoteId)
      if (!appliedNote) return null

      // Create cash movement (expense)
      const concepts = await storage.cashConcepts.findActive()
      const devolucionConcept = concepts.find((c) => c.name === "Devolución")

      if (!devolucionConcept) {
        throw new Error("No se encontró el concepto de Devolución")
      }

      const cashMovement = await this.addCashMovement({
        conceptId: devolucionConcept.id,
        income: 0,
        expense: appliedNote.total,
        documentType: "Nota de Crédito",
        documentNumber: appliedNote.number,
        clientId: appliedNote.clientId,
        clientName: appliedNote.clientName,
        notes: `Devolución - NC ${appliedNote.number} (Factura ${appliedNote.invoiceNumber})`,
        isAutomatic: true,
        creditNoteId: appliedNote.id,
        cashierId: appliedNote.cashierId,
        cashierName: appliedNote.cashierName,
      })

      // Return products to inventory
      for (const item of appliedNote.items) {
        const stock = await storage.stock.getByProductId(item.productId)
        if (stock) {
          await storage.stock.update(item.productId, {
            quantity: stock.quantity + item.quantity,
          })
          await storage.movements.create({
            productId: item.productId,
            type: "entry",
            quantity: item.quantity,
            reason: `Devolución - NC ${appliedNote.number}`,
            userId: appliedNote.cashierId,
          })
        }
      }

      return { creditNote: appliedNote, cashMovement }
    },
  }
}

export type { POSService }
