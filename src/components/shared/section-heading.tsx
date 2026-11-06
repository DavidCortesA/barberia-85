import { cn } from "@/lib/utils";
import { Appear } from "./appear";
import { Reveal as RevealOnScroll } from "./reveal";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Nivel semántico del título. La home usa h1 solo en el hero. */
  as?: "h1" | "h2";
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  as: Tag = "h2",
  align = "left",
  className,
}: SectionHeadingProps) {
  // Un h1 está arriba del pliegue: entrada con CSS para no retrasar el LCP.
  const Reveal = Tag === "h1" ? Appear : RevealOnScroll;
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <Reveal>
          <p className="label-brand">{eyebrow}</p>
        </Reveal>
      )}
      <Reveal delay={0.05}>
        <Tag className="font-display mt-4 text-[clamp(2.5rem,6vw,4.25rem)] font-bold">{title}</Tag>
      </Reveal>
      {subtitle && (
        <Reveal delay={0.1}>
          <p className="text-muted-foreground mt-5 text-base text-pretty sm:text-lg">{subtitle}</p>
        </Reveal>
      )}
    </div>
  );
}
