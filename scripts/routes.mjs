// Public, prerenderable routes: [path, title, description]
export const ROUTES = [
  ['/', 'Neighbourly Exchange — Exchange Skills with Your Neighbors',
   'Connect with neighbors to share skills, services, and favors. No money needed — just skills and kindness.'],
  ['/Explore', 'Explore Skills | Neighbourly Exchange',
   'Browse skills your neighbors are offering and requesting on Neighbourly Exchange.'],
  ['/Terms', 'Terms of Service | Neighbourly Exchange',
   'The terms that govern using Neighbourly Exchange.'],
  ['/Privacy', 'Privacy Policy | Neighbourly Exchange',
   'How Neighbourly Exchange collects, uses, and protects your data.'],
  ['/Legal', 'Legal Notice | Neighbourly Exchange',
   'Legal information about the Neighbourly Exchange platform.'],
];
export const BASE_URL = process.env.URL || 'https://neighbourly-exchange.netlify.app';
