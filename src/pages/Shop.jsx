import Card from '../components/Card.jsx';
import { catsOf, nm } from '../lib/catalog.js';
export default function Shop({ t, lang, products, catalog, cat }) {
  const cats = catsOf(catalog, products), cur = cats.find(c => c.slug === cat);
  const shown = cur ? products.filter(p => (p.category || 'other') === cur.slug) : products;
  return (<section className="wrap"><h1 className="ptitle">{cur ? nm(cur, lang) : t.shop}</h1>
    <div className="opts tabs"><a href="#/shop" className={'chip' + (!cur ? ' on' : '')}>{t.cat_all}</a>
      {cats.map(c => <a key={c.slug} href={`#/shop/${c.slug}`} className={'chip' + (cur?.slug === c.slug ? ' on' : '')}>{nm(c, lang)}</a>)}</div>
    <div className="grid">{shown.map(p => <Card key={p.id} p={p} lang={lang} t={t} />)}</div></section>);
}
