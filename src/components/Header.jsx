import { useEffect, useState } from 'react';

function LangSwitch({ t, lang, setLang }) {
  return (<button className="lang" data-lang={lang} role="switch" aria-checked={lang === 'ar'} aria-label={t.switchLang}
    onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}><span>EN</span><span>ع</span></button>);
}
export default function Header({ t, lang, setLang, count, settings, hash }) {
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [hash]);
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; }, [open]);
  const links = [['#/shop', t.shop], ['#/about', t.about], ['#/sizes', t.sizeGuide], ['#/faq', t.faq], ['#/track', t.track]];
  return (<>
    <div className="announce">{settings['announcement_' + lang] || t.announce}</div>
    <header className="hdr cut">
      <div className="hleft">
        <button className="burger" aria-label={t.menu} aria-expanded={open} onClick={() => setOpen(!open)}><span /><span /></button>
        <nav className="hnav">{links.map(([h, l]) => <a key={h} href={h}>{l}</a>)}</nav>
      </div>
      <a className="logo" href="#/" aria-label="ROVEN"><img src="/logo-r.png" alt="" /><b>ROVEN</b></a>
      <div className="hright">
        <LangSwitch t={t} lang={lang} setLang={setLang} />
        <a className="bag" href="#/cart" aria-label={`${t.cart} (${count})`}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6a3 3 0 016 0v2" /></svg>
          {count > 0 && <i>{count}</i>}</a>
      </div>
    </header>
    {open && <div className="drawer" onClick={() => setOpen(false)}>
      <nav className="cut" onClick={e => e.stopPropagation()}>{links.map(([h, l]) => <a key={h} href={h}>{l}</a>)}</nav></div>}
  </>);
}
