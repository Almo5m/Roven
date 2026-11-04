import Card from '../components/Card.jsx';
import { opt } from '../lib/cloudinary.js';
import { nm } from '../lib/catalog.js';
export default function Collection({ t, lang, products, catalog, id }) {
  const c = catalog.collections.find(x => x.slug === id);
  if (!c) return <section className="wrap narrow"><a href="#/shop">{t.back}</a></section>;
  const list = products.filter(p => (p.collections || []).includes(id));
  return (<>
    <section className="chero">{c.image && <img src={opt(c.image, 1600)} alt="" />}
      <div className="wrap"><p className="eyebrow">{t.collLabel}</p><h1 className="ptitle">{nm(c, lang)}</h1><p className="lead">{c['description_' + lang]}</p></div></section>
    <section className="wrap">{list.length ? <div className="grid">{list.map(p => <Card key={p.id} p={p} lang={lang} t={t} />)}</div> : <p className="dim">{t.comingSoon}</p>}</section>
  </>);
}
