import "@/lib/zod-config";
import { z } from "zod";

/** Esquemas comunes de las acciones del panel. */
export const idSchema = z.object({ id: z.uuid() });
export const moveSchema = z.object({ id: z.uuid(), direction: z.enum(["up", "down"]) });
export const toggleSchema = z.object({ id: z.uuid(), isActive: z.boolean() });
