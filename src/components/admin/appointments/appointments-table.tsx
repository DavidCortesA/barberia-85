"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { WhatsAppIcon } from "@/components/shared/social-icons";
import { EmptyState } from "@/components/shared/states";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { allowedTransitions, displayStatus, transitionCopy } from "@/features/appointments/status";
import { phoneTenDigits, type AppointmentView } from "@/features/appointments/view";
import { formatShop, shopTimeKey } from "@/lib/date";
import { formatDuration, formatPrice, formatTime12 } from "@/lib/format";
import { formatPhoneDisplay } from "@/lib/links";
import { cn } from "@/lib/utils";
import { AppointmentSheet } from "./appointment-sheet";
import { openWhatsApp, useAppointmentActions } from "./use-appointment-actions";
import { whatsappLinkFor } from "./whatsapp";

type AppointmentsTableProps = {
  rows: AppointmentView[];
  total: number;
  page: number;
  pageSize: number;
  filtered: boolean;
};

export function AppointmentsTable({ rows, total, page, pageSize, filtered }: AppointmentsTableProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const actions = useAppointmentActions();
  const selected = rows.find((r) => r.id === selectedId) ?? null;

  if (rows.length === 0) {
    return (
      <EmptyState
        title={filtered ? "Sin resultados" : "Aún no hay citas"}
        description={
          filtered
            ? "Ninguna cita coincide con los filtros. Prueba con otros o límpialos."
            : "Cuando un cliente solicite una cita desde el sitio aparecerá aquí."
        }
      />
    );
  }

  return (
    <>
      {/* Escritorio/tablet: tabla */}
      <div className="border-border bg-ink-900 hidden overflow-hidden rounded-[4px] border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Servicio</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className="hover:text-brand-300 text-left font-medium underline-offset-4 hover:underline"
                  >
                    {r.customerName}
                  </button>
                  <p className="text-muted-foreground text-xs">{formatPhoneDisplay(phoneTenDigits(r.customerPhone))}</p>
                </TableCell>
                <TableCell>
                  {r.serviceName}
                  <p className="text-muted-foreground text-xs">{formatDuration(r.durationMinutes)}</p>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatShop(r.startsAt, "EEE d MMM yyyy")}
                  <p className="text-muted-foreground text-xs">
                    {formatTime12(shopTimeKey(r.startsAt))} – {formatTime12(shopTimeKey(r.endsAt))}
                  </p>
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatPrice(r.price)}</TableCell>
                <TableCell>
                  <StatusBadge status={displayStatus(r.status, r.startsAt)} />
                </TableCell>
                <TableCell>
                  <RowMenu appt={r} onOpen={() => setSelectedId(r.id)} onAction={actions.ask} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Móvil: tarjetas */}
      <ul className="space-y-2 md:hidden">
        {rows.map((r) => (
          <li key={r.id} className="border-border bg-ink-900 flex items-start gap-3 rounded-[4px] border p-4">
            <button type="button" onClick={() => setSelectedId(r.id)} className="min-w-0 flex-1 text-left">
              <p className="truncate font-medium">{r.customerName}</p>
              <p className="text-muted-foreground truncate text-sm">
                {r.serviceName} · {formatPrice(r.price)}
              </p>
              <p className="mt-1 text-sm">
                {formatShop(r.startsAt, "EEE d MMM")} · {formatTime12(shopTimeKey(r.startsAt))}
              </p>
              <StatusBadge status={displayStatus(r.status, r.startsAt)} className="mt-2" />
            </button>
            <RowMenu appt={r} onOpen={() => setSelectedId(r.id)} onAction={actions.ask} />
          </li>
        ))}
      </ul>

      <Pagination total={total} page={page} pageSize={pageSize} />

      <AppointmentSheet
        appointment={selected}
        open={!!selected}
        onOpenChange={(open) => !open && setSelectedId(null)}
        onAction={actions.ask}
        busy={actions.busy}
      />
      {actions.dialogs}
    </>
  );
}

function RowMenu({
  appt,
  onOpen,
  onAction,
}: {
  appt: AppointmentView;
  onOpen: () => void;
  onAction: ReturnType<typeof useAppointmentActions>["ask"];
}) {
  const transitions = allowedTransitions(appt.status, appt.startsAt);
  const wa = whatsappLinkFor(appt);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Acciones para ${appt.customerName}`} />}>
        <MoreHorizontal aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onOpen}>Ver detalle</DropdownMenuItem>
        {wa && (
          <DropdownMenuItem onClick={() => openWhatsApp(wa)}>
            <WhatsAppIcon className="size-4" aria-hidden /> WhatsApp
          </DropdownMenuItem>
        )}
        {transitions.length > 0 && <DropdownMenuSeparator />}
        {transitions.map((to) => (
          <DropdownMenuItem
            key={to}
            variant={transitionCopy[to].destructive ? "destructive" : "default"}
            onClick={() => onAction(appt, to)}
          >
            {transitionCopy[to].verb}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Pagination({ total, page, pageSize }: { total: number; page: number; pageSize: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) params.delete("pagina");
    else params.set("pagina", String(p));
    return `${pathname}${params.size ? `?${params}` : ""}`;
  };
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <nav aria-label="Paginación" className="mt-4 flex items-center justify-between gap-3 text-sm">
      <p className="text-muted-foreground">
        {from}–{to} de {total}
      </p>
      <div className="flex gap-2">
        <Link
          href={href(page - 1)}
          aria-disabled={page <= 1}
          tabIndex={page <= 1 ? -1 : undefined}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), page <= 1 && "pointer-events-none opacity-40")}
        >
          <ChevronLeft aria-hidden /> Anterior
        </Link>
        <Link
          href={href(page + 1)}
          aria-disabled={page >= pages}
          tabIndex={page >= pages ? -1 : undefined}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), page >= pages && "pointer-events-none opacity-40")}
        >
          Siguiente <ChevronRight aria-hidden />
        </Link>
      </div>
    </nav>
  );
}
