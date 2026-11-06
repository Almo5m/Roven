/* One source of truth for page titles, descriptions, social previews and structured data.
   Used by the browser (src/lib/seo.js), by the Vercel functions in /api, and by vite.config.js. Plain JS, no imports. */
export const OG_PATH = '/og-image.jpg';

export const stripLang = p => { const s = String(p || '/').replace(/^\/ar(?=\/|$)/, '').replace(/\/+$/, ''); return s || '/'; };
export const langOf = p => (/^\/ar(\/|$)/.test(p) ? 'ar' : 'en');
export const withLang = (rest, lang) => (lang === 'ar' ? '/ar' + (rest === '/' ? '' : rest) : rest);

export function route(rest) {
  const [page, id] = String(rest).split('/').filter(Boolean);
  if (!page) return { page: 'home' };
  if (['about', 'sizes', 'faq', 'track', 'cart', 'admin'].includes(page) && !id) return { page };
  if (page === 'shop') return { page, id };
  if (['p', 'collection', 'review'].includes(page) && id) return { page, id };
  return { page: 'notfound' };
}

const PAGES = {
  en: {
    homeName: 'Home', shopName: 'Shop', ogAlt: 'ROVEN streetwear. Your difference. Your power.',
    home: { t: 'ROVEN | Streetwear — Your Difference. Your Power.', d: 'ROVEN is streetwear for people who move on their own terms. Shop hoodies, sweatpants and sweatshirts. Pay on delivery or by transfer.' },
    shop: { t: 'Shop | ROVEN Streetwear', d: 'Browse the full ROVEN streetwear collection: hoodies, sweatpants, sweatshirts and more.' },
    about: { t: 'About ROVEN', d: 'The story behind ROVEN streetwear. Your difference is your power.' },
    sizes: { t: 'Size guide | ROVEN', d: 'Find your size with the ROVEN size guide.' },
    faq: { t: 'FAQ | ROVEN', d: 'Answers to common questions about ordering, payment and shipping at ROVEN.' },
    track: { t: 'Track your order | ROVEN', d: 'Track your ROVEN order.', noindex: true },
    cart: { t: 'Cart | ROVEN', d: 'Your ROVEN cart.', noindex: true },
    review: { t: 'Rate your order | ROVEN', d: 'Rate your ROVEN order.', noindex: true },
    admin: { t: 'Dashboard | ROVEN', d: 'ROVEN dashboard.', noindex: true },
    notfound: { t: 'Page not found | ROVEN', d: 'This page does not exist.', noindex: true },
    cat: n => `Shop ${n} from ROVEN streetwear.`, col: n => `Explore the ${n} collection by ROVEN.`, prod: n => `${n} by ROVEN streetwear. Pay on delivery or by transfer.`,
  },
  ar: {
    homeName: 'الرئيسية', shopName: 'المتجر', ogAlt: 'ROVEN ستريت وير. اختلافك. قوّتك.',
    home: { t: 'ROVEN | ستريت وير — اختلافك. قوّتك.', d: 'ROVEN ستريت وير للناس اللي بتمشي بطريقتها. تسوّق هوديز وسويت بانتس وسويت شيرتس. الدفع كاش عند الاستلام أو بالتحويل.' },
    shop: { t: 'المتجر | ROVEN ستريت وير', d: 'تصفّح كل تشكيلة ROVEN: هوديز وسويت بانتس وسويت شيرتس وأكتر.' },
    about: { t: 'عن ROVEN', d: 'حكاية براند ROVEN ستريت وير. اختلافك هو قوتك.' },
    sizes: { t: 'جدول المقاسات | ROVEN', d: 'اعرف مقاسك من جدول مقاسات ROVEN.' },
    faq: { t: 'الأسئلة الشائعة | ROVEN', d: 'إجابات الأسئلة الشائعة عن الطلب والدفع والشحن في ROVEN.' },
    track: { t: 'تتبع الطلب | ROVEN', d: 'تابع طلبك من ROVEN.', noindex: true },
    cart: { t: 'السلة | ROVEN', d: 'سلة ROVEN.', noindex: true },
    review: { t: 'قيّم طلبك | ROVEN', d: 'قيّم طلبك من ROVEN.', noindex: true },
    admin: { t: 'لوحة التحكم | ROVEN', d: 'لوحة تحكم ROVEN.', noindex: true },
    notfound: { t: 'الصفحة غير موجودة | ROVEN', d: 'هذه الصفحة غير موجودة.', noindex: true },
    cat: n => `تسوّق ${n} من ROVEN ستريت وير.`, col: n => `اكتشف كوليكشن ${n} من ROVEN.`, prod: n => `${n} من ROVEN ستريت وير. الدفع كاش عند الاستلام أو بالتحويل.`,
  },
};

const clip = (s, n = 160) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };
const isCloud = u => String(u).includes('res.cloudinary.com');
const ogImage = u => (isCloud(u) ? String(u).replace('/upload/', '/upload/f_jpg,q_auto,w_1200,h_630,c_fill/') : u);

