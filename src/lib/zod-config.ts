import { z } from "zod";

/**
 * Zod 4 prueba `new Function` para compilar validaciones más rápidas. Con la CSP
 * del sitio (sin 'unsafe-eval') esa prueba genera un aviso de seguridad en el
 * navegador aunque falle en silencio. `jitless` la desactiva.
 * Se importa al inicio de cada módulo de esquemas que se usa en el navegador.
 */
z.config({ jitless: true });
