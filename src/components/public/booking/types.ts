export type BookingService = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number;
};

/** Textos administrables del flujo (tabla site_content, claves booking.*). */
export type BookingCopy = {
  pendingNotice: string;
  successTitle: string;
  successMessage: string;
};

export type SlotDto = { time: string; available: boolean };
