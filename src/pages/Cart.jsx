import { useEffect, useState } from 'react';
import { useTo } from '../lib/router.js';
import { placeOrder, quote } from '../lib/data.js';
import { kindLabel } from '../lib/payments.js';
import { colorName } from '../lib/catalog.js';
import { opt } from '../lib/cloudinary.js';
import { normPhone, isPhone } from '../lib/phone.js';
const clean = (v, n) => String(v).trim().slice(0, n);
const MAX_ITEMS = 20; // same limit as the server
const keyOf = l => `${l.id}|${l.size}|${l.color}`;
/* The cart stores one line per piece; the screen groups identical pieces into one row with a quantity. */
const group = cart => { const m = new Map(); cart.forEach(l => (m.has(keyOf(l)) ? m.get(keyOf(l)).qty++ : m.set(keyOf(l), { ...l, qty: 1, key: keyOf(l) }))); return [...m.values()]; };

export default function Cart({ t, lang, cart, setCart, settings }) {
  const to = useTo();
  const [f, setF] = useState({ name: '', phone: '', city: '', address: '' }), [show, setShow] = useState(false);
  const [method, setMethod] = useState('cod'), [state, setState] = useState('idle'), [placed, setPlaced] = useState(null), [reason, setReason] = useState('');
  const [couponIn, setCouponIn] = useState(''), [applied, setApplied] = useState(''), [q, setQ] = useState(null), [cErr, setCErr] = useState(false);
  useEffect(() => {
    if (!cart.length) return;
    quote(cart, applied, settings).then(r => { if (r.error) { setCErr(!!applied); setApplied(''); } else setQ(r); });
  }, [cart, applied, settings]);

  const money = n => (q && q.subtotal > 0 ? `${n} ${t.egp}` : t.soon);
  const errs = { name: f.name.trim().length < 2 && t.errName, phone: !isPhone(f.phone) && t.errPhone, city: !f.city.trim() && t.errCity, address: f.address.trim().length < 6 && t.errAddress };
  const submit = async () => {
    if (state === 'busy') return;
    setShow(true);
    const bad = Object.keys(errs).find(k => errs[k]);
    if (bad) return document.getElementById('f-' + bad)?.focus(); // never leave the customer wondering why nothing happened
    setState('busy'); setReason('');
    const r = await placeOrder({ name: clean(f.name, 80), phone: normPhone(f.phone), city: clean(f.city, 60), address: clean(f.address, 240) }, cart, method, applied);
    if (r.ok) { setPlaced({ tracking: r.tracking, total: r.total, method }); setCart([]); setState('done'); } else { setReason(r.reason || ''); setState('error'); }
  };
  const why = { 'sold out': t.errSoldOut, 'bad coupon': t.badCoupon, 'bad item': t.errItem, 'bad customer': t.errCustomer }[reason];
  const transferBox = (<div className="co-pay">
    <strong>{t.transferNote}</strong>
    {(settings.transfer_methods || []).length ? settings.transfer_methods.map((m, i) => <p key={i}><span>{kindLabel(m, lang)}{m.note && <small className="dim"> · {m.note}</small>}</span><span dir="ltr">{m.value}</span></p>) : <p className="pre">{settings.transfer_info}</p>}</div>);
  const field = (k, label, props = {}, Tag = 'input') => (
    <label className={'field' + (show && errs[k] ? ' bad' : '')}><span>{label}</span>
      <Tag id={'f-' + k} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} aria-invalid={!!(show && errs[k])} {...props} />
      {show && errs[k] && <em className="fld-err" role="alert">{errs[k]}</em>}</label>);

  if (state === 'done') return (<section className="page">
    <h1 className="ptitle">{placed.method === 'transfer' ? t.transferDone : t.done}</h1>
    <div className="co-card"><p className="dim">{t.yourCode}</p><p className="code" dir="ltr">{placed.tracking}</p>
      <button className="link" onClick={() => { navigator.clipboard?.writeText(placed.tracking); setReason('copied'); }}>{reason === 'copied' ? t.copied : t.copy}</button>
      <p className="co-note">{t.keepCode}</p>
      {placed.method === 'transfer' && <>{placed.total > 0 && <p><strong>{t.transferTotal}: {placed.total} {t.egp}</strong></p>}{transferBox}<a className="btn primary" href={to('/track')}>{t.uploadReceipt}</a></>}</div>
    <a href={to('/')}>{t.back}</a></section>);
  if (!cart.length) return <section className="page"><h1 className="ptitle">{t.cart}</h1><p>{t.empty}</p><a className="btn primary" href={to('/shop')}>{t.shopNow}</a></section>;

  const groups = group(cart);
  return (<section className="wrap co">
    <h1 className="ptitle">{t.checkout}</h1>
    <div className="co-grid">
      <div className="co-main">
        <section className="co-card"><h2>{t.yourOrder}</h2>
          <ul className="cl-list">{groups.map(g => { const name = g['name_' + lang] || g.name || g.id; return (
            <li className="cl" key={g.key}>
              <a className="cl-img" href={to(`/p/${g.id}`)}>{g.image ? <img src={opt(g.image, 200)} alt={name} /> : <span className="ph"><img src="/logo-r.png" alt="" /></span>}</a>
              <div className="cl-info"><b>{name}</b><small>{g.size} · {colorName(g.color, lang)}</small>
                <div className="qty" role="group" aria-label={name}>
                  <button aria-label="−" onClick={() => setCart(cart.filter((_, j) => j !== cart.map(keyOf).lastIndexOf(g.key)))}>−</button><span>{g.qty}</span>
                  <button aria-label="+" disabled={cart.length >= MAX_ITEMS} onClick={() => setCart([...cart, { id: g.id, name_ar: g.name_ar, name_en: g.name_en, price: g.price, size: g.size, color: g.color, image: g.image }])}>+</button></div></div>
              <div className="cl-side"><b>{g.price > 0 ? `${g.price * g.qty} ${t.egp}` : t.soon}</b><button className="link" onClick={() => setCart(cart.filter(l => keyOf(l) !== g.key))}>{t.remove}</button></div>
            </li>); })}</ul>
          <div className="coupon-row"><input placeholder={t.coupon} aria-label={t.coupon} value={couponIn} onChange={e => setCouponIn(e.target.value.toUpperCase())} maxLength={20} dir="ltr" />
            <button className="chip" onClick={() => { setCErr(false); setApplied(couponIn.trim()); }}>{t.apply}</button></div>
          {cErr && <p className="error" role="alert">{t.badCoupon}</p>}
        </section>

        <section className="co-card"><h2>{t.deliveryDetails}</h2>
          {field('name', t.name, { maxLength: 80, autoComplete: 'name', enterKeyHint: 'next' })}
          {field('phone', t.phone, { type: 'tel', inputMode: 'tel', autoComplete: 'tel', maxLength: 20, dir: 'ltr', enterKeyHint: 'next' })}
          {field('city', t.city, { maxLength: 60, autoComplete: 'address-level2', enterKeyHint: 'next' })}
          {field('address', t.address, { maxLength: 240, rows: 3, autoComplete: 'street-address' }, 'textarea')}
          <p className="co-note">{t.phoneNote}</p>
        </section>

        <section className="co-card"><h2>{t.paymentMethod}</h2>
          {['cod', 'transfer'].map(m => (<label key={m} className={'pay-opt' + (method === m ? ' on' : '')}>
            <input type="radio" name="pay" checked={method === m} onChange={() => setMethod(m)} /><i className="dot" />
            <span><b>{t[m]}</b><small>{m === 'cod' ? t.codDesc : t.transferDesc}</small></span></label>))}
          {method === 'transfer' && transferBox}
        </section>
      </div>

      <aside className="co-side"><div className="co-card sumcard"><h2>{t.orderSummary}</h2>
        {q && <div className="sum">
          <p><span>{t.subtotal} · {cart.length} {t.items}</span><span>{money(q.subtotal)}</span></p>
          {q.discount > 0 && <p><span>{t.discount}</span><span>-{q.discount} {t.egp}</span></p>}
          <p><span>{t.shipping}</span><span>{q.shipping === 0 ? t.free : `${q.shipping} ${t.egp}`}</span></p>
          <p className="tot"><span>{t.total}</span><span>{money(q.total)}</span></p></div>}
        {state === 'error' && <div className="error" role="alert">{why || t.err}{!why && reason && <small className="dim" dir="ltr"> ({reason.slice(0, 120)})</small>}</div>}
        {show && Object.values(errs).some(Boolean) && <p className="error" role="alert">{t.errFix}</p>}
        <button className="btn primary wide" onClick={submit} disabled={state === 'busy'}>{state === 'busy' ? t.placing : t.place}</button>
        <p className="co-note">{t.phoneNote}</p>
      </div></aside>
    </div>
  </section>);
}
