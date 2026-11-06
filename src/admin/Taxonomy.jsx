import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { uploadImage } from '../lib/cloudinary.js';
import { Modal, Confirm, Field, Check, Pill, Empty, PageHead, makeSlug } from './ui.jsx';
/* One editor for categories and collections. `rich` adds descriptions and the "show on home" switch (collections). */
const EMPTY = { slug: '', name_en: '', name_ar: '', description_en: '', description_ar: '', image: '', sort: 0, active: true, on_home: true };

export default function Taxonomy({ table, title, one, rich, sub, notify }) {
  const [items, setItems] = useState([]), [f, setF] = useState(null), [isNew, setIsNew] = useState(false), [err, setErr] = useState(''), [busy, setBusy] = useState(false), [ask, setAsk] = useState(false);
  const load = useCallback(async () => { const { data } = await supabase.from(table).select('*').order('sort'); setItems(data || []); }, [table]);
  useEffect(() => { load(); }, [load]);
  const set = k => e => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const pick = async e => {
    const file = e.target.files[0]; e.target.value = ''; if (!file) return;
    setBusy(true); setErr('');
    try { const url = await uploadImage(file); setF(x => ({ ...x, image: url })); } catch (e2) { setErr(e2.message); }
    setBusy(false);
  };
  const save = async () => {
    if (!f.name_en.trim() || !f.name_ar.trim()) return setErr('اكتب الاسمين بالعربي والإنجليزي.');
    const slug = isNew ? makeSlug(f.name_en, items.map(i => i.slug)) : f.slug;
    const row = { slug, name_en: f.name_en.trim().slice(0, 60), name_ar: f.name_ar.trim().slice(0, 60), image: f.image || null, sort: parseInt(f.sort, 10) || 0, active: f.active };
    if (rich) Object.assign(row, { description_en: f.description_en.trim().slice(0, 300), description_ar: f.description_ar.trim().slice(0, 300), on_home: f.on_home });
    setBusy(true); const { error } = await supabase.from(table).upsert(row); setBusy(false);
    if (error) return setErr('تعذر الحفظ.'); notify('تم الحفظ.'); setF(null); load();
  };
  const remove = async () => { await supabase.from(table).delete().eq('slug', f.slug); setAsk(false); notify('تم الحذف.'); setF(null); load(); };
  return (<>
    <PageHead title={title} sub={sub} action={<button className="ad-btn primary" onClick={() => { setF(EMPTY); setIsNew(true); setErr(''); }}>+ {one} جديد</button>} />
    {!items.length ? <Empty>لا يوجد شيء هنا بعد.</Empty> : <div className="ad-grid">{items.map(c => (
      <button key={c.slug} className="ad-pcard" onClick={() => { setF({ ...EMPTY, ...c, image: c.image || '' }); setIsNew(false); setErr(''); }}>
        <div className="ad-pimg">{c.image ? <img src={c.image} alt="" loading="lazy" /> : <span>لا صورة</span>}</div>
        <b>{c.name_ar}</b><span className="ad-dim" dir="ltr">{c.name_en}</span><Pill tone={c.active ? 'green' : 'gray'}>{c.active ? 'ظاهر' : 'مخفي'}</Pill></button>))}</div>}
    {f && <Modal title={isNew ? `${one} جديد` : `تعديل ${one}`} onClose={() => setF(null)} footer={<>
      {!isNew && <button className="ad-btn danger ad-start" onClick={() => setAsk(true)}>حذف</button>}
      <button className="ad-btn" onClick={() => setF(null)}>إلغاء</button><button className="ad-btn primary" disabled={busy} onClick={save}>{busy ? 'جاري…' : 'حفظ'}</button></>}>
      <div className="ad-two"><Field label="الاسم بالعربي"><input value={f.name_ar} onChange={set('name_ar')} maxLength={60} /></Field>
        <Field label="الاسم بالإنجليزي"><input value={f.name_en} onChange={set('name_en')} maxLength={60} dir="ltr" /></Field></div>
      {rich && <div className="ad-two"><Field label="الوصف بالعربي"><textarea rows={3} maxLength={300} value={f.description_ar} onChange={set('description_ar')} /></Field>
        <Field label="الوصف بالإنجليزي"><textarea rows={3} maxLength={300} value={f.description_en} onChange={set('description_en')} dir="ltr" /></Field></div>}
      <Field label="صورة الغلاف"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} disabled={busy} /></Field>
      {f.image && <div className="ad-thumbs"><span><img src={f.image} alt="" /><button type="button" onClick={() => setF({ ...f, image: '' })} aria-label="حذف الصورة">×</button></span></div>}
      <Field label="الترتيب" hint="الرقم الأصغر يظهر أولًا. ممكن تسيبه ٠."><input type="number" value={f.sort} onChange={set('sort')} /></Field>
      <div className="ad-checks"><Check label="ظاهر في المتجر" checked={f.active} onChange={set('active')} />{rich && <Check label="يظهر في الصفحة الرئيسية" checked={f.on_home} onChange={set('on_home')} />}</div>
      {err && <p className="ad-err" role="alert">{err}</p>}
    </Modal>}
    {ask && <Confirm text="هل تريد الحذف؟ المنتجات ستبقى لكنها تفقد الارتباط بهذا العنصر." onNo={() => setAsk(false)} onYes={remove} />}
  </>);
}
