import type { SVGProps } from "react";

// lucide-react ya no incluye iconos de marcas: se dibujan aquí (trazos simples, currentColor).
type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export function InstagramIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14 8.5h2.5V5H14a3.5 3.5 0 0 0-3.5 3.5V11H8v3.5h2.5V21H14v-6.5h2.4l.6-3.5H14V8.8c0-.2.1-.3.3-.3z" />
    </svg>
  );
}

export function TikTokIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14 3v11.2a3.2 3.2 0 1 1-3.2-3.2" />
      <path d="M14 3c.3 2.3 1.8 3.8 4.5 4v3a7.3 7.3 0 0 1-4.5-1.6" />
    </svg>
  );
}

export function WhatsAppIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 20l1.3-4.2A8 8 0 1 1 8.4 18.8z" />
      <path d="M9 9c0 3 3 6 6 6l1-1.5-2-1-1 .8c-1-.5-1.8-1.3-2.3-2.3l.8-1-1-2z" />
    </svg>
  );
}
