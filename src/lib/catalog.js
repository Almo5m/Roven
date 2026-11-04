import { T } from './i18n.js';
/* Categories come from the dashboard; until some exist we derive them from the products so the shop is never empty. */
export const catsOf = (catalog, products) => catalog.categories.length ? catalog.categories
  : [...new Set(products.map(p => p.category || 'other'))].map(slug => ({ slug, name_en: T.en['cat_' + slug] || slug, name_ar: T.ar['cat_' + slug] || slug }));
export const nm = (o, lang) => o['name_' + lang] || o.name_en;
