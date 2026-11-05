import { Logo } from "@/components/shared/logo";
import { Reveal } from "@/components/shared/reveal";
import { siteConfig } from "@/config/site";

// Página temporal de la Fase 3: valida tokens, fuentes y animación.
// La landing real se construye en la Fase 4.
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-start justify-center gap-8 px-6 py-24">
      <Reveal>
        <Logo height={72} priority />
      </Reveal>
      <Reveal delay={0.1}>
        <p className="label-brand">Próximamente</p>
      </Reveal>
      <Reveal delay={0.2}>
        <h1 className="font-display text-6xl font-bold sm:text-8xl">
          {siteConfig.tagline.split(" ").slice(0, 2).join(" ")}{" "}
          <span className="text-brand-500">
            {siteConfig.tagline.split(" ").slice(2).join(" ")}
          </span>
        </h1>
      </Reveal>
      <Reveal delay={0.3}>
        <p className="font-serif text-2xl text-brand-300 italic">
          Estamos preparando la reserva en línea.
        </p>
      </Reveal>
    </main>
  );
}
