import type { NextConfig } from "next";

// Las fotos administradas viven en Supabase Storage (bucket público "media").
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return null;
  }
})();

const isDev = process.env.NODE_ENV !== "production";
// Google Analytics solo amplía la CSP si se configuró un ID.
const ga = process.env.NEXT_PUBLIC_GA_ID
  ? { script: " https://www.googletagmanager.com", connect: " https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com", img: " https://*.google-analytics.com https://www.googletagmanager.com" }
  : { script: "", connect: "", img: "" };
const supabaseOrigin = supabaseHost ? `https://${supabaseHost}` : "";

/**
 * CSP razonable sin nonces (los nonces obligarían a renderizar todo de forma
 * dinámica y se perdería el ISR del sitio público). Next necesita scripts y
 * estilos en línea para hidratar; todo lo demás queda limitado al propio sitio
 * y a Supabase (subida de fotos desde el navegador del admin).
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${ga.script}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseOrigin}${ga.img}`.trim(),
  // data: = fuente de íconos de FullCalendar (flechas del calendario del panel).
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigin}${ga.connect}${isDev ? " ws: wss:" : ""}`.trim(),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // En desarrollo Next registra cada Server Action con sus argumentos: eso
  // imprimiría contraseñas (login) y datos de clientes en la terminal.
  logging: { serverFunctions: false },
  turbopack: {
    // Evita que Next detecte lockfiles fuera del repo (p. ej. en el directorio del usuario).
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
