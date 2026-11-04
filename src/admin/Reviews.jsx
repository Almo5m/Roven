import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { Modal, Confirm, Field, Pill, Empty, PageHead } from './ui.jsx';
/* Only real customer feedback should go here. Nothing is shown on the site until you add it. */
export default function Reviews({ notify }) {
  const [items, setItems] = useState([]), [f, setF] = useState(null), [err, setErr] = useState(''), [del, setDel] = useState(null);
  const load = useCallback(async () => { const { data } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false }); setItems(data || []); }, []);
  useEffect(() => { load(); }, [load]);
  const add = async () => {
    const name = f.name.trim().slice(0, 60), text = f.text.trim().slice(0, 400), rating = parseInt(f.rating, 10);
    if (!name || !text || !(rating >= 1 && rating <= 5)) return setErr('اكتب الاسم والنص وتقييمًا من ١ إلى ٥.');
    const { error } = await supabase.from('testimonials').insert({ name, text, rating });
    if (error) return setErr('تعذرت الإضافة.'); notify('تمت إضافة الرأي.'); setF(null); load();
  };
  const toggle = async r => { await supabase.from('testimonials').update({ active: !r.active }).eq('id', r.id); load(); };
  const remove = async () => { await supabase.from('testimonials').delete().eq('id', del.id); setDel(null); notify('تم الحذف.'); load(); };
  return (<>
    <PageHead title="آراء العملاء" sub="أضف آراء حقيقية فقط. القسم يختفي من الموقع طالما لا توجد آراء." action={<button className="ad-btn primary" onClick={() => { setF({ name: '', rating: 5, text: '' }); setErr(''); }}>+ رأي جديد</button>} />
    {!items.length ? <Empty>لا توجد آراء بعد، لذلك القسم مخفي في الموقع.</Empty> : <div className="ad-stack">{items.map(r => (
      <div className="ad-panel" key={r.id}><div className="ad-row"><b>{r.name} · {'★'.repeat(r.rating)}</b><Pill tone={r.active ? 'green' : 'gray'}>{r.active ? 'ظاهر' : 'مخفي'}</Pill></div>
        <p>{r.text}</p><div className="ad-acts"><button className="ad-btn" onClick={() => toggle(r)}>{r.active ? 'إخفاء' : 'إظهار'}</button><button className="ad-btn danger" onClick={() => setDel(r)}>حذف</button></div></div>))}</div>}
    {f && <Modal title="رأي جديد" onClose={() => setF(null)} footer={<><button className="ad-btn" onClick={() => setF(null)}>إلغاء</button><button className="ad-btn primary" onClick={add}>إضافة</button></>}>
      <Field label="اسم العميل"><input value={f.name} maxLength={60} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
      <Field label="التقييم (١ إلى ٥)"><input type="number" min="1" max="5" value={f.rating} onChange={e => setF({ ...f, rating: e.target.value })} /></Field>
      <Field label="ماذا قال"><textarea rows={4} maxLength={400} value={f.text} onChange={e => setF({ ...f, text: e.target.value })} /></Field>
      {err && <p className="ad-err" role="alert">{err}</p>}</Modal>}
    {del && <Confirm text="حذف هذا الرأي؟" onNo={() => setDel(null)} onYes={remove} />}
  </>);
}
