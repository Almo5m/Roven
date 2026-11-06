import { supabase } from './supabase.js';
export const DEMO = [
 {id:'hoodie',name_en:'Hoodie',name_ar:'هودي',price:0,sizes:['S','M','L','XL'],colors:['Black','Silver'],category:'hoodie',featured:true},
 {id:'sweatpants',name_en:'Sweatpants',name_ar:'سويت بانتس',price:0,sizes:['S','M','L','XL'],colors:['Black'],category:'sweatpants',featured:true},
 {id:'sweatshirt',name_en:'Sweatshirt',name_ar:'سويت شيرت',price:0,sizes:['S','M','L','XL'],colors:['Black','Silver'],category:'sweatshirt',featured:true}];
const FALLBACK = { drop_date: '', faq: [], transfer_methods: [], announcement_en: '', announcement_ar: '', about_en: '', about_ar: '', faq_en: '', faq_ar: '', size_chart: '', lookbook: [], shipping_fee: 60, free_shipping_over: 0, transfer_info: '', instagram: '', tiktok: '' };
const toItems = cart => cart.map(l => ({ product_id: l.id, size: l.size, color: l.color }));

export async function loadProducts() {
  if (!supabase) return DEMO; // only when running locally without Supabase keys
  const { data, error } = await supabase.from('products').select('id,name_en,name_ar,price,sizes,colors,images,stock,category,collections,description_en,description_ar,featured').eq('active', true).order('sort');
  return error ? [] : data || []; // a real store never shows placeholder products
}
export async function loadSettings() {
  if (!supabase) return FALLBACK;
  const { data } = await supabase.from('settings').select('key,value');
  return data?.length ? { ...FALLBACK, ...Object.fromEntries(data.map(r => [r.key, r.value])) } : FALLBACK;
}
/* Prices, coupon and shipping are always calculated by the server; this only displays them. */
export async function quote(cart, coupon, settings) {
  if (!supabase) {
    if (coupon) return { error: true };
    const subtotal = cart.reduce((a, l) => a + l.price, 0), shipping = settings.shipping_fee;
    return { subtotal, discount: 0, shipping, total: subtotal + shipping };
  }
  const { data, error } = await supabase.rpc('quote_order', { p_items: toItems(cart), p_coupon: coupon || null });
  return error ? { error: true } : data;
}
export async function placeOrder(customer, cart, method, coupon) {
  if (!supabase) return { ok: true, tracking: 'RV-DEMO0001' };
  const { data, error } = await supabase.rpc('create_order', { p_customer: customer, p_items: toItems(cart), p_method: method, p_coupon: coupon || null });
  return { ok: !error, tracking: data?.tracking };
}
export async function trackOrder(code, phone) {
  if (!supabase) return null;
  const { data } = await supabase.rpc('track_order', { p_code: code, p_phone: phone });
  return data || null;
}

const RECEIPT_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
/* Upload the receipt image, then link it to the order (the server checks code + phone). */
export async function uploadReceipt(code, phone, file) {
  if (!supabase || !file || !RECEIPT_EXT[file.type] || file.size > 2097152) return false;
  const c = code.trim().toUpperCase(), path = `${c}/${crypto.randomUUID()}.${RECEIPT_EXT[file.type]}`;
  const up = await supabase.storage.from('receipts').upload(path, file, { contentType: file.type });
  if (up.error) return false;
  const { data } = await supabase.rpc('attach_receipt', { p_code: c, p_phone: phone, p_path: path });
  return data === true;
}

export async function loadTestimonials() {
  if (!supabase) return [];
  const { data } = await supabase.from('testimonials').select('id,name,rating,text,verified').eq('status', 'approved').order('created_at', { ascending: false }).limit(6);
  return data || [];
}

export async function loadCatalog() {
  if (!supabase) return { categories: [], collections: [] };
  const [c, k] = await Promise.all([supabase.from('categories').select('*').eq('active', true).order('sort'),
    supabase.from('collections').select('*').eq('active', true).order('sort')]);
  return { categories: c.data || [], collections: k.data || [] };
}

/* Review links: the token belongs to one order, the server checks it. */
export async function reviewRequest(token) {
  if (!supabase) return null;
  const { data } = await supabase.rpc('get_review_request', { p_token: token });
  return data || null;
}
export async function submitReview(token, rating, text, name) {
  if (!supabase) return false;
  const { data } = await supabase.rpc('submit_review', { p_token: token, p_rating: rating, p_text: text, p_name: name });
  return data === true;
}
