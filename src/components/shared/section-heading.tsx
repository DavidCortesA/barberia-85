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
  /** id del título, para `aria-labelledby` de la sección. */
  id?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  as: Tag = "h2",
  align = "left",
  className,
  id,
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
        <Tag id={id} className="font-display mt-4 text-[clamp(2.75rem,7vw,5.5rem)] font-bold">{title}</Tag>
      </Reveal>
      {subtitle && (
        <Reveal delay={0.1}>
          <p className="text-muted-foreground mt-5 text-base text-pretty sm:text-lg">{subtitle}</p>
        </Reveal>
      )}
    </div>
  );
}
