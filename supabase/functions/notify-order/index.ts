// Sends a Telegram message when an order is created or a receipt is attached.
// Called by a Supabase Database Webhook on the orders table (INSERT + UPDATE).
const esc = (s: unknown) => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
const METHOD: Record<string, string> = { cod: 'Cash on delivery', transfer: 'Transfer', online: 'Online' };

Deno.serve(async req => {
  if (req.headers.get('x-webhook-secret') !== Deno.env.get('WEBHOOK_SECRET')) return new Response('forbidden', { status: 403 });
  const p = await req.json(), o = p.record;
  let text = '';
  if (p.type === 'INSERT') {
    const items = (o.items as any[]).map(i => `• ${esc(i.product_id)} · ${esc(i.size)} · ${esc(i.color)}`).join('\n');
    text = `🖤 <b>New order ${esc(o.tracking)}</b>\n${esc(o.customer.name)} · ${esc(o.customer.phone)}\n${esc(o.customer.city)}, ${esc(o.customer.address)}\n\n${items}\n\n` +
      `<b>${esc(o.total)} EGP</b> · ${METHOD[o.method] ?? esc(o.method)}${o.coupon ? ` · code ${esc(o.coupon)}` : ''}`;
  } else if (p.type === 'UPDATE' && !p.old_record?.receipt && o.receipt) {
    text = `🧾 Receipt uploaded for <b>${esc(o.tracking)}</b> (${esc(o.total)} EGP). Check it in the dashboard.`;
  } else return new Response('skipped');

  const r = await fetch(`https://api.telegram.org/bot${Deno.env.get('TELEGRAM_BOT_TOKEN')}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: Deno.env.get('TELEGRAM_CHAT_ID'), text, parse_mode: 'HTML' }),
  });
  return new Response(r.ok ? 'sent' : 'telegram error', { status: r.ok ? 200 : 502 });
});
