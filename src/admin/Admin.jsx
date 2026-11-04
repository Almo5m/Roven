import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import Dashboard from './Dashboard.jsx';
import Orders from './Orders.jsx';
import Products from './Products.jsx';
import Taxonomy from './Taxonomy.jsx';
import Coupons from './Coupons.jsx';
import Reviews from './Reviews.jsx';
import Settings from './Settings.jsx';
import { Icon } from './ui.jsx';
import './admin.css';

const NAV = [
  ['المبيعات', [['dash', 'نظرة عامة', 'home'], ['orders', 'الطلبات', 'orders'], ['coupons', 'أكواد الخصم', 'coupons']]],
  ['الكتالوج', [['products', 'المنتجات', 'products'], ['categories', 'الأصناف', 'categories'], ['collections', 'الكوليكشنات', 'collections']]],
  ['الموقع', [['reviews', 'آراء العملاء', 'reviews'], ['settings', 'الإعدادات', 'settings']]],
];
const TITLES = Object.fromEntries(NAV.flatMap(([, items]) => items.map(([k, l]) => [k, l])));

/* The screen gate is only for convenience. Real protection is Row Level Security in Supabase. */
export default function Admin() {
  const [state, setState] = useState('loading'), [tab, setTab] = useState('dash'), [orders, setOrders] = useState([]);
  const [nav, setNav] = useState(false), [toast, setToast] = useState(null);
  const [email, setEmail] = useState(''), [pass, setPass] = useState(''), [err, setErr] = useState('');
  const notify = useCallback((msg, type = 'ok') => setToast({ msg, type, id: Date.now() }), []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3200); return () => clearTimeout(t); }, [toast]);

  const check = useCallback(async () => {
    if (!supabase) return setState('nosb');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return setState('login');
    const { data } = await supabase.from('admins').select('user_id').eq('user_id', session.user.id).maybeSingle();
    setState(data ? 'ok' : 'denied');
  }, []);
  const loadOrders = useCallback(async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(300);
    setOrders(data || []);
  }, []);
  useEffect(() => { check(); }, [check]);
  useEffect(() => { if (state !== 'ok') return; loadOrders(); const i = setInterval(loadOrders, 60000); return () => clearInterval(i); }, [state, loadOrders]);

  const login = async e => {
    e.preventDefault(); setErr('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
    setPass(''); if (error) return setErr('الإيميل أو كلمة المرور غير صحيحة.'); check();
  };
  const logout = async () => { await supabase.auth.signOut(); setState('login'); };
  const go = k => { setTab(k); setNav(false); scrollTo(0, 0); };

  const shell = c => <div className="ad-root" dir="rtl" lang="ar">{c}</div>;
  if (state === 'loading') return shell(<div className="ad-center">جاري التحميل…</div>);
  if (state === 'nosb') return shell(<div className="ad-center">أضف مفاتيح Supabase في ملف .env لتشغيل لوحة التحكم.</div>);
  if (state === 'denied') return shell(<div className="ad-center"><p>هذا الحساب ليس مدير.</p><button className="ad-btn" onClick={logout}>تسجيل الخروج</button></div>);
  if (state === 'login') return shell(
    <form className="ad-center ad-login" onSubmit={login}>
      <img src="/logo-r.png" alt="" width="96" /><h1>لوحة تحكم ROVEN</h1>
      <input type="email" placeholder="الإيميل" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" required />
      <input type="password" placeholder="كلمة المرور" value={pass} onChange={e => setPass(e.target.value)} autoComplete="current-password" required />
      {err && <p className="ad-err" role="alert">{err}</p>}
      <button className="ad-btn primary wide" type="submit">دخول</button>
    </form>);

  const fresh = orders.filter(o => o.status === 'new').length;
  return shell(<>
    <aside className={'ad-side' + (nav ? ' open' : '')}>
      <div className="ad-brand"><img src="/logo-r.png" alt="" /><b>ROVEN</b></div>
      <nav>{NAV.map(([g, items]) => (<div key={g}><h4>{g}</h4>
        {items.map(([k, l, ic]) => (<button key={k} className={tab === k ? 'on' : ''} onClick={() => go(k)}><Icon n={ic} />{l}
          {k === 'orders' && fresh > 0 && <i>{fresh}</i>}</button>))}</div>))}</nav>
      <button className="ad-out" onClick={logout}><Icon n="out" />تسجيل الخروج</button>
    </aside>
    {nav && <div className="ad-scrim" onClick={() => setNav(false)} />}
    <div className="ad-main">
      <div className="ad-top"><button className="ad-icon" onClick={() => setNav(true)} aria-label="القائمة"><Icon n="menu" size={24} /></button><strong>{TITLES[tab]}</strong><span /></div>
      <div className="ad-body">
        {tab === 'dash' && <Dashboard orders={orders} go={go} />}
        {tab === 'orders' && <Orders orders={orders} reload={loadOrders} notify={notify} />}
        {tab === 'coupons' && <Coupons notify={notify} />}
        {tab === 'products' && <Products notify={notify} />}
        {tab === 'categories' && <Taxonomy key="c" table="categories" title="الأصناف" one="صنف" notify={notify} />}
        {tab === 'collections' && <Taxonomy key="k" table="collections" title="الكوليكشنات" one="كوليكشن" rich notify={notify} />}
        {tab === 'reviews' && <Reviews notify={notify} />}
        {tab === 'settings' && <Settings notify={notify} />}
      </div>
    </div>
    {toast && <div key={toast.id} className={'ad-toast ' + toast.type} role="status">{toast.msg}</div>}
  </>);
}
