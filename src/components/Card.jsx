import { opt } from '../lib/cloudinary.js';
export default function Card({ p, lang, t }) {
  const imgs = (p.images || []).slice(0, 3), out = !!p.stock && p.sizes.every(s => !(p.stock[s] > 0));
  return (<a className="card" href={`#/p/${p.id}`}>
    <div className="cimg">
      {imgs.length ? imgs.map((u, i) => <img key={u} className={i ? 'alt' : ''} src={opt(u, 600)} alt="" loading="lazy" />) : <div className="ph"><img src="/logo-r.png" alt="" /></div>}
    </div>
    {out && <em className="badge">{t.soldOut}</em>}
    <div className="cmeta"><h3>{p['name_' + lang]}</h3><span>{p.price > 0 ? `${p.price} ${t.egp}` : t.soon}</span></div>
  </a>);
}
