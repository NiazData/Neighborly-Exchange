import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SITE_URL as BASE_URL } from '@/lib/siteUrl';

const SITE = 'Neighbourly Exchange';

export default function Seo({ title, description, path = '/', jsonLd, noindex = false }) {
  const fullTitle = title ? `${title} | ${SITE}` : `${SITE} — Exchange Skills with Your Neighbors`;
  const url = `${BASE_URL}${path}`;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <meta property="og:site_name" content={SITE} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary" />
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd).replace(/</g, '\\u003c')}
        </script>
      )}
    </Helmet>
  );
}
