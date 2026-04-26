"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { useStore } from "@/components/store-provider"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  CheckCircle2,
  Circle,
  Trash2,
  AlertCircle,
  Check,
  Bell,
  Coins,
  Package,
  Users,
  MoreHorizontal,
} from "lucide-react"
import type { CalendarEvent, EventType } from "@/lib/types"

const eventTypeConfig: Record<
  EventType,
  { label: string; icon: React.ElementType; color: string; bgColor: string }
> = {
  reminder: {
    label: "Recordatorio",
    icon: Bell,
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-950",
  },
  cash_closing: {
    label: "Cierre de Caja",
    icon: Coins,
    color: "text-amber-600",
    bgColor: "bg-amber-100 dark:bg-amber-950",
  },
  inventory: {
    label: "Inventario",
    icon: Package,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100 dark:bg-emerald-950",
  },
  meeting: {
    label: "Reunion",
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-950",
  },
  other: {
    label: "Otro",
    icon: MoreHorizontal,
    color: "text-gray-600",
    bgColor: "bg-gray-100 dark:bg-gray-900",
  },
}

const DAYS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"]
const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function CalendarPage() {
  const {
    calendarEvents,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    markEventComplete,
    currentUser,
  } = useStore()

  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState(
    today.toISOString().split("T")[0]
  )
  const [formOpen, setFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "reminder" as EventType,
    date: "",
    time: "",
    allDay: true,
  })
  const [formError, setFormError] = useState("")
  const [formSuccess, setFormSuccess] = useState(false)

  // Calendar grid
  const calendarGrid = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
    const grid: (number | null)[] = []

    for (let i = 0; i < firstDay; i++) {
      grid.push(null)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      grid.push(day)
    }
    return grid
  }, [currentYear, currentMonth])

  // Events for selected date
  const selectedDateEvents = useMemo(() => {
    return calendarEvents
      .filter((e) => e.date === selectedDate)
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1
        if (a.time && b.time) return a.time.localeCompare(b.time)
        return 0
      })
  }, [calendarEvents, selectedDate])

  // Events count per day for current month
  const eventCountByDay = useMemo(() => {
    const counts: Record<string, number> = {}
    calendarEvents.forEach((e) => {
      if (
        e.date.startsWith(
          `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`
        )
      ) {
        counts[e.date] = (counts[e.date] || 0) + 1
      }
    })
    return counts
  }, [calendarEvents, currentYear, currentMonth])

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const handleDayClick = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    setSelectedDate(dateStr)
  }

  const handleOpenForm = (event?: CalendarEvent) => {
    if (event) {
      setEditingEvent(event)
      setFormData({
        title: event.title,
        description: event.description || "",
        type: event.type,
        date: event.date,
        time: event.time || "",
        allDay: event.allDay,
      })
    } else {
      setEditingEvent(null)
      setFormData({
        title: "",
        description: "",
        type: "reminder",
        date: selectedDate,
        time: "",
        allDay: true,
      })
    }
    setFormError("")
    setFormSuccess(false)
    setFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")

    if (!formData.title.trim()) {
      setFormError("El titulo es requerido")
      return
    }
    if (!formData.date) {
      setFormError("La fecha es requerida")
      return
    }

    setIsProcessing(true)
    try {
      if (editingEvent) {
        await updateCalendarEvent(editingEvent.id, {
          title: formData.title,
          description: formData.description,
          type: formData.type,
          date: formData.date,
          time: formData.allDay ? undefined : formData.time,
          allDay: formData.allDay,
        })
      } else {
        await addCalendarEvent({
          title: formData.title,
          description: formData.description,
          type: formData.type,
          date: formData.date,
          time: formData.allDay ? undefined : formData.time,
          allDay: formData.allDay,
          completed: false,
          userId: currentUser?.id || "1",
        })
      }
      setFormSuccess(true)
      setTimeout(() => {
        setFormOpen(false)
      }, 800)
    } catch {
      setFormError("Error al guardar el evento")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleToggleComplete = async (event: CalendarEvent) => {
    try {
      if (event.completed) {
        await updateCalendarEvent(event.id, { completed: false })
      } else {
        await markEventComplete(event.id)
      }
    } catch {
      console.error("[v0] Error toggling event complete")
    }
  }

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteCalendarEvent(id)
    } catch {
      console.error("[v0] Error deleting event")
    }
  }

  const todayStr = today.toISOString().split("T")[0]
  const isToday = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return dateStr === todayStr
  }
  const isSelected = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return dateStr === selectedDate
  }

  // Upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const nextWeekStr = nextWeek.toISOString().split("T")[0]
    return calendarEvents
      .filter(
        (e) => e.date >= todayStr && e.date <= nextWeekStr && !e.completed
      )
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [calendarEvents, todayStr])

  return (
    <div className="flex flex-col">
      <DashboardHeader
        title="Calendario"
        description="Agenda y recordatorios del negocio"
      />

      <div className="p-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar Grid */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevMonth}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <CardTitle className="text-lg min-w-[180px] text-center">
                  {MONTHS[currentMonth]} {currentYear}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextMonth}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
              <Button onClick={() => handleOpenForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Evento
              </Button>
            </CardHeader>
            <CardContent>
              {/* Days header */}
              <div className="grid grid-cols-7 mb-2">
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-medium text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarGrid.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="h-14" />
                  }
                  const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                  const eventCount = eventCountByDay[dateStr] || 0
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => handleDayClick(day)}
                      className={`relative h-14 rounded-lg text-sm font-medium transition-colors hover:bg-muted
                        ${isToday(day) ? "ring-2 ring-primary" : ""}
                        ${isSelected(day) ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
                        ${!isSelected(day) && !isToday(day) ? "text-foreground" : ""}
                      `}
                    >
                      <span className="block">{day}</span>
                      {eventCount > 0 && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                          {Array.from({
                            length: Math.min(eventCount, 3),
                          }).map((_, i) => (
                            <div
                              key={i}
                              className={`h-1.5 w-1.5 rounded-full ${isSelected(day) ? "bg-primary-foreground" : "bg-primary"}`}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Right Panel - Selected Date Events + Upcoming */}
          <div className="space-y-6">
            {/* Selected Date Events */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    {new Date(selectedDate + "T12:00:00").toLocaleDateString(
                      "es-MX",
                      {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      }
                    )}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {selectedDateEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Sin eventos para este dia
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 bg-transparent"
                      onClick={() => handleOpenForm()}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Agregar
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDateEvents.map((event) => {
                      const config = eventTypeConfig[event.type]
                      const Icon = config.icon
                      return (
                        <div
                          key={event.id}
                          className={`group flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                            event.completed
                              ? "opacity-60 bg-muted/30"
                              : "hover:bg-muted/50"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleComplete(event)}
                            className="mt-0.5 flex-shrink-0"
                          >
                            {event.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-medium text-sm ${event.completed ? "line-through" : ""}`}
                              >
                                {event.title}
                              </span>
                              <Badge
                                variant="secondary"
                                className={`text-xs ${config.bgColor} ${config.color} border-0`}
                              >
                                <Icon className="h-3 w-3 mr-1" />
                                {config.label}
                              </Badge>
                            </div>
                            {event.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                            {event.time && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {event.time}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleOpenForm(event)}
                            >
                              <CalendarDays className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteEvent(event.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Proximos 7 dias
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Sin eventos pendientes
                  </p>
                ) : (
                  <div className="space-y-2">
                    {upcomingEvents.slice(0, 5).map((event) => {
                      const config = eventTypeConfig[event.type]
                      const Icon = config.icon
                      return (
                        <div
                          key={event.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => {
                            setSelectedDate(event.date)
                            const [y, m] = event.date.split("-")
                            setCurrentYear(Number(y))
                            setCurrentMonth(Number(m) - 1)
                          }}
                          onKeyDown={() => {}}
                          role="button"
                          tabIndex={0}
                        >
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.bgColor}`}
                          >
                            <Icon
                              className={`h-4 w-4 ${config.color}`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {event.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(
                                event.date + "T12:00:00"
                              ).toLocaleDateString("es-MX", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                              {event.time && ` - ${event.time}`}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Event Form Sheet */}
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingEvent ? "Editar Evento" : "Nuevo Evento"}
            </SheetTitle>
            <SheetDescription>
              {editingEvent
                ? "Modifica los datos del evento"
                : "Crea un nuevo evento en el calendario"}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            {formSuccess && (
              <Alert className="border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                <Check className="h-4 w-4" />
                <AlertDescription>
                  Evento guardado exitosamente
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Titulo *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Titulo del evento"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value: EventType) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(eventTypeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <config.icon
                          className={`h-4 w-4 ${config.color}`}
                        />
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Fecha *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label htmlFor="allDay" className="font-medium">
                  Todo el dia
                </Label>
                <p className="text-sm text-muted-foreground">
                  {formData.allDay
                    ? "Sin hora especifica"
                    : "Con hora especifica"}
                </p>
              </div>
              <Switch
                id="allDay"
                checked={formData.allDay}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, allDay: checked })
                }
              />
            </div>

            {!formData.allDay && (
              <div className="space-y-2">
                <Label htmlFor="time">Hora</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Descripcion</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
                }
                placeholder="Detalles del evento..."
                rows={3}
              />
            </div>

            <SheetFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isProcessing || formSuccess}>
                {isProcessing
                  ? "Guardando..."
                  : editingEvent
                    ? "Guardar Cambios"
                    : "Crear Evento"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
