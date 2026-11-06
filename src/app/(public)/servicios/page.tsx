import type { Metadata } from "next";
import { Suspense } from "react";
import { ServicesShowcase } from "@/components/public/services-showcase";
import { ServicesSkeleton } from "@/components/public/services-skeleton";
import { SectionHeading } from "@/components/shared/section-heading";
import { getSiteContent } from "@/features/content/queries";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  return {
    title: content["services.title"],
    description: content["services.subtitle"],
    alternates: { canonical: "/servicios" },
  };
}

export default async function ServicesPage() {
  const content = await getSiteContent();

  return (
    <div className="mx-auto max-w-[1280px] px-5 pt-36 pb-24 lg:px-8">
      <SectionHeading
        as="h1"
        eyebrow={content["services.eyebrow"]}
        title={content["services.title"]}
        subtitle={content["services.subtitle"]}
      />
      <div className="mt-12">
        <Suspense fallback={<ServicesSkeleton />}>
          <ServicesShowcase headingLevel={2} />
        </Suspense>
      </div>
    </div>
  );
}
