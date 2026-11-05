import { Clock, MapPin, Phone } from "lucide-react";
import type { ReactNode } from "react";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { FacebookIcon, InstagramIcon, TikTokIcon } from "@/components/shared/social-icons";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import type { SiteContent } from "@/features/content/registry";
import { summarizeWeeklyHours } from "@/features/schedule/format";
import { formatPhoneDisplay, mapsUrl, socialUrl } from "@/lib/links";
import type { BusinessHour, BusinessSettings } from "@/types";

function InfoCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="border-border bg-ink-900 h-full rounded-[4px] border p-6">
      <div className="text-primary mb-4 [&_svg]:size-6">{icon}</div>
      <h3 className="font-display mb-3 text-2xl font-bold">{title}</h3>
      <div className="text-muted-foreground space-y-2 text-sm">{children}</div>
    </div>
  );
}

type ContactBlockProps = {
  content: SiteContent;
  settings: BusinessSettings;
  hours: BusinessHour[];
  /** En la home el encabezado es h2; en /contacto es el h1 de la página. */
  headingAs?: "h1" | "h2";
};

export function ContactBlock({ content, settings, hours, headingAs = "h2" }: ContactBlockProps) {
  const maps = mapsUrl(settings);
  const lines = summarizeWeeklyHours(hours);
  const socials = [
    { label: "Instagram", href: socialUrl("instagram", settings.instagram), Icon: InstagramIcon },
    { label: "Facebook", href: socialUrl("facebook", settings.facebook), Icon: FacebookIcon },
    { label: "TikTok", href: socialUrl("tiktok", settings.tiktok), Icon: TikTokIcon },
  ].filter((s): s is typeof s & { href: string } => Boolean(s.href));

  return (
    <section id="contacto" className="mx-auto max-w-[1200px] px-5 py-24 md:py-32">
      <SectionHeading
        as={headingAs}
        eyebrow={content["contact.eyebrow"]}
        title={content["contact.title"]}
        subtitle={content["contact.subtitle"]}
      />

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        <Reveal className="h-full">
          <InfoCard icon={<MapPin aria-hidden />} title="Ubicación">
            {settings.address ? (
              <>
                <p className="text-foreground">
                  {settings.address}
                  {settings.city ? `, ${settings.city}` : ""}
                </p>
                {maps && (
                  <a
                    href={maps}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary inline-block underline-offset-4 hover:underline"
                  >
                    Ver en Google Maps<span className="sr-only"> (se abre en una pestaña nueva)</span>
                  </a>
                )}
              </>
            ) : (
              <p>Dirección próximamente.</p>
            )}
          </InfoCard>
        </Reveal>

        <Reveal delay={0.08} className="h-full">
          <InfoCard icon={<Clock aria-hidden />} title="Horarios">
            {hours.length > 0 ? (
              <dl className="space-y-1.5">
                {lines.map((line) => (
                  <div key={line.label} className="flex justify-between gap-4">
                    <dt>{line.label}</dt>
                    <dd className="text-foreground text-right">{line.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p>Consulta nuestro horario por WhatsApp.</p>
            )}
          </InfoCard>
        </Reveal>

        <Reveal delay={0.16} className="h-full">
          <InfoCard icon={<Phone aria-hidden />} title="Escríbenos">
            {settings.phone && (
              <p>
                <a
                  href={`tel:+52${settings.phone.replace(/\D/g, "")}`}
                  className="text-foreground hover:text-primary transition-colors"
                >
                  {formatPhoneDisplay(settings.phone)}
                </a>
              </p>
            )}
            {settings.whatsapp ? (
              <WhatsAppButton
                phone={settings.whatsapp}
                message="Hola, quisiera información sobre 85 BARBERÍA."
                size="sm"
                className="mt-1"
              />
            ) : (
              !settings.phone && <p>Datos de contacto próximamente.</p>
            )}
            {socials.length > 0 && (
              <ul className="flex gap-4 pt-3">
                {socials.map(({ label, href, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${label} (se abre en una pestaña nueva)`}
                      className="hover:text-primary transition-colors"
                    >
                      <Icon />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </InfoCard>
        </Reveal>
      </div>
    </section>
  );
}
