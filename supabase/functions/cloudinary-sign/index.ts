// Signs a Cloudinary upload, but only for signed-in admins. The API secret never reaches the browser.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return json({ error: 'unauthorized' }, 401);
  const { data: admin } = await sb.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
  if (!admin) return json({ error: 'forbidden' }, 403);

  if (!Deno.env.get('CLOUDINARY_API_SECRET') || !Deno.env.get('CLOUDINARY_API_KEY') || !Deno.env.get('CLOUDINARY_CLOUD_NAME')) return json({ error: 'missing_secrets' }, 500);

  const timestamp = Math.floor(Date.now() / 1000), folder = 'roven/products', allowed_formats = 'jpg,png,webp';
  const toSign = `allowed_formats=${allowed_formats}&folder=${folder}&timestamp=${timestamp}${Deno.env.get('CLOUDINARY_API_SECRET')}`;
  const hash = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(toSign));
  const signature = [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
  return json({ signature, timestamp, folder, allowed_formats, api_key: Deno.env.get('CLOUDINARY_API_KEY'), cloud_name: Deno.env.get('CLOUDINARY_CLOUD_NAME') });
});
