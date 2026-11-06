"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { uploadImage } from "@/components/admin/media/upload";
import { Panel } from "@/components/admin/page-header";
import { useServerAction } from "@/components/admin/use-server-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  addGalleryImagesAction,
  deleteGalleryImageAction,
  moveGalleryImageAction,
  updateGalleryImageAction,
} from "@/features/content/admin-actions";
import { ACCEPT_IMAGES } from "@/features/media/constants";
import type { GalleryImage } from "@/types";

/** Fotos de la galería: subir varias, texto alternativo, orden, mostrar/ocultar y eliminar. */
export function GalleryManager({ images }: { images: GalleryImage[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const { pending, run } = useServerAction();

  async function onFiles(list: FileList | null) {
    const files = Array.from(list ?? []).slice(0, 20);
    if (files.length === 0) return;
    setUploading({ done: 0, total: files.length });
    const urls: string[] = [];
    for (const file of files) {
      const result = await uploadImage(file, "gallery");
      if (result.ok) urls.push(result.url);
      else toast.error(`${file.name}: ${result.message}`);
      setUploading((u) => (u ? { ...u, done: u.done + 1 } : u));
    }
    setUploading(null);
    if (inputRef.current) inputRef.current.value = "";
    if (urls.length) run(() => addGalleryImagesAction({ urls }));
  }

  const active = images.filter((i) => i.is_active).length;

  return (
    <Panel
      title="Fotos de la galería"
      description={
        images.length === 0
          ? "Sin fotos, la sección de galería no aparece en el sitio."
          : `${active} de ${images.length} visibles en el sitio. Describe cada foto para lectores de pantalla.`
      }
      actions={
        <>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_IMAGES}
            multiple
            className="sr-only"
            id="gallery-upload"
            onChange={(e) => void onFiles(e.target.files)}
            disabled={!!uploading}
          />
          <Button size="sm" onClick={() => inputRef.current?.click()} disabled={!!uploading || pending}>
            {uploading ? (
              <>
                <Loader2 className="animate-spin" aria-hidden /> Subiendo {uploading.done}/{uploading.total}
              </>
            ) : (
              <>
                <ImagePlus aria-hidden /> Subir fotos
              </>
            )}
          </Button>
        </>
      }
    >
      {images.length === 0 ? (
        <p className="text-muted-foreground text-sm">Sube de 6 a 8 fotos de cortes e instalaciones (JPG, PNG, WebP o AVIF, máx. 5 MB c/u).</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((img, i) => (
            <GalleryItem
              key={img.id}
              image={img}
              first={i === 0}
              last={i === images.length - 1}
              pending={pending}
              onMove={(direction) => run(() => moveGalleryImageAction({ id: img.id, direction }))}
              onSave={(alt, isActive) => run(() => updateGalleryImageAction({ id: img.id, alt, isActive }))}
              onDelete={() => run(() => deleteGalleryImageAction({ id: img.id }))}
            />
          ))}
        </ul>
      )}
    </Panel>
  );
}

function GalleryItem({
  image,
  first,
  last,
  pending,
  onMove,
  onSave,
  onDelete,
}: {
  image: GalleryImage;
  first: boolean;
  last: boolean;
  pending: boolean;
  onMove: (direction: "up" | "down") => void;
  onSave: (alt: string, isActive: boolean) => void;
  onDelete: () => void;
}) {
  const [alt, setAlt] = useState(image.alt ?? "");
  const altDirty = alt.trim() !== (image.alt ?? "");

  return (
    <li className="border-border bg-ink-950 overflow-hidden rounded-[4px] border">
      <div className="relative aspect-[4/3]">
        <Image
          src={image.image_url}
          alt={image.alt ?? ""}
          fill
          sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
          className={image.is_active ? "object-cover" : "object-cover opacity-40 grayscale"}
        />
        {!image.is_active && (
          <span className="bg-ink-950/80 absolute top-2 left-2 rounded-full px-2 py-0.5 text-xs font-medium">Oculta</span>
        )}
      </div>
      <div className="space-y-3 p-3">
        <div className="flex gap-2">
          <Input
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            maxLength={200}
            placeholder="Describe la foto (texto alternativo)"
            aria-label="Texto alternativo"
            className="h-9"
          />
          <Button size="sm" variant="secondary" disabled={!altDirty || pending} onClick={() => onSave(alt, image.is_active)}>
            Guardar
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <label className="text-muted-foreground mr-auto inline-flex items-center gap-2 text-xs">
            <Switch
              checked={image.is_active}
              onCheckedChange={(checked) => onSave(alt, checked)}
              disabled={pending}
              aria-label="Mostrar en el sitio"
            />
            Visible
          </label>
          <Button size="icon-sm" variant="ghost" aria-label="Mover antes" disabled={first || pending} onClick={() => onMove("up")}>
            <ArrowUp aria-hidden />
          </Button>
          <Button size="icon-sm" variant="ghost" aria-label="Mover después" disabled={last || pending} onClick={() => onMove("down")}>
            <ArrowDown aria-hidden />
          </Button>
          <ConfirmDialog
            trigger={
              <Button size="icon-sm" variant="ghost" aria-label="Eliminar foto" disabled={pending}>
                <Trash2 aria-hidden />
              </Button>
            }
            title="¿Eliminar esta foto?"
            description="Se borra de la galería y del almacenamiento. No se puede deshacer."
            confirmLabel="Eliminar"
            onConfirm={onDelete}
            pending={pending}
          />
        </div>
      </div>
    </li>
  );
}
