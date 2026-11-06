import Image from "next/image";
import Link from "next/link";
import { BrandMark } from "@/components/shared/brand-mark";
import { Appear } from "@/components/shared/appear";
import { buttonVariants } from "@/components/ui/button";
import type { SiteContent } from "@/features/content/registry";
import { cn } from "@/lib/utils";

export function Hero({ content }: { content: SiteContent }) {
  const image = content["hero.image"];

  return (
    <section className="relative isolate overflow-hidden">
      <div className="mx-auto grid min-h-[100svh] max-w-[1200px] items-center gap-12 px-5 pt-32 pb-20 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div>
          <Appear>
            <p className="label-brand">{content["hero.eyebrow"]}</p>
          </Appear>
          <Appear delay={0.08}>
            <h1 className="font-display mt-5 text-[clamp(3.5rem,10vw,8rem)] font-bold">
              {content["hero.title_main"]}{" "}
              <span className="text-primary">{content["hero.title_accent"]}</span>
            </h1>
          </Appear>
          <Appear delay={0.16}>
            <p className="font-serif text-brand-300 mt-6 text-2xl italic sm:text-3xl">{content["hero.tagline"]}</p>
          </Appear>
          <Appear delay={0.22}>
            <p className="text-muted-foreground mt-5 max-w-[46ch] text-base text-pretty sm:text-lg">
              {content["hero.description"]}
            </p>
          </Appear>
          <Appear delay={0.3}>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/reservar" className={cn(buttonVariants({ size: "lg" }))}>
                {content["hero.cta_primary"]}
              </Link>
              <Link href="/#servicios" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                {content["hero.cta_secondary"]}
              </Link>
            </div>
          </Appear>
        </div>

        <Appear delay={0.2} className="relative mx-auto w-full max-w-md lg:max-w-none">
          {/* Marco ámbar desplazado: detalle editorial */}
          <div
            aria-hidden="true"
            className="border-primary pointer-events-none absolute inset-0 translate-x-4 translate-y-4 border"
          />
          <div className="relative aspect-[4/5] overflow-hidden">
            {image ? (
              <Image
                src={image}
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="object-cover"
              />
            ) : (
              <BrandMark />
            )}
          </div>
        </Appear>
      </div>
    </section>
  );
}
