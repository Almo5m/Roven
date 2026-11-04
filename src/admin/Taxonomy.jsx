import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { uploadImage } from '../lib/cloudinary.js';
/* One editor for both categories and collections. `rich` adds the description and the "show on home" switch (collections). */
const EMPTY = { slug: '', name_en: '', name_ar: '', description_en: '', description_ar: '', image: '', sort: 0, active: true, on_home: true };

export default function Taxonomy({ table, title, rich }) {
  const [items, setItems] = useState([]), [f, setF] = useState(EMPTY), [editing, setEditing] = useState(false), [msg, setMsg] = useState('');
  const load = useCallback(async () => { const { data } = await supabase.from(table).select('*').order('sort'); setItems(data || []); }, [table]);
  useEffect(() => { setF(EMPTY); setEditing(false); load(); }, [load]);
  const set = k => e => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const pick = async e => {
    const file = e.target.files[0]; if (!file) return; setMsg('Uploading…');
    const url = await uploadImage(file); if (!url) return setMsg('Upload failed. Use a JPG, PNG or WebP under 3 MB.');
    setF(x => ({ ...x, image: url })); setMsg('');
  };
  const save = async e => {
    e.preventDefault();
    const slug = f.slug.trim().toLowerCase();
    if (!/^[a-z0-9-]{2,30}$/.test(slug)) return setMsg('Link name: 2 to 30 letters, numbers or dashes.');
    if (!f.name_en.trim() || !f.name_ar.trim()) return setMsg('Fill both names.');
    const row = { slug, name_en: f.name_en.trim().slice(0, 60), name_ar: f.name_ar.trim().slice(0, 60), image: f.image || null, sort: parseInt(f.sort, 10) || 0, active: f.active };
    if (rich) Object.assign(row, { description_en: f.description_en.trim().slice(0, 300), description_ar: f.description_ar.trim().slice(0, 300), on_home: f.on_home });
    const { error } = await supabase.from(table).upsert(row);
    if (error) return setMsg('Could not save.');
    setMsg('Saved.'); setF(EMPTY); setEditing(false); load();
  };
  const del = async s => { if (!window.confirm('Delete this? Products keep working but lose the link to it.')) return; await supabase.from(table).delete().eq('slug', s); load(); };
  return (<><h2>{title}</h2>
    <div className="ad-list">{!items.length && <p className="ad-dim">Nothing here yet.</p>}{items.map(c => (
      <div className="ad-prod" key={c.slug}>{c.image ? <img src={c.image} alt="" /> : <span className="ph" />}
        <strong>{c.name_en} · {c.name_ar}</strong><small>{c.active ? 'Live' : 'Hidden'}</small>
        <button className="ad-btn" onClick={() => { setF({ ...EMPTY, ...c, image: c.image || '' }); setEditing(true); setMsg(''); }}>Edit</button>
        <button className="ad-btn" onClick={() => del(c.slug)}>Delete</button></div>))}</div>
    <h2>{editing ? 'Edit' : 'Add'}</h2>
    <form className="ad-form" onSubmit={save}>
      <label>Link name (letters, numbers, dashes. Cannot change later)<input value={f.slug} onChange={set('slug')} disabled={editing} maxLength={30} /></label>
      <label>Name (English)<input value={f.name_en} onChange={set('name_en')} maxLength={60} /></label>
      <label>Name (Arabic)<input value={f.name_ar} onChange={set('name_ar')} maxLength={60} dir="rtl" /></label>
      {rich && <><label>Description (English)<textarea rows={2} maxLength={300} value={f.description_en} onChange={set('description_en')} /></label>
        <label>Description (Arabic)<textarea rows={2} maxLength={300} dir="rtl" value={f.description_ar} onChange={set('description_ar')} /></label>
        <label className="chk"><input type="checkbox" checked={f.on_home} onChange={set('on_home')} /> Show on the home page</label></>}
      <label>Cover photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} /></label>
      {f.image && <div className="ad-thumbs"><span><img src={f.image} alt="" /><button type="button" onClick={() => setF({ ...f, image: '' })}>×</button></span></div>}
      <label>Order in the list<input type="number" value={f.sort} onChange={set('sort')} /></label>
      <label className="chk"><input type="checkbox" checked={f.active} onChange={set('active')} /> Visible in the store</label>
      {msg && <p className={msg === 'Saved.' ? 'ad-dim' : 'ad-err'} role="status">{msg}</p>}
      <div className="ad-row"><button className="ad-btn primary" type="submit">Save</button>
        {editing && <button className="ad-btn" type="button" onClick={() => { setF(EMPTY); setEditing(false); }}>Cancel</button>}</div>
    </form></>);
}
