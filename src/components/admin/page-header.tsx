import type { ReactNode } from "react";

/** Encabezado de cada pantalla del panel: la tipografía display solo vive aquí. */
export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-4xl font-bold sm:text-5xl">{title}</h1>
        {description && <p className="text-muted-foreground mt-2 max-w-2xl text-sm text-pretty">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Tarjeta/superficie del panel. */
export function Panel({ title, description, actions, children, className }: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`border-border bg-ink-900 rounded-[4px] border ${className ?? ""}`}>
      {(title || actions) && (
        <div className="border-border flex flex-wrap items-start justify-between gap-3 border-b px-4 py-4 sm:px-5">
          <div>
            {title && <h2 className="text-base font-semibold">{title}</h2>}
            {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}
