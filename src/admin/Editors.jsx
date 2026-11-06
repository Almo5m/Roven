import { Field } from './ui.jsx';
import { KINDS } from '../lib/payments.js';
/* Structured editors: every item is its own card with its own fields, no special characters to remember. */

export function FaqEditor({ value, onChange }) {
  const upd = (i, k, v) => onChange(value.map((x, j) => j === i ? { ...x, [k]: v } : x));
  return (<div className="ad-rep">
    {!value.length && <p className="ad-dim">لسه ما أضفتش أسئلة.</p>}
    {value.map((it, i) => (<div className="ad-repitem" key={i}>
      <div className="ad-row"><b>سؤال {i + 1}</b><button type="button" className="ad-btn danger" onClick={() => onChange(value.filter((_, j) => j !== i))}>حذف</button></div>
      <div className="ad-two"><Field label="السؤال بالعربي"><input value={it.q_ar} maxLength={200} onChange={e => upd(i, 'q_ar', e.target.value)} /></Field>
        <Field label="Question (English)"><input dir="ltr" value={it.q_en} maxLength={200} onChange={e => upd(i, 'q_en', e.target.value)} /></Field></div>
      <div className="ad-two"><Field label="الإجابة بالعربي"><textarea rows={3} maxLength={1000} value={it.a_ar} onChange={e => upd(i, 'a_ar', e.target.value)} /></Field>
        <Field label="Answer (English)"><textarea rows={3} dir="ltr" maxLength={1000} value={it.a_en} onChange={e => upd(i, 'a_en', e.target.value)} /></Field></div>
    </div>))}
    <button type="button" className="ad-btn" onClick={() => onChange([...value, { q_ar: '', a_ar: '', q_en: '', a_en: '' }])}>+ إضافة سؤال</button>
  </div>);
}

export function SizeChartEditor({ value, onChange }) {
  const v = value && Array.isArray(value.cols) && value.cols.length ? value : null;
  if (!v) return (<div className="ad-empty">لسه ما عملتش جدول مقاسات.<br /><br />
    <button type="button" className="ad-btn primary" onClick={() => onChange({ cols: [{ ar: 'المقاس', en: 'Size' }, { ar: 'الصدر', en: 'Chest' }, { ar: 'الطول', en: 'Length' }], rows: [['S', '', ''], ['M', '', ''], ['L', '', ''], ['XL', '', '']] })}>ابدأ بجدول جاهز</button></div>);
  const setCol = (i, k, val) => onChange({ ...v, cols: v.cols.map((c, j) => j === i ? { ...c, [k]: val } : c) });
  const setCell = (r, c, val) => onChange({ ...v, rows: v.rows.map((row, i) => i === r ? row.map((x, j) => j === c ? val : x) : row) });
  return (<div className="ad-stack">
    <p className="ad-dim">اكتب عناوين الأعمدة بالعربي والإنجليزي، وبعدين املا الخلايا بالمقاسات.</p>
    <div className="ad-scrollx"><table className="ad-ed"><thead><tr>
      {v.cols.map((c, i) => <th key={i}><input placeholder="العنوان بالعربي" value={c.ar} maxLength={30} onChange={e => setCol(i, 'ar', e.target.value)} />
        <input dir="ltr" placeholder="Title (English)" value={c.en} maxLength={30} onChange={e => setCol(i, 'en', e.target.value)} />
        {v.cols.length > 1 && <button type="button" className="ad-link" onClick={() => onChange({ cols: v.cols.filter((_, j) => j !== i), rows: v.rows.map(r => r.filter((_, j) => j !== i)) })}>حذف العمود</button>}</th>)}<th /></tr></thead>
      <tbody>{v.rows.map((r, i) => <tr key={i}>{r.map((x, j) => <td key={j}><input value={x} maxLength={30} onChange={e => setCell(i, j, e.target.value)} /></td>)}
        <td><button type="button" className="ad-link" onClick={() => onChange({ ...v, rows: v.rows.filter((_, j) => j !== i) })}>حذف الصف</button></td></tr>)}</tbody></table></div>
    <div className="ad-acts"><button type="button" className="ad-btn" onClick={() => onChange({ ...v, rows: [...v.rows, v.cols.map(() => '')] })}>+ إضافة صف</button>
      <button type="button" className="ad-btn" onClick={() => onChange({ cols: [...v.cols, { ar: '', en: '' }], rows: v.rows.map(r => [...r, '']) })}>+ إضافة عمود</button>
      <button type="button" className="ad-btn danger" onClick={() => onChange({})}>مسح الجدول</button></div>
  </div>);
}

export function PaymentMethods({ value, onChange }) {
  const upd = (i, k, v) => onChange(value.map((x, j) => j === i ? { ...x, [k]: v } : x));
  return (<div className="ad-rep">
    {!value.length && <p className="ad-dim">لسه ما أضفتش طرق تحويل. العميل مش هيشوف بيانات تحويل لحد ما تضيف.</p>}
    {value.map((m, i) => (<div className="ad-repitem" key={i}>
      <div className="ad-row"><b>طريقة {i + 1}</b><button type="button" className="ad-btn danger" onClick={() => onChange(value.filter((_, j) => j !== i))}>حذف</button></div>
      <div className="ad-two"><Field label="النوع"><select value={m.kind} onChange={e => upd(i, 'kind', e.target.value)}>{KINDS.map(k => <option key={k.k} value={k.k}>{k.ar}</option>)}</select></Field>
        {m.kind === 'other' && <Field label="اسم الطريقة"><input value={m.label || ''} maxLength={40} onChange={e => upd(i, 'label', e.target.value)} /></Field>}</div>
      <Field label="الرقم أو العنوان" hint="رقم المحفظة، أو عنوان إنستا باي، أو رقم الحساب"><input dir="ltr" value={m.value} maxLength={120} onChange={e => upd(i, 'value', e.target.value)} /></Field>
      <Field label="ملاحظة (اختياري)" hint="مثال: باسم Moaz Amin"><input value={m.note || ''} maxLength={120} onChange={e => upd(i, 'note', e.target.value)} /></Field>
    </div>))}
    <button type="button" className="ad-btn" onClick={() => onChange([...value, { kind: 'instapay', label: '', value: '', note: '' }])}>+ إضافة طريقة تحويل</button>
  </div>);
}
