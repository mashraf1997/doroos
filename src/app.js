// Doroos server: sell your own courses. Public course pages, student accounts, a lesson player,
// card payments (Stripe) or manual transfers approved by the owner, coupons and progress.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { hashPassword, verifyPassword, createSession, checkSession, parseCookies, RateLimiter } from './auth.js';
import { send, readJson, readBody, clientIp, originOf, serveStatic, cookie, VERSION } from './http.js';
import { demoConfig, resetData } from './demo-mode.js';
import { buildDemo } from './demo-data.js';
import { homePage, coursePage, notFoundPage } from './pages.js';
import { videoSource } from './video.js';
import { stripeCheckout, verifyStripeEvent } from './payments.js';

export function defaultData() {
  return {
    version: 1,
    meta: { secret: crypto.randomBytes(32).toString('hex'), createdAt: new Date().toISOString() },
    admin: null,
    settings: {
      siteName: '',
      tagline: '',
      about: '',
      footer: '',
      lang: 'ar',
      color: '#7C3AED',
      currency: 'جنيه',
      currencyCode: 'EGP', // for card payments
      timezone: '',
      whatsapp: '',
      allowSignup: true,
      paymentInfo: '', // manual payment instructions (InstaPay, wallet, bank). Empty = off.
      stripeSecretKey: '',
      stripeWebhookSecret: '',
    },
    courses: [], // { id, slug, title, subtitle, description, cover, price, comparePrice, instructor, published, order, createdAt }
    lessons: [], // { id, courseId, title, body, videoUrl, free, durationMin, order }
    students: [], // { id, name, email, phone, pass: { salt, hash }, createdAt, lastSeen }
    enrollments: [], // { id, studentId, courseId, status: pending|active|rejected, method, amount, reference, coupon, checkoutId, createdAt, approvedAt, progress: { lessonId: iso } }
    coupons: [], // { id, code, percent, courseId, maxUses, used, expires }
  };
}

