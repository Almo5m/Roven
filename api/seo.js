/* Serves index.html with the right title, description, social preview and structured data for the requested page,
   so Google, WhatsApp and Facebook see them without running JavaScript. The app then takes over in the browser. */
import { buildMeta, headHtml, stripLang, langOf, route } from '../src/lib/seo-core.js';
import { db, origin, siteOf, ID } from './_shared.js';

export default async function handler(req, res) {
  const pathname = ('/' + String(req.query.path || '').replace(/^\/+/, '')).slice(0, 200);
  const lang = langOf(pathname), rest = stripLang(pathname), r = route(rest), data = { loaded: true };
  const ok = u => typeof u === 'string' && u.startsWith('https://');

  if (r.page === 'p' && ID.test(r.id))
    data.product = (await db(`products?id=eq.${r.id}&active=eq.true&select=id,name_en,name_ar,description_en,description_ar,price,images,sizes,stock&limit=1`))[0];
  if (r.page === 'collection' && ID.test(r.id))
    data.collection = (await db(`collections?slug=eq.${r.id}&active=eq.true&select=slug,name_en,name_ar,description_en,description_ar,image&limit=1`))[0];
  if (r.page === 'shop' && r.id && ID.test(r.id)) {
    data.category = (await db(`categories?slug=eq.${r.id}&active=eq.true&select=slug,name_en,name_ar,image&limit=1`))[0];
    if (!data.category && (await db(`products?category=eq.${r.id}&active=eq.true&select=id&limit=1`)).length) data.category = { slug: r.id, name_en: r.id, name_ar: r.id };
  }
  if (r.page === 'home') data.social = (await db('settings?key=in.(instagram,tiktok)&select=value')).map(x => x.value).filter(ok);
  if (r.page === 'faq') data.faq = (await db('settings?key=eq.faq&select=value'))[0]?.value || [];

  const meta = buildMeta({ site: siteOf(req), lang, rest, data });
  let html;
  try { html = await (await fetch(`${origin(req)}/index.html`)).text(); } catch { return res.status(500).send('Temporarily unavailable'); }
  const block = `<!--SEO-->\n${headHtml(meta, { verification: process.env.VITE_GOOGLE_VERIFICATION })}\n<!--/SEO-->`;
  html = /<!--SEO-->[\s\S]*?<!--\/SEO-->/.test(html) ? html.replace(/<!--SEO-->[\s\S]*?<!--\/SEO-->/, () => block) : html.replace('</head>', () => block + '</head>');
  html = html.replace(/<html[^>]*>/, `<html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">`);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
  res.status(meta.status).send(html);
}
