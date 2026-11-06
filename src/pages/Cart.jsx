import { useTo } from '../lib/router.js';
import { useEffect, useState } from 'react';
import { placeOrder, quote } from '../lib/data.js';
import { kindLabel } from '../lib/payments.js';
import { colorName } from '../lib/catalog.js';
const clean = (v, n) => String(v).trim().slice(0, n);

export default function Cart({ t, lang, cart, setCart, settings }) {
  const to = useTo();
  const [f, setF] = useState({ name: '', phone: '', city: '', address: '' });
  const [method, setMethod] = useState('cod'), [state, setState] = useState('idle'), [tracking, setTracking] = useState('');
  const [couponIn, setCouponIn] = useState(''), [applied, setApplied] = useState(''), [q, setQ] = useState(null), [cErr, setCErr] = useState(false);
  useEffect(() => {
    if (!cart.length) return;
    quote(cart, applied, settings).then(r => { if (r.error) { setCErr(!!applied); setApplied(''); } else setQ(r); });
  }, [cart, applied, settings]);

  const set = k => e => setF({ ...f, [k]: e.target.value });
  const valid = f.name.trim().length > 1 && /^\+?\d{10,14}$/.test(f.phone.replace(/\s/g, '')) && f.city.trim() && f.address.trim().length > 5;
  const money = n => (q && q.subtotal > 0 ? `${n} ${t.egp}` : t.soon);
  const submit = async () => {
    if (!valid || state === 'busy') return;
    setState('busy');
    const customer = { name: clean(f.name, 80), phone: f.phone.replace(/\s/g, ''), city: clean(f.city, 60), address: clean(f.address, 240) };
    const r = await placeOrder(customer, cart, method, applied);
    if (r.ok) { setTracking(r.tracking || ''); setCart([]); setState(method === 'transfer' ? 'transfer' : 'done'); } else setState('error');
  };
  if (state === 'done' || state === 'transfer') return (<section className="page">
    <h1 className="ptitle">{state === 'transfer' ? t.transferDone : t.done}</h1>
    {tracking && <><p>{t.yourCode}</p><p className="code">{tracking}</p><p className="hint">{t.keepCode}</p></>}
    {state === 'transfer' && <a href={to('/track')}>{t.uploadReceipt}</a>}<a href={to('/')}>{t.back}</a></section>);
  if (!cart.length) return <section className="page"><p>{t.empty}</p><a href={to('/')}>{t.back}</a></section>;
  return (<section className="page">
    <h1 className="ptitle">{t.cart}</h1>
    <ul className="lines">{cart.map((l, i) => (<li key={i}><span>{l.name} · {l.size} · {colorName(l.color, lang)}</span>
      <button className="link" onClick={() => setCart(cart.filter((_, j) => j !== i))}>{t.remove}</button></li>))}</ul>
    <div className="opts"><span>{t.coupon}</span>
      <input className="mini" value={couponIn} onChange={e => setCouponIn(e.target.value.toUpperCase())} maxLength={20} />
      <button className="chip" onClick={() => { setCErr(false); setApplied(couponIn.trim()); }}>{t.apply}</button></div>
    {cErr && <p className="error" role="alert">{t.badCoupon}</p>}
    {q && <div className="sum">
      <p><span>{t.subtotal}</span><span>{money(q.subtotal)}</span></p>
      {q.discount > 0 && <p><span>{t.discount}</span><span>-{q.discount} {t.egp}</span></p>}
      <p><span>{t.shipping}</span><span>{q.shipping === 0 ? t.free : `${q.shipping} ${t.egp}`}</span></p>
      <p className="tot"><span>{t.total}</span><span>{money(q.total)}</span></p></div>}
    <h2 className="sub">{t.checkout}</h2>
    {['name', 'phone', 'city', 'address'].map(k => (<label key={k} className="field"><span>{t[k]}</span>
      <input value={f[k]} onChange={set(k)} maxLength={k === 'address' ? 240 : 80} autoComplete={k === 'phone' ? 'tel' : 'on'} inputMode={k === 'phone' ? 'tel' : 'text'} /></label>))}
    <div className="opts"><span>{t.pay}</span>
      {['cod', 'transfer'].map(m => <button key={m} className={'chip' + (m === method ? ' on' : '')} onClick={() => setMethod(m)}>{t[m]}</button>)}</div>
    {method === 'transfer' && <div className="sum"><p><strong>{t.transferNote}</strong></p>{(settings.transfer_methods || []).length ? settings.transfer_methods.map((m, i) => <p key={i}><span>{kindLabel(m, lang)}{m.note && <small className="dim"> · {m.note}</small>}</span><span dir="ltr">{m.value}</span></p>) : <p className="pre">{settings.transfer_info}</p>}</div>}
    {state === 'error' && <p className="error" role="alert">{t.err}</p>}
    <button className="cta" disabled={!valid || state === 'busy'} onClick={submit}>{t.place}</button>
  </section>);
}
