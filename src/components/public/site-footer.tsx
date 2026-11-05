import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { FacebookIcon, InstagramIcon, TikTokIcon } from "@/components/shared/social-icons";
import { siteConfig } from "@/config/site";
import { formatPhoneDisplay, socialUrl } from "@/lib/links";
import type { BusinessSettings } from "@/types";

export function SiteFooter({ settings }: { settings: BusinessSettings }) {
  const socials = [
    { label: "Instagram", href: socialUrl("instagram", settings.instagram), Icon: InstagramIcon },
    { label: "Facebook", href: socialUrl("facebook", settings.facebook), Icon: FacebookIcon },
    { label: "TikTok", href: socialUrl("tiktok", settings.tiktok), Icon: TikTokIcon },
  ].filter((s): s is typeof s & { href: string } => Boolean(s.href));

  return (
    <footer className="border-border bg-ink-900 border-t">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-14 md:grid-cols-3">
        <div className="space-y-4">
          <Logo height={48} />
          <p className="text-muted-foreground max-w-xs text-sm">{settings.name}</p>
        </div>

        <nav aria-label="Pie de página">
          <p className="label-brand mb-4">Navegación</p>
          <ul className="space-y-2 text-sm">
            {[...siteConfig.nav, { label: "Reservar cita", href: "/reservar" }].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-muted-foreground hover:text-foreground transition-colors">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="label-brand mb-4">Contacto</p>
          <ul className="text-muted-foreground space-y-2 text-sm">
            {settings.address && (
              <li>
                {settings.address}
                {settings.city ? `, ${settings.city}` : ""}
              </li>
            )}
            {settings.phone && (
              <li>
                <a href={`tel:+52${settings.phone.replace(/\D/g, "")}`} className="hover:text-foreground transition-colors">
                  {formatPhoneDisplay(settings.phone)}
                </a>
              </li>
            )}
            {!settings.address && !settings.phone && <li>Datos de contacto próximamente.</li>}
          </ul>
          {socials.length > 0 && (
            <ul className="mt-5 flex gap-4">
              {socials.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${label} (se abre en una pestaña nueva)`}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Icon />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="border-border text-muted-foreground border-t px-5 py-5 text-center text-xs">
        © {new Date().getFullYear()} {settings.name}. Todos los derechos reservados.
      </div>
    </footer>
  );
}
