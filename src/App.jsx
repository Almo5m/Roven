import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { T } from './lib/i18n.js';
import { loadProducts, loadSettings, loadTestimonials, loadCatalog } from './lib/data.js';
import { reveal } from './lib/reveal.js';
import { catsOf } from './lib/catalog.js';
import { buildMeta, route } from './lib/seo-core.js';
import { applySeo } from './lib/seo.js';
import { trackView } from './lib/track.js';
import { LangContext, navigate, usePath, useLinkClicks, stripLang, langOf, withLang } from './lib/router.js';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import Collection from './pages/Collection.jsx';
import Product from './pages/Product.jsx';
import Cart from './pages/Cart.jsx';
import Track from './pages/Track.jsx';
import Review from './pages/Review.jsx';
import NotFound from './pages/NotFound.jsx';
import { About, Sizes, Faq } from './pages/Info.jsx';
const Admin = lazy(() => import('./admin/Admin.jsx')); // loaded only on /admin

const DEFAULTS = { drop_date: '', faq: [], transfer_methods: [], shipping_fee: 60, free_shipping_over: 0, transfer_info: '', instagram: '', tiktok: '',
  announcement_en: '', announcement_ar: '', about_en: '', about_ar: '', size_chart: {}, lookbook: [] };
const pref = () => { try { return localStorage.getItem('roven-lang'); } catch { return null; } };

export default function App() {
  const path = usePath(), lang = langOf(path), rest = stripLang(path), r = route(rest), t = T[lang];
  const [products, setProducts] = useState([]), [cart, setCart] = useState(() => { try { const c = JSON.parse(localStorage.getItem('roven-cart') || '[]'); return Array.isArray(c) ? c.filter(l => l && typeof l.id === 'string' && typeof l.size === 'string').slice(0, 20) : []; } catch { return []; } }), [settings, setSettings] = useState(DEFAULTS), [testimonials, setTestimonials] = useState([]);
  const [catalog, setCatalog] = useState({ categories: [], collections: [] }), [ready, setReady] = useState(false);
  useLinkClicks();

  useEffect(() => {
    Promise.all([loadProducts(), loadCatalog()]).then(([p, c]) => { setProducts(p); setCatalog(c); setReady(true); });
    loadSettings().then(s => setSettings({ ...DEFAULTS, ...s })); loadTestimonials().then(setTestimonials);
    // old #/ links keep working, and a saved Arabic choice sends visitors to the Arabic pages
    if (location.hash.startsWith('#/')) return navigate(location.hash.slice(1), { replace: true });
    const wantsAr = pref() === 'ar' || (!pref() && navigator.language?.toLowerCase().startsWith('ar'));
    if (wantsAr && langOf(location.pathname) === 'en' && !location.pathname.startsWith('/admin')) navigate(withLang(stripLang(location.pathname), 'ar') + location.search, { replace: true });
  }, []);
  useEffect(() => { document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; }, [lang]);
  useEffect(() => { reveal(); });
  useEffect(() => { try { localStorage.setItem('roven-cart', JSON.stringify(cart)); } catch { /* blocked storage is fine */ } }, [cart]);
  useEffect(() => { trackView(rest, lang, r.page); }, [path]);
  useEffect(() => {
    const ok = u => typeof u === 'string' && u.startsWith('https://');
    applySeo(buildMeta({ site: __SITE_URL__, lang, rest, data: { loaded: ready, faq: settings.faq, social: [settings.instagram, settings.tiktok].filter(ok),
      product: r.page === 'p' ? products.find(x => String(x.id) === r.id) : undefined,
      category: r.page === 'shop' && r.id ? catsOf(catalog, products).find(c => c.slug === r.id) : undefined,
      collection: r.page === 'collection' ? catalog.collections.find(c => c.slug === r.id) : undefined } }));
  }, [path, products, catalog, settings, ready]);

  const switchLang = () => { const next = lang === 'en' ? 'ar' : 'en'; try { localStorage.setItem('roven-lang', next); } catch { /* blocked storage is fine */ } navigate(withLang(rest, next) + location.search); };
  const add = useCallback(line => setCart(c => [...c, line]), []);
  const ctx = { t, lang, products, cart, setCart, add, settings, testimonials, catalog };

  if (r.page === 'admin') return <Suspense fallback={null}><Admin /></Suspense>;
  const view = { home: <Home {...ctx} />, shop: <Shop {...ctx} cat={r.id} />, p: <Product {...ctx} id={r.id} />, collection: <Collection {...ctx} id={r.id} />, cart: <Cart {...ctx} />,
    track: <Track {...ctx} />, review: <Review {...ctx} id={r.id} />, about: <About {...ctx} />, sizes: <Sizes {...ctx} />, faq: <Faq {...ctx} />, notfound: <NotFound t={t} /> }[r.page];
  return (<LangContext.Provider value={lang}>
    <div className="ambient" aria-hidden="true" />
    <Header t={t} lang={lang} onSwitch={switchLang} count={cart.length} settings={settings} path={path} />
    <main>{view}</main>
    <Footer t={t} lang={lang} products={products} catalog={catalog} settings={settings} />
  </LangContext.Provider>);
}
