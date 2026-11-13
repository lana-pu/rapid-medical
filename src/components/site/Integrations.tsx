import Script from "next/script";

/**
 * Third-party tags found on the Duda site. All keys are editable in
 * Site settings → Integrations; leaving one empty disables it.
 */
export function Integrations({ gaMeasurementId: ga, userwayAccount: uw }: { gaMeasurementId?: string; userwayAccount?: string }) {
  // they go into scripts on every page: only values of the providers' own format (security check 2026-11-13)
  const gaMeasurementId = ga && /^G-[A-Z0-9]{4,20}$/.test(ga.trim()) ? ga.trim() : undefined;
  const userwayAccount = uw && /^[A-Za-z0-9]{4,40}$/.test(uw.trim()) ? uw.trim() : undefined;
  return (
    <>
      {gaMeasurementId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaMeasurementId}',{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {userwayAccount && <Script src={`https://cdn.userway.org/widget.js?account=${userwayAccount}`} strategy="lazyOnload" />}
    </>
  );
}
