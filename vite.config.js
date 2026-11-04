import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/* The strict CSP is added only to the production build. In dev, Vite injects inline styles and scripts
   (hot reload), and a strict CSP would block them and leave the page unstyled. */
const CSP = "default-src 'self'; img-src 'self' data: https://*.supabase.co https://res.cloudinary.com; connect-src 'self' https://*.supabase.co https://api.cloudinary.com; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self'; base-uri 'none'; form-action 'none'";
const csp = () => ({
  name: 'roven-csp', apply: 'build',
  transformIndexHtml: html => html.replace('</head>', `<meta http-equiv="Content-Security-Policy" content="${CSP}"></head>`),
});
export default defineConfig({ plugins: [react(), csp()] });
