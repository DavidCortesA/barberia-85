import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import type { SiteContent } from "@/features/content/registry";
import { getGalleryImages } from "@/features/content/queries";
import { GalleryGrid } from "./gallery-grid";

/** Se oculta por completo mientras el admin no haya cargado fotos. */
export async function GallerySection({ content }: { content: SiteContent }) {
  const images = await getGalleryImages();
  if (images.length === 0) return null;

  return (
    <section id="galeria" className="border-border bg-ink-900 border-y">
      <div className="mx-auto max-w-[1200px] px-5 py-24 md:py-32">
        <SectionHeading eyebrow={content["gallery.eyebrow"]} title={content["gallery.title"]} />
        <Reveal delay={0.1} className="mt-12">
          <GalleryGrid
            items={images.map((img) => ({
              id: img.id,
              url: img.image_url,
              alt: img.alt?.trim() || "Fotografía de 85 BARBERÍA",
            }))}
          />
        </Reveal>
      </div>
    </section>
  );
}
