/* Helpers shared by the Vercel functions. Reads public data through Supabase's REST API with the public anon key (Row Level Security applies). */
const URL_ = process.env.VITE_SUPABASE_URL, KEY = process.env.VITE_SUPABASE_ANON_KEY;
export const db = async q => {
  if (!URL_ || !KEY) return [];
  try { const r = await fetch(`${URL_}/rest/v1/${q}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }); return r.ok ? await r.json() : []; } catch { return []; }
};
export const origin = req => `https://${req.headers['x-forwarded-host'] || req.headers.host}`;
export const siteOf = req => (process.env.VITE_SITE_URL || origin(req)).replace(/\/$/, '');
export const ID = /^[a-z0-9-]{1,60}$/;
