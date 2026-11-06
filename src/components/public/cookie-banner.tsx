"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { setConsent, useConsent } from "./consent";

/**
 * Aviso de cookies. Las cookies técnicas (sesión del panel, preferencias) no
 * necesitan permiso; la analítica solo se activa si el visitante acepta.
 */
export function CookieBanner() {
  const consent = useConsent();

  return (
    <AnimatePresence>
      {consent === "unset" && (
        <motion.div
          role="region"
          aria-label="Aviso de cookies"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.6, duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
          exit={{ opacity: 0, y: 24, transition: { duration: 0.25 } }}
          className="border-border bg-ink-900/95 fixed inset-x-3 bottom-3 z-50 rounded-[4px] border p-5 shadow-2xl backdrop-blur sm:right-5 sm:bottom-5 sm:left-auto sm:max-w-md"
        >
          <p className="font-display text-2xl font-bold">Cookies</p>
          <p className="text-muted-foreground mt-2 text-sm text-pretty">
            Usamos cookies técnicas para que el sitio funcione y, si aceptas, analítica anónima para saber qué páginas se
            visitan y mejorar el sitio. Más detalles en el{" "}
            <Link href="/privacidad#cookies" className="text-foreground underline underline-offset-4">
              aviso de privacidad
            </Link>
            .
          </p>
          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={() => setConsent("granted")}>
              Aceptar
            </Button>
            <Button size="sm" variant="outline" onClick={() => setConsent("denied")}>
              Solo necesarias
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Enlace del pie de página para volver a decidir sobre las cookies. */
export function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => setConsent(null)}
      className="text-muted-foreground hover:text-foreground underline-offset-4 transition-colors hover:underline"
    >
      Preferencias de cookies
    </button>
  );
}
