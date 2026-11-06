import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { LogoMark } from "@/components/brand/logo-mark";
import { checkSession } from "@/features/auth/dal";
import { safeAdminPath } from "@/features/auth/schemas";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  robots: { index: false, follow: false },
};

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const next = safeAdminPath(searchParams.next);
  const check = await checkSession();
  if (check.status === "admin") redirect(next);

  const notice =
    searchParams.error === "sin-acceso" || check.status === "forbidden"
      ? "Esta cuenta no tiene acceso al panel. Inicia sesión con una cuenta de administrador."
      : null;

  return (
    <main className="grid flex-1 place-items-center px-5 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="mx-auto mb-10 block w-fit" aria-label="Ir al sitio">
          <LogoMark className="h-14 w-auto" />
        </Link>
        <div className="border-border bg-ink-900 rounded-[4px] border p-6 sm:p-8">
          <h1 className="font-display text-4xl font-bold">Panel</h1>
          <p className="text-muted-foreground mt-2 text-sm">Acceso solo para la administración de la barbería.</p>
          {notice && (
            <p role="alert" className="border-st-rejected/40 bg-st-rejected/10 text-foreground mt-5 rounded-[3px] border p-3 text-sm">
              {notice}
            </p>
          )}
          <LoginForm next={next} />
        </div>
        <p className="text-muted-foreground mt-6 text-center text-xs">
          <Link href="/" className="hover:text-foreground underline-offset-4 hover:underline">
            ← Volver al sitio
          </Link>
        </p>
      </div>
    </main>
  );
}
