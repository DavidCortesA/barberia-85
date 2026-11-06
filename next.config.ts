import type { NextConfig } from "next";

// Las fotos administradas viven en Supabase Storage (bucket público "media").
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
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
