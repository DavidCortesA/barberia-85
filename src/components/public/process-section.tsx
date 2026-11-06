"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import type { BrandIconName } from "@/components/brand/brand-icon";
import { RevealIcon } from "@/components/brand/reveal-icon";

/** `image` vacío = tarjeta sin foto (se administra en Contenido → Cómo reservar). */
type Step = { title: string; text: string; image: string };

const ICONS: BrandIconName[] = ["catalogo", "calendario", "mensaje", "silla"];

const DESKTOP = "(min-width: 1024px)";
function useIsDesktop() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(DESKTOP);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(DESKTOP).matches,
    () => false,
  );
}

/**
 * "Cómo reservar". En escritorio la sección se queda fija y los pasos se
 * desplazan en horizontal según el scroll; en móvil o con "reducir
 * movimiento" es una lista vertical normal.
 */
export function ProcessSection({ eyebrow, title, steps }: { eyebrow: string; title: string; steps: Step[] }) {
  const reduce = useReducedMotion();
  const isDesktop = useIsDesktop();
  const horizontal = isDesktop && !reduce;

  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLOListElement>(null);
  const [distance, setDistance] = useState(0);

  // Cuánto hay que desplazar el carril para mostrar el último paso completo.
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || !horizontal) return;
    const measure = () => setDistance(Math.max(0, track.scrollWidth - window.innerWidth + 80));
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [horizontal]);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0.05, 0.95], [0, -distance]);
  const progress = useTransform(scrollYProgress, [0.05, 0.95], [0, 1]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="process-title"
      className="relative"
      style={horizontal ? { height: `calc(100vh + ${distance}px)` } : undefined}
    >
      <div className={horizontal ? "sticky top-0 flex h-screen flex-col justify-center overflow-hidden" : "py-24 md:py-32"}>
        <div className="mx-auto w-full max-w-[1280px] px-5 lg:px-8">
          <p className="label-brand">{eyebrow}</p>
          <div className="mt-4 flex items-end justify-between gap-8">
            <h2 id="process-title" className="font-display max-w-[14ch] text-[clamp(2.75rem,7vw,5.5rem)] font-bold">
              {title}
            </h2>
            {horizontal && (
              <div className="bg-ink-700 mb-4 hidden h-px w-48 overflow-hidden lg:block" aria-hidden>
                <motion.div className="bg-primary h-full origin-left" style={{ scaleX: progress }} />
              </div>
            )}
          </div>
        </div>

        <motion.ol
          ref={trackRef}
          style={horizontal ? { x } : undefined}
          className={
            horizontal
              ? "mt-14 flex w-max gap-6 pr-10 pl-[max(1.25rem,calc((100vw-1280px)/2+2rem))]"
              : "mx-auto mt-12 grid max-w-[1280px] gap-5 px-5 sm:grid-cols-2"
          }
        >
          {steps.map((step, i) => (
            <li
              key={i}
              className={
                "group border-border bg-ink-900 relative isolate overflow-hidden rounded-[4px] border " +
                (horizontal ? "h-[min(56vh,460px)] w-[min(40vw,480px)]" : "min-h-80")
              }
            >
              {step.image && (
                <>
                  {/* Foto en blanco y negro; al pasar el cursor recupera el color y crece */}
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    sizes="(min-width: 1024px) 480px, (min-width: 640px) 50vw, 100vw"
                    className="-z-20 object-cover grayscale transition-[filter,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 group-hover:grayscale-0"
                  />
                  {/* Difuminado negro de derecha a izquierda (transparente a la izquierda) */}
                  <div aria-hidden="true" className="from-ink-950 via-ink-950/75 absolute inset-0 -z-10 bg-gradient-to-l via-40% to-transparent" />
                </>
              )}
              <div className={"flex h-full flex-col justify-between gap-10 p-7 sm:p-9 " + (step.image ? "ml-auto w-[68%] items-end text-right" : "")}>
                <div className={"flex w-full items-start justify-between gap-4 " + (step.image ? "flex-row-reverse" : "")}>
                  <span
                    aria-hidden="true"
                    className="font-display text-[6rem] leading-none font-bold text-transparent sm:text-[7rem]"
                    style={{ WebkitTextStroke: "1.5px rgb(245 243 239 / 0.45)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <RevealIcon name={ICONS[i % ICONS.length]} delay={0.1} className="text-primary size-14 sm:size-16" />
                </div>
                <div>
                  <h3 className="font-display text-3xl font-bold sm:text-4xl">{step.title}</h3>
                  <p className="text-muted-foreground mt-3 max-w-[36ch] text-pretty">{step.text}</p>
                </div>
              </div>
            </li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}
