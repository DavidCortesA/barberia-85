import Image from "next/image";
import { BrandMark } from "@/components/shared/brand-mark";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import type { SiteContent } from "@/features/content/registry";

export function AboutSection({ content }: { content: SiteContent }) {
  const image = content["about.image"];
  const paragraphs = content["about.body"].split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <section id="nosotros" className="mx-auto max-w-[1200px] px-5 py-24 md:py-32">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <Reveal y={24} className="relative aspect-[4/3] overflow-hidden lg:aspect-[4/5]">
          {image ? (
            <Image
              src={image}
              alt=""
              fill
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover"
            />
          ) : (
            <BrandMark />
          )}
        </Reveal>

        <div>
          <SectionHeading
            eyebrow={content["about.eyebrow"]}
            title={content["about.title"]}
          />
          <Reveal delay={0.15}>
            <div className="text-muted-foreground mt-8 space-y-5 text-base leading-relaxed text-pretty sm:text-lg">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
