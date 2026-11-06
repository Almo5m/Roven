import { T } from './i18n.js';
/* Categories come from the dashboard; until some exist we derive them from the products so the shop is never empty. */
export const catsOf = (catalog, products) => catalog.categories.length ? catalog.categories
  : [...new Set(products.map(p => p.category || 'other'))].map(slug => ({ slug, name_en: T.en['cat_' + slug] || slug, name_ar: T.ar['cat_' + slug] || slug }));
export const nm = (o, lang) => o['name_' + lang] || o.name_en;

/* Colour names typed in English show in Arabic on the Arabic site. Anything else is shown as typed. */
export const COLOR_AR = { black: 'أسود', white: 'أبيض', grey: 'رمادي', gray: 'رمادي', silver: 'فضي', navy: 'كحلي', beige: 'بيج', red: 'أحمر', blue: 'أزرق', green: 'أخضر', brown: 'بني', olive: 'زيتي', cream: 'كريمي' };
export const colorName = (c, lang) => (lang === 'ar' && COLOR_AR[String(c).toLowerCase()]) || c;
