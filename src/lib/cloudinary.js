import { supabase } from './supabase.js';
const OK = new Set(['image/jpeg', 'image/png', 'image/webp']);
const fail = m => { throw new Error(m); };

/* Phone photos are often 4 to 10 MB. Shrink them in the browser first (max 2000 px, JPEG), so uploads are fast and never hit a size limit. */
async function shrink(file) {
  let bmp; try { bmp = await createImageBitmap(file); } catch { return file; }
  const k = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
  if (k === 1 && file.size <= 1.5 * 1024 * 1024) { bmp.close?.(); return file; }
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(bmp, 0, 0, c.width, c.height); bmp.close?.();
  const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.86));
  return blob ? new File([blob], 'photo.jpg', { type: 'image/jpeg' }) : file;
}

/* Admin only. Returns the image address, or throws an Error whose message (Arabic) says exactly what went wrong. */
export async function uploadImage(original) {
  if (!supabase) fail('مفاتيح Supabase مش موجودة.');
  if (!OK.has(original.type)) fail('نوع الصورة غير مدعوم. استخدم JPG أو PNG أو WebP.');
  const file = await shrink(original);
  if (file.size > 9 * 1024 * 1024) fail('الصورة كبيرة جدًا حتى بعد التصغير.');

  const { data: s, error } = await supabase.functions.invoke('cloudinary-sign');
  if (error) {
    const st = error.context?.status; let body = null; try { body = await error.context.json(); } catch { /* no body */ }
    if (st === 404) fail('دالة رفع الصور (cloudinary-sign) مش منشورة على Supabase.');
    if (st === 401) fail('الجلسة انتهت. سجّل خروج وادخل تاني.');
    if (st === 403) fail('الحساب ده مش مسجّل كأدمن.');
    if (body?.error === 'missing_secrets') fail('أسرار Cloudinary ناقصة في Supabase.');
    fail('تعذر الاتصال بدالة رفع الصور.');
  }
  if (!s?.signature) fail('رد غير متوقع من دالة رفع الصور.');

  const fd = new FormData();
  fd.append('file', file);
  for (const k of ['api_key', 'timestamp', 'signature', 'folder', 'allowed_formats']) fd.append(k, s[k]);
  let r; try { r = await fetch(`https://api.cloudinary.com/v1_1/${s.cloud_name}/image/upload`, { method: 'POST', body: fd }); } catch { fail('تعذر الوصول لـ Cloudinary. راجع الإنترنت.'); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) fail(`Cloudinary رفض الصورة: ${j.error?.message || r.status}`);
  return j.secure_url;
}
/* Serve Cloudinary images resized and in the best format for the visitor's browser. */
export const opt = (url, w = 900) => (url.includes('res.cloudinary.com') ? url.replace('/upload/', `/upload/f_auto,q_auto,w_${w}/`) : url);
