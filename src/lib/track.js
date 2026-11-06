/* Anonymous visit counting for the dashboard. Skips the owner's browser, bots, "Do Not Track", the dashboard and private review links. */
let last = '';
const safe = (f, d = null) => { try { return f(); } catch { return d; } };
const sessionId = () => safe(() => {
  let s = sessionStorage.getItem('roven-sid');
  if (!s) { s = crypto.randomUUID().replace(/-/g, '').slice(0, 20); sessionStorage.setItem('roven-sid', s); }
  return s;
});

export function trackView(path, lang, page) {
  if (page === 'admin' || page === 'review' || page === 'notfound') return;
  if (navigator.doNotTrack === '1' || navigator.webdriver || safe(() => localStorage.getItem('roven-no-track'))) return;
  const key = path + lang; if (key === last) return; last = key;
  const sid = sessionId(); if (!sid) return;
  // the referring site only counts for the first page of a visit
  const first = !safe(() => sessionStorage.getItem('roven-ref'));
  safe(() => sessionStorage.setItem('roven-ref', '1'));
  const ref = first ? safe(() => { const h = new URL(document.referrer).hostname; return h && h !== location.hostname ? h : ''; }, '') : '';
  const device = innerWidth < 700 ? 'mobile' : innerWidth < 1100 ? 'tablet' : 'desktop';
  const body = JSON.stringify({ path, lang, ref, device, sid });
  if (navigator.sendBeacon) navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
  else fetch('/api/track', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
}
