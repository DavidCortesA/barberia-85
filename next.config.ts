import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
