"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[admin]", error.digest ?? error.message);
  }, [error]);

  return (
    <ErrorState
      title="No se pudo cargar esta sección"
      description="Revisa tu conexión e inténtalo de nuevo. Si el problema continúa, recarga la página."
      action={<Button onClick={reset}>Reintentar</Button>}
    />
  );
}
