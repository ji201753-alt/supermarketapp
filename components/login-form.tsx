"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/components/store-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShoppingCart, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const [splashProgress, setSplashProgress] = useState(0)
  const { login, settings } = useStore()
  const router = useRouter()

  // Splash screen animation
  useEffect(() => {
    const timer = setInterval(() => {
      setSplashProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          setTimeout(() => setShowSplash(false), 300)
          return 100
        }
        return prev + 2
      })
    }, 30)
    return () => clearInterval(timer)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!email.trim() || !password.trim()) {
      setError("Ingresa tu correo y contrasena")
      setLoading(false)
      return
    }

    const success = await login(email, password)
    if (success) {
      router.push("/dashboard")
    } else {
      setError("Credenciales invalidas. Verifica tu correo y contrasena.")
    }
    setLoading(false)
  }

  const storeName = settings?.storeName || "Super T"
  const storeSlogan = settings?.storeSlogan || "Sistema POS e Inventario"

  // Splash Screen
  if (showSplash) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/20 via-background to-primary/10">
        <div className="flex flex-col items-center space-y-8 animate-in fade-in duration-500">
          {/* Logo */}
          <div className="relative">
            <div className="flex items-center justify-center h-28 w-28 rounded-3xl bg-primary shadow-2xl shadow-primary/30">
              <ShoppingCart className="h-14 w-14 text-primary-foreground" />
            </div>
            <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-accent flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-accent-foreground animate-spin" />
            </div>
          </div>

          {/* Store Name */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-foreground tracking-tight">{storeName}</h1>
            <p className="text-lg text-muted-foreground">{storeSlogan}</p>
          </div>

          {/* Progress Bar */}
          <div className="w-64 space-y-2">
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-100 ease-out"
                style={{ width: `${splashProgress}%` }}
              />
            </div>
            <p className="text-xs text-center text-muted-foreground">
              {splashProgress < 30
                ? "Iniciando sistema..."
                : splashProgress < 60
                  ? "Cargando datos..."
                  : splashProgress < 90
                    ? "Preparando interfaz..."
                    : "Listo"}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Login Form
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/5 p-4">
      <div className="w-full max-w-md space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header with Logo */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="flex items-center justify-center h-20 w-20 rounded-2xl bg-primary shadow-lg shadow-primary/20">
              <ShoppingCart className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{storeName}</h1>
            <p className="text-muted-foreground mt-1">{storeSlogan}</p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-border/50 shadow-xl backdrop-blur-sm bg-card/95">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Iniciar Sesion</CardTitle>
            <CardDescription>Ingresa tus credenciales para acceder</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electronico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contrasena</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-11 w-11 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="sr-only">{showPassword ? "Ocultar" : "Mostrar"}</span>
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full h-11 text-base font-medium" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando...
                  </>
                ) : (
                  "Iniciar Sesion"
                )}
              </Button>
            </form>

            {/* Demo credentials */}
            <div className="mt-5 p-4 rounded-lg bg-muted/50 border border-border text-sm">
              <p className="font-medium mb-2 text-foreground">Credenciales de prueba:</p>
              <div className="space-y-1 text-muted-foreground text-xs">
                <p><span className="font-mono text-primary">admin@super.com</span> - Admin</p>
                <p><span className="font-mono text-primary">maria@super.com</span> - Encargado</p>
                <p><span className="font-mono text-primary">juan@super.com</span> - Visualizador</p>
                <p className="mt-2 pt-2 border-t border-border">
                  Clave: <span className="font-mono text-primary">admin123</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          {settings?.storeAddress && <span>{settings.storeAddress}</span>}
        </p>
      </div>
    </div>
  )
}
