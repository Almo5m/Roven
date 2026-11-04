import { supabase } from './supabase.js';
const OK = new Set(['image/jpeg', 'image/png', 'image/webp']);

/* Admin only: the Edge Function checks the admin and signs the upload; the file goes straight to Cloudinary. */
export async function uploadImage(file) {
  if (!supabase || !OK.has(file.type) || file.size > 3145728) return null;
  const { data: s, error } = await supabase.functions.invoke('cloudinary-sign');
  if (error || !s?.signature) return null;
  const fd = new FormData();
  fd.append('file', file);
  for (const k of ['api_key', 'timestamp', 'signature', 'folder', 'allowed_formats']) fd.append(k, s[k]);
  const r = await fetch(`https://api.cloudinary.com/v1_1/${s.cloud_name}/image/upload`, { method: 'POST', body: fd });
  return r.ok ? (await r.json()).secure_url : null;
}
/* Serve Cloudinary images resized and in the best format for the visitor's browser. */
export const opt = (url, w = 900) => (url.includes('res.cloudinary.com') ? url.replace('/upload/', `/upload/f_auto,q_auto,w_${w}/`) : url);
