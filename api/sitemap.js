/* sitemap.xml built from the live catalog, so new products appear without a redeploy. Both languages, with hreflang links. */
import { withLang } from '../src/lib/seo-core.js';
import { db, siteOf } from './_shared.js';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

export default async function handler(req, res) {
  const site = siteOf(req);
  const [products, cats, cols] = await Promise.all([db('products?active=eq.true&select=id'), db('categories?active=eq.true&select=slug'), db('collections?active=eq.true&select=slug')]);
  const paths = ['/', '/shop', '/about', '/sizes', '/faq', ...cats.map(c => `/shop/${c.slug}`), ...cols.map(c => `/collection/${c.slug}`), ...products.map(p => `/p/${p.id}`)];
  const links = p => [['en', p], ['ar', withLang(p, 'ar')], ['x-default', p]].map(([l, x]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${esc(site + x)}"/>`).join('');
  const urls = paths.flatMap(p => [p, withLang(p, 'ar')]).map(u => { const rest = u.replace(/^\/ar(?=\/|$)/, '') || '/'; return `<url><loc>${esc(site + u)}</loc>${links(rest)}</url>`; });
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>`);
}
