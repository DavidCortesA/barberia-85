import type { Metadata } from "next";
import { Suspense } from "react";
import { AboutSection } from "@/components/public/about-section";
import { ContactBlock } from "@/components/public/contact-block";
import { GallerySection } from "@/components/public/gallery-section";
import { Hero } from "@/components/public/hero";
import { ServicesGrid } from "@/components/public/services-grid";
import { ServicesSkeleton } from "@/components/public/services-skeleton";
import { SectionHeading } from "@/components/shared/section-heading";
import { getSiteContent } from "@/features/content/queries";
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

export default async function HomePage() {
  const [content, settings, hours] = await Promise.all([
    getSiteContent(),
    getBusinessSettings(),
    getBusinessHours(),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(buildLocalBusinessJsonLd(settings, hours)) }}
      />

      <Hero content={content} />

      <section id="servicios" className="border-border bg-ink-900 border-y">
        <div className="mx-auto max-w-[1200px] px-5 py-24 md:py-32">
          <SectionHeading
            eyebrow={content["services.eyebrow"]}
            title={content["services.title"]}
            subtitle={content["services.subtitle"]}
          />
          <div className="mt-12">
            <Suspense fallback={<ServicesSkeleton />}>
              <ServicesGrid />
            </Suspense>
          </div>
        </div>
      </section>

      <AboutSection content={content} />
      <GallerySection content={content} />
      <ContactBlock content={content} settings={settings} hours={hours} />
    </>
  );
}
