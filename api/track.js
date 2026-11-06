/* Receives a page view from the browser, adds the visitor's country (from Vercel's request header, never stored with an IP) and passes it to Supabase. */
const URL_ = process.env.VITE_SUPABASE_URL, KEY = process.env.VITE_SUPABASE_ANON_KEY;
const BOTS = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|headless|lighthouse|pingdom|uptime|monitor/i;

export default async function handler(req, res) {
  res.status(204);
  if (req.method !== 'POST' || !URL_ || !KEY) return res.end();
  const origin = req.headers.origin;
  try { if (origin && new URL(origin).host !== req.headers.host) return res.end(); } catch { return res.end(); }
  if (BOTS.test(req.headers['user-agent'] || '')) return res.end();
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { return res.end(); } }
  if (!b || typeof b !== 'object') return res.end();
  const country = String(req.headers['x-vercel-ip-country'] || '').toUpperCase().slice(0, 2);
  try {
    await fetch(`${URL_}/rest/v1/rpc/track_view`, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_path: String(b.path || '').slice(0, 160), p_lang: b.lang, p_ref: String(b.ref || '').slice(0, 100), p_device: b.device, p_country: country || null, p_sid: String(b.sid || '').slice(0, 40) }) });
  } catch { /* statistics must never break the site */ }
  res.end();
}
