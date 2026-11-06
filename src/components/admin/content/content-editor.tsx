"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { ImageUpload } from "@/components/admin/media/image-upload";
import { Panel } from "@/components/admin/page-header";
import { useServerAction } from "@/components/admin/use-server-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { saveContentAction } from "@/features/content/admin-actions";
import { contentFields, contentSections, type ContentField } from "@/features/content/registry";
import type { GalleryImage } from "@/types";
import { GalleryManager } from "./gallery-manager";

type ContentEditorProps = { saved: Record<string, string>; gallery: GalleryImage[] };

/** Pestañas por sección; el formulario se genera desde src/features/content/registry.ts. */
export function ContentEditor({ saved, gallery }: ContentEditorProps) {
  const [tab, setTab] = useState<string>(contentSections[0].id);

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(String(v))} className="gap-5">
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <TabsList variant="line" className="border-border h-auto! w-max min-w-full justify-start gap-1 rounded-none border-b pb-0">
          {contentSections.map((s) => (
            <TabsTrigger key={s.id} value={s.id} className="data-active:text-brand-300 h-10 flex-none px-3">
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {contentSections.map((s) => (
        <TabsContent key={s.id} value={s.id} className="space-y-6">
          <SectionForm
            sectionId={s.id}
            title={s.label}
            description={s.description}
            fields={contentFields.filter((f) => f.section === s.id)}
            saved={saved}
          />
          {s.id === "gallery" && <GalleryManager images={gallery} />}
        </TabsContent>
      ))}
    </Tabs>
  );
}

function SectionForm({
  sectionId,
  title,
  description,
  fields,
  saved,
}: {
  sectionId: string;
  title: string;
  description: string;
  fields: readonly ContentField[];
  saved: Record<string, string>;
}) {
  const initial = () => Object.fromEntries(fields.map((f) => [f.key, saved[f.key] ?? ""]));
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [baseline, setBaseline] = useState<Record<string, string>>(initial);
  const { pending, run } = useServerAction();
  const dirty = fields.some((f) => values[f.key] !== baseline[f.key]);
  const overLimit = fields.some((f) => f.maxLength && values[f.key].trim().length > f.maxLength);

  const set = (key: string, value: string) => setValues((v) => ({ ...v, [key]: value }));

  function save() {
    const snapshot = values;
    run(() => saveContentAction({ section: sectionId, values: snapshot }), { onSuccess: () => setBaseline(snapshot) });
  }

  return (
    <Panel
      title={title}
      description={`${description} Si dejas un campo vacío se usa el texto original.`}
      actions={
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setValues(baseline)} disabled={!dirty || pending}>
            Descartar
          </Button>
          <Button size="sm" onClick={save} disabled={!dirty || pending || overLimit}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {fields.map((f) => (
          <ContentInput key={f.key} field={f} value={values[f.key]} onChange={(v) => set(f.key, v)} />
        ))}
      </div>
    </Panel>
  );
}

function ContentInput({ field, value, onChange }: { field: ContentField; value: string; onChange: (v: string) => void }) {
  const id = `content-${field.key.replace(/\./g, "-")}`;

  if (field.type === "image") {
    return (
      <ImageUpload
        label={field.label}
        folder="content"
        value={value}
        onChange={onChange}
        hint={field.hint}
        aspect={field.key === "hero.image" ? "4/5" : "4/3"}
      />
    );
  }

  const length = value.trim().length;
  const over = !!field.maxLength && length > field.maxLength;
  const customized = value !== "";
  const Control = field.type === "textarea" ? Textarea : Input;

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {field.label}
        </label>
        {customized && (
          <Button type="button" size="xs" variant="ghost" onClick={() => onChange("")}>
            <RotateCcw aria-hidden /> Restaurar original
          </Button>
        )}
      </div>
      <Control
        id={id}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => onChange(e.target.value)}
        placeholder={field.default}
        aria-invalid={over}
        aria-describedby={`${id}-meta`}
        className={field.type === "textarea" ? "min-h-24" : "h-10"}
        {...(field.type === "textarea" ? { rows: 4 } : {})}
      />
      <div id={`${id}-meta`} className="flex justify-between gap-3 text-xs">
        <span className="text-muted-foreground">
          {field.hint ? `${field.hint} ` : ""}
          {customized ? `Original: “${field.default}”` : "Usando el texto original."}
        </span>
        {field.maxLength && (
          <span className={over ? "text-destructive shrink-0 font-semibold" : "text-muted-foreground shrink-0"}>
            {length}/{field.maxLength}
          </span>
        )}
      </div>
    </div>
  );
}
