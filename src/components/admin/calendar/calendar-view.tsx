"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

export type WeeklyRange = { day: number; open: string; close: string };

// FullCalendar solo se renderiza en el navegador (elige la vista según el ancho de pantalla).
const FullCalendarView = dynamic(() => import("./full-calendar-view"), {
  ssr: false,
  loading: () => <Skeleton className="h-[640px] w-full" />,
});

export function CalendarView({ businessHours }: { businessHours: WeeklyRange[] }) {
  return <FullCalendarView businessHours={businessHours} />;
}
