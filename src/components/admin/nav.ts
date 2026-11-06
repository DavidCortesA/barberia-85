import {
  CalendarDays,
  Clock3,
  LayoutDashboard,
  ListChecks,
  Palette,
  Scissors,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = { href: string; label: string; icon: LucideIcon; mobile?: boolean };

/** Navegación del panel. `mobile` = aparece en la barra inferior; el resto va en "Más". */
export const adminNav: AdminNavItem[] = [
  { href: "/admin", label: "Inicio", icon: LayoutDashboard, mobile: true },
  { href: "/admin/appointments", label: "Citas", icon: ListChecks, mobile: true },
  { href: "/admin/calendar", label: "Calendario", icon: CalendarDays, mobile: true },
  { href: "/admin/services", label: "Servicios", icon: Scissors },
  { href: "/admin/barbers", label: "Barberos", icon: Users },
  { href: "/admin/schedule", label: "Horarios", icon: Clock3 },
  { href: "/admin/content", label: "Contenido", icon: Palette },
  { href: "/admin/settings", label: "Configuración", icon: Settings },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}
