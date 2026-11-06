import type { Metadata } from "next";
import { ContentEditor } from "@/components/admin/content/content-editor";
import { PageHeader } from "@/components/admin/page-header";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/features/auth/dal";
import { isContentKey } from "@/features/content/registry";

export const metadata: Metadata = { title: "Contenido del sitio" };

export default async function ContentAdminPage() {
  const { supabase } = await requireAdmin();
  const [contentRes, galleryRes] = await Promise.all([
    supabase.from("site_content").select("key, value"),
    supabase.from("gallery_images").select("*").order("sort_order").order("created_at"),
  ]);
  if (contentRes.error) throw new Error(contentRes.error.message);
  if (galleryRes.error) throw new Error(galleryRes.error.message);

  // Valores guardados tal cual ("" o ausente = se usa el texto original).
  const saved: Record<string, string> = {};
  for (const row of contentRes.data ?? []) if (isContentKey(row.key)) saved[row.key] = row.value;

  return (
    <>
      <PageHeader
        title="Contenido"
        description="Textos y fotos del sitio público. Los cambios se publican al guardar, sin volver a desplegar."
        actions={
          <a href="/" target="_blank" rel="noopener" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Ver sitio
          </a>
        }
      />
      <ContentEditor saved={saved} gallery={galleryRes.data ?? []} />
    </>
  );
}
