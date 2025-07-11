import Script from 'next/script'

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-MVDNCWGV'
const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID || 'G-PC5CJTZ95B'

export function GoogleTagManager() {
  return (
    <>
      {/* Google Tag Manager Script */}
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);
j.async=true;j.src="https://xtnpqrnt.eue.stape.net/8m4gzxtnpqrnt.js?"+i;
f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','bqeb4=aWQ9R1RNLU1WRE5DV0dW&sort=asc');
`,
        }}
      />
    </>
  )
}

export function GoogleAnalytics() {
  return (
    <>
      {/* Google Analytics 4 Script */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="ga4-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA4_ID}');
          `,
        }}
      />
    </>
  )
}

export function GoogleTagManagerNoscript() {
  return (
    <noscript>
      <iframe
        src={`https://xtnpqrnt.eue.stape.net/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  )
}