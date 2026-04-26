"use client"

import type React from "react"

import { useState } from "react"
import { useStore } from "@/components/store-provider"
import { DashboardHeader } from "@/components/dashboard-header"
import { DataTable } from "@/components/data-table"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, AlertCircle, Check, Mail, Phone } from "lucide-react"
import type { Supplier } from "@/lib/types"

export default function SuppliersPage() {
  const { suppliers, products, addSupplier, updateSupplier, deleteSupplier, currentUser } = useStore()
  const [formOpen, setFormOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null)

  const isViewer = currentUser?.role === "viewer"

  const handleDelete = (supplier: Supplier) => {
    const hasProducts = products.some((p) => p.supplierId === supplier.id)
    if (hasProducts) {
      return
    }
    setSupplierToDelete(supplier)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (supplierToDelete) {
      deleteSupplier(supplierToDelete.id)
    }
    setDeleteDialogOpen(false)
    setSupplierToDelete(null)
  }

  const columns = [
    {
      key: "name",
      header: "Proveedor",
      cell: (supplier: Supplier) => (
        <div>
          <span className="font-medium">{supplier.name}</span>
          <p className="text-xs text-muted-foreground">{supplier.contact}</p>
        </div>
      ),
    },
    {
      key: "nit",
      header: "NIT",
      cell: (supplier: Supplier) => (
        <span className="font-mono text-sm">{supplier.nit || "-"}</span>
      ),
    },
    {
      key: "contact",
      header: "Contacto",
      cell: (supplier: Supplier) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-sm">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{supplier.email}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Phone className="h-3.5 w-3.5" />
            <span>{supplier.phone}</span>
          </div>
        </div>
      ),
    },
    {
      key: "address",
      header: "Dirección",
      cell: (supplier: Supplier) => <span className="text-sm text-muted-foreground">{supplier.address}</span>,
    },
    {
      key: "products",
      header: "Productos",
      cell: (supplier: Supplier) => {
        const count = products.filter((p) => p.supplierId === supplier.id).length
        return <Badge variant="secondary">{count}</Badge>
      },
    },
    {
      key: "actions",
      header: "",
      cell: (supplier: Supplier) => {
        const hasProducts = products.some((p) => p.supplierId === supplier.id)
        return (
          <div className="flex items-center gap-1">
            {!isViewer && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingSupplier(supplier)
                    setFormOpen(true)
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(supplier)
                  }}
                  disabled={hasProducts}
                  title={hasProducts ? "No se puede eliminar: tiene productos asociados" : "Eliminar"}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="flex flex-col">
      <DashboardHeader title="Proveedores" description="Gestiona tus proveedores" />

      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          {!isViewer && (
            <Button
              onClick={() => {
                setEditingSupplier(null)
                setFormOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proveedor
            </Button>
          )}
        </div>

        <DataTable data={suppliers} columns={columns} searchPlaceholder="Buscar proveedor..." searchKey="name" />
      </div>

      <SupplierForm open={formOpen} onOpenChange={setFormOpen} supplier={editingSupplier} />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Eliminar Proveedor"
        description={`¿Estás seguro de eliminar el proveedor "${supplierToDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  )
}

// Supplier Form Component
function SupplierForm({
  open,
  onOpenChange,
  supplier,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier: Supplier | null
}) {
  const { addSupplier, updateSupplier, currentUser } = useStore()
  const isViewer = currentUser?.role === "viewer"

  const [formData, setFormData] = useState({
    name: "",
    nit: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && supplier) {
      setFormData({
        name: supplier.name,
        nit: supplier.nit || "",
        contact: supplier.contact,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
      })
    } else if (isOpen) {
      setFormData({ name: "", nit: "", contact: "", phone: "", email: "", address: "" })
    }
    setError("")
    setSuccess(false)
    onOpenChange(isOpen)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.name.trim() || !formData.email.trim()) {
      setError("El nombre y correo son requeridos")
      return
    }

    if (supplier) {
      updateSupplier(supplier.id, formData)
    } else {
      addSupplier({ ...formData, active: true })
    }

    setSuccess(true)
    setTimeout(() => {
      handleOpenChange(false)
    }, 1000)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{supplier ? "Editar Proveedor" : "Nuevo Proveedor"}</SheetTitle>
          <SheetDescription>
            {supplier ? "Modifica los datos del proveedor" : "Registra un nuevo proveedor"}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              <Check className="h-4 w-4" />
              <AlertDescription>Proveedor guardado exitosamente</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Empresa *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nombre del proveedor"
              disabled={isViewer}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nit">NIT</Label>
            <Input
              id="nit"
              value={formData.nit}
              onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
              placeholder="900123456-1"
              disabled={isViewer}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">Persona de Contacto</Label>
            <Input
              id="contact"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              placeholder="Nombre del contacto"
              disabled={isViewer}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="correo@empresa.com"
                disabled={isViewer}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="555-0000"
                disabled={isViewer}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Dirección completa"
              rows={2}
              disabled={isViewer}
            />
          </div>

          <SheetFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isViewer || success}>
              {supplier ? "Guardar Cambios" : "Crear Proveedor"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
