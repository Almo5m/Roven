import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { uploadImage } from '../lib/cloudinary.js';
const local = iso => { const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16); };
const NUM = [['shipping_fee', 'Shipping fee (EGP)'], ['free_shipping_over', 'Free shipping above (EGP, 0 means never)']];
const TEXT = [
  ['announcement_en', 'Top bar message (English), empty uses the default', 1], ['announcement_ar', 'Top bar message (Arabic)', 1],
  ['transfer_info', 'Transfer details shown to customers (InstaPay, wallet, bank)', 4],
  ['about_en', 'About page (English). The first line also shows on the home page', 5], ['about_ar', 'About page (Arabic)', 5],
  ['faq_en', 'FAQ (English). One per line: Question || Answer', 6], ['faq_ar', 'FAQ (Arabic). One per line: Question || Answer', 6],
  ['size_chart', 'Size chart. One row per line, cells separated by |, first line is the header. Example: Size | Chest | Length', 6]];
const LINKS = [['instagram', 'Instagram link (https://…)'], ['tiktok', 'TikTok link (https://…)']];

export default function Settings() {
  const [f, setF] = useState({}), [look, setLook] = useState([]), [msg, setMsg] = useState('');
  useEffect(() => { supabase.from('settings').select('key,value').then(({ data }) => {
    const v = Object.fromEntries((data || []).map(r => [r.key, r.value]));
    const next = { drop_date: v.drop_date ? local(v.drop_date) : '' };
    [...NUM, ...TEXT, ...LINKS].forEach(([k]) => { next[k] = v[k] ?? (NUM.some(n => n[0] === k) ? 0 : ''); });
    setF(next); setLook(Array.isArray(v.lookbook) ? v.lookbook : []); }); }, []);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const addLook = async e => {
    const file = e.target.files[0]; if (!file || look.length >= 8) return;
    setMsg('Uploading…'); const url = await uploadImage(file);
    if (!url) return setMsg('Upload failed. Use a JPG, PNG or WebP under 3 MB.'); setLook([...look, url]); setMsg('');
  };
  const save = async e => {
    e.preventDefault();
    if (f.drop_date && isNaN(new Date(f.drop_date))) return setMsg('Pick a valid release date, or clear it.');
    if (LINKS.some(([k]) => f[k].trim() && !/^https:\/\//.test(f[k].trim()))) return setMsg('Social links must start with https://');
    const rows = [{ key: 'drop_date', value: f.drop_date ? new Date(f.drop_date).toISOString() : '' }, { key: 'lookbook', value: look },
      ...NUM.map(([k]) => ({ key: k, value: Math.max(0, parseInt(f[k], 10) || 0) })),
      ...TEXT.map(([k]) => ({ key: k, value: String(f[k] ?? '').trim().slice(0, 4000) })),
      ...LINKS.map(([k]) => ({ key: k, value: f[k].trim().slice(0, 200) }))];
    const { error } = await supabase.from('settings').upsert(rows);
    setMsg(error ? 'Could not save.' : 'Saved.');
  };
  return (<><h2>Store settings</h2>
    <form className="ad-form" onSubmit={save}>
      {NUM.map(([k, l]) => <label key={k}>{l}<input type="number" min="0" value={f[k] ?? 0} onChange={set(k)} /></label>)}
      {TEXT.map(([k, l, r]) => <label key={k}>{l}<textarea rows={r} maxLength={4000} value={f[k] ?? ''} onChange={set(k)} /></label>)}
      {LINKS.map(([k, l]) => <label key={k}>{l}<input value={f[k] ?? ''} onChange={set(k)} maxLength={200} /></label>)}
      <label>Next release date (optional). The countdown shows on the home page only while this date is in the future<input type="datetime-local" value={f.drop_date ?? ''} onChange={set('drop_date')} /></label>
      <label>Lookbook photos (up to 8)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={addLook} /></label>
      <div className="ad-thumbs">{look.map(u => <span key={u}><img src={u} alt="" /><button type="button" onClick={() => setLook(look.filter(x => x !== u))}>×</button></span>)}</div>
      {msg && <p className={msg === 'Saved.' ? 'ad-dim' : 'ad-err'} role="status">{msg}</p>}
      <button className="ad-btn primary" type="submit">Save settings</button></form></>);
}
