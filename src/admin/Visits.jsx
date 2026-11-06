import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { PageHead } from './ui.jsx';

const PAGES = { '/': 'الرئيسية', '/shop': 'المتجر', '/about': 'عن البراند', '/sizes': 'جدول المقاسات', '/faq': 'الأسئلة الشائعة', '/cart': 'السلة', '/track': 'تتبع الطلب' };
const DEVICES = { mobile: 'موبايل', tablet: 'تابلت', desktop: 'كمبيوتر' }, LANGS = { ar: 'العربية', en: 'الإنجليزية' };
const num = n => Number(n || 0).toLocaleString('ar-EG');
const country = c => { if (c === '??') return 'غير معروف'; try { return new Intl.DisplayNames(['ar'], { type: 'region' }).of(c); } catch { return c; } };

function Rank({ title, rows, label = x => x, pct }) {
  const max = Math.max(1, ...rows.map(r => r.n)), tot = rows.reduce((a, r) => a + r.n, 0) || 1;
  return (<section className="ad-panel"><h3>{title}</h3>
    {!rows.length ? <p className="ad-dim">لا بيانات بعد.</p> : <div className="ad-rank">{rows.map(r => (
      <div key={r.k}><div className="ad-row"><span>{label(r.k)}</span><b>{pct ? `${Math.round(r.n / tot * 100)}٪` : num(r.n)}</b></div><i style={{ width: `${r.n / max * 100}%` }} /></div>))}</div>}</section>);
}

export default function Visits({ notify }) {
  const [days, setDays] = useState(30), [d, setD] = useState(null), [names, setNames] = useState({});
  useEffect(() => {
    supabase.rpc('visit_stats', { p_days: days }).then(({ data, error }) => { if (error) notify('تعذر تحميل الإحصائيات. تأكد إنك شغّلت ملف 09_visits.sql.', 'err'); else setD(data); });
  }, [days, notify]);
  useEffect(() => {
    Promise.all([supabase.from('products').select('id,name_ar'), supabase.from('categories').select('slug,name_ar'), supabase.from('collections').select('slug,name_ar')]).then(([p, c, k]) => {
      const m = {}; (p.data || []).forEach(x => { m['p/' + x.id] = x.name_ar; }); (c.data || []).forEach(x => { m['shop/' + x.slug] = x.name_ar; }); (k.data || []).forEach(x => { m['collection/' + x.slug] = x.name_ar; }); setNames(m); });
  }, []);
  const page = path => {
    if (PAGES[path]) return PAGES[path];
    const [, a, b] = path.split('/'), n = names[`${a}/${b}`] || b;
    return a === 'p' ? `منتج: ${n}` : a === 'shop' ? `صنف: ${n}` : a === 'collection' ? `كوليكشن: ${n}` : path;
  };
  const source = h => (h === 'direct' ? 'مباشر (رابط أو بحث في المتصفح)' : h);
  const step = days <= 7 ? 1 : days <= 30 ? 5 : 15;
  const cards = d && [['زيارات اليوم', d.today_sessions], ['مشاهدات صفحات اليوم', d.today_views], [`زيارات آخر ${days} يوم`, d.sessions], [`مشاهدات صفحات آخر ${days} يوم`, d.views]];
  const max = d ? Math.max(1, ...d.days.map(x => x.sessions)) : 1;
  return (<>
    <PageHead title="إحصائيات الزيارات" sub="الزيارة = شخص دخل الموقع (بيتحسب مرة واحدة في كل جلسة). مشاهدة الصفحة = كل صفحة فتحها." />
    <div className="ad-chips">{[7, 30, 90].map(n => <button key={n} className={days === n ? 'on' : ''} onClick={() => setDays(n)}>آخر {n} يوم</button>)}</div>
    {!d ? <p className="ad-dim">جاري التحميل…</p> : <>
      <div className="ad-cards">{cards.map(([l, v]) => <div className="ad-card" key={l}><b>{num(v)}</b><span>{l}</span></div>)}</div>
      <section className="ad-panel"><h3>الزيارات يوميًا</h3>
        {!d.views ? <p className="ad-dim">لسه مفيش زيارات متسجلة. العدّ بيبدأ من وقت تشغيل ملف 09_visits.sql ونشر الموقع.</p> :
          <div className="ad-bars">{d.days.map((x, i) => (<div key={x.d} title={`${x.d}: ${x.sessions} زيارة، ${x.views} مشاهدة`}><span>{x.sessions || ''}</span><i style={{ height: `${x.sessions / max * 100}%` }} /><small>{i % step === 0 || i === d.days.length - 1 ? x.d.slice(5) : ''}</small></div>))}</div>}</section>
      <div className="ad-two">
        <Rank title="أكتر الصفحات مشاهدة" rows={d.pages} label={page} />
        <Rank title="الزيارات جت منين" rows={d.sources} label={source} />
      </div>
      <div className="ad-two">
        <Rank title="الدول" rows={d.countries} label={country} />
        <Rank title="الأجهزة" rows={d.devices} label={k => DEVICES[k] || k} pct />
      </div>
      <Rank title="لغة الصفحة" rows={d.langs} label={k => LANGS[k] || k} pct />
      <p className="ad-dim">الأرقام تقريبية: بنستبعد الروبوتات والمتصفحات اللي طالبة "عدم التتبع" والمتصفح اللي سجّلت منه دخول لوحة التحكم، فزياراتك إنت مش بتتحسب.</p></>}
  </>);
}
