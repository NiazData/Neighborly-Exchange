import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { ROUTES, BASE_URL } from './routes.mjs';

const template = readFileSync('dist/index.html', 'utf8');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

for (const [route, title, description] of ROUTES) {
  const html = template
    .replace(/<title>.*?<\/title>/s, `<title>${esc(title)}</title>`)
    .replace('</head>', [
      `<meta name="description" content="${esc(description)}">`,
      `<link rel="canonical" href="${BASE_URL}${route}">`,
      `<meta property="og:title" content="${esc(title)}">`,
      `<meta property="og:description" content="${esc(description)}">`,
      `<meta property="og:url" content="${BASE_URL}${route}">`,
      '</head>',
    ].join('\n'));
  const dir = route === '/' ? 'dist' : path.join('dist', route.slice(1));
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'index.html'), html);
  console.log(`prerendered meta for ${route}`);
}
