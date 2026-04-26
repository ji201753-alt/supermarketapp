"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/components/store-provider"
import { DashboardHeader } from "@/components/dashboard-header"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Pencil, AlertCircle, Check, Shield, UserCog, Eye, EyeOff, KeyRound } from "lucide-react"
import type { User, UserRole } from "@/lib/types"

const roleConfig: Record<UserRole, { label: string; icon: React.ElementType; color: string }> = {
  admin: { label: "Administrador", icon: Shield, color: "text-red-600" },
  manager: { label: "Encargado", icon: UserCog, color: "text-blue-600" },
  viewer: { label: "Visualizador", icon: Eye, color: "text-gray-600" },
}

export default function UsersPage() {
  const { users, currentUser } = useStore()
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [passwordFormOpen, setPasswordFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<User | null>(null)

  // Only admins can access this page
  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") {
      router.push("/dashboard")
    }
  }, [currentUser, router])

  if (currentUser?.role !== "admin") {
    return null
  }

  const columns = [
    {
      key: "name",
      header: "Usuario",
      cell: (user: User) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <span className="text-sm font-medium text-primary">{user.name.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <span className="font-medium">{user.name}</span>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Rol",
      cell: (user: User) => {
        const config = roleConfig[user.role]
        const Icon = config.icon
        return (
          <div className={`flex items-center gap-1.5 ${config.color}`}>
            <Icon className="h-4 w-4" />
            <span className="text-sm font-medium">{config.label}</span>
          </div>
        )
      },
    },
    {
      key: "status",
      header: "Estado",
      cell: (user: User) => (
        <Badge variant={user.active ? "default" : "secondary"}>{user.active ? "Activo" : "Inactivo"}</Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Creado",
      cell: (user: User) => (
        <span className="text-sm text-muted-foreground">{new Date(user.createdAt).toLocaleDateString("es-MX")}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (user: User) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedUserForPassword(user)
              setPasswordFormOpen(true)
            }}
            title="Cambiar contraseña"
          >
            <KeyRound className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              setEditingUser(user)
              setFormOpen(true)
            }}
            title="Editar usuario"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col">
      <DashboardHeader title="Usuarios" description="Gestiona los usuarios del sistema" />

      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <Button
            onClick={() => {
              setEditingUser(null)
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {Object.entries(roleConfig).map(([role, config]) => {
            const Icon = config.icon
            const count = users.filter((u) => u.role === role && u.active).length
            return (
              <div key={role} className="flex items-center gap-3 rounded-lg border border-border p-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${config.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{config.label}s</p>
                  <p className="text-xl font-semibold">{count}</p>
                </div>
              </div>
            )
          })}
        </div>

        <DataTable data={users} columns={columns} searchPlaceholder="Buscar usuario..." searchKey="name" />
      </div>

      <UserForm open={formOpen} onOpenChange={setFormOpen} user={editingUser} />
      <PasswordForm open={passwordFormOpen} onOpenChange={setPasswordFormOpen} user={selectedUserForPassword} />
    </div>
  )
}

// User Form Component
function UserForm({
  open,
  onOpenChange,
  user,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
}) {
  const { addUser, updateUser, currentUser } = useStore()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "viewer" as UserRole,
    active: true,
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        password: "",
        confirmPassword: "",
      })
    } else {
      setFormData({ name: "", email: "", role: "viewer", active: true, password: "", confirmPassword: "" })
    }
    setError("")
    setSuccess(false)
    setShowPassword(false)
  }, [user, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.name.trim() || !formData.email.trim()) {
      setError("El nombre y correo son requeridos")
      return
    }

    // Password validation for new users
    if (!user) {
      if (!formData.password) {
        setError("La contraseña es requerida para nuevos usuarios")
        return
      }
      if (formData.password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres")
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Las contraseñas no coinciden")
        return
      }
    }

    // Prevent deactivating own account
    if (user && user.id === currentUser?.id && !formData.active) {
      setError("No puedes desactivar tu propia cuenta")
      return
    }

    // Prevent demoting own account
    if (user && user.id === currentUser?.id && formData.role !== "admin") {
      setError("No puedes cambiar tu propio rol de administrador")
      return
    }

    if (user) {
      await updateUser(user.id, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        active: formData.active,
      })
    } else {
      await addUser(
        {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          active: formData.active,
        },
        formData.password,
      )
    }

    setSuccess(true)
    setTimeout(() => {
      onOpenChange(false)
    }, 1000)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{user ? "Editar Usuario" : "Nuevo Usuario"}</SheetTitle>
          <SheetDescription>
            {user ? "Modifica los datos del usuario" : "Crea un nuevo usuario del sistema"}
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
              <AlertDescription>Usuario guardado exitosamente</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nombre Completo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nombre del usuario"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="correo@ejemplo.com"
            />
          </div>

          {!user && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-10 w-10 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Repite la contraseña"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select
              value={formData.role}
              onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleConfig).map(([role, config]) => (
                  <SelectItem key={role} value={role}>
                    <div className="flex items-center gap-2">
                      <config.icon className={`h-4 w-4 ${config.color}`} />
                      <span>{config.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground space-y-1 mt-2">
              <p>
                <strong>Administrador:</strong> Acceso total al sistema
              </p>
              <p>
                <strong>Encargado:</strong> Gestión de productos e inventario
              </p>
              <p>
                <strong>Visualizador:</strong> Solo lectura
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="active" className="font-medium">
                Estado de la Cuenta
              </Label>
              <p className="text-sm text-muted-foreground">{formData.active ? "Usuario activo" : "Usuario inactivo"}</p>
            </div>
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
          </div>

          <SheetFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={success}>
              {user ? "Guardar Cambios" : "Crear Usuario"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

// Password Change Form Component
function PasswordForm({
  open,
  onOpenChange,
  user,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
}) {
  const { updateUserPassword } = useStore()

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    setFormData({ password: "", confirmPassword: "" })
    setError("")
    setSuccess(false)
    setShowPassword(false)
  }, [user, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!user) return

    if (!formData.password) {
      setError("La contraseña es requerida")
      return
    }
    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    const success = await updateUserPassword(user.id, formData.password)
    if (success) {
      setSuccess(true)
      setTimeout(() => {
        onOpenChange(false)
      }, 1000)
    } else {
      setError("Error al cambiar la contraseña")
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Cambiar Contraseña</SheetTitle>
          <SheetDescription>
            Establece una nueva contraseña para <strong>{user?.name}</strong>
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
              <AlertDescription>Contraseña actualizada exitosamente</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nueva Contraseña *</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-10 w-10 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmNewPassword">Confirmar Contraseña *</Label>
            <Input
              id="confirmNewPassword"
              type={showPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Repite la contraseña"
            />
          </div>

          <SheetFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={success}>
              Cambiar Contraseña
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
