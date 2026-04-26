import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  variant?: "default" | "warning" | "success" | "accent"
}

export function MetricCard({ title, value, description, icon: Icon, trend, variant = "default" }: MetricCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        variant === "warning" && "border-warning/50 bg-warning/10",
        variant === "success" && "border-primary/50 bg-primary/10",
        variant === "accent" && "border-accent/50 bg-accent/10",
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            variant === "default" && "bg-muted",
            variant === "warning" && "bg-warning/20",
            variant === "success" && "bg-primary/20",
            variant === "accent" && "bg-accent/20",
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5",
              variant === "default" && "text-muted-foreground",
              variant === "warning" && "text-warning-foreground",
              variant === "success" && "text-primary",
              variant === "accent" && "text-accent",
            )}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {trend && (
          <p className={cn("text-xs mt-1 font-medium", trend.isPositive ? "text-primary" : "text-destructive")}>
            {trend.isPositive ? "+" : ""}
            {trend.value}% desde el mes pasado
          </p>
        )}
      </CardContent>
    </Card>
  )
}
