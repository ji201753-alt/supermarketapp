import {
  LayoutDashboard,
  Package,
  Boxes,
  Tags,
  Truck,
  Users,
  FileBarChart,
  ShoppingCart,
  Settings,
  CreditCard,
  Receipt,
  CalendarDays,
  Coins,
  UserCircle,
  Database,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  key: string
  name: string
  href: string
  icon: LucideIcon
  color: string
  roles: ("admin" | "manager" | "viewer")[]
}

export const navigationItems: NavItem[] = [
  {
    key: "D",
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    color: "text-slate-500",
    roles: ["admin", "manager", "viewer"],
  },
  {
    key: "1",
    name: "Punto de Venta",
    href: "/dashboard/pos",
    icon: CreditCard,
    color: "text-primary",
    roles: ["admin", "manager"],
  },
  {
    key: "2",
    name: "Facturas",
    href: "/dashboard/invoices",
    icon: Receipt,
    color: "text-blue-500",
    roles: ["admin", "manager"],
  },
  {
    key: "3",
    name: "Caja",
    href: "/dashboard/cash",
    icon: Coins,
    color: "text-amber-500",
    roles: ["admin", "manager"],
  },
  {
    key: "4",
    name: "Productos",
    href: "/dashboard/products",
    icon: Package,
    color: "text-emerald-500",
    roles: ["admin", "manager", "viewer"],
  },
  {
    key: "5",
    name: "Inventario",
    href: "/dashboard/inventory",
    icon: Boxes,
    color: "text-purple-500",
    roles: ["admin", "manager", "viewer"],
  },
  {
    key: "6",
    name: "Clientes",
    href: "/dashboard/clients",
    icon: UserCircle,
    color: "text-cyan-500",
    roles: ["admin", "manager"],
  },
  {
    key: "9",
    name: "Categorias",
    href: "/dashboard/categories",
    icon: Tags,
    color: "text-indigo-500",
    roles: ["admin"],
  },
  {
    key: "0",
    name: "Proveedores",
    href: "/dashboard/suppliers",
    icon: Truck,
    color: "text-teal-500",
    roles: ["admin"],
  },
  {
    key: "8",
    name: "Calendario",
    href: "/dashboard/calendar",
    icon: CalendarDays,
    color: "text-pink-500",
    roles: ["admin", "manager"],
  },
  {
    key: "7",
    name: "Reportes",
    href: "/dashboard/reports",
    icon: FileBarChart,
    color: "text-orange-500",
    roles: ["admin", "manager", "viewer"],
  },
  {
    key: "B",
    name: "Base de Datos",
    href: "/dashboard/database",
    icon: Database,
    color: "text-slate-500",
    roles: ["admin"],
  },
  {
    key: "U",
    name: "Usuarios",
    href: "/dashboard/users",
    icon: Users,
    color: "text-red-500",
    roles: ["admin"],
  },
  {
    key: "C",
    name: "Configuracion",
    href: "/dashboard/settings",
    icon: Settings,
    color: "text-gray-500",
    roles: ["admin"],
  },
]
