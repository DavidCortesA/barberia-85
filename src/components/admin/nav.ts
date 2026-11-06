import {
  CalendarDays,
  Clock3,
  LayoutDashboard,
  ListChecks,
  Palette,
  Scissors,
  Settings,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Enums } from "@/types";

type PanelRole = Enums<"user_role">;

/** `adminOnly`: solo lo ve el rol admin (staff = recepción). */
export type AdminNavItem = { href: string; label: string; icon: LucideIcon; mobile?: boolean; adminOnly?: boolean };

/** Navegación del panel. `mobile` = aparece en la barra inferior; el resto va en "Más". */
export const adminNav: AdminNavItem[] = [
  { href: "/admin", label: "Inicio", icon: LayoutDashboard, mobile: true },
  { href: "/admin/appointments", label: "Citas", icon: ListChecks, mobile: true },
  { href: "/admin/calendar", label: "Calendario", icon: CalendarDays, mobile: true },
  { href: "/admin/schedule", label: "Horarios", icon: Clock3 },
  { href: "/admin/services", label: "Servicios", icon: Scissors, adminOnly: true },
  { href: "/admin/barbers", label: "Barberos", icon: Users, adminOnly: true },
  { href: "/admin/content", label: "Contenido", icon: Palette, adminOnly: true },
  { href: "/admin/settings", label: "Configuración", icon: Settings, adminOnly: true },
  { href: "/admin/users", label: "Usuarios", icon: UserCog, adminOnly: true },
];

export function navFor(role: PanelRole): AdminNavItem[] {
  return adminNav.filter((item) => role === "admin" || !item.adminOnly);
}

export function isActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}
