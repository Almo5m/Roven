import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { Modal, Confirm, Field, Pill, Empty, PageHead } from './ui.jsx';

export default function Coupons({ notify }) {
  const [items, setItems] = useState([]), [f, setF] = useState(null), [err, setErr] = useState(''), [del, setDel] = useState(null);
  const load = useCallback(async () => { const { data } = await supabase.from('coupons').select('*').order('code'); setItems(data || []); }, []);
  useEffect(() => { load(); }, [load]);
  const add = async () => {
    const code = f.code.trim().toUpperCase(), percent = parseInt(f.percent, 10);
    if (!/^[A-Z0-9]{3,20}$/.test(code) || !(percent >= 1 && percent <= 90)) return setErr('الكود: من ٣ إلى ٢٠ حرف إنجليزي أو رقم. النسبة من ١ إلى ٩٠.');
    const { error } = await supabase.from('coupons').insert({ code, percent, max_uses: f.max_uses ? parseInt(f.max_uses, 10) : null });
    if (error) return setErr('تعذر الإضافة (ربما الكود موجود).'); notify('تمت إضافة الكود.'); setF(null); load();
  };
  const toggle = async c => { await supabase.from('coupons').update({ active: !c.active }).eq('code', c.code); load(); };
  const remove = async () => { await supabase.from('coupons').delete().eq('code', del.code); setDel(null); notify('تم حذف الكود.'); load(); };
  return (<>
    <PageHead title="أكواد الخصم" sub={`${items.length} كود`} action={<button className="ad-btn primary" onClick={() => { setF({ code: '', percent: 10, max_uses: '' }); setErr(''); }}>+ كود جديد</button>} />
    {!items.length ? <Empty>لا توجد أكواد خصم بعد.</Empty> : <div className="ad-stack">{items.map(c => (
      <div className="ad-line" key={c.code}><b dir="ltr">{c.code}</b><span>خصم {c.percent}%</span>
        <span className="ad-dim">استُخدم {c.uses}{c.max_uses ? ` من ${c.max_uses}` : ''}</span><Pill tone={c.active ? 'green' : 'gray'}>{c.active ? 'يعمل' : 'متوقف'}</Pill>
        <span className="ad-acts"><button className="ad-btn" onClick={() => toggle(c)}>{c.active ? 'إيقاف' : 'تشغيل'}</button><button className="ad-btn danger" onClick={() => setDel(c)}>حذف</button></span></div>))}</div>}
    {f && <Modal title="كود خصم جديد" onClose={() => setF(null)} footer={<><button className="ad-btn" onClick={() => setF(null)}>إلغاء</button><button className="ad-btn primary" onClick={add}>إضافة</button></>}>
      <Field label="الكود"><input value={f.code} onChange={e => setF({ ...f, code: e.target.value.toUpperCase() })} maxLength={20} dir="ltr" /></Field>
      <Field label="نسبة الخصم %"><input type="number" min="1" max="90" value={f.percent} onChange={e => setF({ ...f, percent: e.target.value })} /></Field>
      <Field label="أقصى عدد استخدامات" hint="اتركه فارغًا لعدد غير محدود"><input type="number" min="1" value={f.max_uses} onChange={e => setF({ ...f, max_uses: e.target.value })} /></Field>
      {err && <p className="ad-err" role="alert">{err}</p>}</Modal>}
    {del && <Confirm text={`حذف الكود ${del.code}؟`} onNo={() => setDel(null)} onYes={remove} />}
  </>);
}
