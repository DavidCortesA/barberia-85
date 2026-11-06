import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { formatDuration, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Service } from "@/types";

export function ServiceCard({ service, headingLevel = 3 }: { service: Service; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="group border-border bg-ink-900 hover:border-primary/60 relative flex h-full flex-col overflow-hidden rounded-[4px] border transition-[border-color,transform] duration-300 hover:-translate-y-1">
      {service.image_url ? (
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={service.image_url}
            alt=""
            fill
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <div aria-hidden="true" className="bg-primary h-1 w-full origin-left scale-x-[0.18] transition-transform duration-500 group-hover:scale-x-100" />
      )}

      <div className="flex flex-1 flex-col p-6">
        <Heading className="font-display text-3xl font-bold">{service.name}</Heading>
        {service.description && (
          <p className="text-muted-foreground mt-3 flex-1 text-sm text-pretty">{service.description}</p>
        )}
        {!service.description && <div className="flex-1" />}

        <div className="mt-6 flex items-end justify-between gap-4">
          <span className="text-muted-foreground inline-flex items-center gap-1.5 text-sm">
            <Clock className="size-4" aria-hidden />
            {formatDuration(service.duration_minutes)}
          </span>
          <span className="font-display text-brand-300 text-3xl leading-none font-bold">
            {formatPrice(service.price)}
          </span>
        </div>

        <Link
          href={`/reservar?servicio=${service.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-5 w-full")}
          aria-label={`Reservar ${service.name}`}
        >
          Reservar
        </Link>
      </div>
    </article>
  );
}
