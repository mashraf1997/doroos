import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { createApp } from '../src/app.js';
import { videoSource } from '../src/video.js';

let app, base, owner, mona, karim, dataDir, stripe, stripeCalls = [], paid, free, lessons = [];

before(async () => {
  stripe = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      stripeCalls.push({ url: req.url, auth: req.headers.authorization, form: new URLSearchParams(body) });
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ id: 'cs_test_1', url: 'https://checkout.stripe.test/pay/cs_test_1' }));
    });
  });
  await new Promise((r) => stripe.listen(0, r));
  process.env.STRIPE_API_URL = `http://127.0.0.1:${stripe.address().port}`;
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doroos-'));
  app = createApp({ dataDir, env: {}, maxVideoMb: 1 });
  base = `http://127.0.0.1:${await app.start(0)}`;
});
after(async () => {
  await app.stop();
  await new Promise((r) => stripe.close(r));
  fs.rmSync(dataDir, { recursive: true, force: true });
});
async function call(p, { method = 'GET', body, jar, raw, headers = {} } = {}) {
  const res = await fetch(base + p, { method, headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...(jar ? { cookie: jar } : {}), ...headers }, body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined) });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json, headers: res.headers };
}
const jarOf = (r) => r.headers.get('set-cookie').split(';')[0];

test('video links: YouTube, Vimeo, Drive, Bunny, files; anything else is refused', () => {
  assert.equal(videoSource('https://youtu.be/aqz-KE-bpKQ').src, 'https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ?rel=0&modestbranding=1');
  assert.equal(videoSource('https://www.youtube.com/watch?v=aqz-KE-bpKQ&t=3').type, 'embed');
  assert.equal(videoSource('https://vimeo.com/76979871/abc123').src, 'https://player.vimeo.com/video/76979871?h=abc123');
  assert.equal(videoSource('https://drive.google.com/file/d/1AbC_dEf/view').src, 'https://drive.google.com/file/d/1AbC_dEf/preview');
  assert.equal(videoSource('https://iframe.mediadelivery.net/embed/1/abc').type, 'embed');
  assert.deepEqual(videoSource('file:v-abc.mp4'), { type: 'file', name: 'v-abc.mp4' });
  assert.equal(videoSource('javascript:alert(1)'), null);
  assert.equal(videoSource('https://evil.example.com/page'), null);
});

test('owner creates a paid course with lessons and a free course', async () => {
  owner = jarOf(await call('/api/setup', { method: 'POST', body: { siteName: 'أكاديمية نيل', password: 'owner-pass-1' } }));
  await call('/api/settings', { method: 'PUT', jar: owner, body: { settings: { paymentInfo: 'إنستاباي: nile@instapay' } } });
  let r = await call('/api/courses', { method: 'POST', jar: owner, body: { title: 'تصوير المنتجات بالموبايل', price: 500 } });
  paid = r.body.course;
  assert.equal(paid.slug, 'تصوير-المنتجات-بالموبايل');
  assert.equal((await call('/api/courses/' + paid.id + '/lessons', { method: 'POST', jar: owner, body: { title: 'x', videoUrl: 'https://example.com/x' } })).status, 400);
  for (const [title, freeL] of [['المقدمة', true], ['الإضاءة', false], ['الخلفيات', false]]) {
    r = await call(`/api/courses/${paid.id}/lessons`, { method: 'POST', jar: owner, body: { title, free: freeL, videoUrl: 'https://youtu.be/aqz-KE-bpKQ', body: 'ملخص' } });
    lessons.push(r.body.lesson);
  }
  r = await call(`/api/courses/${paid.id}/order`, { method: 'PUT', jar: owner, body: { ids: [lessons[0].id, lessons[2].id, lessons[1].id] } });
  assert.deepEqual(r.body.lessons.map((l) => l.title), ['المقدمة', 'الخلفيات', 'الإضاءة']);
  r = await call('/api/courses', { method: 'POST', jar: owner, body: { title: 'Coding 101', slug: 'coding-101', published: true } });
  free = r.body.course;
  await call(`/api/courses/${free.id}/lessons`, { method: 'POST', jar: owner, body: { title: 'Hello' } });
});

