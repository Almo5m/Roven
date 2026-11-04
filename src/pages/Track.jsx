import { useState } from 'react';
import { trackOrder, uploadReceipt } from '../lib/data.js';
export default function Track({ t }) {
  const [code, setCode] = useState(''), [phone, setPhone] = useState(''), [r, setR] = useState(undefined), [busy, setBusy] = useState(false);
  const [file, setFile] = useState(null), [rmsg, setRmsg] = useState('');
  const go = async e => { e.preventDefault(); setBusy(true); setRmsg(''); setR(await trackOrder(code, phone)); setBusy(false); };
  const send = async () => {
    setBusy(true); const ok = await uploadReceipt(code, phone, file);
    setRmsg(ok ? 'ok' : 'err'); if (ok) setR(await trackOrder(code, phone)); setBusy(false);
  };
  return (<section className="page"><h1 className="ptitle">{t.track}</h1>
    <form className="fcol" onSubmit={go}>
      <label className="field"><span>{t.trackCode}</span><input value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={12} required /></label>
      <label className="field"><span>{t.phone}</span><input value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" maxLength={16} required /></label>
      <button className="cta" disabled={busy}>{t.find}</button></form>
    {r === null && <p className="error" role="alert">{t.notFound}</p>}
    {r && <div className="sum"><p className="tot"><span>{t['st_' + r.status]}</span><span>{r.total} {t.egp}</span></p>
      {r.items.map((it, i) => <p key={i}><span>{it.size} · {it.color}</span></p>)}</div>}
    {r && r.method === 'transfer' && r.status === 'awaiting_payment' && (r.has_receipt
      ? <p>{t.receiptSent}</p>
      : <div className="fcol"><label className="field"><span>{t.uploadReceipt}</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setFile(e.target.files[0] || null)} /></label>
          <button className="cta" disabled={!file || busy} onClick={send}>{t.sendReceipt}</button></div>)}
    {rmsg === 'err' && <p className="error" role="alert">{t.receiptErr}</p>}
  </section>);
}
