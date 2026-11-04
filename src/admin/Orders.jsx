import { useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { Modal, Pill, PageHead, Empty, money, fmtDate } from './ui.jsx';
export const ST = { new: ['جديد', 'blue'], awaiting_payment: ['في انتظار الدفع', 'amber'], confirmed: ['مؤكد', 'green'], shipped: ['تم الشحن', 'violet'], delivered: ['تم التسليم', 'gray'], cancelled: ['ملغي', 'red'] };
const ME = { cod: 'كاش عند الاستلام', transfer: 'تحويل', online: 'أونلاين' };

export default function Orders({ orders, reload, notify }) {
  const [filter, setFilter] = useState('all'), [sel, setSel] = useState(null), [status, setStatus] = useState(''), [busy, setBusy] = useState(false);
  const shown = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const open = o => { setSel(o); setStatus(o.status); };
  const save = async () => {
    setBusy(true); const { error } = await supabase.from('orders').update({ status }).eq('id', sel.id); setBusy(false);
    if (error) return notify('تعذر تحديث الطلب.', 'err');
    notify('تم تحديث حالة الطلب.'); setSel(null); reload();
  };
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
      <h4>القطع</h4><ul className="ad-items">{sel.items.map((it, i) => <li key={i}>{it.product_id} · {it.size} · {it.color}</li>)}</ul>
      <div className="ad-kv"><span>المجموع</span><b>{money(sel.subtotal)}</b>
        {sel.discount > 0 && <><span>الخصم{sel.coupon ? ` (${sel.coupon})` : ''}</span><b>- {money(sel.discount)}</b></>}
        <span>الشحن</span><b>{money(sel.shipping)}</b><span>الإجمالي</span><b>{money(sel.total)}</b></div>
      {sel.receipt && <button className="ad-btn wide" onClick={() => receipt(sel.receipt)}>عرض إيصال التحويل</button>}
      <label className="ad-fld"><span>حالة الطلب</span><select value={status} onChange={e => setStatus(e.target.value)}>{Object.entries(ST).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select></label>
    </Modal>}
  </>);
}
