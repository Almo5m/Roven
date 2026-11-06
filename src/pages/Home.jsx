import { useTo } from '../lib/router.js';
import { useEffect, useRef, useState } from 'react';
import Card from '../components/Card.jsx';
import { opt } from '../lib/cloudinary.js';
import { catsOf, nm } from '../lib/catalog.js';
const pad = n => String(n).padStart(2, '0');

export default function Home({ t, lang, products, catalog, settings, testimonials }) {
  const to = useTo();
  const ref = useRef(null), [now, setNow] = useState(Date.now());
  const DROP = settings.drop_date ? new Date(settings.drop_date).getTime() : 0, showDrop = DROP > now;
  useEffect(() => { if (!DROP) return; const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, [DROP]);
  /* Phones have no hover, so the light drifts on its own and follows the scroll. */
  useEffect(() => {
    const el = ref.current;
    if (!el || !matchMedia('(hover: none)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let seen = true, raf; const t0 = performance.now();
    const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; }); io.observe(el);
    const loop = now => {
      if (seen) { const t = (now - t0) / 1000, sy = scrollY * 0.003;
        el.style.setProperty('--x', 50 + 38 * Math.sin(t * 0.9 + sy) + '%'); el.style.setProperty('--y', 50 + 30 * Math.cos(t * 0.7 + sy * 1.3) + '%'); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, []);
  const light = e => { const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--x', (e.clientX - r.left) / r.width * 100 + '%');
    ref.current.style.setProperty('--y', (e.clientY - r.top) / r.height * 100 + '%'); };
  const s = Math.max(0, Math.floor((DROP - now) / 1000));
  const clock = [[Math.floor(s / 86400), t.days], [Math.floor(s % 86400 / 3600), t.hours], [Math.floor(s % 3600 / 60), t.mins], [s % 60, t.secs]];
  const feat = products.filter(p => p.featured), shown = (feat.length ? feat : products).slice(0, 4);
  const cats = catsOf(catalog, products).slice(0, 4), cols = catalog.collections.filter(c => c.on_home).slice(0, 2);
  const look = (Array.isArray(settings.lookbook) ? settings.lookbook : []).filter(u => String(u).startsWith('https://'));
  const fee = Number(settings.shipping_fee) || 0, free = Number(settings.free_shipping_over) || 0;
  const trust = [[t.trust1t, t.trust1d], [t.trust2t, t.trust2d], [t.trust3t, t.trust3d],
    [t.trust4t, fee ? `${fee} ${t.egp}${free ? ` · ${t.freeOver} ${free}` : ''}` : t.free]];
  const catImg = c => c.image || products.find(p => (p.category || 'other') === c.slug && p.images?.[0])?.images[0];
  return (<>
    <section className="hero">
      <div className="hero-copy">
        <h1><span className="l1">{t.tag1}</span><span className="l2">{t.tag2}</span></h1>
        <p className="sub">{t.heroSub}</p>
        <div className="btnrow"><a className="btn primary" href={to('/shop')}>{t.shopNow}</a>{look.length > 0 && <button className="btn ghost" onClick={() => document.getElementById('lookbook')?.scrollIntoView({ behavior: 'smooth' })}>{t.lookbookCta}</button>}</div>
      </div>
      <div className="mark" ref={ref} onPointerMove={light} onPointerDown={light}>
        <img className="mark-base" src="/logo-r.png" alt="ROVEN" /><img className="mark-lit" src="/logo-r.png" alt="" aria-hidden="true" /></div>
    </section>

    {cols.length > 0 && <section className="wrap"><div className="head rv"><h2>{t.collections}</h2></div>
      <div className="ctiles">{cols.map(c => (<a key={c.slug} className="ctile cut rv" href={to(`/collection/${c.slug}`)}>
        {c.image ? <img src={opt(c.image, 1000)} alt={nm(c, lang)} loading="lazy" /> : <div className="ph"><img src="/logo-r.png" alt="" /></div>}
        <div><h3>{nm(c, lang)}</h3><p>{c['description_' + lang]}</p><span className="more">{t.explore}<i className="arr">→</i></span></div></a>))}</div></section>}

    <section className="wrap"><div className="head rv"><h2>{t.catsTitle}</h2></div>
      <div className="tiles">{cats.map(c => { const img = catImg(c);
        return (<a key={c.slug} className="tile cut rv" href={to(`/shop/${c.slug}`)}>
          {img ? <img src={opt(img, 700)} alt={nm(c, lang)} loading="lazy" /> : <div className="ph"><img src="/logo-r.png" alt="" /></div>}
          <span>{nm(c, lang)}<i className="arr">→</i></span></a>); })}</div></section>

    <section className="wrap"><div className="head rv"><h2>{t.featured}</h2><a className="more" href={to('/shop')}>{t.viewAll}<i className="arr">→</i></a></div>
      {shown.length ? <div className="grid">{shown.map(p => <Card key={p.id} p={p} lang={lang} t={t} />)}</div> : <p className="dim">{t.noProducts}</p>}</section>

    {look.length > 0 && <section className="wrap" id="lookbook"><div className="head rv"><h2>{t.lookbook}</h2></div>
      <div className="strip">{look.map(u => <img key={u} src={opt(u, 800)} alt="" loading="lazy" />)}</div></section>}

    <section className="band"><p className="rv">{settings['about_' + lang] ? settings['about_' + lang].split('\n')[0] : t.manifesto}</p>
      <a className="more rv" href={to('/about')}>{t.about}<i className="arr">→</i></a></section>

    <section className="trust">{trust.map(([a, b]) => <div className="rv" key={a}><strong>{a}</strong><span>{b}</span></div>)}</section>

    {testimonials.length > 0 && <section className="wrap"><div className="head rv"><h2>{t.reviews}</h2></div>
      <div className="reviews">{testimonials.map(r => <figure className="rv" key={r.id}><div className="stars" aria-label={`${r.rating}/5`}>{'★'.repeat(r.rating)}</div>
        <blockquote>{r.text}</blockquote><figcaption>{r.name}{r.verified && <em className="vbadge">✓ {t.verified}</em>}</figcaption></figure>)}</div></section>}

    {showDrop && <section className="release"><h2>{t.dropTitle}</h2>
      <div className="clock">{clock.map(([n, l]) => <div key={l}><b>{pad(n)}</b><span>{l}</span></div>)}</div></section>}
  </>);
}
