import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import Dashboard from './Dashboard.jsx';
import Orders from './Orders.jsx';
import Products from './Products.jsx';
import Coupons from './Coupons.jsx';
import Settings from './Settings.jsx';
import Reviews from './Reviews.jsx';
import Taxonomy from './Taxonomy.jsx';
import './admin.css';

/* The UI gate is only for convenience. Real protection is Row Level Security in Supabase. */
export default function Admin() {
  const [state, setState] = useState('loading'), [tab, setTab] = useState('dash'), [orders, setOrders] = useState([]);
  const [email, setEmail] = useState(''), [pass, setPass] = useState(''), [err, setErr] = useState('');

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
  useEffect(() => { if (state === 'ok') loadOrders(); }, [state, loadOrders]);

  const login = async e => {
    e.preventDefault(); setErr('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
    setPass(''); if (error) return setErr('Wrong email or password.'); check();
  };
  const logout = async () => { await supabase.auth.signOut(); setState('login'); };

  if (state === 'loading') return <div className="ad-center">Loading…</div>;
  if (state === 'nosb') return <div className="ad-center">Add your Supabase keys to .env to use the dashboard.</div>;
  if (state === 'denied') return <div className="ad-center"><p>This account is not an admin.</p><button className="ad-btn" onClick={logout}>Sign out</button></div>;
  if (state === 'login') return (
    <form className="ad-center ad-login" onSubmit={login}>
      <img src="/logo-r.png" alt="" width="72" />
      <h1>ROVEN dashboard</h1>
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" required />
      <input type="password" placeholder="Password" value={pass} onChange={e => setPass(e.target.value)} autoComplete="current-password" required />
      {err && <p className="ad-err" role="alert">{err}</p>}
      <button className="ad-btn primary" type="submit">Sign in</button>
    </form>);

  const tabs = [['dash', 'Overview'], ['orders', 'Orders'], ['products', 'Products'], ['categories', 'Categories'], ['collections', 'Collections'], ['coupons', 'Coupons'], ['reviews', 'Reviews'], ['settings', 'Settings']];
  return (<div className="ad">
    <header className="ad-top"><strong>ROVEN</strong>
      <nav>{tabs.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</nav>
      <button className="ad-btn" onClick={logout}>Sign out</button></header>
    <div className="ad-body">
      {tab === 'dash' && <Dashboard orders={orders} />}
      {tab === 'orders' && <Orders orders={orders} reload={loadOrders} />}
      {tab === 'products' && <Products />}
      {tab === 'categories' && <Taxonomy table="categories" title="Categories" />}
      {tab === 'collections' && <Taxonomy table="collections" title="Collections" rich />}
      {tab === 'coupons' && <Coupons />}
      {tab === 'reviews' && <Reviews />}
      {tab === 'settings' && <Settings />}
    </div></div>);
}
