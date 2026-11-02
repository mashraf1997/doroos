// Stripe Checkout for course purchases, with a verified webhook.
import crypto from 'node:crypto';

const STRIPE = () => process.env.STRIPE_API_URL || 'https://api.stripe.com';
const ZERO_DECIMAL = new Set(['jpy', 'krw', 'vnd', 'clp', 'xof', 'xaf', 'ugx', 'rwf']);
const minor = (amount, currency) => Math.round(Number(amount) * (ZERO_DECIMAL.has(currency) ? 1 : 100));

export async function stripeCheckout({ secretKey, currency, amount, title, reference, email, successUrl, cancelUrl }) {
  const cur = String(currency || 'usd').toLowerCase();
  const form = new URLSearchParams({
    mode: 'payment',
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': cur,
    'line_items[0][price_data][unit_amount]': String(minor(amount, cur)),
    'line_items[0][price_data][product_data][name]': title.slice(0, 200),
    'metadata[reference]': reference,
    client_reference_id: reference,
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
  if (email && /@/.test(email)) form.set('customer_email', email);
  const res = await fetch(`${STRIPE()}/v1/checkout/sessions`, {
    method: 'POST',
    headers: { authorization: `Bearer ${secretKey}`, 'content-type': 'application/x-www-form-urlencoded' },
    body: form,
    signal: AbortSignal.timeout(20_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error?.message || `Stripe answered HTTP ${res.status}`);
  return { id: data.id, url: data.url };
}

/** Verifies a Stripe webhook (Stripe-Signature: t=...,v1=...). Returns the event or null. */
export function verifyStripeEvent(rawBody, header, secret, toleranceSec = 300) {
  if (!secret || !header) return null;
  const parts = Object.fromEntries(String(header).split(',').map((kv) => kv.split('=')).filter((p) => p.length === 2).map(([k, v]) => [k.trim(), v.trim()]));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > toleranceSec) return null;
  const expected = crypto.createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
  const sigs = String(header).split(',').filter((p) => p.trim().startsWith('v1=')).map((p) => p.trim().slice(3));
  if (!sigs.some((s) => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)))) return null;
  try { return JSON.parse(rawBody.toString('utf8')); } catch { return null; }
}
