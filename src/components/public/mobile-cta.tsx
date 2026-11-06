"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HIDDEN_ON = ["/reservar", "/gracias"];

/**
 * Botón fijo de reserva en móvil: aparece al pasar la portada y se oculta en
 * las pantallas donde ya se está reservando.
 */
export function MobileCta({ label }: { label: string }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <div
      className={cn(
        "border-border bg-ink-950/90 fixed inset-x-0 bottom-0 z-40 border-t px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden",
        visible ? "translate-y-0" : "translate-y-full",
      )}
      aria-hidden={!visible}
    >
      <Link href="/reservar" tabIndex={visible ? undefined : -1} className={cn(buttonVariants({ size: "lg" }), "w-full")}>
        {label}
      </Link>
    </div>
  );
}
