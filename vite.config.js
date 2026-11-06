import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { buildMeta, headHtml } from './src/lib/seo-core.js';

/* The strict CSP is added only to the production build. In dev, Vite injects inline styles and scripts
   (hot reload), and a strict CSP would block them and leave the page unstyled. */
const CSP = "default-src 'self'; img-src 'self' data: https://*.supabase.co https://res.cloudinary.com; connect-src 'self' https://*.supabase.co https://api.cloudinary.com; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self'; base-uri 'none'; form-action 'none'";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const site = (env.VITE_SITE_URL || 'https://roven-almo.vercel.app').replace(/\/$/, '');
  /* Default page tags (title, description, social preview) written into index.html. The /api/seo function replaces them per page. */
  const seo = () => ({ name: 'roven-seo', transformIndexHtml: html => html.replace('<!--SEO-->', () =>
    `<!--SEO-->\n${headHtml(buildMeta({ site, lang: 'en', rest: '/', data: {} }), { verification: env.VITE_GOOGLE_VERIFICATION })}\n<!--/SEO-->`) });
  const csp = () => ({ name: 'roven-csp', apply: 'build',
    transformIndexHtml: html => html.replace('</head>', `<meta http-equiv="Content-Security-Policy" content="${CSP}"></head>`) });
  return { plugins: [react(), seo(), csp()], define: { __SITE_URL__: JSON.stringify(site) } };
});
