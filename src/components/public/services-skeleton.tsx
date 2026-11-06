import { Skeleton } from "@/components/ui/skeleton";

/** Marcador de posición mientras cargan los servicios (misma forma que la lista). */
export function ServicesSkeleton() {
  return (
    <div className="border-border border-t" aria-busy="true" aria-label="Cargando servicios">
      {[0, 1, 2].map((i) => (
        <div key={i} className="border-border grid grid-cols-[4rem_1fr_auto] items-center gap-5 border-b px-4 py-9">
          <Skeleton className="h-6 w-8" />
          <div className="space-y-3">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-10 w-20" />
        </div>
      ))}
    </div>
  );
}
