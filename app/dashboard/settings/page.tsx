"use client"

import { useState } from "react"
import { useStore } from "@/components/store-provider"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Mail, Send, Trash2, Check, AlertTriangle, Package, Store, Building2, FileText, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { 
    alertConfig, 
    updateAlertConfig, 
    emailAlerts, 
    sendTestAlert, 
    markAlertRead, 
    clearAlerts, 
    products, 
    stock,
    settings,
    updateSettings 
  } = useStore()
  const { toast } = useToast()
  
  // Alert config state
  const [email, setEmail] = useState(alertConfig.email)
  
  // Store branding state
  const [storeName, setStoreName] = useState(settings?.storeName || "Super T")
  const [storeSlogan, setStoreSlogan] = useState(settings?.storeSlogan || "")
  const [storeAddress, setStoreAddress] = useState(settings?.storeAddress || "")
  const [storePhone, setStorePhone] = useState(settings?.storePhone || "")
  const [storeEmail, setStoreEmail] = useState(settings?.storeEmail || "")
  const [storeNit, setStoreNit] = useState(settings?.storeNit || "")
  const [taxRate, setTaxRate] = useState(String(settings?.taxRate || 19))
  const [invoicePrefix, setInvoicePrefix] = useState(settings?.invoicePrefix || "FAC-")
  const [creditNotePrefix, setCreditNotePrefix] = useState(settings?.creditNotePrefix || "NC-")
  const [cashMovementPrefix, setCashMovementPrefix] = useState(settings?.cashMovementPrefix || "MOV-")

  const lowStockCount = stock.filter((s) => {
    const product = products.find((p) => p.id === s.productId && p.active)
    return product && s.quantity < s.minStock
  }).length

  const handleSaveAlertConfig = () => {
    updateAlertConfig({ email })
    toast({
      title: "Configuracion guardada",
      description: "Las alertas por email han sido configuradas.",
    })
  }

  const handleSendTest = () => {
    if (!alertConfig.enabled) {
      toast({
        title: "Alertas deshabilitadas",
        description: "Activa las alertas primero.",
        variant: "destructive",
      })
      return
    }
    if (!email) {
      toast({
        title: "Email requerido",
        description: "Ingresa un correo electronico.",
        variant: "destructive",
      })
      return
    }
    sendTestAlert()
    toast({
      title: "Alerta de prueba enviada",
      description: `Simulado envio a ${email}`,
    })
  }

  const handleSaveBranding = () => {
    updateSettings({
      storeName: storeName.trim() || "Super T",
      storeSlogan: storeSlogan.trim(),
      storeAddress: storeAddress.trim(),
      storePhone: storePhone.trim(),
      storeEmail: storeEmail.trim(),
      storeNit: storeNit.trim(),
      taxRate: Number(taxRate) || 19,
      invoicePrefix: invoicePrefix.trim() || "FAC-",
      creditNotePrefix: creditNotePrefix.trim() || "NC-",
      cashMovementPrefix: cashMovementPrefix.trim() || "MOV-",
    })
    toast({
      title: "Datos del negocio guardados",
      description: "La informacion se usara en el login, tickets y facturas.",
    })
  }

  const unreadCount = emailAlerts.filter((a) => !a.read).length

  return (
    <div className="flex flex-col">
      <DashboardHeader title="Configuracion" description="Datos del negocio, alertas y preferencias del sistema" />

      <div className="p-6">
        <Tabs defaultValue="branding" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="branding" className="gap-2">
              <Store className="h-4 w-4" />
              Negocio
            </TabsTrigger>
            <TabsTrigger value="invoicing" className="gap-2">
              <FileText className="h-4 w-4" />
              Facturacion
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <Bell className="h-4 w-4" />
              Alertas
            </TabsTrigger>
          </TabsList>

          {/* Store Branding Tab */}
          <TabsContent value="branding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                  Datos del Negocio
                </CardTitle>
                <CardDescription>
                  Esta informacion aparecera en el login, tickets de venta y facturas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Nombre del Negocio *</Label>
                    <Input
                      id="storeName"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="Mi Supermercado"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeSlogan">Eslogan / Descripcion</Label>
                    <Input
                      id="storeSlogan"
                      value={storeSlogan}
                      onChange={(e) => setStoreSlogan(e.target.value)}
                      placeholder="Los mejores precios"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="storeNit">NIT / RUC / RFC</Label>
                    <Input
                      id="storeNit"
                      value={storeNit}
                      onChange={(e) => setStoreNit(e.target.value)}
                      placeholder="900123456-1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storePhone">Telefono</Label>
                    <Input
                      id="storePhone"
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                      placeholder="555-1234"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storeAddress">Direccion</Label>
                  <Input
                    id="storeAddress"
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    placeholder="Calle Principal #123, Ciudad"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storeEmailBrand">Correo del Negocio</Label>
                  <Input
                    id="storeEmailBrand"
                    type="email"
                    value={storeEmail}
                    onChange={(e) => setStoreEmail(e.target.value)}
                    placeholder="contacto@minegocio.com"
                  />
                </div>

                <Button onClick={handleSaveBranding} className="w-full sm:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Datos del Negocio
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoicing Tab */}
          <TabsContent value="invoicing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Configuracion de Facturacion
                </CardTitle>
                <CardDescription>
                  Prefijos y tasa de impuestos para documentos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tasa de IVA (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      min="0"
                      max="100"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      placeholder="19"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoicePrefix">Prefijo de Facturas</Label>
                    <Input
                      id="invoicePrefix"
                      value={invoicePrefix}
                      onChange={(e) => setInvoicePrefix(e.target.value)}
                      placeholder="FAC-"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="creditNotePrefix">Prefijo de Notas Credito</Label>
                    <Input
                      id="creditNotePrefix"
                      value={creditNotePrefix}
                      onChange={(e) => setCreditNotePrefix(e.target.value)}
                      placeholder="NC-"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cashMovementPrefix">Prefijo de Movimientos</Label>
                    <Input
                      id="cashMovementPrefix"
                      value={cashMovementPrefix}
                      onChange={(e) => setCashMovementPrefix(e.target.value)}
                      placeholder="MOV-"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 border text-sm">
                  <p className="font-medium mb-2">Vista previa de numeracion:</p>
                  <div className="space-y-1 text-muted-foreground font-mono text-xs">
                    <p>Factura: {invoicePrefix}{String(settings?.currentInvoiceNumber || 1).padStart(6, "0")}</p>
                    <p>Nota Credito: {creditNotePrefix}{String(settings?.currentCreditNoteNumber || 1).padStart(6, "0")}</p>
                    <p>Movimiento: {cashMovementPrefix}{String(settings?.currentCashMovementNumber || 1).padStart(6, "0")}</p>
                  </div>
                </div>

                <Button onClick={handleSaveBranding} className="w-full sm:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Configuracion
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Email Alert Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Mail className="h-5 w-5 text-primary" />
                    Alertas por Email
                  </CardTitle>
                  <CardDescription>Notificaciones automaticas de stock bajo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="alerts-enabled">Activar alertas</Label>
                      <p className="text-sm text-muted-foreground">Recibe notificaciones</p>
                    </div>
                    <Switch
                      id="alerts-enabled"
                      checked={alertConfig.enabled}
                      onCheckedChange={(checked) => updateAlertConfig({ enabled: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alertEmail">Correo electronico</Label>
                    <Input
                      id="alertEmail"
                      type="email"
                      placeholder="alertas@mitienda.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!alertConfig.enabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="threshold">Frecuencia</Label>
                    <Select
                      value={alertConfig.threshold}
                      onValueChange={(value: "immediate" | "daily" | "weekly") => updateAlertConfig({ threshold: value })}
                      disabled={!alertConfig.enabled}
                    >
                      <SelectTrigger id="threshold">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Inmediata</SelectItem>
                        <SelectItem value="daily">Diaria</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label>Tipos de alerta</Label>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning-foreground" />
                        <span className="text-sm">Stock bajo</span>
                      </div>
                      <Switch
                        checked={alertConfig.notifyLowStock}
                        onCheckedChange={(checked) => updateAlertConfig({ notifyLowStock: checked })}
                        disabled={!alertConfig.enabled}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Sin movimiento (30d)</span>
                      </div>
                      <Switch
                        checked={alertConfig.notifyNoMovement}
                        onCheckedChange={(checked) => updateAlertConfig({ notifyNoMovement: checked })}
                        disabled={!alertConfig.enabled}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSaveAlertConfig} className="flex-1">
                      Guardar
                    </Button>
                    <Button variant="outline" onClick={handleSendTest} disabled={lowStockCount === 0}>
                      <Send className="h-4 w-4 mr-2" />
                      Probar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Alert History */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Bell className="h-5 w-5 text-primary" />
                      Historial
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {unreadCount}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>Alertas enviadas</CardDescription>
                  </div>
                  {emailAlerts.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearAlerts}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Limpiar
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {emailAlerts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No hay alertas</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[350px] overflow-y-auto">
                      {emailAlerts.map((alert) => {
                        const product = products.find((p) => p.id === alert.productId)
                        return (
                          <div
                            key={alert.id}
                            className={`p-3 rounded-lg border ${
                              alert.read ? "bg-muted/30" : "bg-warning/10 border-warning/30"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle
                                    className={`h-4 w-4 flex-shrink-0 ${
                                      alert.read ? "text-muted-foreground" : "text-warning-foreground"
                                    }`}
                                  />
                                  <span className="font-medium text-sm truncate">{product?.name}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(alert.sentAt).toLocaleString("es-ES")}
                                </p>
                              </div>
                              {!alert.read && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 flex-shrink-0"
                                  onClick={() => markAlertRead(alert.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
