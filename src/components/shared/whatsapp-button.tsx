import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { WhatsAppIcon } from "./social-icons";

type WhatsAppButtonProps = VariantProps<typeof buttonVariants> & {
  /** 10 dígitos MX (sin lada país). */
  phone: string;
  message?: string;
  label?: string;
  className?: string;
};

/** Enlace wa.me; abre WhatsApp con un mensaje precargado. No envía nada por sí mismo. */
export function WhatsAppButton({
  phone,
  message,
  label = "WhatsApp",
  variant = "outline",
  size = "default",
  className,
}: WhatsAppButtonProps) {
  return (
    <a
      href={buildWhatsAppLink(phone, message)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(buttonVariants({ variant, size }), className)}
    >
      <WhatsAppIcon />
      {label}
      <span className="sr-only"> (se abre en una pestaña nueva)</span>
    </a>
  );
}
