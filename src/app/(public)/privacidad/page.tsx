import type { Metadata } from "next";
import Link from "next/link";
import { ContactChannels } from "@/components/public/contact-channels";
import { LegalPage } from "@/components/public/legal-page";
import { getBusinessSettings } from "@/features/settings/queries";

export const metadata: Metadata = {
  title: "Aviso de privacidad",
  description:
    "Cómo 85 BARBERÍA trata los datos que compartes al reservar: qué datos, para qué, con quién y cómo ejercer tus derechos ARCO.",
  alternates: { canonical: "/privacidad" },
};

const UPDATED = "6 de noviembre de 2026";

export default async function PrivacyPage() {
  const settings = await getBusinessSettings();
  const name = settings.name;

  return (
    <LegalPage
      eyebrow="Legal"
      title="Aviso de privacidad"
      updated={UPDATED}
      intro={
        <p>
          En <strong>{name}</strong> cuidamos los datos que nos compartes. Este aviso explica qué datos recabamos al
          solicitar una cita en este sitio, para qué los usamos y cómo puedes ejercer tus derechos, conforme a la Ley
          Federal de Protección de Datos Personales en Posesión de los Particulares.
        </p>
      }
      sections={[
        {
          id: "responsable",
          title: "Responsable",
          body: (
            <>
              <p>
                <strong>{name}</strong> es responsable del tratamiento de tus datos personales. Puedes contactarnos por:
              </p>
              <ContactChannels settings={settings} />
            </>
          ),
        },
        {
          id: "datos",
          title: "Datos que recabamos",
          body: (
            <>
              <p>Al solicitar una cita te pedimos únicamente:</p>
              <ul>
                <li>Nombre.</li>
                <li>Teléfono celular (10 dígitos).</li>
                <li>Notas opcionales que quieras agregar a tu cita.</li>
              </ul>
              <p>
                También guardamos los datos de la cita (servicio, fecha, hora, precio y su estado). No pedimos datos
                sensibles, financieros ni de pago.
              </p>
            </>
          ),
        },
        {
          id: "finalidades",
          title: "Para qué los usamos",
          body: (
            <>
              <h3>Finalidades necesarias</h3>
              <ul>
                <li>Registrar y gestionar tu solicitud de cita.</li>
                <li>Confirmarla, reprogramarla o cancelarla contigo por WhatsApp o teléfono.</li>
                <li>Llevar el historial de citas de la barbería y evitar abusos del sistema de reservas.</li>
              </ul>
              <h3>Finalidades adicionales</h3>
              <p>Ninguna. No usamos tus datos para publicidad ni los vendemos.</p>
            </>
          ),
        },
        {
          id: "terceros",
          title: "Con quién los compartimos",
          body: (
            <>
              <p>
                No transferimos tus datos a terceros. Para operar el sitio usamos proveedores que los almacenan o procesan
                por cuenta nuestra y bajo nuestras instrucciones:
              </p>
              <ul>
                <li>
                  <strong>Supabase</strong>: base de datos donde se guardan las citas (puede alojarlos fuera de México).
                </li>
                <li>
                  <strong>Vercel</strong>: alojamiento del sitio.
                </li>
                <li>
                  <strong>WhatsApp (Meta)</strong>: solo si tú o la barbería inician una conversación por ese medio.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: "cookies",
          title: "Cookies y analítica",
          body: (
            <>
              <p>
                Usamos <strong>cookies técnicas</strong> necesarias para que el sitio funcione (por ejemplo, la sesión del
                panel de administración y recordar tu decisión sobre cookies). No requieren tu consentimiento.
              </p>
              <p>
                Si lo aceptas en el aviso de cookies, activamos <strong>analítica anónima</strong> (Vercel Web Analytics y,
                en su caso, Google Analytics con IP anonimizada) para saber qué páginas se visitan y mejorar el sitio. Puedes
                cambiar tu decisión cuando quieras desde «Preferencias de cookies», al pie de cada página.
              </p>
            </>
          ),
        },
        {
          id: "conservacion",
          title: "Cuánto tiempo los conservamos",
          body: (
            <p>
              Conservamos los datos de tus citas mientras sean necesarios para las finalidades descritas y para el
              historial de la barbería. Puedes pedir que los eliminemos en cualquier momento (ver «Tus derechos»).
            </p>
          ),
        },
        {
          id: "derechos",
          title: "Tus derechos (ARCO)",
          body: (
            <>
              <p>
                Puedes <strong>acceder</strong> a tus datos, <strong>rectificarlos</strong>, <strong>cancelarlos</strong>{" "}
                u <strong>oponerte</strong> a su uso, así como revocar tu consentimiento. Envíanos tu solicitud por
                cualquiera de los medios de la sección «Responsable», indicando tu nombre, el teléfono con el que
                reservaste y lo que necesitas. Te responderemos en un máximo de 20 días hábiles.
              </p>
            </>
          ),
        },
        {
          id: "seguridad",
          title: "Seguridad",
          body: (
            <p>
              Solo la administración de la barbería puede ver las citas, mediante una cuenta protegida. La conexión al
              sitio está cifrada (HTTPS) y la base de datos restringe el acceso por permisos.
            </p>
          ),
        },
        {
          id: "cambios",
          title: "Cambios a este aviso",
          body: (
            <p>
              Si actualizamos este aviso, publicaremos la nueva versión en esta página con su fecha. Consulta también los{" "}
              <Link href="/terminos">términos y condiciones</Link>.
            </p>
          ),
        },
      ]}
    />
  );
}
