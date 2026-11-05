"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-start justify-center gap-6 px-6">
      <p className="label-brand">Algo salió mal</p>
      <h1 className="font-display text-6xl font-bold sm:text-7xl">Tuvimos un problema</h1>
      <p className="text-muted-foreground">Inténtalo de nuevo. Si continúa, vuelve más tarde.</p>
      <Button onClick={reset}>Reintentar</Button>
    </main>
  );
}
