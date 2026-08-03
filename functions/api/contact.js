/**
 * Cloudflare Pages Function — POST /api/contact
 *
 * 收聯絡表單，用 Resend 寄到公司信箱。
 *
 * 需要在 Cloudflare Pages 專案設定 → Environment variables 設定：
 *   RESEND_API_KEY  Resend 的 API key（設為 Secret）
 *   MAIL_TO         收件信箱，例如 Sales@comtrue-inc.com
 *   MAIL_FROM       寄件位址，網域必須先在 Resend 驗證過，
 *                   例如 "ComTrue Website <noreply@comtrue-inc.com>"
 */

const MAX = { name: 100, company: 120, email: 150, topic: 80, message: 4000 };

const json = (obj, status) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const clean = (v, limit) =>
  typeof v === 'string' ? v.trim().slice(0, limit) : '';

const escapeHtml = (s) =>
  s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  // Honeypot — 真人不會填到這欄，填了就當成垃圾訊息默默丟掉
  if (clean(body.website, 200)) return json({ ok: true }, 200);

  const name    = clean(body.name, MAX.name);
  const company = clean(body.company, MAX.company);
  const email   = clean(body.email, MAX.email);
  const topic   = clean(body.topic, MAX.topic) || 'Website enquiry';
  const message = clean(body.message, MAX.message);

  if (!name || !email || !message) {
    return json({ error: 'Name, email and message are required.' }, 400);
  }
  if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) {
    return json({ error: 'Please provide a valid email address.' }, 400);
  }

  if (!env.RESEND_API_KEY || !env.MAIL_TO || !env.MAIL_FROM) {
    console.error('contact: missing RESEND_API_KEY / MAIL_TO / MAIL_FROM');
    return json({ error: 'Mail service is not configured.' }, 500);
  }

  const rows = [
    ['Name', name],
    ['Company', company || '—'],
    ['Email', email],
    ['Subject', topic],
  ]
    .map(([k, v]) => `<tr><td><b>${k}</b></td><td>${escapeHtml(v)}</td></tr>`)
    .join('');

  const html =
    `<table cellpadding="6">${rows}</table>` +
    `<hr><p style="white-space:pre-wrap">${escapeHtml(message)}</p>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: [env.MAIL_TO],
      reply_to: email,
      subject: `[Website] ${topic} — ${name}`,
      html,
    }),
  });

  if (!res.ok) {
    console.error('contact: resend failed', res.status, await res.text());
    return json({ error: 'Could not send the message.' }, 502);
  }

  return json({ ok: true }, 200);
}