test('drafts are hidden; published course pages are server-rendered for search engines', async () => {
  assert.equal((await fetch(base + '/c/' + encodeURIComponent(paid.slug))).status, 404);
  await call('/api/courses/' + paid.id, { method: 'PUT', jar: owner, body: { published: true, comparePrice: 800 } });
  const html = await (await fetch(base + '/c/' + encodeURIComponent(paid.slug))).text();
  assert.match(html, /<h1>تصوير المنتجات بالموبايل<\/h1>/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /الإضاءة/);
  const home = await (await fetch(base + '/')).text();
  assert.match(home, /Coding 101/);
  assert.match(await (await fetch(base + '/sitemap.xml')).text(), /coding-101/);
});

test('students sign up; free lessons are open, paid ones locked', async () => {
  let r = await call('/api/s/signup', { method: 'POST', body: { name: 'منى', email: 'Mona@Example.com', password: 'mona-123' } });
  mona = jarOf(r);
  assert.equal((await call('/api/s/signup', { method: 'POST', body: { name: 'x', email: 'mona@example.com', password: 'secret1' } })).body.error, 'exists');
  r = await call('/api/s/login', { method: 'POST', body: { login: 'mona@example.com', password: 'mona-123' } });
  assert.equal(r.status, 200);
  karim = jarOf(await call('/api/s/signup', { method: 'POST', body: { name: 'كريم', phone: '٠١٠٠١٢٣٤٥٦٧', password: 'karim-123' } }));
  assert.equal((await call('/api/s/login', { method: 'POST', body: { login: '01001234567', password: 'karim-123' } })).status, 200, 'sign in by phone');
  r = await call('/api/s/course/' + encodeURIComponent(paid.slug), { jar: mona });
  assert.deepEqual(r.body.lessons.map((l) => l.open), [true, false, false]);
  assert.equal((await call('/api/s/lesson/' + lessons[0].id, { jar: mona })).body.lesson.video.type, 'embed');
  assert.equal((await call('/api/s/lesson/' + lessons[1].id, { jar: mona })).status, 403);
  assert.equal((await call('/api/s/lesson/' + lessons[1].id)).status, 401);
});

test('free course: instant access and progress', async () => {
  let r = await call('/api/s/checkout', { method: 'POST', jar: mona, body: { courseId: free.id } });
  assert.equal(r.body.status, 'active');
  const lesson = app.data.lessons.find((l) => l.courseId === free.id);
  r = await call(`/api/s/lesson/${lesson.id}/done`, { method: 'POST', jar: mona, body: {} });
  assert.equal(r.body.progress.percent, 100);
});

test('manual transfer: pending until the owner confirms; coupons', async () => {
  await call('/api/coupons', { method: 'POST', jar: owner, body: { code: 'welcome20', percent: 20, maxUses: 1 } });
  let r = await call('/api/s/quote', { method: 'POST', jar: mona, body: { courseId: paid.id, coupon: 'WELCOME20' } });
  assert.equal(r.body.total, 400);
  assert.equal((await call('/api/s/quote', { method: 'POST', jar: mona, body: { courseId: paid.id, coupon: 'NOPE' } })).status, 404);
  assert.equal((await call('/api/s/checkout', { method: 'POST', jar: mona, body: { courseId: paid.id, method: 'manual' } })).body.error, 'reference_required');
  r = await call('/api/s/checkout', { method: 'POST', jar: mona, body: { courseId: paid.id, method: 'manual', coupon: 'welcome20', reference: 'TRX 5531' } });
  assert.equal(r.body.status, 'pending');
  assert.equal((await call('/api/s/lesson/' + lessons[1].id, { jar: mona })).status, 403, 'still locked');
  const o = await call('/api/overview', { jar: owner });
  assert.equal(o.body.pending, 1);
  const e = (await call('/api/enrollments?status=pending', { jar: owner })).body.enrollments[0];
  assert.equal(e.reference, 'TRX 5531');
  assert.equal(e.amount, 400);
  await call('/api/enrollments/' + e.id, { method: 'PUT', jar: owner, body: { status: 'active' } });
  assert.equal((await call('/api/s/lesson/' + lessons[1].id, { jar: mona })).status, 200);
  assert.equal(app.data.coupons[0].used, 1);
  assert.equal((await call('/api/s/quote', { method: 'POST', jar: karim, body: { courseId: paid.id, coupon: 'WELCOME20' } })).status, 404, 'coupon used up');
  const page = await (await fetch(base + '/c/' + encodeURIComponent(paid.slug), { headers: { cookie: mona } })).text();
  assert.match(page, /كمّل الكورس/);
});

