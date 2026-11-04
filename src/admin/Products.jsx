import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { uploadImage } from '../lib/cloudinary.js';
import { Modal, Confirm, Field, Check, Pill, Empty, PageHead, money } from './ui.jsx';

const EMPTY = { id: '', name_en: '', name_ar: '', description_en: '', description_ar: '', price: 0, sizes: 'S, M, L, XL', colors: 'Black', stock: '',
  category: 'other', collections: [], featured: false, active: true, sort: 0, images: [] };
const list = s => String(s).split(/[,،]/).map(x => x.trim()).filter(Boolean);
const parseStock = s => s.trim() ? Object.fromEntries(list(s).map(x => x.split(':').map(y => y.trim())).filter(([k, v]) => k && /^\d+$/.test(v)).map(([k, v]) => [k, +v])) : null;
const stockText = st => st ? Object.entries(st).map(([k, v]) => `${k}:${v}`).join(', ') : '';

export default function Products({ notify }) {
  const [items, setItems] = useState([]), [cats, setCats] = useState([]), [cols, setCols] = useState([]);
  const [f, setF] = useState(null), [isNew, setIsNew] = useState(false), [err, setErr] = useState(''), [busy, setBusy] = useState(false), [ask, setAsk] = useState(false), [q, setQ] = useState('');
  const load = useCallback(async () => { const { data } = await supabase.from('products').select('*').order('sort'); setItems(data || []); }, []);
  useEffect(() => {
    load();
    supabase.from('categories').select('slug,name_ar').order('sort').then(({ data }) => setCats(data || []));
    supabase.from('collections').select('slug,name_ar').order('sort').then(({ data }) => setCols(data || []));
  }, [load]);

  const openNew = () => { setF(EMPTY); setIsNew(true); setErr(''); };
  const openEdit = p => { setF({ ...EMPTY, ...p, sizes: p.sizes.join(', '), colors: p.colors.join(', '), stock: stockText(p.stock), collections: p.collections || [], images: p.images || [] }); setIsNew(false); setErr(''); };
  const set = k => e => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const upload = async e => {
    const files = [...e.target.files]; e.target.value = ''; if (!files.length) return;
    setBusy(true); setErr('');
    for (const file of files) {
      if (f.images.length >= 8) break;
      const url = await uploadImage(file);
      if (!url) { setErr('فشل رفع صورة. استخدم JPG أو PNG أو WebP أقل من 3 ميجا.'); break; }
      setF(x => ({ ...x, images: [...x.images, url] }));
    }
    setBusy(false);
  };
  const save = async () => {
    const id = f.id.trim().toLowerCase();
    if (!/^[a-z0-9-]{2,40}$/.test(id)) return setErr('الرابط: من ٢ إلى ٤٠ حرف إنجليزي أو رقم أو شرطة.');
    const row = { id, name_en: f.name_en.trim().slice(0, 80), name_ar: f.name_ar.trim().slice(0, 80), description_en: f.description_en.trim().slice(0, 600), description_ar: f.description_ar.trim().slice(0, 600),
      price: Math.max(0, parseInt(f.price, 10) || 0), sizes: list(f.sizes), colors: list(f.colors), stock: parseStock(f.stock), category: f.category || 'other',
      collections: f.collections, featured: f.featured, active: f.active, sort: parseInt(f.sort, 10) || 0, images: f.images };
    if (!row.name_en || !row.name_ar || !row.sizes.length || !row.colors.length) return setErr('أكمل الاسمين والمقاسات والألوان.');
    setBusy(true); const { error } = await supabase.from('products').upsert(row); setBusy(false);
    if (error) return setErr('تعذر حفظ المنتج.');
    notify('تم حفظ المنتج.'); setF(null); load();
  };
  const remove = async () => { const { error } = await supabase.from('products').delete().eq('id', f.id); setAsk(false);
    if (error) return notify('تعذر حذف المنتج.', 'err'); notify('تم حذف المنتج.'); setF(null); load(); };

  const shown = items.filter(p => !q || (p.name_ar + p.name_en + p.id).toLowerCase().includes(q.toLowerCase()));
  return (<>
    <PageHead title="المنتجات" sub={`${items.length} منتج`} action={<button className="ad-btn primary" onClick={openNew}>+ منتج جديد</button>} />
    <input className="ad-search" placeholder="ابحث عن منتج…" value={q} onChange={e => setQ(e.target.value)} />
    {!shown.length ? <Empty>{items.length ? 'لا نتائج.' : 'لا توجد منتجات بعد. اضغط "منتج جديد" لإضافة أول منتج.'}</Empty> :
      <div className="ad-grid">{shown.map(p => (<button key={p.id} className="ad-pcard" onClick={() => openEdit(p)}>
        <div className="ad-pimg">{p.images?.[0] ? <img src={p.images[0]} alt="" loading="lazy" /> : <span>لا صورة</span>}</div>
        <b>{p.name_ar}</b><span>{p.price > 0 ? money(p.price) : 'بدون سعر'}</span>
        <div className="ad-row"><Pill tone={p.active ? 'green' : 'gray'}>{p.active ? 'ظاهر' : 'مخفي'}</Pill>
          <small className="ad-dim">{p.stock ? `مخزون: ${Object.values(p.stock).reduce((a, b) => a + b, 0)}` : 'مخزون غير محدد'}</small></div></button>))}</div>}

    {f && <Modal wide title={isNew ? 'منتج جديد' : 'تعديل المنتج'} onClose={() => setF(null)} footer={<>
      {!isNew && <button className="ad-btn danger ad-start" onClick={() => setAsk(true)}>حذف</button>}
      <button className="ad-btn" onClick={() => setF(null)}>إلغاء</button><button className="ad-btn primary" disabled={busy} onClick={save}>{busy ? 'جاري…' : 'حفظ'}</button></>}>
      <h4>المعلومات الأساسية</h4>
      <div className="ad-two"><Field label="الاسم بالعربي"><input value={f.name_ar} onChange={set('name_ar')} maxLength={80} /></Field>
        <Field label="الاسم بالإنجليزي"><input value={f.name_en} onChange={set('name_en')} maxLength={80} dir="ltr" /></Field></div>
      <Field label="رابط المنتج" hint="حروف إنجليزية وأرقام وشرطات. لا يمكن تغييره بعد الحفظ."><input value={f.id} onChange={set('id')} disabled={!isNew} maxLength={40} dir="ltr" /></Field>
      <div className="ad-two"><Field label="الوصف بالعربي"><textarea rows={3} maxLength={600} value={f.description_ar} onChange={set('description_ar')} /></Field>
        <Field label="الوصف بالإنجليزي"><textarea rows={3} maxLength={600} value={f.description_en} onChange={set('description_en')} dir="ltr" /></Field></div>
      <h4>السعر والمتغيرات</h4>
      <div className="ad-two"><Field label="السعر (ج.م)"><input type="number" min="0" value={f.price} onChange={set('price')} /></Field>
        <Field label="الترتيب في القائمة"><input type="number" value={f.sort} onChange={set('sort')} /></Field></div>
      <div className="ad-two"><Field label="المقاسات" hint="مفصولة بفاصلة"><input value={f.sizes} onChange={set('sizes')} dir="ltr" /></Field>
        <Field label="الألوان" hint="مفصولة بفاصلة"><input value={f.colors} onChange={set('colors')} dir="ltr" /></Field></div>
      <Field label="المخزون لكل مقاس" hint="مثال: S:10, M:5. اتركه فارغًا لعدم تتبع المخزون."><input value={f.stock} onChange={set('stock')} dir="ltr" /></Field>
      <h4>التصنيف والظهور</h4>
      <Field label="الصنف"><select value={f.category} onChange={set('category')}><option value="other">أخرى</option>{cats.map(c => <option key={c.slug} value={c.slug}>{c.name_ar}</option>)}</select></Field>
      {cols.length > 0 && <div className="ad-fld"><span>الكوليكشنات</span><div className="ad-checks">{cols.map(c => <Check key={c.slug} label={c.name_ar} checked={f.collections.includes(c.slug)}
        onChange={e => setF({ ...f, collections: e.target.checked ? [...f.collections, c.slug] : f.collections.filter(x => x !== c.slug) })} />)}</div></div>}
      <div className="ad-checks"><Check label="ظاهر في المتجر" checked={f.active} onChange={set('active')} /><Check label="يظهر في الصفحة الرئيسية" checked={f.featured} onChange={set('featured')} /></div>
      <h4>الصور (حتى ٨)</h4>
      <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={upload} disabled={busy || f.images.length >= 8} />
      <div className="ad-thumbs">{f.images.map((u, i) => <span key={u}><img src={u} alt="" />{i === 0 && <em>الرئيسية</em>}<button type="button" onClick={() => setF({ ...f, images: f.images.filter(x => x !== u) })} aria-label="حذف الصورة">×</button></span>)}</div>
      {err && <p className="ad-err" role="alert">{err}</p>}
    </Modal>}
    {ask && <Confirm text="هل تريد حذف هذا المنتج نهائيًا؟" onNo={() => setAsk(false)} onYes={remove} />}
  </>);
}
