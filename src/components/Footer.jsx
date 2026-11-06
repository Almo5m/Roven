import { useTo } from '../lib/router.js';
import { catsOf, nm } from '../lib/catalog.js';
export default function Footer({ t, lang, products, catalog, settings }) {
  const to = useTo();
  const ok = u => typeof u === 'string' && u.startsWith('https://');
  return (<footer className="foot">
    <div className="fgrid">
      <div><a className="logo" href={to('/')}><img src="/logo-r.png" alt="" /><b>ROVEN</b></a><p className="dim">{t.tag1} {t.tag2}</p></div>
      <div><h4>{t.shop}</h4>{catsOf(catalog, products).map(c => <a key={c.slug} href={to(`/shop/${c.slug}`)}>{nm(c, lang)}</a>)}</div>
      <div><h4>{t.help}</h4><a href={to('/sizes')}>{t.sizeGuide}</a><a href={to('/faq')}>{t.faq}</a><a href={to('/track')}>{t.track}</a><a href={to('/about')}>{t.about}</a></div>
      <div><h4>{t.followUs}</h4>
        {ok(settings.instagram) && <a href={settings.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>}
        {ok(settings.tiktok) && <a href={settings.tiktok} target="_blank" rel="noopener noreferrer">TikTok</a>}</div>
    </div>
    <p className="legal">{t.payMethods}</p>
    <p className="legal">© 2026 ROVEN. All rights reserved.</p>
  </footer>);
}
