import { useState } from 'react';
import { opt } from '../lib/cloudinary.js';
export default function Product({ t, lang, products, add, id, settings }) {
  const p = products.find(x => String(x.id) === id);
  const [size, setSize] = useState(''), [color, setColor] = useState(''), [msg, setMsg] = useState(''), [img, setImg] = useState(0);
  if (!p) return <section className="page"><a href="#/shop">{t.back}</a></section>;
  const chosen = color || p.colors[0], imgs = p.images || [], desc = p['description_' + lang], free = Number(settings.free_shipping_over) || 0;
  const go = () => {
    if (!size) return setMsg(t.pickSize);
    add({ id: p.id, name: p['name_' + lang], price: p.price, size, color: chosen }); location.hash = '#/cart';
  };
  return (<section className="pdp">
    <div className="gallery">
      {imgs.length ? <img className="main" src={opt(imgs[img] || imgs[0], 1100)} alt={p['name_' + lang]} /> : <div className="ph main"><img src="/logo-r.png" alt="" /></div>}
      {imgs.length > 1 && <div className="thumbs">{imgs.map((u, i) => <button key={u} className={i === img ? 'on' : ''} onClick={() => setImg(i)}><img src={opt(u, 160)} alt="" /></button>)}</div>}
    </div>
    <div className="info">
      <a href="#/shop">{t.back}</a>
      <h1 className="ptitle">{p['name_' + lang]}</h1>
      <p className="price">{p.price > 0 ? `${p.price} ${t.egp}` : t.soon}</p>
      {desc && <p className="desc">{desc}</p>}
      <div className="opts"><span>{t.size}</span>{p.sizes.map(s => <button key={s} className={'chip' + (s === size ? ' on' : '')} disabled={!!p.stock && !(p.stock[s] > 0)} title={p.stock && !(p.stock[s] > 0) ? t.soldOut : ''} onClick={() => { setSize(s); setMsg(''); }}>{s}</button>)}</div>
      <div className="opts"><span>{t.color}</span>{p.colors.map(c => <button key={c} className={'chip' + (c === chosen ? ' on' : '')} onClick={() => setColor(c)}>{c}</button>)}</div>
      {msg && <p className="error" role="alert">{msg}</p>}
      <button className="btn primary wide" onClick={go}>{t.add}</button>
      <details><summary>{t.shipPay}</summary>
        <p>{t.shipFee}: {settings.shipping_fee} {t.egp}{free > 0 ? ` · ${t.freeOver} ${free} ${t.egp}` : ''}</p><p>{t.payMethods}</p></details>
    </div></section>);
}
