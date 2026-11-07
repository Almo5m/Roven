import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { Modal, Pill, PageHead, Empty, money, fmtDate } from './ui.jsx';
export const ST = { new: ['جديد', 'blue'], awaiting_payment: ['في انتظار الدفع', 'amber'], confirmed: ['مؤكد', 'green'], shipped: ['تم الشحن', 'violet'], delivered: ['تم التسليم', 'gray'], cancelled: ['ملغي', 'red'] };
const ME = { cod: 'كاش عند الاستلام', transfer: 'تحويل', online: 'أونلاين' };

const waNumber = p => { const d = String(p).replace(/\D/g, ''); return d.startsWith('20') ? d : d.startsWith('0') ? '20' + d.slice(1) : d; };

export default function Orders({ orders, reload, notify }) {
  const [filter, setFilter] = useState('all'), [sel, setSel] = useState(null), [status, setStatus] = useState(''), [busy, setBusy] = useState(false);
  const [names, setNames] = useState({});
  useEffect(() => { supabase.from('products').select('id,name_ar').then(({ data }) => setNames(Object.fromEntries((data || []).map(p => [p.id, p.name_ar])))); }, []);
  const shown = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const open = o => { setSel(o); setStatus(o.status); };
  const save = async () => {
    setBusy(true); const { error } = await supabase.from('orders').update({ status }).eq('id', sel.id); setBusy(false);
    if (error) return notify('تعذر تحديث الطلب.', 'err');
    notify('تم تحديث حالة الطلب.'); setSel({ ...sel, status }); reload(); // stay open: the review link appears once the order is shipped
  };
  const reviewLink = o => `${location.origin}/ar/review/${o.review_token}`;
  const waLink = o => `https://wa.me/${waNumber(o.customer.phone)}?text=${encodeURIComponent(`أهلاً ${o.customer.name.split(' ')[0]}، شكرًا لثقتك في ROVEN 🖤\nيهمنا رأيك في تجربتك، ممكن تقيّم من هنا:\n${reviewLink(o)}`)}`;
  const copy = text => navigator.clipboard.writeText(text).then(() => notify('تم نسخ الرابط.')).catch(() => notify('تعذر النسخ.', 'err'));
  const receipt = async path => {
    const { data } = await supabase.storage.from('receipts').createSignedUrl(path, 120);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener'); else notify('تعذر فتح الإيصال.', 'err');
  };
  return (<>
    <PageHead title="الطلبات" sub={`${orders.length} طلب`} action={<button className="ad-btn" onClick={() => { reload(); notify('تم التحديث.'); }}>تحديث</button>} />
    <div className="ad-chips"><button className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>الكل ({orders.length})</button>
      {Object.entries(ST).map(([k, [l]]) => <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l} ({orders.filter(o => o.status === k).length})</button>)}</div>
    {!shown.length ? <Empty>لا توجد طلبات هنا.</Empty> : <div className="ad-rows">
      <div className="ad-rowh"><span>العميل</span><span>الكود</span><span>الإجمالي</span><span>الدفع</span><span>الحالة</span><span>التاريخ</span></div>
      {shown.map(o => (<button key={o.id} className="ad-orow" onClick={() => open(o)}>
        <b className="c-name">{o.customer.name}</b><span className="c-trk ad-dim">{o.tracking}</span><span className="c-total">{money(o.total)}</span>
        <span className="c-method">{ME[o.method]}</span><span className="c-st"><Pill tone={ST[o.status][1]}>{ST[o.status][0]}</Pill></span><small className="c-date ad-dim">{fmtDate(o.created_at)}</small></button>))}</div>}
    {sel && <Modal title={`طلب ${sel.tracking}`} onClose={() => setSel(null)} footer={<><button className="ad-btn" onClick={() => setSel(null)}>إغلاق</button>
      <button className="ad-btn primary" disabled={busy || status === sel.status} onClick={save}>حفظ الحالة</button></>}>
      <div className="ad-kv"><span>العميل</span><b>{sel.customer.name}</b>
        <span>الموبايل</span><a href={`tel:${sel.customer.phone}`} dir="ltr">{sel.customer.phone}</a>
        <span>العنوان</span><b>{sel.customer.city}، {sel.customer.address}</b>
        <span>الدفع</span><b>{ME[sel.method]}</b><span>التاريخ</span><b>{fmtDate(sel.created_at)}</b></div>
      <h4>القطع</h4><ul className="ad-items">{sel.items.map((it, i) => <li key={i}>{names[it.product_id] || it.product_id} · {it.size} · {it.color}</li>)}</ul>
      <div className="ad-kv"><span>المجموع</span><b>{money(sel.subtotal)}</b>
        {sel.discount > 0 && <><span>الخصم{sel.coupon ? ` (${sel.coupon})` : ''}</span><b>- {money(sel.discount)}</b></>}
        <span>الشحن</span><b>{money(sel.shipping)}</b><span>الإجمالي</span><b>{money(sel.total)}</b></div>
      {sel.receipt && <button className="ad-btn wide" onClick={() => receipt(sel.receipt)}>عرض إيصال التحويل</button>}
      <div className="ad-review"><h4>طلب تقييم من العميل</h4>
        {['shipped', 'delivered'].includes(sel.status) ? <><p className="ad-dim">ابعت الرابط للعميل على واتساب. بيفتح له صفحة تقييم مرتبطة بطلبه هو بس.</p>
          <div className="ad-acts"><a className="ad-btn primary" href={waLink(sel)} target="_blank" rel="noopener noreferrer">إرسال على واتساب</a>
            <button className="ad-btn" onClick={() => copy(reviewLink(sel))}>نسخ الرابط</button></div></>
          : <p className="ad-dim">رابط التقييم بيشتغل بعد تغيير حالة الطلب إلى "تم الشحن" أو "تم التسليم". اختار الحالة من القايمة تحت واضغط "حفظ الحالة"، وهيظهر زر الإرسال هنا.</p>}</div>
      <label className="ad-fld"><span>حالة الطلب</span><select value={status} onChange={e => setStatus(e.target.value)}>{Object.entries(ST).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select></label>
    </Modal>}
  </>);
}
