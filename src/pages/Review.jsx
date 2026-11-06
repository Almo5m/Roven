import { useTo } from '../lib/router.js';
import { useEffect, useState } from 'react';
import { reviewRequest, submitReview } from '../lib/data.js';
/* Opened from the link the owner sends on WhatsApp. The link belongs to one real order. */
export default function Review({ t, id }) {
  const to = useTo();
  const [info, setInfo] = useState(undefined), [rating, setRating] = useState(0), [text, setText] = useState(''), [name, setName] = useState(''), [state, setState] = useState('idle');
  useEffect(() => { reviewRequest(id).then(r => { setInfo(r); if (r?.name) setName(r.name); }); }, [id]);
  if (info === undefined) return <section className="page"><p className="dim">…</p></section>;
  if (!info) return <section className="page"><h1 className="ptitle">{t.reviewTitle}</h1><p>{t.reviewInvalid}</p><a href={to('/')}>{t.back}</a></section>;
  if (info.done) return <section className="page"><h1 className="ptitle">{t.reviewTitle}</h1><p>{t.reviewDone}</p><a href={to('/')}>{t.back}</a></section>;
  if (state === 'done') return <section className="page"><h1 className="ptitle">{t.reviewTitle}</h1><p>{t.reviewThanks}</p><a href={to('/')}>{t.back}</a></section>;
  const ready = rating > 0 && text.trim() && name.trim();
  const send = async () => { setState('busy'); setState(await submitReview(id, rating, text.trim(), name.trim()) ? 'done' : 'error'); };
  return (<section className="page"><h1 className="ptitle">{t.reviewTitle}</h1><p className="dim">{t.reviewHello}</p>
    <div className="fcol"><span className="dim">{t.yourRating}</span>
      <div className="rate" role="radiogroup" aria-label={t.yourRating}>{[1, 2, 3, 4, 5].map(n => <button key={n} role="radio" aria-checked={rating === n} aria-label={String(n)} className={n <= rating ? 'on' : ''} onClick={() => setRating(n)}>★</button>)}</div>
      <label className="field"><span>{t.yourWords}</span><textarea rows={5} maxLength={400} value={text} onChange={e => setText(e.target.value)} /></label>
      <label className="field"><span>{t.displayName}</span><input value={name} maxLength={40} onChange={e => setName(e.target.value)} /></label>
      {state === 'error' && <p className="error" role="alert">{t.err}</p>}
      <button className="cta" disabled={!ready || state === 'busy'} onClick={send}>{t.sendReview}</button></div></section>);
}
