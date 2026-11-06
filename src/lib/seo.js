/* Applies the same tags in the browser when the visitor moves between pages. The server already sent the right tags for the first page. */
const el = (sel, make) => { let e = document.head.querySelector(sel); if (!e) { e = make(); document.head.appendChild(e); } return e; };
const meta = (attr, key, content) => el(`meta[${attr}="${key}"]`, () => { const m = document.createElement('meta'); m.setAttribute(attr, key); return m; }).setAttribute('content', content);

export function applySeo(m) {
  const loc = m.lang === 'ar' ? ['ar_EG', 'en_US'] : ['en_US', 'ar_EG'];
  document.title = m.title;
  meta('name', 'description', m.description);
  meta('name', 'robots', m.noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large');
  el('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' })).setAttribute('href', m.canonical);
  document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach(n => n.remove());
  m.alternates.forEach(([l, h]) => { const n = document.createElement('link'); n.rel = 'alternate'; n.hreflang = l; n.href = h; document.head.appendChild(n); });
  [['type', m.type], ['site_name', 'ROVEN'], ['title', m.title], ['description', m.description], ['url', m.canonical], ['image', m.image], ['image:alt', m.imageAlt], ['locale', loc[0]], ['locale:alternate', loc[1]]]
    .forEach(([k, v]) => meta('property', 'og:' + k, v));
  [['image:width', m.imageSize?.[0]], ['image:height', m.imageSize?.[1]]].forEach(([k, v]) => {
    const n = document.head.querySelector(`meta[property="og:${k}"]`); if (v) meta('property', 'og:' + k, String(v)); else n?.remove(); });
  meta('name', 'twitter:card', 'summary_large_image'); meta('name', 'twitter:title', m.title); meta('name', 'twitter:description', m.description); meta('name', 'twitter:image', m.image);
  const ld = document.getElementById('seo-jsonld');
  if (!m.ld.length) return ld?.remove();
  const s = ld || Object.assign(document.createElement('script'), { type: 'application/ld+json', id: 'seo-jsonld' });
  s.textContent = JSON.stringify(m.ld.length === 1 ? m.ld[0] : m.ld).replace(/</g, '\\u003c'); if (!ld) document.head.appendChild(s);
}
