import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { uploadImage } from '../lib/cloudinary.js';
import { Field, PageHead } from './ui.jsx';
import { FaqEditor, SizeChartEditor, PaymentMethods } from './Editors.jsx';
const local = iso => { const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16); };

/* Simple fields: [key, label, kind, hint]. kind: num | text | area:<rows> | link | date. Lists and tables have their own editors. */
const SIMPLE = {
  pay: [['shipping_fee', 'سعر الشحن (ج.م)', 'num'], ['free_shipping_over', 'شحن مجاني فوق مبلغ (ج.م)', 'num', 'اكتب ٠ لو مفيش شحن مجاني']],
  texts: [['announcement_ar', 'شريط الإعلان بالعربي', 'text', 'اتركه فارغًا لاستخدام النص الافتراضي'], ['announcement_en', 'شريط الإعلان بالإنجليزي', 'text'],
    ['about_ar', 'صفحة عن البراند بالعربي', 'area:5', 'السطر الأول يظهر أيضًا في الصفحة الرئيسية'], ['about_en', 'صفحة عن البراند بالإنجليزي', 'area:5']],
  links: [['instagram', 'رابط إنستجرام', 'link', 'يبدأ بـ https://'], ['tiktok', 'رابط تيك توك', 'link', 'يبدأ بـ https://'],
    ['drop_date', 'موعد الإصدار القادم (اختياري)', 'date', 'العدّاد يظهر في الرئيسية فقط طالما الموعد في المستقبل']],
};
const TABS = [['pay', 'الشحن والدفع'], ['texts', 'نصوص الموقع'], ['help', 'الأسئلة والمقاسات'], ['links', 'الروابط والإطلاق'], ['look', 'اللوك بوك']];
const ALL = Object.values(SIMPLE).flat();
const t = (s, n) => String(s ?? '').trim().slice(0, n);

export default function Settings({ notify }) {
  const [tab, setTab] = useState('pay'), [f, setF] = useState({}), [look, setLook] = useState([]), [faq, setFaq] = useState([]), [chart, setChart] = useState({}), [methods, setMethods] = useState([]);
  const [busy, setBusy] = useState(false), [err, setErr] = useState('');
  useEffect(() => { supabase.from('settings').select('key,value').then(({ data }) => {
    const v = Object.fromEntries((data || []).map(r => [r.key, r.value])), next = {};
    ALL.forEach(([k, , kind]) => { next[k] = kind === 'date' ? (v[k] ? local(v[k]) : '') : (v[k] ?? (kind === 'num' ? 0 : '')); });
    setF(next); setLook(Array.isArray(v.lookbook) ? v.lookbook : []); setFaq(Array.isArray(v.faq) ? v.faq : []);
    setChart(v.size_chart && typeof v.size_chart === 'object' ? v.size_chart : {}); setMethods(Array.isArray(v.transfer_methods) ? v.transfer_methods : []); }); }, []);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const addLook = async e => {
    const files = [...e.target.files]; e.target.value = ''; setBusy(true); setErr('');
    for (const file of files) { if (look.length >= 8) break; const url = await uploadImage(file); if (!url) { setErr('فشل رفع صورة. استخدم JPG أو PNG أو WebP أقل من 3 ميجا.'); break; } setLook(x => [...x, url]); }
    setBusy(false);
  };
  const save = async () => {
    setErr('');
    if (f.drop_date && isNaN(new Date(f.drop_date))) return setErr('موعد الإصدار غير صحيح.');
    if (['instagram', 'tiktok'].some(k => f[k].trim() && !/^https:\/\//.test(f[k].trim()))) return setErr('روابط السوشيال يجب أن تبدأ بـ https://');
    if (methods.some(m => !m.value.trim())) return setErr('في طريقة تحويل من غير رقم أو عنوان. اكتبه أو احذفها.');
    const cleanChart = chart.cols?.length ? { cols: chart.cols.map(c => ({ ar: t(c.ar, 30), en: t(c.en, 30) })), rows: chart.rows.map(r => r.map(x => t(x, 30))) } : {};
    const rows = [{ key: 'lookbook', value: look },
      { key: 'faq', value: faq.map(x => ({ q_ar: t(x.q_ar, 200), a_ar: t(x.a_ar, 1000), q_en: t(x.q_en, 200), a_en: t(x.a_en, 1000) })).filter(x => (x.q_ar || x.q_en) && (x.a_ar || x.a_en)) },
      { key: 'size_chart', value: cleanChart },
      { key: 'transfer_methods', value: methods.map(m => ({ kind: m.kind, label: t(m.label, 40), value: t(m.value, 120), note: t(m.note, 120) })) },
      ...ALL.map(([k, , kind]) => ({ key: k, value: kind === 'num' ? Math.max(0, parseInt(f[k], 10) || 0) : kind === 'date' ? (f[k] ? new Date(f[k]).toISOString() : '') : t(f[k], kind === 'link' ? 200 : 4000) }))];
    setBusy(true); const { error } = await supabase.from('settings').upsert(rows); setBusy(false);
    if (error) return setErr('تعذر الحفظ.'); notify('تم حفظ الإعدادات.');
  };
  const simple = (SIMPLE[tab] || []).map(([k, label, kind, hint]) => (
    <Field key={k} label={label} hint={hint}>
      {kind.startsWith('area') ? <textarea rows={+kind.split(':')[1]} maxLength={4000} value={f[k] ?? ''} onChange={set(k)} dir={k.endsWith('_en') ? 'ltr' : undefined} />
        : <input type={kind === 'num' ? 'number' : kind === 'date' ? 'datetime-local' : 'text'} min={kind === 'num' ? 0 : undefined} value={f[k] ?? ''} onChange={set(k)} dir={k.endsWith('_en') || kind === 'link' ? 'ltr' : undefined} />}
    </Field>));
  return (<>
    <PageHead title="الإعدادات" sub="كل نصوص الموقع وبياناته تتغير من هنا" />
    <div className="ad-chips">{TABS.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
    <section className="ad-panel ad-form">
      {simple}
      {tab === 'pay' && <><h3>طرق التحويل اللي بتظهر للعميل</h3><PaymentMethods value={methods} onChange={setMethods} /></>}
      {tab === 'help' && <><h3>الأسئلة الشائعة</h3><FaqEditor value={faq} onChange={setFaq} /><h3>جدول المقاسات</h3><SizeChartEditor value={chart} onChange={setChart} /></>}
      {tab === 'look' && <><Field label="صور اللوك بوك (حتى ٨)" hint="تظهر كشريط صور في الصفحة الرئيسية"><input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={addLook} disabled={busy || look.length >= 8} /></Field>
        <div className="ad-thumbs">{look.map(u => <span key={u}><img src={u} alt="" /><button type="button" onClick={() => setLook(look.filter(x => x !== u))} aria-label="حذف الصورة">×</button></span>)}</div></>}
    </section>
    <div className="ad-savebar">{err && <span className="ad-err" role="alert">{err}</span>}<button className="ad-btn primary" disabled={busy} onClick={save}>{busy ? 'جاري…' : 'حفظ الإعدادات'}</button></div>
  </>);
}
