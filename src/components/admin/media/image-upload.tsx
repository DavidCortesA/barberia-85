"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { discardUploadAction } from "@/features/media/actions";
import { ACCEPT_IMAGES, type MediaFolder } from "@/features/media/constants";
import { cn } from "@/lib/utils";
import { uploadImage } from "./upload";

type ImageUploadProps = {
  value: string;
  onChange: (url: string) => void;
  folder: MediaFolder;
  label: string;
  hint?: string;
  /** Proporción de la vista previa, p. ej. "4/5" o "4/3". */
  aspect?: string;
  className?: string;
};

/**
 * Campo de imagen reutilizable: vista previa, subir/cambiar y quitar.
 * La imagen anterior se borra del bucket cuando se GUARDA el formulario
 * (lo hace la Server Action); aquí solo se descartan subidas intermedias.
 */
export function ImageUpload({ value, onChange, folder, label, hint, aspect = "4/3", className }: ImageUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  // Subidas hechas en esta edición que aún no se guardan: si se reemplazan, se borran.
  const [unsaved, setUnsaved] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    const result = await uploadImage(file, folder);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    if (unsaved) void discardUploadAction(unsaved);
    setUnsaved(result.url);
    onChange(result.url);
  }

  function remove() {
    if (unsaved && unsaved === value) {
      void discardUploadAction(unsaved);
      setUnsaved(null);
    }
    onChange("");
  }

  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div
          className="border-border bg-ink-950 relative w-full max-w-56 overflow-hidden rounded-[3px] border"
          style={{ aspectRatio: aspect }}
        >
          {value ? (
            <Image src={value} alt={`Vista previa: ${label}`} fill sizes="224px" className="object-cover" />
          ) : (
            <div className="text-muted-foreground grid h-full place-items-center p-4 text-center text-xs">Sin imagen</div>
          )}
          {busy && (
            <div className="bg-ink-950/70 absolute inset-0 grid place-items-center" aria-live="polite">
              <Loader2 className="size-6 animate-spin" aria-hidden />
              <span className="sr-only">Subiendo imagen…</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={ACCEPT_IMAGES}
            className="sr-only"
            onChange={(e) => void onFile(e.target.files?.[0])}
            disabled={busy}
          />
          <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
            <ImagePlus aria-hidden /> {value ? "Cambiar" : "Subir foto"}
          </Button>
          {value && (
            <Button type="button" size="sm" variant="ghost" onClick={remove} disabled={busy}>
              <Trash2 aria-hidden /> Quitar
            </Button>
          )}
        </div>
      </div>
      <p className="text-muted-foreground text-xs">{hint ? `${hint} ` : ""}JPG, PNG, WebP o AVIF, máximo 5 MB.</p>
    </div>
  );
}
