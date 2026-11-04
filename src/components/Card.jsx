import { opt } from '../lib/cloudinary.js';
export default function Card({ p, lang, t }) {
  const [a, b] = p.images || [], out = !!p.stock && p.sizes.every(s => !(p.stock[s] > 0));
  return (<a className="card" href={`#/p/${p.id}`}>
    <div className="cimg">
      {a ? <img src={opt(a, 600)} alt="" loading="lazy" /> : <div className="ph"><img src="/logo-r.png" alt="" /></div>}
      {b && <img className="alt" src={opt(b, 600)} alt="" loading="lazy" />}
      {out && <em className="badge">{t.soldOut}</em>}
    </div>
    <div className="cmeta"><h3>{p['name_' + lang]}</h3><span>{p.price > 0 ? `${p.price} ${t.egp}` : t.soon}</span></div>
  </a>);
}
