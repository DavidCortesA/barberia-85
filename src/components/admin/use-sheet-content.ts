"use client";

import { useState } from "react";

/**
 * Conserva el último valor no nulo para que una hoja lateral no se quede vacía
 * mientras se anima al cerrarse (el valor sigue actualizándose mientras está abierta).
 */
export function useRetained<T>(value: T | null): T | null {
  const [kept, setKept] = useState(value);
  if (value !== null && value !== kept) setKept(value);
  return value ?? kept;
}

/**
 * Para formularios en hojas: congela el valor al abrir y da una clave nueva en
 * cada apertura (el formulario se reinicia), pero mantiene el contenido al cerrar.
 */
export function useSheetSession<T>(open: boolean, value: T): { key: number; value: T } | null {
  const [state, setState] = useState({ key: 0, value, open: false });
  if (open !== state.open) {
    setState({ key: open ? state.key + 1 : state.key, value: open ? value : state.value, open });
  }
  return state.key > 0 ? { key: state.key, value: state.value } : null;
}
