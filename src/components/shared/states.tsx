import type { ReactNode } from "react";
import { AlertTriangle, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

type StateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

function StateShell({ icon, title, description, action, className }: StateProps & { icon: ReactNode }) {
  return (
    <div
      className={cn(
        "border-border bg-ink-900/60 flex flex-col items-center gap-3 rounded-[4px] border border-dashed px-6 py-12 text-center",
        className,
      )}
    >
      <div className="text-muted-foreground">{icon}</div>
      <p className="font-display text-2xl font-bold">{title}</p>
      {description && <p className="text-muted-foreground max-w-md text-sm text-pretty">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Estado vacío: aún no hay contenido que mostrar. */
export function EmptyState(props: StateProps) {
  return <StateShell {...props} icon={<Inbox className="size-8" aria-hidden />} />;
}

/** Estado de error recuperable. */
export function ErrorState(props: StateProps) {
  return (
    <div role="alert">
      <StateShell {...props} icon={<AlertTriangle className="text-st-rejected size-8" aria-hidden />} />
    </div>
  );
}
