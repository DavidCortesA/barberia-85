"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Retraso en segundos (útil para escalonar elementos). */
  delay?: number;
  /** Desplazamiento vertical inicial en px. */
  y?: number;
  className?: string;
};

/**
 * Revelado discreto al entrar en pantalla (opacidad + leve desplazamiento).
 * Respeta `prefers-reduced-motion`: en ese caso no anima.
 */
export function Reveal({ children, delay = 0, y = 16, className }: RevealProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
