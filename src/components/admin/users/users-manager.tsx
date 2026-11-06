"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { KeyRound, Plus, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { describedBy, FormField, NativeSelect } from "@/components/admin/form-field";
import { useSheetSession } from "@/components/admin/use-sheet-content";
import { PasswordInput } from "@/components/admin/password-input";
import { useServerAction } from "@/components/admin/use-server-action";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { changeRoleAction, createUserAction, deleteUserAction, setPasswordAction } from "@/features/users/admin-actions";
import { createUserSchema, passwordSchema, roleLabels, type CreateUserInput } from "@/features/users/schemas";
import { formatShop } from "@/lib/date";

export type PanelUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: "admin" | "staff";
  lastSignIn: string | null;
  isSelf: boolean;
};

export function UsersManager({ users }: { users: PanelUser[] }) {
  const [creating, setCreating] = useState(false);
  const [passwordFor, setPasswordFor] = useState<PanelUser | null>(null);
  const { pending, run } = useServerAction();
  const session = useSheetSession(creating, null);

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setCreating(true)}>
          <Plus aria-hidden /> Nueva cuenta
        </Button>
      </div>

      <ul className="space-y-2">
        {users.map((u) => (
          <li key={u.id} className="border-border bg-ink-900 flex flex-col gap-4 rounded-[4px] border p-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {u.name || "Sin nombre"}
                {u.isSelf && <span className="text-muted-foreground ml-2 text-xs font-normal">(tú)</span>}
              </p>
              <p className="text-muted-foreground truncate text-sm">{u.email ?? "—"}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {u.lastSignIn ? `Último acceso: ${formatShop(u.lastSignIn, "d MMM yyyy, h:mm aaa")}` : "Aún no ha entrado"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <NativeSelect
                aria-label={`Rol de ${u.name || u.email}`}
                value={u.role}
                disabled={u.isSelf || pending}
                onChange={(e) => run(() => changeRoleAction({ id: u.id, role: e.target.value }))}
                className="w-44"
              >
                <option value="staff">{roleLabels.staff}</option>
                <option value="admin">{roleLabels.admin}</option>
              </NativeSelect>
              <Button size="sm" variant="outline" disabled={u.isSelf} onClick={() => setPasswordFor(u)}>
                <KeyRound aria-hidden /> Contraseña
              </Button>
              <ConfirmDialog
                trigger={
                  <Button size="icon-sm" variant="ghost" aria-label={`Eliminar cuenta de ${u.name || u.email}`} disabled={u.isSelf || pending}>
                    <Trash2 aria-hidden />
                  </Button>
                }
                title="¿Eliminar esta cuenta?"
                description="La persona ya no podrá entrar al panel. Las citas que gestionó se conservan."
                confirmLabel="Eliminar"
                onConfirm={() => run(() => deleteUserAction({ id: u.id }))}
                pending={pending}
              />
            </div>
          </li>
        ))}
      </ul>

      <Sheet open={creating} onOpenChange={setCreating}>
        <SheetContent className="w-full! overflow-y-auto sm:max-w-md!">
          {session && <CreateUserForm key={session.key} onDone={() => setCreating(false)} />}
        </SheetContent>
      </Sheet>

      <PasswordDialog user={passwordFor} onClose={() => setPasswordFor(null)} />
    </>
  );
}

function CreateUserForm({ onDone }: { onDone: () => void }) {
  const { pending, run } = useServerAction();
  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { fullName: "", email: "", password: "", role: "staff" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    run(() => createUserAction(values), {
      onSuccess: onDone,
      onError: (r) => {
        for (const [field, message] of Object.entries(r.fieldErrors ?? {})) form.setError(field as keyof CreateUserInput, { message });
      },
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex min-h-full flex-col">
      <SheetHeader className="border-border border-b px-5 pt-6 pb-4">
        <SheetTitle className="font-display text-3xl font-bold">Nueva cuenta</SheetTitle>
        <SheetDescription>La persona entra en /login con este correo y contraseña.</SheetDescription>
      </SheetHeader>
      <div className="space-y-5 px-5 py-5">
        <FormField id="u-name" label="Nombre" error={errors.fullName?.message}>
          <Input id="u-name" className="h-10" autoComplete="off" aria-invalid={!!errors.fullName} {...form.register("fullName")} />
        </FormField>
        <FormField id="u-email" label="Correo" error={errors.email?.message}>
          <Input id="u-email" type="email" className="h-10" autoComplete="off" aria-invalid={!!errors.email} {...form.register("email")} />
        </FormField>
        <FormField
          id="u-password"
          label="Contraseña inicial"
          error={errors.password?.message}
          hint="Mínimo 12 caracteres. Compártela en persona; la persona puede pedirte cambiarla."
        >
          <PasswordInput
            id="u-password"
            className="h-10"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            aria-describedby={describedBy("u-password", errors.password?.message, "x")}
            {...form.register("password")}
          />
        </FormField>
        <FormField id="u-role" label="Rol" hint="Recepción: citas, calendario y bloqueos. Administración: todo el panel.">
          <NativeSelect id="u-role" {...form.register("role")}>
            <option value="staff">{roleLabels.staff}</option>
            <option value="admin">{roleLabels.admin}</option>
          </NativeSelect>
        </FormField>
      </div>
      <SheetFooter className="border-border bg-ink-900 sticky bottom-0 flex-row justify-end border-t px-5 py-4">
        <Button type="button" variant="ghost" onClick={onDone} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Creando…" : "Crear cuenta"}
        </Button>
      </SheetFooter>
    </form>
  );
}

function PasswordDialog({ user, onClose }: { user: PanelUser | null; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { pending, run } = useServerAction();

  function save() {
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Contraseña inválida");
      return;
    }
    if (!user) return;
    run(() => setPasswordAction({ id: user.id, password }), {
      onSuccess: () => {
        setPassword("");
        onClose();
      },
    });
  }

  return (
    <Dialog
      open={user !== null}
      onOpenChange={(open) => {
        if (!open) {
          setPassword("");
          setError(null);
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva contraseña</DialogTitle>
          <DialogDescription>Para {user?.name || user?.email}. Compártela en persona.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <PasswordInput
            autoComplete="new-password"
            aria-label="Nueva contraseña"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            className="h-10"
          />
          <p className={error ? "text-destructive text-sm" : "text-muted-foreground text-xs"}>{error ?? "Mínimo 12 caracteres."}</p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
