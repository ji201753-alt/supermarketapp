"use client"

import React from "react"
import { Suspense } from "react"

import { useState } from "react"
import { useStore } from "@/components/store-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Search, Edit, Trash2, UserCircle, CreditCard, Receipt, Wallet } from "lucide-react"
import type { Client } from "@/lib/types"

const Loading = () => null

export default function ClientsPage() {
  const { clients, invoices, addClient, updateClient, deleteClient, currentUser } = useStore()
  const [search, setSearch] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Client | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    cedula: "",
    ruc: "",
    email: "",
    phone: "",
    address: "",
    creditLimit: 0,
    creditBalance: 0,
    allowCredit: false,
  })

  const canEdit = currentUser?.role !== "viewer"

  // Search by name, cedula, NIT/RUC, or email
  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.cedula && c.cedula.toLowerCase().includes(search.toLowerCase())) ||
      (c.ruc && c.ruc.toLowerCase().includes(search.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  )

  const getClientStats = (clientId: string) => {
    const clientInvoices = invoices.filter((i) => i.clientId === clientId)
    const totalPurchases = clientInvoices.reduce((sum, i) => sum + i.total, 0)
    const pendingBalance = clientInvoices
      .filter((i) => i.status === "pending" && i.paymentMethod === "credit")
      .reduce((sum, i) => sum + i.total, 0)
    return { totalPurchases, pendingBalance, invoiceCount: clientInvoices.length }
  }

  const handleOpenForm = (client?: Client) => {
    if (client) {
      setEditingClient(client)
      setFormData({
        name: client.name,
        cedula: client.cedula || "",
        ruc: client.ruc || "",
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        creditLimit: client.creditLimit || 0,
        creditBalance: client.creditBalance || 0,
        allowCredit: client.allowCredit || false,
      })
    } else {
      setEditingClient(null)
      setFormData({
        name: "",
        cedula: "",
        ruc: "",
        email: "",
        phone: "",
        address: "",
        creditLimit: 0,
        creditBalance: 0,
        allowCredit: false,
      })
    }
    setIsFormOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingClient) {
      updateClient(editingClient.id, formData)
    } else {
      addClient(formData)
    }
    setIsFormOpen(false)
  }

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteClient(deleteConfirm.id)
      setDeleteConfirm(null)
    }
  }

  const totalClients = clients.length
  const clientsWithCredit = clients.filter((c) => c.allowCredit).length
  const totalCreditLimit = clients.reduce((sum, c) => sum + (c.creditLimit || 0), 0)
  const totalCreditPortfolio = clients.reduce((sum, c) => sum + (c.creditBalance || 0), 0)

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground">Gestiona tu cartera de clientes</p>
          </div>
          {canEdit && (
            <Button onClick={() => handleOpenForm()} className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Clientes
              </CardTitle>
              <UserCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClients}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Con Credito Habilitado
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clientsWithCredit}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Limite de Credito Total
              </CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalCreditLimit.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cartera de Credito
              </CardTitle>
              <Wallet className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">${totalCreditPortfolio.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Saldo pendiente total</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, cedula, NIT o email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Cedula</TableHead>
                  <TableHead>NIT</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Credito</TableHead>
                  <TableHead className="text-right">Compras</TableHead>
                  <TableHead className="text-right">Cartera</TableHead>
                  {canEdit && <TableHead className="w-[100px]">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => {
                  const stats = getClientStats(client.id)
                  return (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.address}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{client.cedula || "-"}</TableCell>
                      <TableCell className="font-mono text-sm">{client.ruc || "-"}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{client.email || "-"}</p>
                          <p className="text-muted-foreground">{client.phone || "-"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.allowCredit ? (
                          <div>
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                              Habilitado
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-1">
                              Limite: ${(client.creditLimit || 0).toLocaleString()}
                            </p>
                          </div>
                        ) : (
                          <Badge variant="secondary">No habilitado</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <p className="font-medium">${stats.totalPurchases.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{stats.invoiceCount} facturas</p>
                      </TableCell>
                      <TableCell className="text-right">
                        <p className={(client.creditBalance || 0) > 0 ? "font-medium text-amber-600" : ""}>
                          ${(client.creditBalance || 0).toLocaleString()}
                        </p>
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenForm(client)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteConfirm(client)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
                {filteredClients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No se encontraron clientes
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editingClient ? "Editar Cliente" : "Nuevo Cliente"}</SheetTitle>
              <SheetDescription>
                {editingClient
                  ? "Modifica los datos del cliente"
                  : "Ingresa los datos del nuevo cliente"}
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre / Razon Social *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cedula">Cedula</Label>
                  <Input
                    id="cedula"
                    placeholder="Documento de identidad"
                    value={formData.cedula}
                    onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ruc">NIT / RUC</Label>
                  <Input
                    id="ruc"
                    placeholder="Para facturacion"
                    value={formData.ruc}
                    onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Direccion</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="allowCredit">Permitir Credito</Label>
                <Switch
                  id="allowCredit"
                  checked={formData.allowCredit}
                  onCheckedChange={(checked) => setFormData({ ...formData, allowCredit: checked })}
                />
              </div>
              {formData.allowCredit && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="creditLimit">Limite de Credito ($)</Label>
                    <Input
                      id="creditLimit"
                      type="number"
                      min={0}
                      value={formData.creditLimit}
                      onChange={(e) =>
                        setFormData({ ...formData, creditLimit: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="creditBalance">Saldo de Cartera ($)</Label>
                    <Input
                      id="creditBalance"
                      type="number"
                      min={0}
                      value={formData.creditBalance}
                      onChange={(e) =>
                        setFormData({ ...formData, creditBalance: Number(e.target.value) })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Monto que el cliente debe actualmente
                    </p>
                  </div>
                </>
              )}
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                  {editingClient ? "Guardar Cambios" : "Crear Cliente"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>

        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Eliminacion</DialogTitle>
              <DialogDescription>
                Estas seguro de que deseas eliminar al cliente "{deleteConfirm?.name}"? Esta accion
                no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Suspense>
  )
}
