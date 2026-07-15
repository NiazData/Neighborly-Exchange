import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE = 'Neighbourly Exchange';
const BASE_URL = import.meta.env.VITE_SITE_URL || 'https://neighbourly-exchange.netlify.app';

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
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
