import type { Metadata } from "next";
import Link from "next/link";
import { ContactChannels } from "@/components/public/contact-channels";
import { LegalPage } from "@/components/public/legal-page";
import { getBusinessSettings } from "@/features/settings/queries";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Condiciones de uso del sitio y de la reserva de citas en línea de 85 BARBERÍA.",
  alternates: { canonical: "/terminos" },
};

const UPDATED = "6 de noviembre de 2026";

export default async function TermsPage() {
  const settings = await getBusinessSettings();
  const name = settings.name;

  return (
    <LegalPage
      eyebrow="Legal"
      title="Términos y condiciones"
      updated={UPDATED}
      intro={
        <p>
          Estos términos regulan el uso de este sitio y del sistema de reservas de <strong>{name}</strong>. Al solicitar
          una cita aceptas estas condiciones y el <Link href="/privacidad">aviso de privacidad</Link>.
        </p>
      }
      sections={[
        {
          id: "reservas",
          title: "Solicitudes de cita",
          body: (
            <>
              <p>
                Lo que envías desde el sitio es una <strong>solicitud</strong>: la cita queda confirmada solo cuando la
                barbería te lo confirma por WhatsApp o teléfono. Mientras tanto, el horario se aparta de forma temporal.
              </p>
              <p>
                La barbería puede rechazar una solicitud si el horario ya no está disponible o si los datos no permiten
                contactarte. Para evitar abusos, hay un límite de solicitudes pendientes por teléfono.
              </p>
            </>
          ),
        },
        {
          id: "precios",
          title: "Precios y servicios",
          body: (
            <p>
              Los precios y duraciones publicados son informativos y pueden cambiar. El precio que ves al solicitar queda
              registrado con tu cita. El pago se realiza en la barbería; este sitio no cobra ni guarda datos de pago.
            </p>
          ),
        },
        {
          id: "cambios-cita",
          title: "Cambios y cancelaciones",
          body: (
            <p>
              Si no puedes asistir o necesitas cambiar tu horario, avísanos lo antes posible por los medios de contacto
              para liberar el lugar a otra persona. Te pedimos llegar unos minutos antes de tu hora.
            </p>
          ),
        },
        {
          id: "uso",
          title: "Uso del sitio",
          body: (
            <p>
              Te comprometes a proporcionar datos verdaderos y a no usar el sistema de reservas para enviar solicitudes
              falsas, automatizadas o masivas. Podemos bloquear el uso del sitio a quien lo haga.
            </p>
          ),
        },
        {
          id: "propiedad",
          title: "Propiedad intelectual",
          body: (
            <p>
              El nombre, el logotipo, los textos, las fotografías y el diseño de este sitio pertenecen a {name} o a sus
              autores, y no pueden usarse sin autorización.
            </p>
          ),
        },
        {
          id: "responsabilidad",
          title: "Disponibilidad del sitio",
          body: (
            <p>
              Procuramos que el sitio funcione en todo momento, pero puede haber interrupciones por mantenimiento o
              causas ajenas. Si no puedes reservar en línea, contáctanos directamente.
            </p>
          ),
        },
        {
          id: "ley",
          title: "Legislación aplicable",
          body: <p>Estos términos se rigen por las leyes de los Estados Unidos Mexicanos.</p>,
        },
        {
          id: "contacto",
          title: "Contacto",
          body: <ContactChannels settings={settings} />,
        },
      ]}
    />
  );
}
