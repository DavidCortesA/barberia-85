"use client";

import { useSyncExternalStore } from "react";

export type Consent = "granted" | "denied";
type ConsentState = Consent | "unset" | "unknown";

const KEY = "85-cookie-consent";
const EVENT = "85-consent-change";

function read(): ConsentState {
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : "unset";
  } catch {
    return "unset";
  }
}

export function setConsent(value: Consent | null) {
  try {
    if (value) localStorage.setItem(KEY, value);
    else localStorage.removeItem(KEY);
  } catch {
    // Navegación privada sin almacenamiento: la decisión dura lo que la pestaña.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/**
 * Consentimiento de cookies guardado en el navegador. En el servidor vale
 * "unknown" (no se renderiza nada) para no provocar errores de hidratación.
 */
export function useConsent(): ConsentState {
  return useSyncExternalStore(subscribe, read, () => "unknown");
}
