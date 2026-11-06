"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/features/admin/result";

/** Ejecuta una Server Action del panel y muestra el resultado con un toast. */
export function useServerAction() {
  const [pending, startTransition] = useTransition();

  function run<T>(
    action: () => Promise<ActionResult<T>>,
    options: { onSuccess?: (result: ActionResult<T> & { ok: true }) => void; onError?: (result: ActionResult<T> & { ok: false }) => void } = {},
  ) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        if (result.message) (result.warning ? toast.warning : toast.success)(result.message, result.warning ? { duration: 10000 } : undefined);
        options.onSuccess?.(result);
      } else {
        toast.error(result.message);
        options.onError?.(result);
      }
    });
  }

  return { pending, run };
}
