import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { stripLang, langOf, withLang } from './seo-core.js';
/* Clean URLs without a router library. English lives at /shop, Arabic at /ar/shop. */
export { stripLang, langOf, withLang };
export const LangContext = createContext('en');
/* to('/shop') gives '/shop' on the English site and '/ar/shop' on the Arabic site. */
export const useTo = () => { const lang = useContext(LangContext); return useCallback(p => withLang(p, lang), [lang]); };

export function navigate(to, { replace = false } = {}) {
  history[replace ? 'replaceState' : 'pushState'](null, '', to);
  dispatchEvent(new Event('roven:nav'));
  scrollTo(0, 0);
}
export function usePath() {
  const [p, setP] = useState(location.pathname);
  useEffect(() => { const f = () => setP(location.pathname); addEventListener('popstate', f); addEventListener('roven:nav', f); return () => { removeEventListener('popstate', f); removeEventListener('roven:nav', f); }; }, []);
  return p;
}
/* Turns ordinary same-site <a href> clicks into in-app navigation, so every link stays a real link for Google. */
export function useLinkClicks() {
  useEffect(() => {
    const f = e => {
      if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest?.('a'); if (!a || a.target || a.hasAttribute('download')) return;
      const u = new URL(a.href, location.href); if (u.origin !== location.origin) return;
      e.preventDefault(); navigate(u.pathname + u.search + u.hash);
    };
    document.addEventListener('click', f); return () => document.removeEventListener('click', f);
  }, []);
}
