import { writeFileSync } from 'node:fs';
import { ROUTES, BASE_URL } from './routes.mjs';

const today = new Date().toISOString().slice(0, 10);
const urls = ROUTES.map(([path]) =>
  `  <url><loc>${BASE_URL}${path}</loc><lastmod>${today}</lastmod></url>`).join('\n');
writeFileSync('dist/sitemap.xml',
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`);
console.log(`sitemap.xml written with ${ROUTES.length} routes`);
