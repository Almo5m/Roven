import { siteOf } from './_shared.js';
export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600');
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /review/\nDisallow: /ar/review/\n\nSitemap: ${siteOf(req)}/sitemap.xml\n`);
}
