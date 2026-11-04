import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { T } from './lib/i18n.js';
import { loadProducts, loadSettings, loadTestimonials, loadCatalog } from './lib/data.js';
import { reveal } from './lib/reveal.js';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import Collection from './pages/Collection.jsx';
import Product from './pages/Product.jsx';
import Cart from './pages/Cart.jsx';
import Track from './pages/Track.jsx';
import { About, Sizes, Faq } from './pages/Info.jsx';
const Admin = lazy(() => import('./admin/Admin.jsx')); // loaded only on #/admin

const DEFAULTS = { drop_date: '', shipping_fee: 60, free_shipping_over: 0, transfer_info: '', instagram: '', tiktok: '',
  announcement_en: '', announcement_ar: '', about_en: '', about_ar: '', faq_en: '', faq_ar: '', size_chart: '', lookbook: [] };
const useHash = () => {
  const [h, setH] = useState(location.hash || '#/');
  useEffect(() => { const f = () => { setH(location.hash || '#/'); scrollTo(0, 0); }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  return h;
};

export default function App() {
  const [lang, setLang] = useState(localStorage.getItem('roven-lang') === 'ar' ? 'ar' : 'en');
  const [products, setProducts] = useState([]), [cart, setCart] = useState([]), [settings, setSettings] = useState(DEFAULTS), [testimonials, setTestimonials] = useState([]), [catalog, setCatalog] = useState({ categories: [], collections: [] });
  const hash = useHash(), t = T[lang];
  useEffect(() => { loadProducts().then(setProducts); loadSettings().then(s => setSettings({ ...DEFAULTS, ...s })); loadTestimonials().then(setTestimonials); loadCatalog().then(setCatalog); }, []);
  useEffect(() => { reveal(); });
  useEffect(() => {
    document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    try { localStorage.setItem('roven-lang', lang); } catch { /* blocked storage is fine */ }
  }, [lang]);
  const add = useCallback(line => setCart(c => [...c, line]), []);
  const ctx = { t, lang, products, cart, setCart, add, settings, testimonials, catalog };
  const [, page, id] = hash.split('/');
  if (page === 'admin') return <Suspense fallback={null}><Admin /></Suspense>;
  const view = { p: <Product {...ctx} id={id} />, cart: <Cart {...ctx} />, track: <Track {...ctx} />, shop: <Shop {...ctx} cat={id} />, collection: <Collection {...ctx} id={id} />,
    about: <About {...ctx} />, sizes: <Sizes {...ctx} />, faq: <Faq {...ctx} /> }[page] || <Home {...ctx} />;
  return (<>
    <div className="ambient" aria-hidden="true" />
    <Header t={t} lang={lang} setLang={setLang} count={cart.length} settings={settings} hash={hash} />
    <main>{view}</main>
    <Footer t={t} lang={lang} products={products} catalog={catalog} settings={settings} />
  </>);
}
