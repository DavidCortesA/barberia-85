"use client";

import Image from "next/image";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type GalleryItem = { id: string; url: string; alt: string };

// Patrón de mosaico asimétrico (se repite cada 6 fotos).
const spans = [
  "sm:col-span-2 sm:row-span-2",
  "",
  "",
  "sm:row-span-2",
  "",
  "sm:col-span-2",
];

/** Mosaico de fotos con visor ampliado accesible (Esc para cerrar). */
export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [active, setActive] = useState<GalleryItem | null>(null);

  return (
    <>
      <ul className="grid auto-rows-[160px] grid-cols-2 gap-3 sm:auto-rows-[200px] sm:grid-cols-4">
        {items.map((item, i) => (
          <li key={item.id} className={cn("relative overflow-hidden", spans[i % spans.length])}>
            <button
              type="button"
              onClick={() => setActive(item)}
              aria-label={`Ampliar foto: ${item.alt}`}
              className="group relative block h-full w-full cursor-zoom-in"
            >
              <Image
                src={item.url}
                alt={item.alt}
                fill
                sizes="(min-width: 640px) 25vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="bg-ink-950/0 group-hover:bg-ink-950/25 absolute inset-0 transition-colors" />
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={active !== null} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="bg-ink-950 max-w-[min(92vw,1100px)] border-0 p-2 sm:max-w-[min(92vw,1100px)]">
          <DialogTitle className="sr-only">{active?.alt ?? "Foto"}</DialogTitle>
          <DialogDescription className="sr-only">Vista ampliada de la fotografía</DialogDescription>
          {active && (
            <div className="relative h-[80vh] w-full">
              <Image src={active.url} alt={active.alt} fill sizes="92vw" className="object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
