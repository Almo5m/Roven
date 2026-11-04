import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { uploadImage } from '../lib/cloudinary.js';
const EMPTY = { id: '', name_en: '', name_ar: '', price: 0, sizes: 'S, M, L, XL', colors: 'Black', stock: '', category: 'other', collections: [], description_en: '', description_ar: '', featured: false, sort: 0, active: true, images: [] };
const parseStock = s => { if (!s.trim()) return null; return Object.fromEntries(list(s).map(x => x.split(':').map(y => y.trim())).filter(([k, v]) => k && /^\d+$/.test(v)).map(([k, v]) => [k, +v])); };
const list = s => String(s).split(',').map(x => x.trim()).filter(Boolean);

export default function Products() {
  const [cats, setCats] = useState([]), [cols, setCols] = useState([]);
  useEffect(() => { supabase.from('categories').select('slug,name_en').order('sort').then(({ data }) => setCats(data || [])); supabase.from('collections').select('slug,name_en').order('sort').then(({ data }) => setCols(data || [])); }, []);
  const [items, setItems] = useState([]), [f, setF] = useState(EMPTY), [msg, setMsg] = useState(''), [editing, setEditing] = useState(false);
  const load = useCallback(async () => { const { data } = await supabase.from('products').select('*').order('sort'); setItems(data || []); }, []);
  useEffect(() => { load(); }, [load]);
  const set = k => e => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const edit = p => { setF({ ...p, sizes: p.sizes.join(', '), colors: p.colors.join(', '), stock: p.stock ? Object.entries(p.stock).map(([k, v]) => `${k}:${v}`).join(', ') : '' }); setEditing(true); setMsg(''); };

  const upload = async e => {
    const file = e.target.files[0]; if (!file) return;
    setMsg('Uploading…');
    const url = await uploadImage(file);
    if (!url) return setMsg('Upload failed. Use a JPG, PNG or WebP under 3 MB.');
    setF(x => ({ ...x, images: [...x.images, url] })); setMsg('');
  };
  const save = async e => {
    e.preventDefault();
    const id = f.id.trim().toLowerCase();
    if (!/^[a-z0-9-]{2,40}$/.test(id)) return setMsg('Id: 2 to 40 letters, numbers or dashes.');
    const row = { id, name_en: f.name_en.trim(), name_ar: f.name_ar.trim(), price: Math.max(0, parseInt(f.price, 10) || 0),
      sizes: list(f.sizes), colors: list(f.colors), stock: parseStock(f.stock), category: (f.category.trim().toLowerCase().slice(0, 30) || 'other'), description_en: f.description_en.trim().slice(0, 600), description_ar: f.description_ar.trim().slice(0, 600), featured: f.featured, collections: f.collections || [], sort: parseInt(f.sort, 10) || 0, active: f.active, images: f.images };
    if (!row.name_en || !row.name_ar || !row.sizes.length || !row.colors.length) return setMsg('Fill the names, sizes and colors.');
    const { error } = await supabase.from('products').upsert(row);
    if (error) return setMsg('Could not save the product.');
    setMsg('Saved.'); setF(EMPTY); setEditing(false); load();
  };
  return (<>
    <h2>Products</h2>
    <div className="ad-list">{items.map(p => (<button key={p.id} className="ad-prod" onClick={() => edit(p)}>
      {p.images?.[0] ? <img src={p.images[0]} alt="" /> : <span className="ph" />}
      <strong>{p.name_en}</strong><span>{p.price} EGP</span><small>{p.active ? 'Live' : 'Hidden'}</small></button>))}</div>
    <h2>{editing ? 'Edit product' : 'Add product'}</h2>
    <form className="ad-form" onSubmit={save}>
      <label>Id (used in the link)<input value={f.id} onChange={set('id')} disabled={editing} maxLength={40} /></label>
      <label>Name (English)<input value={f.name_en} onChange={set('name_en')} maxLength={80} /></label>
      <label>Name (Arabic)<input value={f.name_ar} onChange={set('name_ar')} maxLength={80} dir="rtl" /></label>
      <label>Category<select value={f.category} onChange={set('category')}><option value="other">Other</option>{cats.map(c => <option key={c.slug} value={c.slug}>{c.name_en}</option>)}</select></label>
      {cols.length > 0 && <div className="ad-form"><span className="ad-dim">Collections</span>{cols.map(c => <label className="chk" key={c.slug}><input type="checkbox" checked={(f.collections || []).includes(c.slug)} onChange={e => setF({ ...f, collections: e.target.checked ? [...(f.collections || []), c.slug] : (f.collections || []).filter(x => x !== c.slug) })} /> {c.name_en}</label>)}</div>}
      <label>Description (English)<textarea rows={3} maxLength={600} value={f.description_en} onChange={set('description_en')} /></label>
      <label>Description (Arabic)<textarea rows={3} maxLength={600} dir="rtl" value={f.description_ar} onChange={set('description_ar')} /></label>
      <label className="chk"><input type="checkbox" checked={f.featured} onChange={set('featured')} /> Show on the home page</label>
      <label>Price (EGP)<input type="number" min="0" value={f.price} onChange={set('price')} /></label>
      <label>Sizes, separated by commas<input value={f.sizes} onChange={set('sizes')} /></label>
      <label>Colors, separated by commas<input value={f.colors} onChange={set('colors')} /></label>
      <label>Stock per size, like S:10, M:5 (leave empty to not track)<input value={f.stock} onChange={set('stock')} /></label>
      <label>Order in the list<input type="number" value={f.sort} onChange={set('sort')} /></label>
      <label className="chk"><input type="checkbox" checked={f.active} onChange={set('active')} /> Visible in the store</label>
      <label>Photos<input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} /></label>
      <div className="ad-thumbs">{f.images.map(u => <span key={u}><img src={u} alt="" /><button type="button" onClick={() => setF({ ...f, images: f.images.filter(x => x !== u) })}>×</button></span>)}</div>
      {msg && <p className={msg === 'Saved.' ? 'ad-dim' : 'ad-err'} role="status">{msg}</p>}
      <div className="ad-row"><button className="ad-btn primary" type="submit">Save product</button>
        {editing && <button className="ad-btn" type="button" onClick={() => { setF(EMPTY); setEditing(false); }}>Cancel</button>}</div>
    </form>
  </>);
}
