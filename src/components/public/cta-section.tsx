"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { motion, useMotionValue, useReducedMotion, useSpring, type Variants } from "motion/react";
import { BrandIcon } from "@/components/brand/brand-icon";

const EASE = [0.16, 1, 0.3, 1] as const;
const words: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const word: Variants = {
  hidden: { y: "105%" },
  show: { y: "0%", transition: { duration: 0.9, ease: EASE } },
};

/** Cierre de la portada: titular que sube palabra por palabra y botón magnético. */
export function CtaSection({ eyebrow, title, subtitle, cta }: { eyebrow: string; title: string; subtitle: string; cta: string }) {
  return (
    <section aria-labelledby="cta-title" className="border-border bg-ink-900 relative isolate overflow-hidden border-y">
      <BrandIcon name="peine" className="text-bone/[0.06] pointer-events-none absolute -top-10 -left-16 -z-10 size-[26rem] -rotate-12" />
      <BrandIcon name="navaja" className="text-primary/10 pointer-events-none absolute -right-20 -bottom-24 -z-10 size-[30rem] rotate-12" />

      <div className="mx-auto grid max-w-[1280px] items-center gap-14 px-5 py-28 md:py-40 lg:grid-cols-[1fr_auto] lg:px-8">
        <div>
          <p className="label-brand">{eyebrow}</p>
          <motion.h2
            id="cta-title"
            variants={words}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="font-display mt-5 text-[clamp(3.25rem,9vw,8.5rem)] leading-[0.88] font-bold"
          >
            {title.split(" ").map((w, i) => (
              <span key={i} className="inline-block overflow-hidden pb-[0.06em] align-bottom">
                <motion.span variants={word} className="inline-block">
                  {w}
                </motion.span>
                {" "}
              </span>
            ))}
          </motion.h2>
          <p className="text-muted-foreground mt-6 max-w-[44ch] text-lg text-pretty">{subtitle}</p>
        </div>
        <MagneticButton label={cta} />
      </div>
    </section>
  );
}

/** Botón circular que se deja "atraer" por el cursor (solo con ratón). */
function MagneticButton({ label }: { label: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduce = useReducedMotion();
  const x = useSpring(useMotionValue(0), { stiffness: 180, damping: 14 });
  const y = useSpring(useMotionValue(0), { stiffness: 180, damping: 14 });

  return (
    <motion.div style={{ x, y }} className="justify-self-start lg:justify-self-end">
      <Link
        ref={ref}
        href="/reservar"
        onPointerMove={(e) => {
          if (reduce || e.pointerType !== "mouse" || !ref.current) return;
          const r = ref.current.getBoundingClientRect();
          x.set((e.clientX - (r.left + r.width / 2)) * 0.3);
          y.set((e.clientY - (r.top + r.height / 2)) * 0.3);
        }}
        onPointerLeave={() => {
          x.set(0);
          y.set(0);
        }}
        className="bg-primary text-primary-foreground hover:bg-brand-300 focus-visible:ring-ring focus-visible:ring-offset-ink-900 group grid size-44 place-items-center rounded-full text-center transition-colors focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:outline-none sm:size-52"
      >
        <span className="flex flex-col items-center gap-2 px-6">
          <ArrowUpRight className="size-8 transition-transform duration-300 group-hover:rotate-45" aria-hidden />
          <span className="text-sm font-bold tracking-[0.18em] uppercase">{label}</span>
        </span>
      </Link>
    </motion.div>
  );
}
