import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import type { Service } from "@/types";

/** Servicios activos, en el orden definido por el admin. Lanza si la BD falla. */
export const getActiveServices = cache(async (): Promise<Service[]> => {
  const { data, error } = await createPublicClient()
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(`No se pudieron cargar los servicios: ${error.message}`);
  return data ?? [];
});
