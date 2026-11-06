"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ExternalLink, LogOut, Menu } from "lucide-react";
import { LogoMark } from "@/components/brand/logo-mark";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { logoutAction } from "@/features/auth/actions";
import { cn } from "@/lib/utils";
import type { Enums } from "@/types";
import { isActive, navFor } from "./nav";

type AdminShellProps = { userLabel: string; role: Enums<"user_role">; children: ReactNode };

/**
 * Estructura del panel: barra lateral de 240 px en escritorio, solo iconos en
 * tablet y barra inferior + menú "Más" en móvil (docs/02-diseno.md §4).
 */
export function AdminShell({ userLabel, role, children }: AdminShellProps) {
  const nav = navFor(role);
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const current = nav.find((item) => isActive(pathname, item.href));

  return (
    <div className="flex min-h-dvh">
      {/* Barra lateral (tablet: iconos; escritorio: iconos + texto) */}
      <aside className="border-border bg-ink-900 sticky top-0 hidden h-dvh w-16 shrink-0 flex-col border-r md:flex lg:w-60">
        <div className="border-border flex h-16 items-center justify-center border-b px-3 lg:justify-start lg:px-5">
          <Link href="/admin" aria-label="Inicio del panel">
            <LogoMark title="" className="hidden h-8 w-auto lg:block" />
            <span className="font-display text-brand-500 text-2xl font-bold lg:hidden">85</span>
          </Link>
        </div>
        <nav aria-label="Panel" className="flex-1 overflow-y-auto p-2 lg:p-3">
          <ul className="space-y-1">
            {nav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    title={item.label}
                    className={cn(
                      "flex h-10 items-center justify-center gap-3 rounded-[3px] px-3 text-sm font-medium transition-colors lg:justify-start",
                      active
                        ? "bg-ink-800 text-foreground shadow-[inset_2px_0_0_var(--color-brand-500)]"
                        : "text-muted-foreground hover:bg-ink-800/60 hover:text-foreground",
                    )}
                  >
                    <item.icon className={cn("size-[18px] shrink-0", active && "text-brand-500")} aria-hidden />
                    <span className="sr-only lg:not-sr-only">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-border space-y-1 border-t p-2 lg:p-3">
          <a
            href="/"
            target="_blank"
            rel="noopener"
            title="Ver sitio"
            className="text-muted-foreground hover:bg-ink-800/60 hover:text-foreground flex h-10 items-center justify-center gap-3 rounded-[3px] px-3 text-sm lg:justify-start"
          >
            <ExternalLink className="size-[18px]" aria-hidden />
            <span className="sr-only lg:not-sr-only">Ver sitio</span>
          </a>
          <form action={logoutAction}>
            <button
              type="submit"
              title="Cerrar sesión"
              className="text-muted-foreground hover:bg-ink-800/60 hover:text-foreground flex h-10 w-full items-center justify-center gap-3 rounded-[3px] px-3 text-sm lg:justify-start"
            >
              <LogOut className="size-[18px]" aria-hidden />
              <span className="sr-only lg:not-sr-only">Cerrar sesión</span>
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="border-border bg-ink-950/90 sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 backdrop-blur sm:px-6">
          <Link href="/admin" className="md:hidden" aria-label="Inicio del panel">
            <span className="font-display text-brand-500 text-2xl font-bold">85</span>
          </Link>
          <p className="text-muted-foreground truncate text-sm">
            <span className="hidden sm:inline">Panel · </span>
            <span className="text-foreground font-medium">{current?.label ?? "Panel"}</span>
          </p>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-muted-foreground hidden max-w-56 truncate text-xs sm:inline">
              {userLabel}
              {role === "staff" && <span className="border-border ml-2 rounded-full border px-2 py-0.5">Recepción</span>}
            </span>
            <a
              href="/"
              target="_blank"
              rel="noopener"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "md:hidden")}
            >
              Ver sitio
            </a>
          </div>
        </header>

        <main id="contenido" className="flex-1 px-4 pt-6 pb-28 sm:px-6 md:pb-10 lg:px-10 lg:pt-8">
          <div className="mx-auto max-w-[1200px]">{children}</div>
        </main>
      </div>

      {/* Barra inferior (móvil) */}
      <nav
        aria-label="Panel"
        className="border-border bg-ink-900/95 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="grid grid-cols-4">
          {nav
            .filter((item) => item.mobile)
            .map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-16 flex-col items-center justify-center gap-1 text-[0.7rem] font-medium",
                      active ? "text-brand-500" : "text-muted-foreground",
                    )}
                  >
                    <item.icon className="size-5" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              className={cn(
                "flex h-16 w-full flex-col items-center justify-center gap-1 text-[0.7rem] font-medium",
                current && !current.mobile ? "text-brand-500" : "text-muted-foreground",
              )}
            >
              <Menu className="size-5" aria-hidden />
              Más
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <SheetHeader>
            <SheetTitle>Más opciones</SheetTitle>
          </SheetHeader>
          <ul className="grid grid-cols-2 gap-2 px-4">
            {nav
              .filter((item) => !item.mobile)
              .map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    className="border-border bg-ink-950 aria-[current=page]:border-primary flex h-14 items-center gap-3 rounded-[3px] border px-4 text-sm font-medium"
                  >
                    <item.icon className="text-brand-500 size-5" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              ))}
          </ul>
          <form action={logoutAction} className="px-4">
            <Button type="submit" variant="ghost" className="w-full">
              <LogOut aria-hidden /> Cerrar sesión
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
