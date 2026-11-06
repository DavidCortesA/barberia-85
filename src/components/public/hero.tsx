import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowDownRight } from "lucide-react";
import { BrandIcon } from "@/components/brand/brand-icon";
import { buttonVariants } from "@/components/ui/button";
import type { SiteContent } from "@/features/content/registry";
import { cn } from "@/lib/utils";
import { HeroMedia } from "./hero-media";

/** Retraso escalonado para `.hero-in` (se suma al de la intro, ver globals.css). */
const d = (seconds: number) => ({ "--d": `${seconds}s` }) as CSSProperties;

/**
 * Portada editorial: titular enorme y desalineado a propósito, foto con
 * paralaje y sello giratorio. El h1 NO se anima (es el LCP): lo revela la
 * cortina de la pantalla de carga; el resto entra escalonado después.
 */
export function Hero({ content }: { content: SiteContent }) {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      {/* "85" en contorno, gigante, detrás de todo */}
      <svg
        aria-hidden="true"
        viewBox="0 0 260 240"
        className="text-bone pointer-events-none absolute -right-[8vw] -bottom-[12vw] -z-10 w-[70vw] max-w-[900px] opacity-[0.05]"
      >
        <g fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="92" cy="66" r="44" />
          <circle cx="92" cy="166" r="58" />
          <path d="M238 24 H168 V104 A62 62 0 1 1 152 212" />
        </g>
      </svg>
      {/* Poste de barbería: franja vertical en el borde */}
      <div aria-hidden="true" className="pole-stripes absolute top-0 right-0 -z-10 hidden h-full w-3 opacity-60 lg:block" />

      <div className="mx-auto flex min-h-[100svh] max-w-[1280px] flex-col px-5 pt-28 pb-10 sm:pt-32 lg:px-8">
        <p className="label-brand hero-in flex items-center gap-3" style={d(0)}>
          <span className="bg-primary inline-block h-px w-10" aria-hidden />
          {content["hero.eyebrow"]}
        </p>

        <h1
          id="hero-title"
          className="font-display mt-6 text-[clamp(3.4rem,10.5vw,9.25rem)] leading-[0.84] font-bold tracking-[-0.01em]"
        >
          <span className="block">{content["hero.title_main"]}</span>
          <span className="text-primary mt-1 flex items-center gap-[0.14em] sm:pl-[1.1em]">
            <BrandIcon name="tijeras" className="text-bone hidden size-[0.55em] -rotate-[100deg] sm:block" />
            {content["hero.title_accent"]}
          </span>
        </h1>

        <div className="mt-10 grid flex-1 gap-14 lg:mt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:gap-10">
          <div className="max-w-[46ch]">
            <p className="font-serif text-brand-300 hero-in text-2xl italic sm:text-3xl" style={d(0.08)}>
              {content["hero.tagline"]}
            </p>
            <p className="text-muted-foreground hero-in mt-4 text-base text-pretty sm:text-lg" style={d(0.16)}>
              {content["hero.description"]}
            </p>
            <div className="hero-in mt-9 flex flex-wrap gap-3" style={d(0.24)}>
              <Link href="/reservar" className={cn(buttonVariants({ size: "lg" }), "group")}>
                {content["hero.cta_primary"]}
                <ArrowDownRight className="-rotate-90 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
              </Link>
              <Link href="/#servicios" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                {content["hero.cta_secondary"]}
              </Link>
            </div>
          </div>

          {/* En escritorio la foto sube y se monta junto al titular */}
          <div className="hero-in relative mx-auto w-full max-w-sm lg:-mt-[19rem] lg:max-w-none" style={d(0.12)}>
            <HeroMedia image={content["hero.image"]} alt={content["hero.image_alt"]} />
            <RotatingSeal />
          </div>
        </div>

        <a
          href="#servicios"
          className="hero-in text-muted-foreground hover:text-foreground mt-12 hidden w-fit items-center gap-4 text-xs tracking-[0.3em] uppercase transition-colors lg:flex"
          style={d(0.4)}
        >
          <span className="scroll-cue bg-ink-700 relative block h-12 w-px overflow-hidden" aria-hidden />
          Desliza
        </a>
      </div>
    </section>
  );
}

/** Sello circular con texto que gira lento; las tijeras quedan fijas al centro. */
function RotatingSeal() {
  return (
    <div
      aria-hidden="true"
      className="bg-ink-950 border-border absolute -bottom-10 -left-6 grid size-32 place-items-center rounded-full border sm:-left-12 sm:size-36"
    >
      <svg viewBox="0 0 120 120" className="spin-slow absolute inset-0 size-full">
        <defs>
          <path id="seal-circle" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
        </defs>
        <text
          fill="#f5f3ef"
          fontFamily="var(--font-barlow), sans-serif"
          fontWeight="600"
          fontSize="11.5"
          letterSpacing="3.2"
        >
          <textPath href="#seal-circle">RESERVA EN LÍNEA · 85 BARBERÍA · CORTE · BARBA ·</textPath>
        </text>
      </svg>
      <BrandIcon name="navaja" className="text-primary size-12" />
    </div>
  );
}
