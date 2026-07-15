// Public, prerenderable routes: [path, title, description]
export const ROUTES = [
  ['/', 'Neighbourly Exchange — Exchange Skills with Your Neighbors',
   'Neighbourly Exchange connects you with neighbors to swap skills, services, and favors — no money needed. Verified members, tracked exchanges, honest reviews.'],
  ['/Explore', 'Explore Skills | Neighbourly Exchange',
   'Browse skills your neighbors on Neighbourly Exchange are offering and requesting — home repairs, tutoring, gardening, cooking, and more.'],
  ['/Terms', 'Terms of Service | Neighbourly Exchange',
   'The terms that govern using Neighbourly Exchange.'],
  ['/Privacy', 'Privacy Policy | Neighbourly Exchange',
   'How Neighbourly Exchange collects, uses, and protects your data.'],
  ['/Legal', 'Legal Notice | Neighbourly Exchange',
   'Legal information about the Neighbourly Exchange platform.'],
];
// Set VITE_SITE_URL in Netlify env to keep client and prerender URLs in lockstep on a custom domain.
export const BASE_URL = process.env.VITE_SITE_URL || process.env.URL || 'https://neighbourly-exchange.netlify.app';
