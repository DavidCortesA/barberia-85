import type { Metadata } from "next";
import { ContactBlock } from "@/components/public/contact-block";
import { getSiteContent } from "@/features/content/queries";
import { getBusinessHours, getBusinessSettings } from "@/features/settings/queries";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  return {
    title: content["contact.title"],
    description: content["contact.subtitle"],
    alternates: { canonical: "/contacto" },
  };
}

export default async function ContactPage() {
  const [content, settings, hours] = await Promise.all([
    getSiteContent(),
    getBusinessSettings(),
    getBusinessHours(),
  ]);

  return (
    <div className="pt-20">
      <ContactBlock content={content} settings={settings} hours={hours} headingAs="h1" />
    </div>
  );
}
