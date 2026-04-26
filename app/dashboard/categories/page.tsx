"use client"

import type React from "react"

import { useState } from "react"
import { useStore } from "@/components/store-provider"
import { DashboardHeader } from "@/components/dashboard-header"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Pencil, Trash2, Tags, AlertCircle, Check } from "lucide-react"
import type { Category } from "@/lib/types"

export default function CategoriesPage() {
  const { categories, products, addCategory, updateCategory, deleteCategory, currentUser } = useStore()
  const [formOpen, setFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)

  const isViewer = currentUser?.role === "viewer"

  const handleDelete = (category: Category) => {
    const hasProducts = products.some((p) => p.categoryId === category.id)
    if (hasProducts) {
      return
    }
    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete.id)
    }
    setDeleteDialogOpen(false)
    setCategoryToDelete(null)
  }

  return (
    <div className="flex flex-col">
      <DashboardHeader title="Categorías" description="Gestiona las categorías de productos" />

      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          {!isViewer && (
            <Button
              onClick={() => {
                setEditingCategory(null)
                setFormOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Categoría
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const productCount = products.filter((p) => p.categoryId === category.id).length
            return (
              <Card key={category.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Tags className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{category.name}</CardTitle>
                        <CardDescription className="text-xs">{productCount} productos</CardDescription>
                      </div>
                    </div>
                    {!isViewer && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingCategory(category)
                            setFormOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(category)}
                          disabled={productCount > 0}
                          title={productCount > 0 ? "No se puede eliminar: tiene productos asociados" : "Eliminar"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                {category.description && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <Tags className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay categorías registradas</p>
          </div>
        )}
      </div>

      <CategoryForm open={formOpen} onOpenChange={setFormOpen} category={editingCategory} />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Eliminar Categoría"
        description={`¿Estás seguro de eliminar la categoría "${categoryToDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  )
}

// Category Form Component
function CategoryForm({
  open,
  onOpenChange,
  category,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category | null
}) {
  const { addCategory, updateCategory, currentUser } = useStore()
  const isViewer = currentUser?.role === "viewer"

  const [formData, setFormData] = useState({ name: "", description: "" })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useState(() => {
    if (category) {
      setFormData({ name: category.name, description: category.description })
    } else {
      setFormData({ name: "", description: "" })
    }
  })

  // Reset form when opening/closing
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && category) {
      setFormData({ name: category.name, description: category.description })
    } else if (isOpen) {
      setFormData({ name: "", description: "" })
    }
    setError("")
    setSuccess(false)
    onOpenChange(isOpen)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.name.trim()) {
      setError("El nombre es requerido")
      return
    }

    if (category) {
      updateCategory(category.id, formData)
    } else {
      addCategory(formData)
    }

    setSuccess(true)
    setTimeout(() => {
      handleOpenChange(false)
    }, 1000)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{category ? "Editar Categoría" : "Nueva Categoría"}</SheetTitle>
          <SheetDescription>
            {category ? "Modifica los datos de la categoría" : "Crea una nueva categoría de productos"}
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
              <AlertDescription>Categoría guardada exitosamente</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nombre de la categoría"
              disabled={isViewer}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción opcional"
              rows={3}
              disabled={isViewer}
            />
          </div>

          <SheetFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isViewer || success}>
              {category ? "Guardar Cambios" : "Crear Categoría"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
