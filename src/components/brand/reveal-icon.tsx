"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { BrandIcon, type BrandIconName } from "./brand-icon";

/**
 * Ícono que se revela de abajo hacia arriba al entrar en pantalla (CSS,
 * `.reveal-icon` en globals.css). Un IntersectionObserver marca el momento.
 */
export function RevealIcon({ name, className, delay = 0 }: { name: BrandIconName; className?: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.shown = "";
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <span ref={ref} className="reveal-icon inline-block" style={{ "--delay": `${delay}s` } as CSSProperties}>
      <BrandIcon name={name} className={className} />
    </span>
  );
}