const clean = (s, n = 200) => String(s ?? '').trim().slice(0, n);
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const SECRET_KEYS = ['stripeSecretKey', 'stripeWebhookSecret'];
const MASK = '••••••';
export const normPhone = (p) => String(p || '').replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^\d+]/g, '').replace(/^00/, '+');
export function slugify(s) {
  const x = String(s || '').toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  return x || 'course';
}
function sniffImage(b) {
  if (b[0] === 0xff && b[1] === 0xd8) return 'jpg';
  if (b[0] === 0x89 && b[1] === 0x50) return 'png';
  if (b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP') return 'webp';
  return null;
}
const sniffVideo = (b) => (b.slice(4, 8).toString() === 'ftyp' ? 'mp4' : b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3 ? 'webm' : null);
const MIME = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', mp4: 'video/mp4', webm: 'video/webm' };

export function createApp({ dataDir, setupToken = process.env.SETUP_TOKEN || '', env = process.env, maxVideoMb = Number(process.env.MAX_VIDEO_MB) || 2048 } = {}) {
  fs.mkdirSync(path.join(dataDir, 'media'), { recursive: true });
  const file = path.join(dataDir, 'doroos.json');
  const mediaDir = path.join(dataDir, 'media');
  const def = defaultData();
  const loaded = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
  const data = loaded ? { ...def, ...loaded, settings: { ...def.settings, ...loaded.settings } } : def;
  let timer;
  const flush = () => { clearTimeout(timer); fs.writeFileSync(file + '.tmp', JSON.stringify(data)); fs.renameSync(file + '.tmp', file); };
  const save = () => { clearTimeout(timer); timer = setTimeout(flush, 200); };
  if (!loaded) flush();
  // DEMO_MODE=true: a public showcase with sample data that resets on a timer.
  const demo = demoConfig(env);
  const resetDemo = () => { resetData(data, () => buildDemo(demo), demo); flush(); };
  let demoTimer = null;
  if (demo) { resetDemo(); demoTimer = setInterval(resetDemo, demo.resetMinutes * 60_000); demoTimer.unref?.(); }

  const loginLimiter = new RateLimiter(10, 15 * 60_000);
  const studentLimiter = new RateLimiter(20, 15 * 60_000);
  const signupLimiter = new RateLimiter(10, 60 * 60_000);

  // Owner and student sessions use separate cookies; each is bound to its password hash.
  const hashFor = (uid) => {
    if (uid === 'owner') return data.admin?.hash;
    if (uid?.startsWith('st:')) return data.students.find((s) => s.id === uid.slice(3))?.pass.hash || null;
    return null;
  };
  const isOwner = (req) => checkSession(data.meta.secret, parseCookies(req.headers.cookie).doroos_session, hashFor) === 'owner';
  const studentOf = (req) => {
    const uid = checkSession(data.meta.secret, parseCookies(req.headers.cookie).doroos_student, hashFor);
    return uid?.startsWith('st:') ? data.students.find((s) => s.id === uid.slice(3)) || null : null;
  };
  const ownerCookie = (req) => cookie(req, 'doroos_session', createSession(data.meta.secret, data.admin.hash), 30 * 86400);
  const studentCookie = (req, s) => cookie(req, 'doroos_student', createSession(data.meta.secret, s.pass.hash, 'st:' + s.id), 30 * 86400);

  const course = (id) => data.courses.find((c) => c.id === id);
  const lessonsOf = (c) => data.lessons.filter((l) => l.courseId === c.id).sort((a, b) => a.order - b.order);
  const enrollment = (st, c) => (st ? data.enrollments.find((e) => e.studentId === st.id && e.courseId === c.id && e.status !== 'rejected') : null);
  const hasAccess = (st, c) => enrollment(st, c)?.status === 'active';
  const progressOf = (e, c) => { const ls = lessonsOf(c); const done = ls.filter((l) => e?.progress?.[l.id]).length; return { done, total: ls.length, percent: ls.length ? Math.round((done / ls.length) * 100) : 0 }; };
  const studentView = (s) => ({ id: s.id, name: s.name, email: s.email, phone: s.phone, createdAt: s.createdAt, lastSeen: s.lastSeen });
  const publicSite = () => { const s = data.settings; return { siteName: s.siteName, lang: s.lang, color: s.color, currency: s.currency, whatsapp: s.whatsapp, allowSignup: s.allowSignup, paymentInfo: s.paymentInfo, cards: Boolean(s.stripeSecretKey) }; };
  const findCoupon = (code, c) => {
    const k = clean(code, 40).toUpperCase();
    if (!k) return null;
    const x = data.coupons.find((y) => y.code === k);
    if (!x || (x.courseId && x.courseId !== c.id) || (x.maxUses && x.used >= x.maxUses) || (x.expires && x.expires < new Date().toISOString().slice(0, 10))) return null;
    return x;
  };
  const priceWith = (c, coupon) => round2(Math.max(0, Number(c.price) * (1 - (coupon ? coupon.percent / 100 : 0))));

  function activate(e, method) {
    if (e.status === 'active') return;
    e.status = 'active';
    e.approvedAt = new Date().toISOString();
    if (method) e.method = method;
    if (e.coupon) { const k = data.coupons.find((x) => x.code === e.coupon); if (k) k.used += 1; }
    save();
  }

  // Streams a stored file with HTTP range support (needed for seeking in videos).
  function sendMedia(req, res, name, extraHeaders = {}) {
    const full = path.join(mediaDir, name);
    if (!full.startsWith(mediaDir + path.sep) || !fs.existsSync(full)) return send(res, 404, 'Not found');
    const size = fs.statSync(full).size;
    const type = MIME[path.extname(name).slice(1)] || 'application/octet-stream';
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (range) {
      let start = range[1] === '' ? size - Number(range[2]) : Number(range[1]);
      let end = range[1] === '' || range[2] === '' ? size - 1 : Math.min(Number(range[2]), size - 1);
      if (!(start >= 0) || start > end) { res.writeHead(416, { 'content-range': `bytes */${size}` }); return res.end(); }
      res.writeHead(206, { 'content-type': type, 'content-length': end - start + 1, 'content-range': `bytes ${start}-${end}/${size}`, 'accept-ranges': 'bytes', ...extraHeaders });
      return fs.createReadStream(full, { start, end }).pipe(res);
    }
    res.writeHead(200, { 'content-type': type, 'content-length': size, 'accept-ranges': 'bytes', ...extraHeaders });
    fs.createReadStream(full).pipe(res);
  }

  /** Saves an uploaded body as a file in the media folder, streaming it (videos can be large). */
  function receiveUpload(req, kind) {
    return new Promise((resolve, reject) => {
      const limit = kind === 'video' ? maxVideoMb * 1024 * 1024 : 5 * 1024 * 1024;
      const tmp = path.join(mediaDir, `.up-${crypto.randomBytes(6).toString('hex')}`);
      const out = fs.createWriteStream(tmp);
      let size = 0, head = Buffer.alloc(0), failed = false;
      const fail = (status, msg) => { if (failed) return; failed = true; out.destroy(); fs.rm(tmp, { force: true }, () => {}); req.resume(); reject(Object.assign(new Error(msg), { status })); };
      req.on('data', (chunk) => {
        size += chunk.length;
        if (head.length < 16) head = Buffer.concat([head, chunk.subarray(0, 16)]);
        if (size > limit) fail(413, kind === 'video' ? `Video is larger than ${maxVideoMb} MB` : 'Image is larger than 5 MB');
        else if (!out.write(chunk)) { req.pause(); out.once('drain', () => req.resume()); }
      });
      req.on('end', () => {
        if (failed) return;
        out.end(() => {
          const ext = kind === 'video' ? sniffVideo(head) : sniffImage(head);
          if (!ext) return fail(400, kind === 'video' ? 'Upload an MP4 or WebM video' : 'Upload a JPG, PNG or WebP image');
          const name = `${kind === 'video' ? 'v' : 'i'}-${crypto.randomBytes(9).toString('hex')}.${ext}`;
          fs.renameSync(tmp, path.join(mediaDir, name));
          resolve({ name, size });
        });
      });
      req.on('error', (e) => fail(400, e.message));
    });
  }

  // ---------- routes ----------
  async function route(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const p = url.pathname;
    const method = req.method;
    const s = data.settings;
    let m;

    if (p === '/health') return send(res, 200, { ok: true, version: VERSION });

    if (method === 'GET') {
      const html = (body, status = 200) => send(res, status, body, { 'content-type': 'text/html; charset=utf-8' });
      if (p === '/') {
        const list = data.courses.filter((c) => c.published).sort((a, b) => a.order - b.order);
        const stats = Object.fromEntries(list.map((c) => [c.id, { lessons: lessonsOf(c).length }]));
        return html(homePage(s, list, stats, originOf(req)));
      }
      if ((m = p.match(/^\/c\/([^/]+)$/))) {
        const c = data.courses.find((x) => x.slug === decodeURIComponent(m[1]) && (x.published || isOwner(req)));
        if (!c) return html(notFoundPage(s), 404);
        const st = studentOf(req);
        return html(coursePage(s, c, lessonsOf(c), { origin: originOf(req), enrolled: hasAccess(st, c), students: data.enrollments.filter((e) => e.courseId === c.id && e.status === 'active').length }));
      }
      if (p === '/learn') return serveStatic(res, 'learn.html');
      if (p === '/admin' || p === '/admin/') return serveStatic(res, 'admin.html');
      if (/^\/[\w.-]+\.(js|css|svg|png|ico)$/.test(p)) return serveStatic(res, p.slice(1));
      if ((m = p.match(/^\/media\/(i-[\w]+\.(jpg|png|webp))$/))) return sendMedia(req, res, m[1], { 'cache-control': 'public, max-age=86400' });
      if ((m = p.match(/^\/media\/v\/(v-[\w]+\.(mp4|webm))$/))) {
        // Uploaded videos only play for students with access (or the owner).
        const st = studentOf(req);
        const ok = isOwner(req) || data.lessons.some((l) => l.videoUrl === 'file:' + m[1] && course(l.courseId) && (l.free || hasAccess(st, course(l.courseId))));
        if (!ok) return send(res, 403, 'Forbidden');
        return sendMedia(req, res, m[1], { 'cache-control': 'private, no-store', 'content-disposition': 'inline' });
      }
      if (p === '/robots.txt') return send(res, 200, `User-agent: *\nDisallow: /api/\nDisallow: /learn\nDisallow: /admin\nSitemap: ${originOf(req)}/sitemap.xml\n`);
      if (p === '/sitemap.xml') {
        const o = originOf(req);
        const urls = [`${o}/`, ...data.courses.filter((c) => c.published).map((c) => `${o}/c/${encodeURIComponent(c.slug)}`)];
        return send(res, 200, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${u.replace(/&/g, '&amp;')}</loc></url>`).join('')}</urlset>`, { 'content-type': 'application/xml' });
      }
    }

    // ----- Stripe webhook -----
    if (p === '/hooks/stripe' && method === 'POST') {
      const raw = await readBody(req);
      const ev = verifyStripeEvent(raw, req.headers['stripe-signature'], s.stripeWebhookSecret);
      if (!ev) return send(res, 400, { error: 'bad_signature' });
      if (ev.type === 'checkout.session.completed') {
        const ref = ev.data?.object?.client_reference_id || ev.data?.object?.metadata?.reference;
        const e = data.enrollments.find((x) => x.id === ref);
        if (e && ev.data.object.payment_status !== 'unpaid') activate(e, 'card');
      }
      return send(res, 200, { received: true });
    }

    if (p.startsWith('/api/s/')) return studentApi(req, res, url, p, method);

    // ----- owner sign-in -----
    if (demo && method === 'POST' && (p === '/api/setup' || p === '/api/password')) return send(res, 403, { error: 'Not available in the demo' });
    if (p === '/api/session' && method === 'GET') return send(res, 200, { needsSetup: !data.admin, authed: isOwner(req), setupTokenRequired: Boolean(setupToken), version: VERSION, demo: demo ? { password: demo.password, resetMinutes: demo.resetMinutes } : null });
    if (p === '/api/setup' && method === 'POST') {
      if (data.admin) return send(res, 409, { error: 'Already set up' });
      const body = await readJson(req);
      if (setupToken && body.setupToken !== setupToken) return send(res, 403, { error: 'Wrong setup token' });
      if (String(body.password || '').length < 8) return send(res, 400, { error: 'Password must be at least 8 characters' });
      data.admin = hashPassword(String(body.password));
      s.siteName = clean(body.siteName, 80);
      if (body.lang === 'en') Object.assign(s, { lang: 'en', currency: 'USD', currencyCode: 'USD' });
      if (body.timezone) s.timezone = clean(body.timezone, 60);
      flush();
      return send(res, 200, { ok: true }, { 'set-cookie': ownerCookie(req) });
    }
    if (p === '/api/login' && method === 'POST') {
      if (!loginLimiter.allow(clientIp(req))) return send(res, 429, { error: 'Too many attempts. Try again in 15 minutes.' });
      const body = await readJson(req);
      if (!verifyPassword(String(body.password || ''), data.admin)) return send(res, 401, { error: 'Wrong password' });
      return send(res, 200, { ok: true }, { 'set-cookie': ownerCookie(req) });
    }
    if (p === '/api/logout' && method === 'POST') return send(res, 200, { ok: true }, { 'set-cookie': cookie(req, 'doroos_session', '', 0) });

    if (p.startsWith('/api/')) {
      if (!isOwner(req)) return send(res, 401, { error: 'Not signed in' });
      if (p === '/api/upload' && method === 'POST') {
        const kind = url.searchParams.get('kind') === 'video' ? 'video' : 'image';
        if (demo && kind === 'video') return send(res, 403, { error: 'Not available in the demo' });
        const r = await receiveUpload(req, kind);
        return send(res, 200, { name: r.name, size: r.size, value: kind === 'video' ? 'file:' + r.name : r.name });
      }
      if (method !== 'GET' && !(req.headers['content-type'] || '').includes('application/json')) return send(res, 415, { error: 'Send JSON' });
      return ownerApi(req, res, url, p, method);
    }
    return send(res, 404, 'Not found');
  }

  // ---------- student API ----------
  async function studentApi(req, res, url, p, method) {
    const s = data.settings;
    let m;
    const st = studentOf(req);
    if (method !== 'GET' && !(req.headers['content-type'] || '').includes('application/json')) return send(res, 415, { error: 'Send JSON' });

    if (p === '/api/s/session' && method === 'GET') {
      if (st && Date.now() - Date.parse(st.lastSeen || 0) > 3600_000) { st.lastSeen = new Date().toISOString(); save(); }
      return send(res, 200, { student: st ? { name: st.name, email: st.email, phone: st.phone } : null, site: publicSite() });
    }
    if (p === '/api/s/signup' && method === 'POST') {
      if (!s.allowSignup) return send(res, 403, { error: 'signup_closed' });
      if (!signupLimiter.allow(clientIp(req))) return send(res, 429, { error: 'too_many' });
      const b = await readJson(req);
      const name = clean(b.name, 80);
      const email = clean(b.email, 120).toLowerCase();
      const phone = normPhone(b.phone).slice(0, 20);
      if (!name || (!email && phone.length < 7)) return send(res, 400, { error: 'name_and_contact' });
      if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return send(res, 400, { error: 'bad_email' });
      if (String(b.password || '').length < 6) return send(res, 400, { error: 'short_password' });
      if ((email && data.students.some((x) => x.email === email)) || (phone && data.students.some((x) => x.phone === phone))) return send(res, 409, { error: 'exists' });
      const x = { id: crypto.randomUUID(), name, email, phone, pass: hashPassword(String(b.password)), createdAt: new Date().toISOString(), lastSeen: new Date().toISOString() };
      data.students.push(x);
      save();
      return send(res, 200, { ok: true }, { 'set-cookie': studentCookie(req, x) });
    }
    if (p === '/api/s/login' && method === 'POST') {
      if (!studentLimiter.allow(clientIp(req))) return send(res, 429, { error: 'too_many' });
      const b = await readJson(req);
      const login = clean(b.login, 120).toLowerCase();
      const phone = normPhone(login);
      const x = data.students.find((y) => (login && y.email === login) || (phone.length >= 7 && y.phone === phone));
      if (!x || !verifyPassword(String(b.password || ''), x.pass)) return send(res, 401, { error: 'wrong_login' });
      return send(res, 200, { ok: true }, { 'set-cookie': studentCookie(req, x) });
    }
    if (p === '/api/s/logout' && method === 'POST') return send(res, 200, { ok: true }, { 'set-cookie': cookie(req, 'doroos_student', '', 0) });

    // Course outline: public (anyone can see the outline and free lessons).
    if ((m = p.match(/^\/api\/s\/course\/([^/]+)$/)) && method === 'GET') {
      const c = data.courses.find((x) => x.slug === decodeURIComponent(m[1]) && x.published);
      if (!c) return send(res, 404, { error: 'not_found' });
      const e = enrollment(st, c);
      const access = e?.status === 'active';
      return send(res, 200, {
        course: { id: c.id, slug: c.slug, title: c.title, subtitle: c.subtitle, cover: c.cover, price: c.price, comparePrice: c.comparePrice },
        enrollment: e ? { status: e.status, method: e.method, amount: e.amount, createdAt: e.createdAt } : null,
        progress: progressOf(e, c),
        lessons: lessonsOf(c).map((l) => ({ id: l.id, title: l.title, free: l.free, durationMin: l.durationMin, open: access || l.free, done: Boolean(e?.progress?.[l.id]) })),
      });
    }
    if ((m = p.match(/^\/api\/s\/lesson\/([\w-]+)$/)) && method === 'GET') {
      const l = data.lessons.find((x) => x.id === m[1]);
      const c = l && course(l.courseId);
      if (!c || !c.published) return send(res, 404, { error: 'not_found' });
      if (!l.free && !hasAccess(st, c)) return send(res, st ? 403 : 401, { error: 'locked' });
      const v = videoSource(l.videoUrl);
      return send(res, 200, { lesson: { id: l.id, title: l.title, body: l.body, durationMin: l.durationMin, video: v ? (v.type === 'file' ? { type: 'file', src: `/media/v/${v.name}` } : v) : null } });
    }

    if (!st) return send(res, 401, { error: 'not_signed_in' });

    if (p === '/api/s/my' && method === 'GET') {
      const mine = data.enrollments.filter((e) => e.studentId === st.id && e.status !== 'rejected').map((e) => {
        const c = course(e.courseId);
        return c ? { status: e.status, course: { slug: c.slug, title: c.title, cover: c.cover }, progress: progressOf(e, c), next: lessonsOf(c).find((l) => !e.progress?.[l.id])?.id || null } : null;
      }).filter(Boolean);
      return send(res, 200, { enrollments: mine });
    }
    if ((m = p.match(/^\/api\/s\/lesson\/([\w-]+)\/done$/)) && method === 'POST') {
      const l = data.lessons.find((x) => x.id === m[1]);
      const c = l && course(l.courseId);
      const e = c && enrollment(st, c);
      if (!e || e.status !== 'active') return send(res, 403, { error: 'locked' });
      const b = await readJson(req);
      e.progress = e.progress || {};
      if (b.done === false) delete e.progress[l.id];
      else e.progress[l.id] = new Date().toISOString();
      save();
      return send(res, 200, { progress: progressOf(e, c) });
    }
    if (p === '/api/s/quote' && method === 'POST') {
      const b = await readJson(req);
      const c = course(b.courseId);
      if (!c || !c.published) return send(res, 404, { error: 'not_found' });
      const k = b.coupon ? findCoupon(b.coupon, c) : null;
      if (b.coupon && !k) return send(res, 404, { error: 'bad_coupon' });
      return send(res, 200, { price: Number(c.price), total: priceWith(c, k), percent: k?.percent || 0 });
    }
    if (p === '/api/s/checkout' && method === 'POST') {
      const b = await readJson(req);
      const c = course(b.courseId);
      if (!c || !c.published) return send(res, 404, { error: 'not_found' });
      const existing = enrollment(st, c);
      if (existing?.status === 'active') return send(res, 200, { status: 'active' });
      const k = b.coupon ? findCoupon(b.coupon, c) : null;
      if (b.coupon && !k) return send(res, 404, { error: 'bad_coupon' });
      const total = priceWith(c, k);
      const e = existing || { id: crypto.randomUUID(), studentId: st.id, courseId: c.id, status: 'pending', method: '', amount: total, reference: '', coupon: '', checkoutId: '', createdAt: new Date().toISOString(), approvedAt: null, progress: {} };
      Object.assign(e, { amount: total, coupon: k?.code || '' });
      if (!existing) data.enrollments.push(e);
      if (total <= 0) { activate(e, k ? 'coupon' : 'free'); return send(res, 200, { status: 'active' }); }
      if (b.method === 'card') {
        if (!s.stripeSecretKey) return send(res, 400, { error: 'cards_off' });
        const o = originOf(req);
        try {
          const r = await stripeCheckout({ secretKey: s.stripeSecretKey, currency: s.currencyCode, amount: total, title: `${c.title} · ${s.siteName || 'Doroos'}`, reference: e.id, email: st.email, successUrl: `${o}/learn#/paid/${c.slug}`, cancelUrl: `${o}/learn#/buy/${c.slug}` });
          e.method = 'card';
          e.checkoutId = r.id;
          save();
          return send(res, 200, { status: 'redirect', url: r.url });
        } catch (err) {
          save();
          return send(res, 502, { error: err.message });
        }
      }
      if (!s.paymentInfo) return send(res, 400, { error: 'manual_off' });
      const ref = clean(b.reference, 120);
      if (!ref) return send(res, 400, { error: 'reference_required' });
      Object.assign(e, { method: 'manual', reference: ref, status: 'pending' });
      save();
      return send(res, 200, { status: 'pending' });
    }
    if (p === '/api/s/password' && method === 'POST') {
      const b = await readJson(req);
      if (!verifyPassword(String(b.current || ''), st.pass)) return send(res, 401, { error: 'wrong_password' });
      if (String(b.next || '').length < 6) return send(res, 400, { error: 'short_password' });
      st.pass = hashPassword(String(b.next));
      save();
      return send(res, 200, { ok: true }, { 'set-cookie': studentCookie(req, st) });
    }
    return send(res, 404, { error: 'Not found' });
  }

  // ---------- owner API ----------
  async function ownerApi(req, res, url, p, method) {
    const s = data.settings;
    let m;
    if (p === '/api/overview' && method === 'GET') {
      const month = new Date().toISOString().slice(0, 7);
      const active = data.enrollments.filter((e) => e.status === 'active');
      const days = [...Array(30)].map((_, i) => new Date(Date.now() - (29 - i) * 864e5).toISOString().slice(0, 10));
      const per = Object.fromEntries(days.map((d) => [d, 0]));
      for (const e of active) { const d = (e.approvedAt || e.createdAt).slice(0, 10); if (d in per) per[d] = round2(per[d] + e.amount); }
      return send(res, 200, {
        students: data.students.length,
        newStudents: data.students.filter((x) => x.createdAt.startsWith(month)).length,
        revenueMonth: round2(active.filter((e) => (e.approvedAt || '').startsWith(month)).reduce((x, e) => x + e.amount, 0)),
        revenueTotal: round2(active.reduce((x, e) => x + e.amount, 0)),
        pending: data.enrollments.filter((e) => e.status === 'pending' && e.method === 'manual').length,
        perDay: days.map((d) => ({ day: d, amount: per[d] })),
        courses: data.courses.map((c) => { const es = active.filter((e) => e.courseId === c.id); return { id: c.id, title: c.title, published: c.published, students: es.length, revenue: round2(es.reduce((x, e) => x + e.amount, 0)), completion: es.length ? Math.round(es.reduce((x, e) => x + progressOf(e, c).percent, 0) / es.length) : 0 }; }),
        recent: [...data.enrollments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8).map(enrollView),
        currency: s.currency,
      });
    }

    // ----- courses -----
    if (p === '/api/courses' && method === 'GET') return send(res, 200, { courses: [...data.courses].sort((a, b) => a.order - b.order).map((c) => ({ ...c, lessons: lessonsOf(c).length, students: data.enrollments.filter((e) => e.courseId === c.id && e.status === 'active').length })) });
    if (p === '/api/courses' && method === 'POST') {
      const b = await readJson(req);
      const c = { id: crypto.randomUUID(), slug: '', title: '', subtitle: '', description: '', cover: '', price: 0, comparePrice: 0, instructor: '', published: false, order: data.courses.length, createdAt: new Date().toISOString() };
      const err = applyCourse(c, b);
      if (err) return send(res, 400, { error: err });
      data.courses.push(c);
      save();
      return send(res, 200, { course: c });
    }
    if ((m = p.match(/^\/api\/courses\/([\w-]+)$/))) {
      const c = course(m[1]);
      if (!c) return send(res, 404, { error: 'Course not found' });
      if (method === 'GET') return send(res, 200, { course: c, lessons: lessonsOf(c) });
      if (method === 'PUT') { const err = applyCourse(c, await readJson(req)); if (err) return send(res, 400, { error: err }); save(); return send(res, 200, { course: c }); }
      if (method === 'DELETE') {
        if (data.enrollments.some((e) => e.courseId === c.id && e.status === 'active')) return send(res, 409, { error: 'Students are enrolled: unpublish it instead' });
        data.courses = data.courses.filter((x) => x.id !== c.id);
        data.lessons = data.lessons.filter((l) => l.courseId !== c.id);
        save();
        return send(res, 200, { ok: true });
      }
    }
    if ((m = p.match(/^\/api\/courses\/([\w-]+)\/lessons$/)) && method === 'POST') {
      const c = course(m[1]);
      if (!c) return send(res, 404, { error: 'Course not found' });
      const l = { id: crypto.randomUUID(), courseId: c.id, title: '', body: '', videoUrl: '', free: false, durationMin: 0, order: lessonsOf(c).length };
      const err = applyLesson(l, await readJson(req));
      if (err) return send(res, 400, { error: err });
      data.lessons.push(l);
      save();
      return send(res, 200, { lesson: l });
    }
    if ((m = p.match(/^\/api\/courses\/([\w-]+)\/order$/)) && method === 'PUT') {
      const c = course(m[1]);
      if (!c) return send(res, 404, { error: 'Course not found' });
      const ids = (await readJson(req)).ids || [];
      lessonsOf(c).forEach((l) => { const i = ids.indexOf(l.id); if (i >= 0) l.order = i; });
      save();
      return send(res, 200, { lessons: lessonsOf(c) });
    }
    if ((m = p.match(/^\/api\/lessons\/([\w-]+)$/))) {
      const l = data.lessons.find((x) => x.id === m[1]);
      if (!l) return send(res, 404, { error: 'Lesson not found' });
      if (method === 'PUT') { const err = applyLesson(l, await readJson(req)); if (err) return send(res, 400, { error: err }); save(); return send(res, 200, { lesson: l }); }
      if (method === 'DELETE') { data.lessons = data.lessons.filter((x) => x.id !== l.id); save(); return send(res, 200, { ok: true }); }
    }

    // ----- enrollments -----
    if (p === '/api/enrollments' && method === 'GET') {
      const status = url.searchParams.get('status');
      let list = [...data.enrollments];
      if (status) list = list.filter((e) => e.status === status);
      return send(res, 200, { enrollments: list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 1000).map(enrollView) });
    }
    if (p === '/api/enrollments' && method === 'POST') {
      // Enroll a student by hand (paid in cash, a gift, a scholarship…).
      const b = await readJson(req);
      const c = course(b.courseId);
      const login = clean(b.student, 120).toLowerCase();
      const st = data.students.find((x) => x.id === b.studentId || (login && (x.email === login || (normPhone(login).length >= 7 && x.phone === normPhone(login)))));
      if (!c || !st) return send(res, 404, { error: 'Student or course not found' });
      let e = enrollment(st, c);
      if (!e) { e = { id: crypto.randomUUID(), studentId: st.id, courseId: c.id, status: 'pending', method: 'admin', amount: round2(b.amount), reference: clean(b.note, 120), coupon: '', checkoutId: '', createdAt: new Date().toISOString(), approvedAt: null, progress: {} }; data.enrollments.push(e); }
      activate(e, 'admin');
      return send(res, 200, { enrollment: enrollView(e) });
    }
    if ((m = p.match(/^\/api\/enrollments\/([\w-]+)$/)) && method === 'PUT') {
      const e = data.enrollments.find((x) => x.id === m[1]);
      if (!e) return send(res, 404, { error: 'Not found' });
      const b = await readJson(req);
      if (b.status === 'active') activate(e);
      else if (b.status === 'rejected' || b.status === 'pending') { e.status = b.status; save(); }
      return send(res, 200, { enrollment: enrollView(e) });
    }

    // ----- students -----
    if (p === '/api/students' && method === 'GET') {
      const q = clean(url.searchParams.get('q'), 80).toLowerCase();
      let list = data.students;
      if (q) list = list.filter((x) => x.name.toLowerCase().includes(q) || x.email.includes(q) || (normPhone(q).length > 2 && x.phone.includes(normPhone(q))));
      return send(res, 200, { students: [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 1000).map((x) => ({ ...studentView(x), courses: data.enrollments.filter((e) => e.studentId === x.id && e.status === 'active').map((e) => { const c = course(e.courseId); return c ? { title: c.title, percent: progressOf(e, c).percent } : null; }).filter(Boolean) })) });
    }
    if ((m = p.match(/^\/api\/students\/([\w-]+)$/))) {
      const x = data.students.find((y) => y.id === m[1]);
      if (!x) return send(res, 404, { error: 'Not found' });
      if (method === 'PUT') {
        const b = await readJson(req);
        if (typeof b.name === 'string' && b.name.trim()) x.name = clean(b.name, 80);
        if (b.password) { if (String(b.password).length < 6) return send(res, 400, { error: 'Password must be at least 6 characters' }); x.pass = hashPassword(String(b.password)); }
        save();
        return send(res, 200, { student: studentView(x) });
      }
      if (method === 'DELETE') { data.students = data.students.filter((y) => y.id !== x.id); data.enrollments = data.enrollments.filter((e) => e.studentId !== x.id); save(); return send(res, 200, { ok: true }); }
    }
    if (p === '/api/students.csv' && method === 'GET') {
      const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const rows = [['name', 'email', 'phone', 'joined', 'courses'].join(',')];
      for (const x of data.students) rows.push([x.name, x.email, x.phone, x.createdAt.slice(0, 10), data.enrollments.filter((e) => e.studentId === x.id && e.status === 'active').map((e) => course(e.courseId)?.title).filter(Boolean).join(' | ')].map(q).join(','));
      return send(res, 200, '﻿' + rows.join('\n'), { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="doroos-students.csv"' });
    }

    // ----- coupons -----
    if (p === '/api/coupons' && method === 'GET') return send(res, 200, { coupons: data.coupons.map((k) => ({ ...k, course: k.courseId ? course(k.courseId)?.title || '' : '' })) });
    if (p === '/api/coupons' && method === 'POST') {
      const b = await readJson(req);
      const code = clean(b.code, 40).toUpperCase().replace(/\s+/g, '');
      const percent = Math.round(Number(b.percent));
      if (!/^[\p{L}\p{N}_-]{3,40}$/u.test(code) || !(percent >= 1 && percent <= 100)) return send(res, 400, { error: 'Code (3+ characters) and a percent from 1 to 100 are required' });
      if (data.coupons.some((k) => k.code === code)) return send(res, 409, { error: 'This code exists' });
      const k = { id: crypto.randomUUID(), code, percent, courseId: course(b.courseId) ? b.courseId : '', maxUses: Math.max(0, Number(b.maxUses) || 0), used: 0, expires: /^\d{4}-\d{2}-\d{2}$/.test(b.expires || '') ? b.expires : '' };
      data.coupons.push(k);
      save();
      return send(res, 200, { coupon: k });
    }
    if ((m = p.match(/^\/api\/coupons\/([\w-]+)$/)) && method === 'DELETE') { data.coupons = data.coupons.filter((k) => k.id !== m[1]); save(); return send(res, 200, { ok: true }); }

    // ----- settings -----
    if (p === '/api/settings' && method === 'GET') {
      const out = { ...s };
      for (const k of SECRET_KEYS) if (out[k]) out[k] = MASK + out[k].slice(-4);
      return send(res, 200, { settings: out, webhookUrl: `${originOf(req)}/hooks/stripe` });
    }
    if (p === '/api/settings' && method === 'PUT') {
      const b = (await readJson(req)).settings || {};
      for (const k of ['siteName', 'tagline', 'currency', 'timezone', 'whatsapp']) if (typeof b[k] === 'string') s[k] = clean(b[k], 160);
      for (const k of ['about', 'footer', 'paymentInfo']) if (typeof b[k] === 'string') s[k] = clean(b[k], 3000);
      if (/^[A-Za-z]{3}$/.test(b.currencyCode || '')) s.currencyCode = b.currencyCode.toUpperCase();
      if (b.lang === 'ar' || b.lang === 'en') s.lang = b.lang;
      if (/^#[0-9a-f]{6}$/i.test(b.color || '')) s.color = b.color;
      if (typeof b.allowSignup === 'boolean') s.allowSignup = b.allowSignup;
      if (!demo) for (const k of SECRET_KEYS) if (typeof b[k] === 'string' && !b[k].startsWith(MASK)) s[k] = b[k].trim();
      save();
      return send(res, 200, { ok: true });
    }
    if (p === '/api/password' && method === 'POST') {
      const b = await readJson(req);
      if (!verifyPassword(String(b.current || ''), data.admin)) return send(res, 401, { error: 'Current password is wrong' });
      if (String(b.next || '').length < 8) return send(res, 400, { error: 'New password must be at least 8 characters' });
      data.admin = hashPassword(String(b.next));
      flush();
      return send(res, 200, { ok: true }, { 'set-cookie': ownerCookie(req) });
    }
    return send(res, 404, { error: 'Not found' });
  }

  function enrollView(e) {
    const st = data.students.find((x) => x.id === e.studentId);
    const c = course(e.courseId);
    return { id: e.id, status: e.status, method: e.method, amount: e.amount, reference: e.reference, coupon: e.coupon, createdAt: e.createdAt, approvedAt: e.approvedAt, student: st ? studentView(st) : null, course: c ? { id: c.id, title: c.title } : null, progress: c ? progressOf(e, c).percent : 0 };
  }

  function applyCourse(c, b) {
    if (typeof b.title === 'string') c.title = clean(b.title, 160);
    if (!c.title) return 'Course title is required';
    for (const k of ['subtitle', 'instructor']) if (typeof b[k] === 'string') c[k] = clean(b[k], 240);
    if (typeof b.description === 'string') c.description = clean(b.description, 20_000);
    if (b.price != null) c.price = Math.max(0, round2(b.price));
    if (b.comparePrice != null) c.comparePrice = Math.max(0, round2(b.comparePrice));
    if (typeof b.published === 'boolean') c.published = b.published;
    if (typeof b.cover === 'string') c.cover = /^i-\w+\.(jpg|png|webp)$/.test(b.cover) ? b.cover : '';
    if (b.order != null) c.order = Number(b.order) || 0;
    const want = typeof b.slug === 'string' && b.slug.trim() ? slugify(b.slug) : c.slug || slugify(c.title);
    let slug = want, i = 2;
    while (data.courses.some((x) => x.id !== c.id && x.slug === slug)) slug = `${want}-${i++}`;
    c.slug = slug;
    return null;
  }

  function applyLesson(l, b) {
    if (typeof b.title === 'string') l.title = clean(b.title, 160);
    if (!l.title) return 'Lesson title is required';
    if (typeof b.body === 'string') l.body = clean(b.body, 50_000);
    if (typeof b.videoUrl === 'string') {
      const v = b.videoUrl.trim();
      if (v && !videoSource(v)) return 'Paste a YouTube, Vimeo, Bunny or Google Drive link, a direct .mp4 link, or upload a video';
      l.videoUrl = v;
    }
    if (typeof b.free === 'boolean') l.free = b.free;
    if (b.durationMin != null) l.durationMin = Math.min(1000, Math.max(0, Math.round(Number(b.durationMin) || 0)));
    return null;
  }

  const server = http.createServer((req, res) => {
    route(req, res).catch((err) => {
      const status = err.status || 500;
      if (status === 500) console.error('[http]', err);
      if (!res.headersSent) send(res, status, { error: status === 500 ? 'Internal error' : err.message });
    });
  });
  server.requestTimeout = 0; // large video uploads

  return {
    resetDemo,
    server,
    data,
    async start(port) {
      await new Promise((r) => server.listen(port, r));
      return server.address().port;
    },
    async stop() {
      clearInterval(demoTimer);
      flush();
      await new Promise((r) => server.close(r));
    },
  };
}
