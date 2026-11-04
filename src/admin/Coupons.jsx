import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

export default function Coupons() {
  const [items, setItems] = useState([]), [f, setF] = useState({ code: '', percent: 10, max_uses: '' }), [msg, setMsg] = useState('');
  const load = useCallback(async () => { const { data } = await supabase.from('coupons').select('*').order('code'); setItems(data || []); }, []);
  useEffect(() => { load(); }, [load]);
  const add = async e => {
    e.preventDefault();
    const code = f.code.trim().toUpperCase(), percent = parseInt(f.percent, 10);
    if (!/^[A-Z0-9]{3,20}$/.test(code) || !(percent >= 1 && percent <= 90)) return setMsg('Code: 3 to 20 letters or numbers. Percent: 1 to 90.');
    const { error } = await supabase.from('coupons').insert({ code, percent, max_uses: f.max_uses ? parseInt(f.max_uses, 10) : null });
    if (error) return setMsg('Could not add (maybe the code exists).');
    setMsg(''); setF({ code: '', percent: 10, max_uses: '' }); load();
  };
  const toggle = async c => { await supabase.from('coupons').update({ active: !c.active }).eq('code', c.code); load(); };
  return (<><h2>Discount codes</h2>
    <div className="ad-list">{!items.length && <p className="ad-dim">No codes yet.</p>}{items.map(c => (
      <div className="ad-order ad-row" key={c.code}><strong>{c.code}</strong><span>{c.percent}% off</span>
        <span className="ad-dim">used {c.uses}{c.max_uses ? ` of ${c.max_uses}` : ''}</span>
        <button className="ad-btn" onClick={() => toggle(c)}>{c.active ? 'Turn off' : 'Turn on'}</button></div>))}</div>
    <h2>New code</h2>
    <form className="ad-form" onSubmit={add}>
      <label>Code<input value={f.code} onChange={e => setF({ ...f, code: e.target.value.toUpperCase() })} maxLength={20} /></label>
      <label>Percent off<input type="number" min="1" max="90" value={f.percent} onChange={e => setF({ ...f, percent: e.target.value })} /></label>
      <label>Max uses (empty for unlimited)<input type="number" min="1" value={f.max_uses} onChange={e => setF({ ...f, max_uses: e.target.value })} /></label>
      {msg && <p className="ad-err" role="alert">{msg}</p>}
      <button className="ad-btn primary" type="submit">Add code</button></form></>);
}
