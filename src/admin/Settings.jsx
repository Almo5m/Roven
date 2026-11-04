import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { uploadImage } from '../lib/cloudinary.js';
import { Field, PageHead } from './ui.jsx';
const local = iso => { const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16); };

/* [key, label, kind, hint]. kind: num | text | area:<rows> | link */
const TABS = [
  ['pay', 'الشحن والدفع', [['shipping_fee', 'سعر الشحن (ج.م)', 'num'], ['free_shipping_over', 'شحن مجاني فوق مبلغ (ج.م)', 'num', '٠ يعني لا يوجد شحن مجاني'],
    ['transfer_info', 'بيانات التحويل التي تظهر للعميل', 'area:4', 'إنستا باي أو محفظة أو حساب بنكي']]],
  ['texts', 'نصوص الموقع', [['announcement_ar', 'شريط الإعلان بالعربي', 'text', 'اتركه فارغًا لاستخدام النص الافتراضي'], ['announcement_en', 'شريط الإعلان بالإنجليزي', 'text'],
    ['about_ar', 'صفحة عن البراند بالعربي', 'area:5', 'السطر الأول يظهر أيضًا في الصفحة الرئيسية'], ['about_en', 'صفحة عن البراند بالإنجليزي', 'area:5']]],
  ['help', 'الأسئلة والمقاسات', [['faq_ar', 'الأسئلة الشائعة بالعربي', 'area:6', 'سطر لكل سؤال: السؤال || الإجابة'], ['faq_en', 'الأسئلة الشائعة بالإنجليزي', 'area:6', 'Question || Answer'],
    ['size_chart', 'جدول المقاسات', 'area:6', 'سطر لكل صف، والخلايا مفصولة بـ | والسطر الأول عناوين. مثال: المقاس | الصدر | الطول']]],
  ['links', 'الروابط والإطلاق', [['instagram', 'رابط إنستجرام', 'link', 'يبدأ بـ https://'], ['tiktok', 'رابط تيك توك', 'link', 'يبدأ بـ https://'], ['drop_date', 'موعد الإصدار القادم (اختياري)', 'date', 'العدّاد يظهر في الرئيسية فقط طالما الموعد في المستقبل']]],
];
const ALL = TABS.flatMap(t => t[2]);

export default function Settings({ notify }) {
  const [tab, setTab] = useState('pay'), [f, setF] = useState({}), [look, setLook] = useState([]), [busy, setBusy] = useState(false), [err, setErr] = useState('');
  useEffect(() => { supabase.from('settings').select('key,value').then(({ data }) => {
    const v = Object.fromEntries((data || []).map(r => [r.key, r.value])), next = {};
    ALL.forEach(([k, , kind]) => { next[k] = kind === 'date' ? (v[k] ? local(v[k]) : '') : (v[k] ?? (kind === 'num' ? 0 : '')); });
    setF(next); setLook(Array.isArray(v.lookbook) ? v.lookbook : []); }); }, []);
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
    const rows = [{ key: 'lookbook', value: look }, ...ALL.map(([k, , kind]) => ({ key: k, value:
      kind === 'num' ? Math.max(0, parseInt(f[k], 10) || 0) : kind === 'date' ? (f[k] ? new Date(f[k]).toISOString() : '') : String(f[k] ?? '').trim().slice(0, kind === 'link' ? 200 : 4000) }))];
    setBusy(true); const { error } = await supabase.from('settings').upsert(rows); setBusy(false);
    if (error) return setErr('تعذر الحفظ.'); notify('تم حفظ الإعدادات.');
  };
  return (<>
    <PageHead title="الإعدادات" sub="كل نصوص الموقع وبياناته تتغير من هنا" />
    <div className="ad-chips">{TABS.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
      <button className={tab === 'look' ? 'on' : ''} onClick={() => setTab('look')}>اللوك بوك</button></div>
    <section className="ad-panel ad-form">
      {TABS.filter(t => t[0] === tab).flatMap(t => t[2]).map(([k, label, kind, hint]) => (
        <Field key={k} label={label} hint={hint}>
          {kind.startsWith('area') ? <textarea rows={+kind.split(':')[1]} maxLength={4000} value={f[k] ?? ''} onChange={set(k)} dir={k.endsWith('_en') ? 'ltr' : undefined} />
            : <input type={kind === 'num' ? 'number' : kind === 'date' ? 'datetime-local' : 'text'} min={kind === 'num' ? 0 : undefined} value={f[k] ?? ''} onChange={set(k)} dir={k.endsWith('_en') || kind === 'link' ? 'ltr' : undefined} />}
        </Field>))}
      {tab === 'look' && <><Field label="صور اللوك بوك (حتى ٨)" hint="تظهر كشريط صور في الصفحة الرئيسية"><input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={addLook} disabled={busy || look.length >= 8} /></Field>
        <div className="ad-thumbs">{look.map(u => <span key={u}><img src={u} alt="" /><button type="button" onClick={() => setLook(look.filter(x => x !== u))} aria-label="حذف الصورة">×</button></span>)}</div></>}
    </section>
    <div className="ad-savebar">{err && <span className="ad-err" role="alert">{err}</span>}<button className="ad-btn primary" disabled={busy} onClick={save}>{busy ? 'جاري…' : 'حفظ الإعدادات'}</button></div>
  </>);
}
