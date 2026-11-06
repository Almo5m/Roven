import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { uploadImage } from '../lib/cloudinary.js';
import { COLOR_AR } from '../lib/catalog.js';
import { Modal, Confirm, Field, Check, Pill, Empty, PageHead, TagInput, makeSlug, money } from './ui.jsx';

const EMPTY = { id: '', name_en: '', name_ar: '', description_en: '', description_ar: '', price: 0, sizes: ['S', 'M', 'L', 'XL'], colors: ['Black'],
  track: false, stock: {}, category: 'other', collections: [], featured: false, active: true, sort: 0, images: [] };
const SIZE_SUGG = ['S', 'M', 'L', 'XL', 'XXL', 'Free Size'].map(x => [x, x]);
const COLOR_SUGG = [['أسود', 'Black'], ['أبيض', 'White'], ['رمادي', 'Grey'], ['فضي', 'Silver'], ['كحلي', 'Navy'], ['بيج', 'Beige']];
const colorLabel = c => COLOR_AR[c.toLowerCase()] ? `${COLOR_AR[c.toLowerCase()]} (${c})` : c;

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
  const openEdit = p => { setF({ ...EMPTY, ...p, track: !!p.stock, stock: p.stock || {}, collections: p.collections || [], images: p.images || [] }); setIsNew(false); setErr(''); };
  const set = k => e => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const upload = async e => {
    const files = [...e.target.files]; e.target.value = ''; if (!files.length) return;
    setBusy(true); setErr('');
    let count = f.images.length;
    for (const file of files) {
      if (count >= 8) { setErr('الحد الأقصى ٨ صور.'); break; }
      try { const url = await uploadImage(file); count++; setF(x => ({ ...x, images: [...x.images, url] })); }
      catch (e2) { setErr(e2.message); break; }
    }
    setBusy(false);
  };
  const save = async () => {
    if (!f.name_ar.trim() || !f.name_en.trim()) return setErr('اكتب اسم المنتج بالعربي والإنجليزي.');
    if (!f.sizes.length || !f.colors.length) return setErr('أضف مقاسًا واحدًا ولونًا واحدًا على الأقل.');
    const id = isNew ? makeSlug(f.name_en, items.map(i => i.id)) : f.id;
    const row = { id, name_en: f.name_en.trim().slice(0, 80), name_ar: f.name_ar.trim().slice(0, 80), description_en: f.description_en.trim().slice(0, 600), description_ar: f.description_ar.trim().slice(0, 600),
      price: Math.max(0, parseInt(f.price, 10) || 0), sizes: f.sizes, colors: f.colors,
      stock: f.track ? Object.fromEntries(f.sizes.map(s => [s, Math.max(0, parseInt(f.stock[s], 10) || 0)])) : null,
      category: f.category || 'other', collections: f.collections, featured: f.featured, active: f.active, sort: parseInt(f.sort, 10) || 0, images: f.images };
    setBusy(true); const { error } = await supabase.from('products').upsert(row); setBusy(false);
    if (error) return setErr('تعذر حفظ المنتج.');
    notify('تم حفظ المنتج.'); setF(null); load();
  };
  const remove = async () => { const { error } = await supabase.from('products').delete().eq('id', f.id); setAsk(false);
    if (error) return notify('تعذر حذف المنتج.', 'err'); notify('تم حذف المنتج.'); setF(null); load(); };

  const shown = items.filter(p => !q || (p.name_ar + p.name_en).toLowerCase().includes(q.toLowerCase()));
  return (<>
    <PageHead title="المنتجات" sub={`${items.length} منتج`} action={<button className="ad-btn primary" onClick={openNew}>+ منتج جديد</button>} />
    <input className="ad-search" placeholder="ابحث عن منتج…" value={q} onChange={e => setQ(e.target.value)} />
    {!shown.length ? <Empty>{items.length ? 'لا نتائج.' : 'لا توجد منتجات بعد. اضغط "منتج جديد" لإضافة أول منتج.'}</Empty> :
      <div className="ad-grid">{shown.map(p => (<button key={p.id} className="ad-pcard" onClick={() => openEdit(p)}>
        <div className="ad-pimg">{p.images?.[0] ? <img src={p.images[0]} alt="" loading="lazy" /> : <span>لا صورة</span>}</div>
        <b>{p.name_ar}</b><span>{p.price > 0 ? money(p.price) : 'بدون سعر'}</span>
        <div className="ad-row"><Pill tone={p.active ? 'green' : 'gray'}>{p.active ? 'ظاهر' : 'مخفي'}</Pill>
          <small className="ad-dim">{p.stock ? `المخزون: ${Object.values(p.stock).reduce((a, b) => a + b, 0)}` : 'المخزون غير محدد'}</small></div></button>))}</div>}

    {f && <Modal wide title={isNew ? 'منتج جديد' : 'تعديل المنتج'} onClose={() => setF(null)} footer={<>
      {!isNew && <button className="ad-btn danger ad-start" onClick={() => setAsk(true)}>حذف</button>}
      <button className="ad-btn" onClick={() => setF(null)}>إلغاء</button><button className="ad-btn primary" disabled={busy} onClick={save}>{busy ? 'جاري…' : 'حفظ'}</button></>}>
      <h4>المعلومات الأساسية</h4>
      <div className="ad-two"><Field label="اسم المنتج بالعربي"><input value={f.name_ar} onChange={set('name_ar')} maxLength={80} /></Field>
        <Field label="اسم المنتج بالإنجليزي"><input value={f.name_en} onChange={set('name_en')} maxLength={80} dir="ltr" /></Field></div>
      <div className="ad-two"><Field label="الوصف بالعربي" hint="اختياري"><textarea rows={3} maxLength={600} value={f.description_ar} onChange={set('description_ar')} /></Field>
        <Field label="الوصف بالإنجليزي" hint="اختياري"><textarea rows={3} maxLength={600} value={f.description_en} onChange={set('description_en')} dir="ltr" /></Field></div>
      <h4>السعر والمقاسات والألوان</h4>
      <Field label="السعر (ج.م)"><input type="number" min="0" value={f.price} onChange={set('price')} /></Field>
      <Field label="المقاسات المتاحة" hint="اكتب المقاس واضغط إضافة، أو اضغط على اختصار."><TagInput value={f.sizes} onChange={v => setF({ ...f, sizes: v })} placeholder="مثال: M" suggest={SIZE_SUGG} /></Field>
      <Field label="الألوان المتاحة" hint="الألوان بالإنجليزي بتظهر للعميل بالعربي تلقائيًا في الموقع العربي."><TagInput value={f.colors} onChange={v => setF({ ...f, colors: v })} placeholder="مثال: Black" suggest={COLOR_SUGG} label={colorLabel} /></Field>
      <Check label="تتبع الكمية المتاحة من كل مقاس" checked={f.track} onChange={set('track')} />
      {f.track && <div className="ad-stockgrid">{f.sizes.map(s => <Field key={s} label={`كمية ${s}`}><input type="number" min="0" value={f.stock[s] ?? 0} onChange={e => setF({ ...f, stock: { ...f.stock, [s]: e.target.value } })} /></Field>)}</div>}
      <h4>التصنيف والظهور</h4>
      <Field label="الصنف" hint="نوع القطعة، مثل هوديز أو بنطلونات."><select value={f.category} onChange={set('category')}><option value="other">أخرى</option>{cats.map(c => <option key={c.slug} value={c.slug}>{c.name_ar}</option>)}</select></Field>
      {cols.length > 0 && <div className="ad-fld"><span>الكوليكشنات</span><small className="ad-dim">اختياري. القطعة ممكن تكون في أكتر من كوليكشن.</small><div className="ad-checks">{cols.map(c => <Check key={c.slug} label={c.name_ar} checked={f.collections.includes(c.slug)}
        onChange={e => setF({ ...f, collections: e.target.checked ? [...f.collections, c.slug] : f.collections.filter(x => x !== c.slug) })} />)}</div></div>}
      <div className="ad-checks"><Check label="ظاهر في المتجر" checked={f.active} onChange={set('active')} /><Check label="يظهر في الصفحة الرئيسية" checked={f.featured} onChange={set('featured')} /></div>
      <Field label="ترتيب المنتج" hint="الرقم الأصغر يظهر أولًا. ممكن تسيبه ٠."><input type="number" value={f.sort} onChange={set('sort')} /></Field>
      <h4>الصور (حتى ٨)</h4>
      <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={upload} disabled={busy || f.images.length >= 8} />
      <div className="ad-thumbs">{f.images.map((u, i) => <span key={u}><img src={u} alt="" />{i === 0 && <em>الرئيسية</em>}<button type="button" onClick={() => setF({ ...f, images: f.images.filter(x => x !== u) })} aria-label="حذف الصورة">×</button></span>)}</div>
      {err && <p className="ad-err" role="alert">{err}</p>}
    </Modal>}
    {ask && <Confirm text="هل تريد حذف هذا المنتج نهائيًا؟" onNo={() => setAsk(false)} onYes={remove} />}
  </>);
}