/* data: { loaded, product, category, collection, faq, social }. Before the data has loaded, unknown pages are not marked as missing. */
export function buildMeta({ site, lang, rest, data = {} }) {
  const r = route(rest), P = PAGES[lang], other = lang === 'ar' ? 'en' : 'ar', loaded = !!data.loaded, url = p => site + p;
  const nm = o => o['name_' + lang] || o['name_' + other] || '';
  const m = { lang, title: P.home.t, description: P.home.d, image: url(OG_PATH), imageSize: [1200, 628], imageAlt: P.ogAlt, type: 'website', noindex: false, status: 200, ld: [],
    canonical: url(withLang(rest, lang)), alternates: [['en', url(rest)], ['ar', url(withLang(rest, 'ar'))], ['x-default', url(rest)]] };
  const page = P[r.page] || P.notfound, crumbs = [[P.homeName, url(withLang('/', lang))]];
  const set = (t, d) => { m.title = t; m.description = clip(d); };
  const missing = () => { if (loaded) { m.noindex = true; m.status = 404; } };
  const pic = u => { if (u) { m.image = ogImage(u); m.imageSize = isCloud(u) ? [1200, 630] : null; } };

  switch (r.page) {
    case 'home':
      set(page.t, page.d);
      m.ld.push({ '@context': 'https://schema.org', '@type': 'Organization', name: 'ROVEN', url: site, logo: url('/icon-512.png'), sameAs: data.social || [] },
        { '@context': 'https://schema.org', '@type': 'WebSite', name: 'ROVEN', url: site, inLanguage: ['en', 'ar'] });
      break;
    case 'shop':
      crumbs.push([P.shopName, url(withLang('/shop', lang))]);
      if (!r.id) { set(P.shop.t, P.shop.d); break; }
      if (!data.category) { set(P.shop.t, P.shop.d); missing(); break; }
      { const n = nm(data.category); set(`${n} | ROVEN`, P.cat(n)); pic(data.category.image); crumbs.push([n, m.canonical]); }
      break;
    case 'collection':
      if (!data.collection) { set(P.shop.t, P.shop.d); missing(); break; }
      { const c = data.collection, n = nm(c); set(`${n} | ROVEN`, c['description_' + lang] || c['description_' + other] || P.col(n)); pic(c.image); crumbs.push([n, m.canonical]); }
      break;
    case 'p':
      crumbs.push([P.shopName, url(withLang('/shop', lang))]);
      if (!data.product) { set(P.shop.t, P.shop.d); missing(); break; }
      { const p = data.product, n = nm(p), imgs = (p.images || []).slice(0, 4);
        set(`${n} | ROVEN`, p['description_' + lang] || p['description_' + other] || P.prod(n)); pic(imgs[0]); m.type = 'product'; crumbs.push([n, m.canonical]);
        const inStock = !p.stock || Object.values(p.stock).some(v => v > 0);
        m.ld.push({ '@context': 'https://schema.org', '@type': 'Product', name: n, sku: p.id, brand: { '@type': 'Brand', name: 'ROVEN' },
          description: clip(p['description_' + lang] || p['description_' + other] || P.prod(n), 300), image: imgs.length ? imgs.map(ogImage) : [url(OG_PATH)],
          ...(p.price > 0 ? { offers: { '@type': 'Offer', url: m.canonical, priceCurrency: 'EGP', price: String(p.price), itemCondition: 'https://schema.org/NewCondition',
            availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' } } : {}) }); }
      break;
    case 'faq': {
      set(page.t, page.d);
      const qa = (data.faq || []).map(x => [x['q_' + lang] || x['q_' + other], x['a_' + lang] || x['a_' + other]]).filter(x => x[0] && x[1]);
      if (qa.length) m.ld.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: qa.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
      break; }
    case 'notfound': set(page.t, page.d); m.status = 404; break;
    default: set(page.t, page.d);
  }
  if (['track', 'cart', 'review', 'admin', 'notfound'].includes(r.page)) m.noindex = true;
  if (crumbs.length > 1) m.ld.push({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) });
  return m;
}

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function headHtml(m, o = {}) {
  const loc = m.lang === 'ar' ? ['ar_EG', 'en_US'] : ['en_US', 'ar_EG'];
  const tags = [`<title>${esc(m.title)}</title>`, `<meta name="description" content="${esc(m.description)}">`,
    `<meta name="robots" content="${m.noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large'}">`, `<link rel="canonical" href="${esc(m.canonical)}">`,
    ...m.alternates.map(([l, h]) => `<link rel="alternate" hreflang="${l}" href="${esc(h)}">`),
    `<meta property="og:type" content="${m.type}">`, '<meta property="og:site_name" content="ROVEN">', `<meta property="og:title" content="${esc(m.title)}">`,
    `<meta property="og:description" content="${esc(m.description)}">`, `<meta property="og:url" content="${esc(m.canonical)}">`, `<meta property="og:image" content="${esc(m.image)}">`,
    ...(m.imageSize ? [`<meta property="og:image:width" content="${m.imageSize[0]}">`, `<meta property="og:image:height" content="${m.imageSize[1]}">`] : []),
    `<meta property="og:image:alt" content="${esc(m.imageAlt)}">`, `<meta property="og:locale" content="${loc[0]}">`, `<meta property="og:locale:alternate" content="${loc[1]}">`,
    '<meta name="twitter:card" content="summary_large_image">', `<meta name="twitter:title" content="${esc(m.title)}">`, `<meta name="twitter:description" content="${esc(m.description)}">`,
    `<meta name="twitter:image" content="${esc(m.image)}">`];
  if (o.verification) tags.push(`<meta name="google-site-verification" content="${esc(o.verification)}">`);
  if (m.ld.length) tags.push(`<script type="application/ld+json" id="seo-jsonld">${JSON.stringify(m.ld.length === 1 ? m.ld[0] : m.ld).replace(/</g, '\\u003c')}</script>`);
  return tags.join('\n');
}
