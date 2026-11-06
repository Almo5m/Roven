import { useTo } from '../lib/router.js';
export default function NotFound({ t }) {
  const to = useTo();
  return (<section className="page"><h1 className="ptitle">{t.notFoundTitle}</h1><p className="dim">{t.notFoundText}</p><a href={to('/')}>{t.back}</a></section>);
}
