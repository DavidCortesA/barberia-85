import { CookieBanner } from "@/components/public/cookie-banner";
import { IntroLoader } from "@/components/public/intro-loader";
import { MobileCta } from "@/components/public/mobile-cta";
import { SiteAnalytics } from "@/components/public/site-analytics";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { MotionProvider } from "@/components/shared/motion-provider";
import { siteConfig } from "@/config/site";
import { getSiteContent } from "@/features/content/queries";
import { getBusinessSettings } from "@/features/settings/queries";

// Las páginas públicas se regeneran cada minuto y al guardar cambios en el admin.
export const revalidate = 60;

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, content] = await Promise.all([getBusinessSettings(), getSiteContent()]);

  return (
    <MotionProvider>
      <IntroLoader />
      <a
        href="#contenido"
        className="bg-primary text-primary-foreground sr-only z-[60] rounded-[3px] px-4 py-2 text-sm font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Saltar al contenido
      </a>
      <SiteHeader nav={siteConfig.nav} ctaLabel={content["hero.cta_primary"]} />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <SiteFooter settings={settings} />
      <MobileCta label={content["hero.cta_primary"]} />
      <CookieBanner />
      <SiteAnalytics />
    </MotionProvider>
  );
}
