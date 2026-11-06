import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * Etiqueta + control + ayuda/error. El control debe usar `id` y
 * `aria-describedby={describedBy(id, error, hint)}`.
 */
export function FormField({ id, label, error, hint, optional, className, children }: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>
        {label}
        {optional && <span className="text-muted-foreground font-normal">(opcional)</span>}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-destructive text-sm">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-muted-foreground text-xs">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function describedBy(id: string, error?: string, hint?: ReactNode): string | undefined {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

/** <select> nativo con el estilo de los inputs: accesible y cómodo en móvil. */
export function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "border-input dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive h-10 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3 [&>option]:bg-ink-900",
        className,
      )}
      {...props}
    />
  );
}
