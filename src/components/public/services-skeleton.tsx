import { Skeleton } from "@/components/ui/skeleton";

/** Marcador de posición mientras cargan los servicios. */
export function ServicesSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Cargando servicios">
      {[0, 1, 2].map((i) => (
        <div key={i} className="border-border bg-ink-900 space-y-4 rounded-[4px] border p-6">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <div className="flex justify-between pt-4">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}
