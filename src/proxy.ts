import { NextResponse, type NextRequest } from "next/server";
import { redirectWithCookies, updateSession } from "@/lib/supabase/proxy";

/**
 * Primera barrera: refresca la sesión y manda a /login a quien no tenga
 * sesión al entrar a /admin. NO es la única defensa (ver layout admin + RLS).
 */
export async function proxy(request: NextRequest) {
  const { response, claims } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !claims) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    return redirectWithCookies(url, response);
  }

  // /login con sesión NO se redirige aquí: el proxy no conoce el rol y un usuario
  // `staff` entraría en un bucle /login ↔ /admin. La página de login lo resuelve.
  return response ?? NextResponse.next();
}

export const config = {
  // Solo rutas con sesión: el sitio público no necesita pasar por Supabase.
  matcher: ["/admin/:path*", "/login"],
};
