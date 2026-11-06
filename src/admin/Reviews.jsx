import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { Confirm, Pill, Empty, PageHead } from './ui.jsx';
/* Reviews arrive only through the link sent from an order, so each one belongs to a real shipped order. */
const TABS = [['pending', 'بانتظار الموافقة'], ['approved', 'ظاهرة في الموقع'], ['hidden', 'مخفية']];

export default function Reviews({ notify }) {
  const [items, setItems] = useState([]), [tab, setTab] = useState('pending'), [del, setDel] = useState(null);
  const load = useCallback(async () => { const { data } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false }); setItems(data || []); }, []);
  useEffect(() => { load(); }, [load]);
  const setStatus = async (r, status) => { await supabase.from('testimonials').update({ status }).eq('id', r.id); notify(status === 'approved' ? 'تم قبول الرأي وظهر في الموقع.' : 'تم تحديث الرأي.'); load(); };
  const remove = async () => { await supabase.from('testimonials').delete().eq('id', del.id); setDel(null); notify('تم الحذف.'); load(); };
  const shown = items.filter(r => r.status === tab);
  return (<>
    <PageHead title="آراء العملاء" sub="الآراء بتوصلك بس من عملاء فعليين عن طريق رابط التقييم." />
    <section className="ad-panel"><h3>إزاي تجمع الآراء؟</h3>
      <p className="ad-dim">افتح الطلب من صفحة "الطلبات" بعد ما تغيّر حالته إلى "تم الشحن" أو "تم التسليم"، واضغط "إرسال على واتساب". العميل بيفتح صفحة تقييم مرتبطة بطلبه هو بس، ويقيّم مرة واحدة. تقييمه بيوصلك هنا وتقرر تقبله أو لأ.</p></section>
    <div className="ad-chips">{TABS.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l} ({items.filter(r => r.status === k).length})</button>)}</div>
    {!shown.length ? <Empty>لا توجد آراء في هذا القسم.</Empty> : <div className="ad-stack">{shown.map(r => (
      <div className="ad-panel" key={r.id}><div className="ad-row"><b>{r.name} · {'★'.repeat(r.rating)}</b>{r.verified && <Pill tone="green">عميل موثّق</Pill>}</div>
        <p>{r.text}</p>
        <div className="ad-acts">{r.status !== 'approved' && <button className="ad-btn primary" onClick={() => setStatus(r, 'approved')}>قبول وإظهار</button>}
          {r.status !== 'hidden' && <button className="ad-btn" onClick={() => setStatus(r, 'hidden')}>{r.status === 'pending' ? 'رفض' : 'إخفاء'}</button>}
          <button className="ad-btn danger" onClick={() => setDel(r)}>حذف</button></div></div>))}</div>}
    {del && <Confirm text="حذف هذا الرأي نهائيًا؟" onNo={() => setDel(null)} onYes={remove} />}
  </>);
}
