import { PageHead, Pill, money, fmtDate } from './ui.jsx';
import { ST } from './Orders.jsx';
const day = d => new Date(d).toISOString().slice(0, 10);

export default function Dashboard({ orders, go }) {
  const live = orders.filter(o => o.status !== 'cancelled');
  const days = [...Array(7)].map((_, i) => new Date(Date.now() - (6 - i) * 864e5));
  const per = days.map(d => orders.filter(o => day(o.created_at) === day(d)).length), max = Math.max(1, ...per);
  const cards = [['طلبات جديدة', orders.filter(o => o.status === 'new').length], ['في انتظار الدفع', orders.filter(o => o.status === 'awaiting_payment').length],
    ['جاهزة للشحن', orders.filter(o => o.status === 'confirmed').length], ['إجمالي المبيعات', money(live.reduce((a, o) => a + o.total, 0))]];
  return (<>
    <PageHead title="نظرة عامة" sub="ملخص سريع لحالة المتجر" />
    <div className="ad-cards">{cards.map(([l, v]) => <div className="ad-card" key={l}><b>{v}</b><span>{l}</span></div>)}</div>
    <section className="ad-panel"><h3>الطلبات في آخر ٧ أيام</h3>
      <div className="ad-bars">{per.map((n, i) => <div key={i}><span>{n}</span><i style={{ height: `${n / max * 100}%` }} /><small>{days[i].toLocaleDateString('ar-EG', { weekday: 'short' })}</small></div>)}</div></section>
    <section className="ad-panel"><div className="ad-row"><h3>آخر الطلبات</h3><button className="ad-btn" onClick={() => go('orders')}>عرض الكل</button></div>
      {!orders.length && <p className="ad-dim">لا توجد طلبات بعد.</p>}
      {orders.slice(0, 5).map(o => (<div className="ad-line" key={o.id}><b>{o.customer.name}</b><span className="ad-dim">{fmtDate(o.created_at)}</span><span>{money(o.total)}</span><Pill tone={ST[o.status][1]}>{ST[o.status][0]}</Pill></div>))}</section>
  </>);
}
