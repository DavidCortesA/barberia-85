import type { Metadata } from "next";
import { Suspense } from "react";
import { AboutSection } from "@/components/public/about-section";
import { ContactBlock } from "@/components/public/contact-block";
import { CtaSection } from "@/components/public/cta-section";
import { GallerySection } from "@/components/public/gallery-section";
import { Hero } from "@/components/public/hero";
import { Marquee } from "@/components/public/marquee";
import { ProcessSection } from "@/components/public/process-section";
import { ServicesShowcase } from "@/components/public/services-showcase";
import { ServicesSkeleton } from "@/components/public/services-skeleton";
import { SectionHeading } from "@/components/shared/section-heading";
import { getSiteContent } from "@/features/content/queries";
import { getActiveServices } from "@/features/services/queries";
import { getBusinessHours, getBusinessSettings } from "@/features/settings/queries";
import { buildLocalBusinessJsonLd, jsonLdString } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  return {
    title: { absolute: content["seo.title"] },
    description: content["seo.description"],
    alternates: { canonical: "/" },
    openGraph: { title: content["seo.title"], description: content["seo.description"], url: "/" },
  };
}

/** Nombres para la marquesina; si Supabase falla, la banda usa textos genéricos. */
async function serviceNames(): Promise<string[]> {
  try {
    return (await getActiveServices()).map((s) => s.name.replace(/^\[EJEMPLO\]\s*/, ""));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [content, settings, hours, names] = await Promise.all([
    getSiteContent(),
    getBusinessSettings(),
    getBusinessHours(),
    serviceNames(),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(buildLocalBusinessJsonLd(settings, hours)) }}
      />

      <Hero content={content} />
      <Marquee items={names} />

      <section id="servicios" aria-labelledby="servicios-title" className="scroll-mt-20">
        <div className="mx-auto max-w-[1280px] px-5 py-24 md:py-36 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeading id="servicios-title" eyebrow={content["services.eyebrow"]} title={content["services.title"]} />
            <p className="text-muted-foreground max-w-sm text-base text-pretty md:text-right">{content["services.subtitle"]}</p>
          </div>
          <div className="mt-14">
            <Suspense fallback={<ServicesSkeleton />}>
              <ServicesShowcase />
            </Suspense>
          </div>
        </div>
      </section>

      <ProcessSection
        eyebrow={content["process.eyebrow"]}
        title={content["process.title"]}
        steps={[1, 2, 3, 4].map((n) => ({
          title: content[`process.step${n}_title` as keyof typeof content],
          text: content[`process.step${n}_text` as keyof typeof content],
          image: content[`process.step${n}_image` as keyof typeof content],
        }))}
      />

      <AboutSection content={content} />
      <GallerySection content={content} />
      <CtaSection
        eyebrow={content["cta.eyebrow"]}
        title={content["cta.title"]}
        subtitle={content["cta.subtitle"]}
        cta={content["hero.cta_primary"]}
      />
      <ContactBlock content={content} settings={settings} hours={hours} />
    </>
  );
}
