import { BrandIcon, type BrandIconName } from "@/components/brand/brand-icon";

const ICONS: BrandIconName[] = ["tijeras", "navaja", "peine", "poste"];

/**
 * Banda ámbar con texto en movimiento continuo (CSS). Es decorativa: los
 * servicios ya aparecen completos en su sección, por eso va con aria-hidden.
 */
export function Marquee({ items }: { items: string[] }) {
  const words = items.length > 0 ? items : ["Corte", "Barba", "Reserva en línea"];
  // Se repite hasta llenar el ancho y se duplica para que el bucle no tenga corte.
  const row = Array.from({ length: Math.max(2, Math.ceil(8 / words.length)) }, () => words).flat();

  return (
    <div aria-hidden="true" className="marquee bg-primary text-primary-foreground relative -rotate-1 overflow-hidden py-4 select-none">
      <div className="marquee-track flex w-max">
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center">
            {row.map((word, i) => (
              <li key={`${copy}-${i}`} className="flex items-center">
                <span className="font-display px-6 text-3xl font-bold whitespace-nowrap sm:text-4xl">{word}</span>
                <BrandIcon name={ICONS[i % ICONS.length]} className="size-8" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
