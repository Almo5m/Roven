/* Text pages. Their content is edited in Dashboard > Settings, nothing is hard-coded here. */
const lines = s => String(s || '').split('\n').map(x => x.trim()).filter(Boolean);

export function About({ t, lang, settings }) {
  return (<section className="wrap narrow"><img className="mini-logo" src="/logo-r.png" alt="" />
    <h1 className="ptitle">{t.about}</h1><p className="lead pre">{settings['about_' + lang] || t.manifesto}</p></section>);
}
export function Sizes({ t, settings }) {
  const rows = lines(settings.size_chart).map(l => l.split('|').map(c => c.trim()));
  return (<section className="wrap narrow"><h1 className="ptitle">{t.sizeGuide}</h1>
    {rows.length < 2 ? <p className="dim">{t.comingSoon}</p> :
      <div className="scroll"><table className="table"><thead><tr>{rows[0].map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
        <tbody>{rows.slice(1).map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table></div>}</section>);
}
export function Faq({ t, lang, settings }) {
  const items = lines(settings['faq_' + lang]).map(l => l.split('||').map(x => x.trim())).filter(x => x[0] && x[1]);
  return (<section className="wrap narrow"><h1 className="ptitle">{t.faq}</h1>
    {!items.length ? <p className="dim">{t.comingSoon}</p> : items.map(([q, a], i) => <details key={i} className="faqitem"><summary>{q}</summary><p>{a}</p></details>)}</section>);
}
