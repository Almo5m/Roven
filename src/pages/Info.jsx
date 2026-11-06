/* Text pages. Their content is edited in the dashboard, nothing is hard-coded here. */
export function About({ t, lang, settings }) {
  return (<section className="wrap narrow"><img className="mini-logo" src="/logo-r.png" alt="" />
    <h1 className="ptitle">{t.about}</h1><p className="lead pre">{settings['about_' + lang] || t.manifesto}</p></section>);
}
export function Sizes({ t, lang, settings }) {
  const c = settings.size_chart, ok = c && Array.isArray(c.cols) && c.cols.length && Array.isArray(c.rows) && c.rows.length;
  return (<section className="wrap narrow"><h1 className="ptitle">{t.sizeGuide}</h1>
    {!ok ? <p className="dim">{t.comingSoon}</p> :
      <div className="scroll"><table className="table"><thead><tr>{c.cols.map((col, i) => <th key={i}>{col[lang] || col.en || col.ar}</th>)}</tr></thead>
        <tbody>{c.rows.map((r, i) => <tr key={i}>{r.map((x, j) => <td key={j}>{x}</td>)}</tr>)}</tbody></table></div>}</section>);
}
export function Faq({ t, lang, settings }) {
  const other = lang === 'ar' ? 'en' : 'ar';
  const items = (Array.isArray(settings.faq) ? settings.faq : []).map(x => [x['q_' + lang] || x['q_' + other], x['a_' + lang] || x['a_' + other]]).filter(x => x[0] && x[1]);
  return (<section className="wrap narrow"><h1 className="ptitle">{t.faq}</h1>
    {!items.length ? <p className="dim">{t.comingSoon}</p> : items.map(([q, a], i) => <details key={i} className="faqitem"><summary>{q}</summary><p>{a}</p></details>)}</section>);
}
