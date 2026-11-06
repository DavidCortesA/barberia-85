"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { es } from "react-day-picker/locale";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createAppointmentRequestAction } from "@/features/appointments/actions";
import { slotRelatedErrors } from "@/features/appointments/errors";
import { localDateToYmd, ymdToLocalDate } from "@/features/appointments/format";
import { detailsSchema, type DetailsInput } from "@/features/appointments/schemas";
import { isDateOpen, type ScheduleWindow } from "@/features/schedule/window";
import { formatDuration, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BookingSummary } from "./booking-summary";
import { SlotPicker } from "./slot-picker";
import type { BookingCopy, BookingService } from "./types";

const STEPS = ["Servicio", "Día", "Hora", "Tus datos", "Revisar"] as const;
type Step = 1 | 2 | 3 | 4 | 5;

type BookingWizardProps = {
  services: BookingService[];
  window: ScheduleWindow;
  copy: BookingCopy;
};

export function BookingWizard({ services, window: schedule, copy }: BookingWizardProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const preselected = useMemo(() => {
    const id = searchParams.get("servicio");
    return services.find((s) => s.id === id)?.id ?? null;
  }, [searchParams, services]);

  const [step, setStep] = useState<Step>(preselected ? 2 : 1);
  const [serviceId, setServiceId] = useState<string | null>(preselected);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [website, setWebsite] = useState(""); // honeypot
  const [slotRefresh, setSlotRefresh] = useState(0);
  const [pending, startTransition] = useTransition();

  const form = useForm<DetailsInput>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { fullName: "", phone: "", notes: "" },
    mode: "onTouched",
  });

  const service = services.find((s) => s.id === serviceId) ?? null;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const lastAnnounced = useRef<Step>(step);

  // Al cambiar de paso, el foco pasa al título para que lectores de pantalla lo anuncien.
  // Se compara con el último paso anunciado para no mover el foco en la carga inicial.
  useEffect(() => {
    if (lastAnnounced.current === step) return;
    lastAnnounced.current = step;
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }, [step, reduceMotion]);

  function chooseService(id: string) {
    if (id !== serviceId) setTime(null); // la duración cambia los horarios posibles
    setServiceId(id);
  }

  function chooseDate(d: Date | undefined) {
    if (!d) return;
    const ymd = localDateToYmd(d);
    if (ymd !== date) setTime(null);
    setDate(ymd);
  }

  async function goFromDetails() {
    const ok = await form.trigger();
    if (ok) setStep(5);
  }

  function submit() {
    if (!service || !date || !time) return;
    const values = form.getValues();

    startTransition(async () => {
      const result = await createAppointmentRequestAction({
        serviceId: service.id,
        date,
        time,
        fullName: values.fullName,
        phone: values.phone,
        notes: values.notes,
        website,
      });

      if (result.ok) {
        // Página de gracias: solo datos de la cita, nunca nombre ni teléfono en la URL.
        router.push(`/gracias?${new URLSearchParams({ servicio: service.id, fecha: date, hora: time })}`);
        return;
      }

      toast.error(result.message);
      if (result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          form.setError(field as keyof DetailsInput, { message });
        }
        setStep(4);
      } else if (slotRelatedErrors.includes(result.code)) {
        setTime(null);
        setSlotRefresh((n) => n + 1);
        setStep(3);
      }
    });
  }

  const canContinue =
    (step === 1 && !!serviceId) || (step === 2 && !!date) || (step === 3 && !!time) || step === 4 || step === 5;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
      <div className="border-border bg-ink-900 rounded-[4px] border p-5 sm:p-8">
        {/* Progreso */}
        <div className="mb-8">
          <ol className="flex gap-1.5" aria-label="Progreso de la reserva">
            {STEPS.map((label, i) => (
              <li
                key={label}
                aria-current={step === i + 1 ? "step" : undefined}
                className={cn("h-1 flex-1 rounded-full transition-colors duration-300", i + 1 <= step ? "bg-primary" : "bg-ink-700")}
              >
                <span className="sr-only">{label}</span>
              </li>
            ))}
          </ol>
          <p className="text-muted-foreground mt-3 text-xs tracking-wide">
            Paso {step} de {STEPS.length}
          </p>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={reduceMotion ? false : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
          >
            <h2 ref={headingRef} tabIndex={-1} className="font-display mb-6 text-4xl font-bold outline-none sm:text-5xl">
              {step === 1 && "Elige tu servicio"}
              {step === 2 && "Elige el día"}
              {step === 3 && "Elige la hora"}
              {step === 4 && "Tus datos"}
              {step === 5 && "Revisa y envía"}
            </h2>

            {/* Paso 1: servicio */}
            {step === 1 && (
              <div role="radiogroup" aria-label="Servicios" className="space-y-3">
                {services.map((s) => {
                  const selected = s.id === serviceId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => chooseService(s.id)}
                      className={cn(
                        "flex w-full items-center justify-between gap-4 rounded-[3px] border p-4 text-left transition-colors",
                        "focus-visible:ring-ring focus-visible:ring-offset-ink-900 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                        selected ? "border-primary bg-primary/10" : "border-border bg-ink-950 hover:border-primary/60",
                      )}
                    >
                      <span>
                        <span className="block font-semibold">{s.name}</span>
                        <span className="text-muted-foreground mt-0.5 block text-sm">
                          {formatDuration(s.durationMinutes)}
                          {s.description ? ` · ${s.description}` : ""}
                        </span>
                      </span>
                      <span className="font-display text-brand-300 text-2xl font-bold">{formatPrice(s.price)}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Paso 2: día */}
            {step === 2 && (
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  locale={es}
                  selected={date ? ymdToLocalDate(date) : undefined}
                  onSelect={chooseDate}
                  defaultMonth={ymdToLocalDate(date ?? schedule.today)}
                  startMonth={ymdToLocalDate(schedule.today)}
                  endMonth={ymdToLocalDate(schedule.lastDate)}
                  disabled={(d) => !isDateOpen(schedule, localDateToYmd(d))}
                  className="bg-transparent p-0 [--cell-size:--spacing(10)] sm:[--cell-size:--spacing(12)]"
                />
              </div>
            )}

            {/* Paso 3: hora */}
            {step === 3 && service && date && (
              <SlotPicker
                serviceId={service.id}
                date={date}
                value={time}
                onChange={setTime}
                refreshKey={slotRefresh}
                onPickAnotherDay={() => setStep(2)}
              />
            )}

            {/* Paso 4: datos */}
            {step === 4 && (
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  void goFromDetails();
                }}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nombre completo</Label>
                  <Input
                    id="fullName"
                    autoComplete="name"
                    aria-invalid={!!form.formState.errors.fullName}
                    aria-describedby={form.formState.errors.fullName ? "fullName-error" : undefined}
                    className="h-12"
                    {...form.register("fullName")}
                  />
                  {form.formState.errors.fullName && (
                    <p id="fullName-error" role="alert" className="text-destructive text-sm">
                      {form.formState.errors.fullName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono (10 dígitos)</Label>
                  <div className="flex">
                    <span className="border-input bg-ink-800 text-muted-foreground grid place-items-center rounded-l-[3px] border border-r-0 px-3 text-sm">
                      +52
                    </span>
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      placeholder="81 1234 5678"
                      aria-invalid={!!form.formState.errors.phone}
                      aria-describedby={form.formState.errors.phone ? "phone-error" : "phone-hint"}
                      className="h-12 rounded-l-none"
                      {...form.register("phone")}
                    />
                  </div>
                  {form.formState.errors.phone ? (
                    <p id="phone-error" role="alert" className="text-destructive text-sm">
                      {form.formState.errors.phone.message}
                    </p>
                  ) : (
                    <p id="phone-hint" className="text-muted-foreground text-xs">
                      Te confirmaremos por WhatsApp a este número.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">
                    Notas <span className="text-muted-foreground font-normal">(opcional)</span>
                  </Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    maxLength={500}
                    aria-invalid={!!form.formState.errors.notes}
                    {...form.register("notes")}
                  />
                  {form.formState.errors.notes && (
                    <p role="alert" className="text-destructive text-sm">
                      {form.formState.errors.notes.message}
                    </p>
                  )}
                </div>

                {/* Honeypot: invisible para personas, tentador para bots */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label>
                    Sitio web
                    <input
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </label>
                </div>
                <button type="submit" className="sr-only">
                  Continuar
                </button>
              </form>
            )}

            {/* Paso 5: revisión */}
            {step === 5 && service && date && time && (
              <div className="space-y-5">
                <div className="border-border bg-ink-950 text-muted-foreground rounded-[3px] border p-4 text-sm">
                  <p>
                    <span className="text-foreground font-medium">{form.getValues("fullName")}</span> · +52{" "}
                    {form.getValues("phone")}
                  </p>
                  {form.getValues("notes") && <p className="mt-2">“{form.getValues("notes")}”</p>}
                </div>
                <p className="border-primary text-muted-foreground border-l-2 pl-4 text-sm">{copy.pendingNotice}</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navegación */}
        <div className="mt-8 flex items-center justify-between gap-3">
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep((s) => (s - 1) as Step)} disabled={pending}>
              Atrás
            </Button>
          ) : (
            <span />
          )}

          {step < 5 ? (
            <Button
              onClick={() => (step === 4 ? void goFromDetails() : setStep((s) => (s + 1) as Step))}
              disabled={!canContinue}
              className="min-w-40"
            >
              Continuar
            </Button>
          ) : (
            <Button onClick={submit} disabled={pending} className="min-w-48">
              {pending ? "Enviando…" : "Enviar solicitud"}
            </Button>
          )}
        </div>
      </div>

      <div className="lg:sticky lg:top-28">
        <BookingSummary service={service} date={date} time={time} />
      </div>
    </div>
  );
}
