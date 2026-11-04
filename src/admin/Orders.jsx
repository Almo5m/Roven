import { useState } from 'react';
import { supabase } from '../lib/supabase.js';
const STATUS = ['new', 'awaiting_payment', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function Orders({ orders, reload }) {
  const [filter, setFilter] = useState('all'), [err, setErr] = useState('');
  const shown = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const setStatus = async (id, status) => {
    setErr(''); const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) setErr('Could not update the order.'); reload();
  };
  const viewReceipt = async path => {
    const { data } = await supabase.storage.from('receipts').createSignedUrl(path, 120);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener'); else setErr('Could not open the receipt.');
  };
  return (<>
    <div className="ad-row"><h2>Orders</h2>
      <select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All</option>{STATUS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select>
      <button className="ad-btn" onClick={reload}>Refresh</button></div>
    {err && <p className="ad-err" role="alert">{err}</p>}
    {!shown.length && <p className="ad-dim">No orders here yet.</p>}
    <div className="ad-list">{shown.map(o => (<article key={o.id} className="ad-order">
      <div className="ad-row"><strong>{o.customer.name}</strong><span>{o.total} EGP · {{ cod: 'Cash', transfer: 'Transfer', online: 'Online' }[o.method]}</span>
        <select value={o.status} onChange={e => setStatus(o.id, e.target.value)}>{STATUS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select></div>
      <p>{o.customer.phone} · {o.customer.city} · {o.customer.address}</p>
      {o.receipt && <button className="ad-btn" onClick={() => viewReceipt(o.receipt)}>View receipt</button>}
      <ul>{o.items.map((it, i) => <li key={i}>{it.product_id} · {it.size} · {it.color}</li>)}</ul>
      <small className="ad-dim">{o.tracking} · shipping {o.shipping} · discount {o.discount}{o.coupon ? ` (${o.coupon})` : ''} · {new Date(o.created_at).toLocaleString()}</small></article>))}</div>
  </>);
}
