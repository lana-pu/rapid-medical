import Script from "next/script";

/**
 * Third-party tags found on the Duda site. All keys are editable in
 * Site settings → Integrations; leaving one empty disables it.
 */
export function Integrations({ gaMeasurementId, userwayAccount }: { gaMeasurementId?: string; userwayAccount?: string }) {
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
