import type { ReactNode } from "react";
import { Appear } from "@/components/shared/appear";

export type LegalSection = { id: string; title: string; body: ReactNode };

/** Plantilla de páginas legales: título, índice fijo en escritorio y secciones h2. */
export function LegalPage({ eyebrow, title, updated, intro, sections }: {
  eyebrow: string;
  title: string;
  updated: string;
  intro: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <div className="mx-auto max-w-[1200px] px-5 pt-36 pb-24 lg:px-8">
      <Appear>
        <p className="label-brand">{eyebrow}</p>
        <h1 className="font-display mt-4 text-[clamp(2.75rem,7vw,5.5rem)] font-bold">{title}</h1>
        <p className="text-muted-foreground mt-4 text-sm">Última actualización: {updated}</p>
      </Appear>

      <div className="mt-14 grid gap-12 lg:grid-cols-[240px_1fr]">
        <nav aria-label="Contenido" className="hidden lg:block">
          <ol className="border-border sticky top-28 space-y-2 border-l pl-5 text-sm">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-muted-foreground hover:text-foreground transition-colors">
                  {String(i + 1).padStart(2, "0")} · {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="legal-prose max-w-[70ch]">
          <div className="text-lg">{intro}</div>
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-t`} className="scroll-mt-28">
              <h2 id={`${s.id}-t`}>
                <span className="text-primary mr-3 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </h2>
              {s.body}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
