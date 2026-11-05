# Deploying on Vercel

1. Vercel > your project > Settings > Environment Variables. Add these two for Production, Preview and Development:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. Go to Deployments > the latest one > Redeploy. The variables are baked in at build time, so changing them without redeploying does nothing.
3. Build settings: Framework Preset Vite, build command `npm run build`, output directory `dist`.
4. Supabase > Authentication > URL Configuration: set Site URL to your Vercel address.
5. Open `https://YOUR-SITE.vercel.app/#/admin`.

Never add the `service_role` key or any Edge Function secret (Telegram, Cloudinary) to Vercel. Those stay in Supabase secrets.

## If something looks cut off on a phone
Open the site on a computer, press F12, choose the device toolbar (phone icon), pick a phone, and paste this in the Console. It lists elements that stick out of the screen:
```js
[...document.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth+1||r.left<-1}).slice(0,10).map(e=>e.tagName+'.'+e.className)
```
