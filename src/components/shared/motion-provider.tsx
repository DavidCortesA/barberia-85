"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Con "reducir movimiento" activado, Motion omite los desplazamientos y
 * escalas y deja solo los fundidos. Así los componentes no cambian su estado
 * inicial según la preferencia (el servidor no la conoce y eso rompía la
 * hidratación).
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
