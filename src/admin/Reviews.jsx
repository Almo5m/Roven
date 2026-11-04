import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
/* Only real customer feedback should go here. Nothing is shown on the site until you add it. */
export default function Reviews() {
  const [items, setItems] = useState([]), [f, setF] = useState({ name: '', rating: 5, text: '' }), [msg, setMsg] = useState('');
  const load = useCallback(async () => { const { data } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false }); setItems(data || []); }, []);
  useEffect(() => { load(); }, [load]);
  const add = async e => {
    e.preventDefault();
    const name = f.name.trim().slice(0, 60), text = f.text.trim().slice(0, 400), rating = parseInt(f.rating, 10);
    if (!name || !text || !(rating >= 1 && rating <= 5)) return setMsg('Fill the name, the text and a rating from 1 to 5.');
    const { error } = await supabase.from('testimonials').insert({ name, text, rating });
    if (error) return setMsg('Could not add the review.'); setMsg(''); setF({ name: '', rating: 5, text: '' }); load();
  };
  const toggle = async r => { await supabase.from('testimonials').update({ active: !r.active }).eq('id', r.id); load(); };
  const del = async r => { await supabase.from('testimonials').delete().eq('id', r.id); load(); };
  return (<><h2>Customer reviews</h2>
    <div className="ad-list">{!items.length && <p className="ad-dim">No reviews yet, so the section is hidden on the site.</p>}{items.map(r => (
      <div className="ad-order" key={r.id}><div className="ad-row"><strong>{r.name} · {'★'.repeat(r.rating)}</strong>
        <span><button className="ad-btn" onClick={() => toggle(r)}>{r.active ? 'Hide' : 'Show'}</button> <button className="ad-btn" onClick={() => del(r)}>Delete</button></span></div>
        <p>{r.text}</p></div>))}</div>
    <h2>Add a review</h2>
    <form className="ad-form" onSubmit={add}>
      <label>Customer name<input value={f.name} maxLength={60} onChange={e => setF({ ...f, name: e.target.value })} /></label>
      <label>Rating (1 to 5)<input type="number" min="1" max="5" value={f.rating} onChange={e => setF({ ...f, rating: e.target.value })} /></label>
      <label>What they said<textarea rows={3} maxLength={400} value={f.text} onChange={e => setF({ ...f, text: e.target.value })} /></label>
      {msg && <p className="ad-err" role="alert">{msg}</p>}<button className="ad-btn primary" type="submit">Add review</button></form></>);
}
