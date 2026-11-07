import { useEffect, useRef, useState } from 'react';
/* Shared building blocks for the Arabic dashboard: modal, confirm dialog, field, pill, icons, formatters. */
export const money = n => `${Number(n || 0).toLocaleString('ar-EG')} ج.م`;
export const fmtDate = d => new Date(d).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });

export function Modal({ title, onClose, children, footer, wide }) {
  const ref = useRef(null), back = useRef(null), close = useRef(onClose);
  close.current = onClose; // always the latest handler, without re-running the effect below
  useEffect(() => {
    // Runs once when the dialog opens. It must not depend on onClose: that is a new function on every
    // render, and re-running this effect moved focus to the dialog after each typed letter (the phone keyboard closed).
    const k = e => e.key === 'Escape' && close.current();
    const prev = document.body.style.overflow;
    addEventListener('keydown', k); document.body.style.overflow = 'hidden'; ref.current?.focus();
    return () => { removeEventListener('keydown', k); document.body.style.overflow = prev; };
  }, []);
  useEffect(() => { // fit the visible area: on phones the keyboard and browser bars cover part of the screen
    const vv = window.visualViewport, el = back.current; if (!vv || !el) return;
    const fit = () => { el.style.height = vv.height + 'px'; el.style.top = vv.offsetTop + 'px'; };
    fit(); vv.addEventListener('resize', fit); vv.addEventListener('scroll', fit);
    return () => { vv.removeEventListener('resize', fit); vv.removeEventListener('scroll', fit); };
  }, []);
  return (<div className="ad-back" ref={back} onMouseDown={e => e.target === e.currentTarget && close.current()}>
    <div className={'ad-md' + (wide ? ' wide' : '')} role="dialog" aria-modal="true" aria-label={title} ref={ref} tabIndex={-1}>
      <header><h3>{title}</h3><button className="ad-x" onClick={() => close.current()} aria-label="إغلاق">×</button></header>
      <div className="ad-mbody">{children}</div>
      {footer && <footer>{footer}</footer>}
    </div></div>);
}
export function Confirm({ text, onYes, onNo, yes = 'حذف' }) {
  return (<Modal title="تأكيد" onClose={onNo} footer={<><button className="ad-btn" onClick={onNo}>إلغاء</button><button className="ad-btn danger" onClick={onYes}>{yes}</button></>}><p>{text}</p></Modal>);
}
export const Field = ({ label, hint, children }) => <label className="ad-fld"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
export const Check = ({ label, ...p }) => <label className="ad-chk"><input type="checkbox" {...p} /> {label}</label>;
export const Pill = ({ tone = 'gray', children }) => <span className={`ad-pill ${tone}`}>{children}</span>;
export const Empty = ({ children }) => <div className="ad-empty">{children}</div>;
export const PageHead = ({ title, sub, action }) => (<div className="ad-ph"><div><h2>{title}</h2>{sub && <p className="ad-dim">{sub}</p>}</div>{action}</div>);

const PATHS = {
  home: 'M3 11l9-8 9 8M5 10v10h14V10', orders: 'M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10',
  products: 'M8 3l-5 4 3 3 2-1v12h8V9l2 1 3-3-5-4a4 4 0 01-8 0z', categories: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  collections: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5', coupons: 'M3 12V4h8l10 10-8 8L3 12zM7.5 8.5h.01',
  reviews: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z', settings: 'M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M14 4v4M8 10v4M16 16v4',
  menu: 'M4 7h16M4 12h16M4 17h16', chart: 'M4 20V10M10 20V4M16 20v-8M22 20H2', out: 'M10 4H5v16h5M16 8l4 4-4 4M20 12H9',
};
export const Icon = ({ n, size = 20 }) => <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={PATHS[n]} /></svg>;

/* Link name made automatically from the English name, so the owner never has to think about it. */
export const makeSlug = (name, taken = []) => {
  let base = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 28);
  if (base.length < 2) base = 'item';
  let s = base, n = 2; while (taken.includes(s)) s = `${base}-${n++}`; return s;
};

/* A list of short values (sizes, colours): type, press add, remove with the x. `suggest` is a row of one-tap shortcuts. */
export function TagInput({ value, onChange, placeholder, suggest = [], label = x => x }) {
  const [t, setT] = useState('');
  const add = v => { v = String(v).trim(); if (v && !value.includes(v)) onChange([...value, v]); setT(''); };
  return (<div className="ad-tags">
    {value.length > 0 && <div className="ad-taglist">{value.map(x => <span key={x}>{label(x)}<button type="button" onClick={() => onChange(value.filter(y => y !== x))} aria-label="حذف">×</button></span>)}</div>}
    <div className="ad-tagadd"><input value={t} placeholder={placeholder} onChange={e => setT(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(t); } }} />
      <button type="button" className="ad-btn" onClick={() => add(t)}>إضافة</button></div>
    {suggest.filter(([, v]) => !value.includes(v)).length > 0 && <div className="ad-sugg"><small className="ad-dim">اختصارات:</small>
      {suggest.filter(([, v]) => !value.includes(v)).map(([l, v]) => <button type="button" key={v} onClick={() => add(v)}>+ {l}</button>)}</div>}
  </div>);
}
