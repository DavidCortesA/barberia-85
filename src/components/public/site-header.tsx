"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { LogoMark } from "@/components/brand/logo-mark";
import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string };

/**
 * Header fijo: transparente sobre el hero y, al hacer scroll, sólido y más compacto.
 * En móvil la navegación vive en un panel lateral (Sheet) accesible por teclado.
 */
export function SiteHeader({ nav, ctaLabel }: { nav: readonly NavItem[]; ctaLabel: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled
          ? "bg-ink-950/85 border-border backdrop-blur-md"
          : "border-transparent bg-transparent",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-5 transition-[height] duration-300",
          scrolled ? "h-16" : "h-20",
        )}
      >
        <Link href="/" aria-label="85 BARBERÍA, ir al inicio" className="logo-hover shrink-0">
          <LogoMark title="" className={cn("w-auto transition-[height] duration-300", scrolled ? "h-9" : "h-12")} />
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:text-foreground after:bg-primary relative py-1 text-sm font-medium tracking-wide transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:transition-transform hover:after:scale-x-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/reservar" className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex")}>
            {ctaLabel}
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              aria-label="Abrir menú"
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "md:hidden")}
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="bg-ink-950 w-[86vw] max-w-sm">
              <SheetHeader>
                <SheetTitle className="font-display text-2xl">Menú</SheetTitle>
                <SheetDescription className="sr-only">Navegación del sitio</SheetDescription>
              </SheetHeader>
              <nav aria-label="Móvil" className="flex flex-col gap-1 px-4">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="font-display border-border hover:text-primary border-b py-4 text-3xl font-bold transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/reservar"
                  onClick={() => setOpen(false)}
                  className={cn(buttonVariants({ size: "lg" }), "mt-6 w-full")}
                >
                  {ctaLabel}
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
