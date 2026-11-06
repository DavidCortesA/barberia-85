import type { MetadataRoute } from "next";
import { publicEnv } from "@/config/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/servicios`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/reservar`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/contacto`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/privacidad`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terminos`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