test('card payment through Stripe Checkout and a signed webhook', async () => {
  await call('/api/settings', { method: 'PUT', jar: owner, body: { settings: { stripeSecretKey: 'sk_test_123', stripeWebhookSecret: 'whsec_test', currencyCode: 'egp' } } });
  assert.match((await call('/api/settings', { jar: owner })).body.settings.stripeSecretKey, /^••••••/);
  let r = await call('/api/s/checkout', { method: 'POST', jar: karim, body: { courseId: paid.id, method: 'card' } });
  assert.equal(r.body.url, 'https://checkout.stripe.test/pay/cs_test_1');
  const call0 = stripeCalls.at(-1);
  assert.equal(call0.auth, 'Bearer sk_test_123');
  assert.equal(call0.form.get('line_items[0][price_data][unit_amount]'), '50000');
  assert.equal(call0.form.get('line_items[0][price_data][currency]'), 'egp');
  const ref = call0.form.get('client_reference_id');
  const event = JSON.stringify({ type: 'checkout.session.completed', data: { object: { client_reference_id: ref, payment_status: 'paid' } } });
  const ts = Math.floor(Date.now() / 1000);
  assert.equal((await call('/hooks/stripe', { method: 'POST', raw: event, headers: { 'stripe-signature': `t=${ts},v1=bad` } })).status, 400);
  const sig = crypto.createHmac('sha256', 'whsec_test').update(`${ts}.${event}`).digest('hex');
  r = await call('/hooks/stripe', { method: 'POST', raw: event, headers: { 'stripe-signature': `t=${ts},v1=${sig}` } });
  assert.equal(r.status, 200);
  r = await call('/api/s/my', { jar: karim });
  assert.equal(r.body.enrollments[0].status, 'active');
});

test('uploaded videos stream with ranges, only to students with access', async () => {
  const mp4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypmp42'), Buffer.alloc(2000, 7)]);
  let r = await call('/api/upload?kind=video', { method: 'POST', jar: owner, raw: mp4 });
  assert.match(r.body.value, /^file:v-\w+\.mp4$/);
  assert.equal((await call('/api/upload?kind=video', { method: 'POST', jar: owner, raw: Buffer.from('not a video at all') })).status, 400);
  assert.equal((await call('/api/upload?kind=video', { method: 'POST', jar: owner, raw: Buffer.alloc(1.5 * 1024 * 1024) })).status, 413);
  await call('/api/lessons/' + lessons[2].id, { method: 'PUT', jar: owner, body: { videoUrl: r.body.value } });
  const src = (await call('/api/s/lesson/' + lessons[2].id, { jar: mona })).body.lesson.video.src;
  const part = await fetch(base + src, { headers: { cookie: mona, range: 'bytes=0-99' } });
  assert.equal(part.status, 206);
  assert.equal(part.headers.get('content-range'), `bytes 0-99/${mp4.length}`);
  assert.equal((await part.arrayBuffer()).byteLength, 100);
  const stranger = jarOf(await call('/api/s/signup', { method: 'POST', body: { name: 'z', email: 'z@example.com', password: 'zzzzzz' } }));
  assert.equal((await fetch(base + src, { headers: { cookie: stranger } })).status, 403);
  assert.equal((await fetch(base + src)).status, 403);
});

test('owner tools: manual enrollment, students, CSV, delete rules', async () => {
  let r = await call('/api/enrollments', { method: 'POST', jar: owner, body: { student: 'z@example.com', courseId: paid.id, amount: 250 } });
  assert.equal(r.body.enrollment.status, 'active');
  r = await call('/api/students?q=منى', { jar: owner });
  assert.equal(r.body.students.length, 1);
  assert.equal(r.body.students[0].courses.length, 2);
  const csv = await (await fetch(base + '/api/students.csv', { headers: { cookie: owner } })).text();
  assert.match(csv, /mona@example.com/);
  assert.equal((await call('/api/courses/' + paid.id, { method: 'DELETE', jar: owner, body: {} })).status, 409);
  const o = await call('/api/overview', { jar: owner });
  assert.equal(o.body.revenueTotal, 400 + 500 + 250);
  for (const p of ['/learn', '/admin', '/robots.txt']) assert.equal((await fetch(base + p)).status, 200, p);
  assert.equal((await call('/api/courses')).status, 401);
});
