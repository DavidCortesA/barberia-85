"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, type Variants } from "motion/react";
import { formatDuration, formatPrice } from "@/lib/format";

export type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number;
  imageUrl: string | null;
};

const EASE = [0.16, 1, 0.3, 1] as const;

const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const row: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

/**
 * Servicios como lista editorial: número, nombre grande, precio. Al pasar el
 * cursor, un barrido oscuro llena la fila y la foto del servicio (si tiene)
 * sigue al cursor. Toda la fila lleva a la reserva con el servicio elegido.
 */
export function ServicesRows({ services, headingLevel = 3 }: { services: ServiceRow[]; headingLevel?: 2 | 3 }) {
  const reduce = useReducedMotion();
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const [active, setActive] = useState<ServiceRow | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 26, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 220, damping: 26, mass: 0.6 });

  return (
    <div
      className="relative"
      onPointerMove={(e) => {
        x.set(e.clientX);
        y.set(e.clientY);
      }}
      onPointerLeave={() => setActive(null)}
    >
      <motion.ol
        variants={list}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="border-border border-t"
      >
        {services.map((s, i) => (
          <motion.li
            key={s.id}
            variants={row}
            onPointerEnter={(e) => e.pointerType === "mouse" && setActive(s)}
            className="group border-border relative border-b"
          >
            {/* Barrido de fondo al pasar el cursor */}
            <span
              aria-hidden="true"
              className="bg-ink-900 absolute inset-0 origin-bottom scale-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100 group-focus-within:scale-y-100"
            />
            <div className="relative grid grid-cols-[auto_1fr] items-baseline gap-x-5 gap-y-3 px-2 py-7 sm:grid-cols-[4rem_1fr_auto] sm:px-4 sm:py-9">
              <span className="font-display text-primary text-xl font-bold tabular-nums sm:text-2xl">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-2">
                <Heading className="font-display text-[clamp(2.25rem,6vw,4.5rem)] leading-[0.9] font-bold text-balance">
                  <Link
                    href={`/reservar?servicio=${s.id}`}
                    className="focus-visible:outline-none after:absolute after:inset-0 after:content-['']"
                  >
                    {s.name}
                    <span className="sr-only">: reservar</span>
                  </Link>
                </Heading>
                {s.description && (
                  <p className="text-muted-foreground mt-3 max-w-[56ch] text-sm text-pretty sm:text-base">{s.description}</p>
                )}
              </div>
              <div className="col-span-2 flex items-center justify-between gap-6 sm:col-span-1 sm:flex-col sm:items-end sm:justify-start">
                <span className="font-display text-brand-300 text-4xl leading-none font-bold sm:text-5xl">
                  {formatPrice(s.price)}
                </span>
                <span className="text-muted-foreground flex items-center gap-3 text-xs tracking-[0.2em] uppercase">
                  {formatDuration(s.durationMinutes)}
                  <span className="border-border group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground grid size-10 place-items-center rounded-full border transition-colors duration-300">
                    <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:rotate-45" aria-hidden />
                  </span>
                </span>
              </div>
            </div>
          </motion.li>
        ))}
      </motion.ol>

      {/* Foto que sigue al cursor (solo ratón, solo si el servicio tiene foto) */}
      <AnimatePresence>
        {active?.imageUrl && !reduce && (
          <motion.div
            key={active.id}
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.85, rotate: -4 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.35, ease: EASE }}
            style={{ x: sx, y: sy }}
            className="pointer-events-none fixed top-0 left-0 z-30 -mt-36 ml-8 hidden h-56 w-44 overflow-hidden rounded-[3px] lg:block"
          >
            <Image src={active.imageUrl} alt="" fill sizes="176px" className="object-cover" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
