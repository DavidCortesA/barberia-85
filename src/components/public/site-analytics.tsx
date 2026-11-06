"use client";

import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { publicEnv } from "@/config/env";
import { useConsent } from "./consent";

/**
 * Analítica, solo con consentimiento:
 *  · Vercel Web Analytics (sin cookies; se activa en el panel de Vercel).
 *  · Google Analytics 4 si se define NEXT_PUBLIC_GA_ID (IP anonimizada).
 */
export function SiteAnalytics() {
  const consent = useConsent();
  if (consent !== "granted") return null;

  const gaId = publicEnv.NEXT_PUBLIC_GA_ID;
  return (
    <>
      <Analytics />
      {gaId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`}
          </Script>
        </>
      )}
    </>
  );
}
