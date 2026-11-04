const day = d => new Date(d).toISOString().slice(0, 10);

export default function Dashboard({ orders }) {
  const live = orders.filter(o => o.status !== 'cancelled');
  const revenue = live.reduce((a, o) => a + o.total, 0);
  const days = [...Array(7)].map((_, i) => { const d = new Date(Date.now() - (6 - i) * 864e5); return day(d); });
  const perDay = days.map(d => orders.filter(o => day(o.created_at) === d).length), max = Math.max(1, ...perDay);
  const cards = [['New orders', orders.filter(o => o.status === 'new').length], ['Awaiting payment', orders.filter(o => o.status === 'awaiting_payment').length],
    ['To ship', orders.filter(o => o.status === 'confirmed').length], ['Revenue (EGP)', revenue.toLocaleString()]];
  return (<>
    <div className="ad-cards">{cards.map(([l, v]) => <div className="ad-card" key={l}><b>{v}</b><span>{l}</span></div>)}</div>
    <h2>Orders, last 7 days</h2>
    <div className="ad-bars">{perDay.map((n, i) => <div key={days[i]}><i style={{ height: `${n / max * 100}%` }} /><span>{n}</span><small>{days[i].slice(5)}</small></div>)}</div>
  </>);
}
