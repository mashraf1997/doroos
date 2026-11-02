/* Doroos owner dashboard */
(function () {
  'use strict';
  const STR = {
    ar: {
      overview: 'الرئيسية', courses: 'الكورسات', enrollments: 'الاشتراكات', students: 'الطلبة', coupons: 'أكواد الخصم', settings: 'الإعدادات', site: 'الموقع ↗', logout: 'خروج', lang: 'English',
      setupTitle: 'أهلاً بيك في دروس', setupLead: 'منصتك الخاصة لبيع الكورسات: صفحات للكورسات، حسابات للطلبة، دفع بالكارت أو تحويل، ومتابعة التقدم.', siteName: 'اسم الأكاديمية أو اسمك', password: 'كلمة السر', pwHint: '8 حروف على الأقل', start: 'ابدأ', loginTitle: 'تسجيل الدخول', login: 'دخول',
      revenueMonth: 'دخل الشهر', revenueTotal: 'إجمالي الدخل', studentsN: 'طالب', newThisMonth: 'جديد الشهر ده', pending: 'تحويلات مستنية تأكيد', last30: 'الدخل آخر 30 يوم', recent: 'آخر الاشتراكات', perCourse: 'الكورسات', completion: 'متوسط الإنجاز',
      newCourse: '+ كورس جديد', title: 'العنوان', subtitle: 'وصف قصير', description: 'عن الكورس', descHint: 'سطر فاضي بين الفقرات، و «- » في أول السطر لعمل قائمة', price: 'السعر (0 = مجاني)', comparePrice: 'السعر قبل الخصم (اختياري)', instructor: 'المحاضر', slug: 'رابط الكورس', published: 'منشور', draft: 'مسودة', cover: 'صورة الغلاف', upload: 'ارفع', remove: 'شيل', save: 'حفظ', saved: 'اتحفظ ✓', del: 'حذف', delQ: 'متأكد؟', back: '← الكورسات', view: 'افتح ↗', lessons: 'الدروس', lessonsN: 'درس',
      addLesson: '+ درس', lessonTitle: 'عنوان الدرس', video: 'الفيديو', videoHint: 'لينك يوتيوب (غير مدرج) أو فيميو أو Bunny أو جوجل درايف، أو ارفع ملف MP4', uploadVideo: 'ارفع فيديو', uploading: 'بيترفع…', body: 'شرح / ملخص الدرس', free: 'مشاهدة مجانية', duration: 'المدة (دقيقة)', up: '↑', down: '↓', edit: 'تعديل', close: 'إغلاق', noLessons: 'لسه مفيش دروس.',
      student: 'الطالب', course: 'الكورس', method: 'الطريقة', amount: 'المبلغ', status: 'الحالة', date: 'التاريخ', reference: 'رقم العملية', approve: 'تأكيد', reject: 'رفض', st_active: 'مفعّل', st_pending: 'مستني', st_rejected: 'مرفوض', m_free: 'مجاني', m_manual: 'تحويل', m_card: 'كارت', m_coupon: 'كوبون', m_admin: 'يدوي', all: 'الكل', progress: 'التقدم', addEnroll: 'اشتراك يدوي', addEnrollHint: 'لطالب دفع كاش أو منحة: اكتب إيميله أو موبايله', none: 'مفيش حاجة هنا.',
      name: 'الاسم', contact: 'التواصل', joined: 'انضم', search: 'دوّر', resetPw: 'كلمة سر جديدة', resetDone: 'كلمة السر اتغيرت', exportCsv: 'تصدير CSV',
      code: 'الكود', percent: 'نسبة الخصم %', anyCourse: 'كل الكورسات', maxUses: 'أقصى استخدام (0 = مفتوح)', expires: 'ينتهي (اختياري)', used: 'استُخدم', addCoupon: 'إضافة كود',
      general: 'عام', tagline: 'جملة تعريفية', about: 'عن الأكاديمية (في الصفحة الرئيسية)', footer: 'سطر في آخر الصفحة', whatsapp: 'رقم واتساب للتواصل', color: 'اللون', currency: 'العملة (تظهر للطلبة)', currencyCode: 'كود العملة للكارت (EGP، USD…)', signup: 'اسمح بتسجيل حسابات جديدة',
      payments: 'الدفع', paymentInfo: 'تعليمات التحويل اليدوي (إنستاباي، محفظة، بنك). سيبها فاضية عشان تقفلها', stripe: 'الدفع بالكارت (Stripe)', stripeKey: 'Secret key', stripeHook: 'Webhook signing secret', stripeHelp: 'في Stripe اعمل Webhook على الرابط ده لحدث checkout.session.completed:', pwTitle: 'تغيير كلمة السر', current: 'الحالية', next: 'الجديدة', change: 'تغيير',
    },
    en: {
      overview: 'Home', courses: 'Courses', enrollments: 'Enrollments', students: 'Students', coupons: 'Coupons', settings: 'Settings', site: 'Website ↗', logout: 'Sign out', lang: 'العربية',
      setupTitle: 'Welcome to Doroos', setupLead: 'Your own platform to sell courses: course pages, student accounts, card or transfer payments, and progress tracking.', siteName: 'Academy or your name', password: 'Password', pwHint: 'At least 8 characters', start: 'Get started', loginTitle: 'Sign in', login: 'Sign in',
      revenueMonth: 'Revenue this month', revenueTotal: 'Total revenue', studentsN: 'students', newThisMonth: 'new this month', pending: 'Transfers to confirm', last30: 'Revenue, last 30 days', recent: 'Latest enrollments', perCourse: 'Courses', completion: 'Average completion',
      newCourse: '+ New course', title: 'Title', subtitle: 'Short description', description: 'About the course', descHint: 'Blank line between paragraphs, "- " at the start of a line for a list', price: 'Price (0 = free)', comparePrice: 'Price before discount (optional)', instructor: 'Instructor', slug: 'Course URL', published: 'Published', draft: 'Draft', cover: 'Cover image', upload: 'Upload', remove: 'Remove', save: 'Save', saved: 'Saved ✓', del: 'Delete', delQ: 'Are you sure?', back: '← Courses', view: 'Open ↗', lessons: 'Lessons', lessonsN: 'lessons',
      addLesson: '+ Lesson', lessonTitle: 'Lesson title', video: 'Video', videoHint: 'A YouTube (unlisted), Vimeo, Bunny or Google Drive link, or upload an MP4', uploadVideo: 'Upload video', uploading: 'Uploading…', body: 'Notes / summary', free: 'Free preview', duration: 'Length (minutes)', up: '↑', down: '↓', edit: 'Edit', close: 'Close', noLessons: 'No lessons yet.',
      student: 'Student', course: 'Course', method: 'Method', amount: 'Amount', status: 'Status', date: 'Date', reference: 'Reference', approve: 'Confirm', reject: 'Reject', st_active: 'Active', st_pending: 'Waiting', st_rejected: 'Rejected', m_free: 'Free', m_manual: 'Transfer', m_card: 'Card', m_coupon: 'Coupon', m_admin: 'Manual', all: 'All', progress: 'Progress', addEnroll: 'Enroll by hand', addEnrollHint: 'For cash payments or scholarships: type their email or mobile', none: 'Nothing here.',
      name: 'Name', contact: 'Contact', joined: 'Joined', search: 'Search', resetPw: 'New password', resetDone: 'Password changed', exportCsv: 'Export CSV',
      code: 'Code', percent: 'Discount %', anyCourse: 'All courses', maxUses: 'Max uses (0 = unlimited)', expires: 'Expires (optional)', used: 'Used', addCoupon: 'Add code',
      general: 'General', tagline: 'Tagline', about: 'About (on the home page)', footer: 'Footer line', whatsapp: 'WhatsApp number for contact', color: 'Color', currency: 'Currency (shown to students)', currencyCode: 'Currency code for cards (USD, EGP…)', signup: 'Allow new sign-ups',
      payments: 'Payments', paymentInfo: 'Manual transfer instructions (bank, wallet). Leave empty to turn off', stripe: 'Card payments (Stripe)', stripeKey: 'Secret key', stripeHook: 'Webhook signing secret', stripeHelp: 'In Stripe, add a webhook to this URL for checkout.session.completed:', pwTitle: 'Change password', current: 'Current', next: 'New', change: 'Change',
    },
  };
  const get = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };
  let lang = get('doroos_lang') || 'ar';
  const t = (k) => STR[lang][k] ?? k;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const app = $('#app');
  let session = null, currency = '';
  async function api(p, opts = {}) {
    const res = await fetch(p, { method: opts.method || 'GET', headers: opts.body !== undefined ? { 'content-type': 'application/json' } : {}, body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && p !== '/api/login' && p !== '/api/password') { boot(); throw new Error(data.error); }
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }
  // Uploads a file as the raw request body, with progress.
  function upload(file, kind, onProgress) {
    return new Promise((resolve, reject) => {
      const x = new XMLHttpRequest();
      x.open('POST', '/api/upload?kind=' + kind);
      x.upload.onprogress = (e) => e.lengthComputable && onProgress && onProgress(e.loaded / e.total);
      x.onload = () => { let d = {}; try { d = JSON.parse(x.responseText); } catch { /* ignore */ } if (x.status === 200) resolve(d); else reject(new Error(d.error || 'HTTP ' + x.status)); };
      x.onerror = () => reject(new Error('Upload failed'));
      x.send(file);
    });
  }
  const toast = (m) => { const el = $('#toast'); el.textContent = m; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2400); };
  const num = (n) => Number(n || 0).toLocaleString(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US', { maximumFractionDigits: 2 });
  const money = (n) => `${num(n)} <span class="small muted">${esc(currency)}</span>`;
  const day = (iso) => (iso ? iso.slice(0, 10) : '—');
  const pill = (s) => `<span class="pill ${{ active: 'good', pending: 'warn', rejected: 'bad' }[s]}">${t('st_' + s)}</span>`;
  function dialog(html) {
    const d = document.createElement('dialog');
    d.innerHTML = html;
    document.body.appendChild(d);
    d.showModal();
    d.addEventListener('close', () => d.remove());
    $$('[data-close]', d).forEach((b) => (b.onclick = () => d.close()));
    return d;
  }

  async function boot() {
    document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    session = await api('/api/session').catch(() => ({}));
    if (session.needsSetup) return auth(true);
    if (!session.authed) return auth(false);
    shell(); route();
  }
  function auth(setup) {
    app.innerHTML = `<div class="auth"><form class="card" id="f"><div class="brand"><img src="/favicon.svg" alt="">Doroos <span class="muted small">دروس</span></div>
      <h1>${setup ? t('setupTitle') : t('loginTitle')}</h1>${setup ? `<p class="muted">${t('setupLead')}</p><label class="field" for="b">${t('siteName')}<input type="text" id="b"></label>` : ''}
      <label class="field" for="pw">${t('password')} ${setup ? `<span class="hint">${t('pwHint')}</span>` : ''}<input type="password" id="pw" autocomplete="${setup ? 'new-password' : 'current-password'}"></label>
      ${setup && session.setupTokenRequired ? `<label class="field" for="st">Setup token<input type="password" id="st" class="ltr"></label>` : ''}
      <div class="err" id="err"></div><div class="row"><button class="btn primary" type="submit">${setup ? t('start') : t('login')}</button><span class="spacer"></span><button class="btn sm" type="button" id="lb">${t('lang')}</button></div></form></div>`;
    $('#lb').onclick = () => { lang = lang === 'ar' ? 'en' : 'ar'; set('doroos_lang', lang); boot(); };
    $('#f').onsubmit = async (e) => {
      e.preventDefault();
      try {
        if (setup) await api('/api/setup', { method: 'POST', body: { siteName: $('#b').value, password: $('#pw').value, lang, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, setupToken: $('#st')?.value } });
        else await api('/api/login', { method: 'POST', body: { password: $('#pw').value } });
        location.hash = '#overview'; boot();
      } catch (err) { $('#err').textContent = err.message; }
    };
  }
  const PAGES = ['overview', 'courses', 'enrollments', 'students', 'coupons', 'settings'];
  function shell() {
    const nav = PAGES.map((p) => `<a class="nav" href="#${p}" data-page="${p}">${t(p)}${p === 'enrollments' ? ' <span class="badge" id="pb" hidden></span>' : ''}</a>`).join('');
    app.innerHTML = `<div class="shell"><nav class="rail"><div class="brand"><img src="/favicon.svg" alt="">Doroos</div>${nav}<a class="nav" href="/" target="_blank" rel="noopener">${t('site')}</a>
      <div class="rail-foot"><button class="nav" id="lb" type="button">${t('lang')}</button><button class="nav" id="lo" type="button">${t('logout')}</button></div></nav>
      <nav class="mobile-nav">${PAGES.slice(0, 4).map((p) => `<a class="nav" href="#${p}" data-page="${p}">${t(p)}</a>`).join('')}</nav><main class="main" id="main"></main></div>`;
    $('#lb').onclick = () => { lang = lang === 'ar' ? 'en' : 'ar'; set('doroos_lang', lang); boot(); };
    $('#lo').onclick = async () => { await api('/api/logout', { method: 'POST', body: {} }); boot(); };
  }
  const page = () => { const h = location.hash.slice(1).split('/')[0]; return PAGES.includes(h) ? h : 'overview'; };
  function route() {
    $$('.nav[data-page]').forEach((a) => a.setAttribute('aria-current', a.dataset.page === page() ? 'page' : 'false'));
    const main = $('#main');
    const c = location.hash.match(/^#courses\/([\w-]+)$/);
    if (c) return pCourse(main, c[1]);
    ({ overview: pOverview, courses: pCourses, enrollments: pEnrollments, students: pStudents, coupons: pCoupons, settings: pSettings }[page()])(main);
  }
  window.addEventListener('hashchange', () => session?.authed && route());
  const setBadge = (n) => { const b = $('#pb'); if (b) { b.textContent = n; b.hidden = !n; } };

  async function pOverview(main) {
    const o = await api('/api/overview');
    currency = o.currency;
    setBadge(o.pending);
    const max = Math.max(1, ...o.perDay.map((d) => d.amount));
    main.innerHTML = `<div class="page"><div class="page-head"><h1>${t('overview')}</h1><a class="btn primary" href="#courses">${t('newCourse')}</a></div>
      <div class="grid4"><div class="card stat"><b>${money(o.revenueMonth)}</b><span>${t('revenueMonth')}</span></div><div class="card stat"><b>${money(o.revenueTotal)}</b><span>${t('revenueTotal')}</span></div>
        <div class="card stat"><b>${o.students}</b><span>${t('studentsN')} · +${o.newStudents} ${t('newThisMonth')}</span></div><a class="card stat ${o.pending ? 'alert' : ''}" href="#enrollments" style="text-decoration:none;color:inherit"><b>${o.pending}</b><span>${t('pending')}</span></a></div>
      <section class="card"><h2>${t('last30')}</h2><div class="bars" style="grid-template-columns:repeat(30,1fr)">${o.perDay.map((d, i) => `<div class="bar ${i === 29 ? 'today' : ''}" title="${esc(d.day)}: ${num(d.amount)}"><i style="height:${Math.max(2, Math.round((d.amount / max) * 110))}px"></i></div>`).join('')}</div></section>
      <div class="grid2"><section class="card"><h2>${t('perCourse')}</h2><table style="min-width:0"><tbody>${o.courses.map((c) => `<tr><td><a href="#courses/${c.id}">${esc(c.title)}</a>${c.published ? '' : ` <span class="pill off">${t('draft')}</span>`}<br><span class="small muted">${c.students} ${t('studentsN')} · ${t('completion')} ${c.completion}%</span></td><td class="num">${money(c.revenue)}</td></tr>`).join('')}</tbody></table></section>
        <section class="card"><h2>${t('recent')}</h2>${o.recent.map((e) => `<div class="row small"><b>${esc(e.student?.name || '—')}</b><span class="muted">${esc(e.course?.title || '')}</span><span class="spacer"></span>${pill(e.status)}</div>`).join('') || `<p class="muted">${t('none')}</p>`}</section></div></div>`;
  }

  async function pCourses(main) {
    const { courses } = await api('/api/courses');
    main.innerHTML = `<div class="page"><div class="page-head"><h1>${t('courses')}</h1><button class="btn primary" id="nc" type="button">${t('newCourse')}</button></div>
      ${courses.length ? `<div class="table-wrap"><table><thead><tr><th>${t('title')}</th><th>${t('price')}</th><th>${t('lessons')}</th><th>${t('students')}</th><th>${t('status')}</th></tr></thead><tbody>
      ${courses.map((c) => `<tr><td><a href="#courses/${c.id}"><b>${esc(c.title)}</b></a><br><span class="small muted">${esc(c.subtitle)}</span></td><td class="num">${Number(c.price) ? num(c.price) : '—'}</td><td class="num">${c.lessons}</td><td class="num">${c.students}</td><td>${c.published ? `<span class="pill good">${t('published')}</span>` : `<span class="pill off">${t('draft')}</span>`}</td></tr>`).join('')}
      </tbody></table></div>` : `<div class="card empty">${t('none')}</div>`}</div>`;
    $('#nc').onclick = () => {
      const d = dialog(`<form id="cf" class="stack"><h2 style="margin:0">${t('newCourse')}</h2><label class="field">${t('title')}<input type="text" name="title" required></label><label class="field">${t('price')}<input type="number" name="price" min="0" step="any" value="0"></label><div class="err" id="ce"></div><div class="row"><button class="btn primary" type="submit">${t('save')}</button><span class="spacer"></span><button class="btn" type="button" data-close>${t('close')}</button></div></form>`);
      $('#cf', d).onsubmit = async (e) => { e.preventDefault(); try { const r = await api('/api/courses', { method: 'POST', body: { title: e.target.title.value, price: Number(e.target.price.value || 0) } }); d.close(); location.hash = '#courses/' + r.course.id; } catch (err) { $('#ce', d).textContent = err.message; } };
    };
  }

  async function pCourse(main, id) {
    const { course: c, lessons } = await api('/api/courses/' + id);
    main.innerHTML = `<div class="page"><p style="margin:0"><a href="#courses">${t('back')}</a></p>
      <div class="page-head"><h1>${esc(c.title)}</h1><a class="btn" href="/c/${encodeURIComponent(c.slug)}" target="_blank" rel="noopener">${t('view')}</a></div>
      <form class="card" id="cf"><div class="grid2"><label class="field">${t('title')}<input type="text" name="title" value="${esc(c.title)}" required></label><label class="field">${t('instructor')}<input type="text" name="instructor" value="${esc(c.instructor)}"></label></div>
        <label class="field">${t('subtitle')}<input type="text" name="subtitle" value="${esc(c.subtitle)}"></label>
        <label class="field">${t('description')} <span class="hint">${t('descHint')}</span><textarea name="description" rows="7">${esc(c.description)}</textarea></label>
        <div class="grid4"><label class="field">${t('price')}<input type="number" name="price" min="0" step="any" value="${c.price}"></label><label class="field">${t('comparePrice')}<input type="number" name="comparePrice" min="0" step="any" value="${c.comparePrice || ''}"></label>
          <label class="field">${t('slug')}<input type="text" name="slug" class="ltr" value="${esc(c.slug)}"></label><label class="field">${t('published')}<span class="switch"><input type="checkbox" name="published" ${c.published ? 'checked' : ''}></span></label></div>
        <div class="field">${t('cover')}<div class="row">${c.cover ? `<img class="cover" src="/media/${esc(c.cover)}" alt="">` : `<div class="cover">16:9</div>`}<div class="stack"><label class="btn sm" style="cursor:pointer">${t('upload')}<input type="file" id="cv" accept="image/jpeg,image/png,image/webp" hidden></label>${c.cover ? `<button class="btn sm" type="button" id="cr">${t('remove')}</button>` : ''}</div></div></div>
        <div class="row"><button class="btn primary" type="submit">${t('save')}</button><span class="spacer"></span><button class="btn danger" type="button" id="cd">${t('del')}</button></div></form>
      <section class="card"><div class="row"><h2 style="margin:0">${t('lessons')} <span class="muted small">(${lessons.length})</span></h2><span class="spacer"></span><button class="btn primary sm" id="al" type="button">${t('addLesson')}</button></div>
        ${lessons.length ? `<div class="lessons">${lessons.map((l, i) => `<div class="lesson"><span class="n">${i + 1}</span><span><b>${esc(l.title)}</b>${l.free ? ` <span class="pill good">${t('free')}</span>` : ''}<br><span class="small muted">${l.videoUrl ? (l.videoUrl.startsWith('file:') ? '🎞️ MP4' : '▶ ' + esc(l.videoUrl.replace(/^https?:\/\//, '').slice(0, 40))) : '📝'}${l.durationMin ? ` · ${l.durationMin}′` : ''}</span></span>
          <span class="row" style="gap:4px"><button class="btn sm" type="button" data-mv="-1" data-id="${l.id}" ${i === 0 ? 'disabled' : ''} aria-label="${t('up')}">${t('up')}</button><button class="btn sm" type="button" data-mv="1" data-id="${l.id}" ${i === lessons.length - 1 ? 'disabled' : ''} aria-label="${t('down')}">${t('down')}</button><button class="btn sm" type="button" data-el="${l.id}">${t('edit')}</button></span></div>`).join('')}</div>` : `<p class="muted">${t('noLessons')}</p>`}</section></div>`;
    const reload = () => pCourse(main, id);
    const f = $('#cf');
    f.onsubmit = async (e) => {
      e.preventDefault();
      try { await api('/api/courses/' + id, { method: 'PUT', body: { title: f.title.value, instructor: f.instructor.value, subtitle: f.subtitle.value, description: f.description.value, price: Number(f.price.value || 0), comparePrice: Number(f.comparePrice.value || 0), slug: f.slug.value, published: f.published.checked } }); toast(t('saved')); reload(); } catch (err) { toast(err.message); }
    };
    $('#cv').onchange = async () => { const file = $('#cv').files[0]; if (!file) return; try { const r = await upload(file, 'image'); await api('/api/courses/' + id, { method: 'PUT', body: { cover: r.value } }); reload(); } catch (err) { toast(err.message); } };
    if ($('#cr')) $('#cr').onclick = async () => { await api('/api/courses/' + id, { method: 'PUT', body: { cover: '' } }); reload(); };
    $('#cd').onclick = async () => { if (!confirm(t('delQ'))) return; try { await api('/api/courses/' + id, { method: 'DELETE', body: {} }); location.hash = '#courses'; } catch (err) { toast(err.message); } };
    $$('[data-mv]', main).forEach((b) => (b.onclick = async () => {
      const ids = lessons.map((l) => l.id);
      const i = ids.indexOf(b.dataset.id), j = i + Number(b.dataset.mv);
      [ids[i], ids[j]] = [ids[j], ids[i]];
      await api(`/api/courses/${id}/order`, { method: 'PUT', body: { ids } });
      reload();
    }));
    const lessonForm = (l) => {
      const d = dialog(`<form id="lf" class="stack"><h2 style="margin:0">${l ? esc(l.title) : t('addLesson')}</h2>
        <label class="field">${t('lessonTitle')}<input type="text" name="title" value="${esc(l?.title || '')}" required></label>
        <label class="field">${t('video')} <span class="hint">${t('videoHint')}</span><input type="text" name="videoUrl" class="ltr" value="${esc(l?.videoUrl || '')}" placeholder="https://youtu.be/…"></label>
        <div class="row"><label class="btn sm" style="cursor:pointer">${t('uploadVideo')}<input type="file" id="vf" accept="video/mp4,video/webm" hidden></label><div class="upbar" style="flex:1" hidden id="ub"><i></i></div></div>
        <div class="grid2"><label class="field">${t('duration')}<input type="number" name="durationMin" min="0" value="${l?.durationMin || ''}"></label><label class="field">${t('free')}<span class="switch"><input type="checkbox" name="free" ${l?.free ? 'checked' : ''}></span></label></div>
        <label class="field">${t('body')}<textarea name="body" rows="6">${esc(l?.body || '')}</textarea></label><div class="err" id="le"></div>
        <div class="row"><button class="btn primary" type="submit">${t('save')}</button>${l ? `<button class="btn danger" type="button" id="ld">${t('del')}</button>` : ''}<span class="spacer"></span><button class="btn" type="button" data-close>${t('close')}</button></div></form>`);
      const lf = $('#lf', d);
      $('#vf', d).onchange = async () => {
        const file = $('#vf', d).files[0];
        if (!file) return;
        const bar = $('#ub', d); bar.hidden = false;
        $('#le', d).textContent = t('uploading');
        try { const r = await upload(file, 'video', (x) => { $('i', bar).style.width = Math.round(x * 100) + '%'; }); lf.videoUrl.value = r.value; $('#le', d).textContent = ''; } catch (err) { $('#le', d).textContent = err.message; }
      };
      lf.onsubmit = async (e) => {
        e.preventDefault();
        const body = { title: lf.title.value, videoUrl: lf.videoUrl.value, durationMin: Number(lf.durationMin.value || 0), free: lf.free.checked, body: lf.body.value };
        try {
          if (l) await api('/api/lessons/' + l.id, { method: 'PUT', body });
          else await api(`/api/courses/${id}/lessons`, { method: 'POST', body });
          d.close(); reload();
        } catch (err) { $('#le', d).textContent = err.message; }
      };
      if ($('#ld', d)) $('#ld', d).onclick = async () => { if (!confirm(t('delQ'))) return; await api('/api/lessons/' + l.id, { method: 'DELETE', body: {} }); d.close(); reload(); };
    };
    $('#al').onclick = () => lessonForm(null);
    $$('[data-el]', main).forEach((b) => (b.onclick = () => lessonForm(lessons.find((l) => l.id === b.dataset.el))));
  }

  let enrollFilter = 'pending';
  async function pEnrollments(main) {
    const [{ enrollments }, { courses }] = await Promise.all([api('/api/enrollments' + (enrollFilter ? '?status=' + enrollFilter : '')), api('/api/courses')]);
    if (enrollFilter === 'pending') setBadge(enrollments.filter((e) => e.method === 'manual').length);
    if (!currency) currency = (await api('/api/overview')).currency;
    main.innerHTML = `<div class="page"><div class="page-head"><h1>${t('enrollments')}</h1><div class="tabs">${['pending', 'active', 'rejected', ''].map((s) => `<button type="button" data-f="${s}" aria-pressed="${enrollFilter === s}">${s ? t('st_' + s) : t('all')}</button>`).join('')}</div></div>
      ${enrollments.length ? `<div class="table-wrap"><table><thead><tr><th>${t('student')}</th><th>${t('course')}</th><th>${t('method')}</th><th>${t('amount')}</th><th>${t('date')}</th><th>${t('progress')}</th><th>${t('status')}</th><th></th></tr></thead><tbody>
      ${enrollments.map((e) => `<tr><td><b>${esc(e.student?.name || '—')}</b><br><span class="small muted" dir="ltr">${esc(e.student?.email || e.student?.phone || '')}</span></td><td>${esc(e.course?.title || '—')}</td>
        <td>${e.method ? t('m_' + e.method) : '—'}${e.reference ? `<br><span class="small mono">${esc(e.reference)}</span>` : ''}${e.coupon ? `<br><span class="small muted">${esc(e.coupon)}</span>` : ''}</td><td class="num">${money(e.amount)}</td><td class="small">${day(e.createdAt)}</td>
        <td>${e.status === 'active' ? `<div class="prog"><i style="width:${e.progress}%"></i></div><span class="small muted">${e.progress}%</span>` : ''}</td><td>${pill(e.status)}</td>
        <td><div class="row" style="gap:6px">${e.status !== 'active' ? `<button class="btn sm primary" data-s="active" data-id="${e.id}">${t('approve')}</button>` : ''}${e.status === 'pending' ? `<button class="btn sm" data-s="rejected" data-id="${e.id}">${t('reject')}</button>` : ''}</div></td></tr>`).join('')}
      </tbody></table></div>` : `<div class="card empty">${t('none')}</div>`}
      <form class="card" id="mf" style="max-width:720px"><h2>${t('addEnroll')}</h2><p class="small muted" style="margin:0">${t('addEnrollHint')}</p><div class="grid4">
        <label class="field">${t('student')}<input type="text" name="student" class="ltr" required></label><label class="field">${t('course')}<select name="course">${courses.map((c) => `<option value="${c.id}">${esc(c.title)}</option>`).join('')}</select></label>
        <label class="field">${t('amount')}<input type="number" name="amount" min="0" step="any" value="0"></label><label class="field">&nbsp;<button class="btn primary" type="submit">${t('save')}</button></label></div></form></div>`;
    $$('[data-f]', main).forEach((b) => (b.onclick = () => { enrollFilter = b.dataset.f; pEnrollments(main); }));
    $$('[data-s]', main).forEach((b) => (b.onclick = async () => { await api('/api/enrollments/' + b.dataset.id, { method: 'PUT', body: { status: b.dataset.s } }); pEnrollments(main); }));
    const f = $('#mf');
    f.onsubmit = async (e) => { e.preventDefault(); try { await api('/api/enrollments', { method: 'POST', body: { student: f.student.value, courseId: f.course.value, amount: Number(f.amount.value || 0) } }); toast(t('saved')); enrollFilter = 'active'; pEnrollments(main); } catch (err) { toast(err.message); } };
  }

  let studentQ = '';
  async function pStudents(main) {
    const { students } = await api('/api/students?q=' + encodeURIComponent(studentQ));
    main.innerHTML = `<div class="page"><div class="page-head"><h1>${t('students')} <span class="muted small">(${students.length})</span></h1><div class="row"><input type="search" id="q" placeholder="${t('search')}" value="${esc(studentQ)}" style="width:220px"><a class="btn" href="/api/students.csv">${t('exportCsv')}</a></div></div>
      ${students.length ? `<div class="table-wrap"><table><thead><tr><th>${t('name')}</th><th>${t('contact')}</th><th>${t('courses')}</th><th>${t('joined')}</th><th></th></tr></thead><tbody>
      ${students.map((x) => `<tr><td><b>${esc(x.name)}</b></td><td class="small" dir="ltr" style="text-align:start">${esc(x.email)}${x.email && x.phone ? '<br>' : ''}${esc(x.phone)}</td>
        <td class="small">${x.courses.map((c) => `${esc(c.title)} <span class="muted">${c.percent}%</span>`).join('<br>') || '—'}</td><td class="small">${day(x.createdAt)}</td>
        <td><div class="row" style="gap:6px"><button class="btn sm" data-pw="${x.id}">${t('resetPw')}</button><button class="btn sm danger" data-del="${x.id}">${t('del')}</button></div></td></tr>`).join('')}
      </tbody></table></div>` : `<div class="card empty">${t('none')}</div>`}</div>`;
    let tm;
    $('#q').oninput = () => { clearTimeout(tm); tm = setTimeout(() => { studentQ = $('#q').value; pStudents(main).then(() => { const i = $('#q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }); }, 300); };
    $$('[data-pw]', main).forEach((b) => (b.onclick = async () => { const pw = prompt(t('resetPw')); if (!pw) return; try { await api('/api/students/' + b.dataset.pw, { method: 'PUT', body: { password: pw } }); toast(t('resetDone')); } catch (err) { toast(err.message); } }));
    $$('[data-del]', main).forEach((b) => (b.onclick = async () => { if (!confirm(t('delQ'))) return; await api('/api/students/' + b.dataset.del, { method: 'DELETE', body: {} }); pStudents(main); }));
  }

  async function pCoupons(main) {
    const [{ coupons }, { courses }] = await Promise.all([api('/api/coupons'), api('/api/courses')]);
    main.innerHTML = `<div class="page"><div class="page-head"><h1>${t('coupons')}</h1></div>
      ${coupons.length ? `<div class="table-wrap"><table><thead><tr><th>${t('code')}</th><th>${t('percent')}</th><th>${t('course')}</th><th>${t('used')}</th><th>${t('expires')}</th><th></th></tr></thead><tbody>
      ${coupons.map((k) => `<tr><td class="mono"><b>${esc(k.code)}</b></td><td class="num">${k.percent}%</td><td>${esc(k.course || t('anyCourse'))}</td><td class="num">${k.used}${k.maxUses ? ' / ' + k.maxUses : ''}</td><td class="small">${esc(k.expires || '—')}</td><td><button class="btn sm danger" data-del="${k.id}">${t('del')}</button></td></tr>`).join('')}
      </tbody></table></div>` : ''}
      <form class="card" id="kf" style="max-width:760px"><h2>${t('addCoupon')}</h2><div class="grid4">
        <label class="field">${t('code')}<input type="text" name="code" class="ltr" required></label><label class="field">${t('percent')}<input type="number" name="percent" min="1" max="100" value="20"></label>
        <label class="field">${t('course')}<select name="course"><option value="">${t('anyCourse')}</option>${courses.map((c) => `<option value="${c.id}">${esc(c.title)}</option>`).join('')}</select></label><label class="field">${t('maxUses')}<input type="number" name="maxUses" min="0" value="0"></label></div>
        <div class="grid4"><label class="field">${t('expires')}<input type="date" name="expires"></label></div><div class="row"><button class="btn primary" type="submit">${t('save')}</button></div></form></div>`;
    $$('[data-del]', main).forEach((b) => (b.onclick = async () => { await api('/api/coupons/' + b.dataset.del, { method: 'DELETE', body: {} }); pCoupons(main); }));
    const f = $('#kf');
    f.onsubmit = async (e) => { e.preventDefault(); try { await api('/api/coupons', { method: 'POST', body: { code: f.code.value, percent: Number(f.percent.value), courseId: f.course.value, maxUses: Number(f.maxUses.value || 0), expires: f.expires.value } }); pCoupons(main); } catch (err) { toast(err.message); } };
  }

  async function pSettings(main) {
    const { settings: s, webhookUrl } = await api('/api/settings');
    main.innerHTML = `<div class="page"><div class="page-head"><h1>${t('settings')}</h1></div>
      <form class="card" id="sf" style="max-width:780px"><h2>${t('general')}</h2>
        <div class="grid2"><label class="field">${t('siteName')}<input type="text" name="siteName" value="${esc(s.siteName)}"></label><label class="field">${t('tagline')}<input type="text" name="tagline" value="${esc(s.tagline)}"></label></div>
        <label class="field">${t('about')} <span class="hint">${t('descHint')}</span><textarea name="about" rows="4">${esc(s.about)}</textarea></label>
        <div class="grid2"><label class="field">${t('footer')}<input type="text" name="footer" value="${esc(s.footer)}"></label><label class="field">${t('whatsapp')}<input type="tel" name="whatsapp" class="ltr" value="${esc(s.whatsapp)}"></label></div>
        <div class="grid4"><label class="field">${t('currency')}<input type="text" name="currency" value="${esc(s.currency)}"></label><label class="field">${t('currencyCode')}<input type="text" name="currencyCode" class="ltr" maxlength="3" value="${esc(s.currencyCode)}"></label><label class="field">${t('color')}<input type="color" name="color" value="${esc(s.color)}" style="height:40px;width:100%"></label><label class="field">${t('signup')}<span class="switch"><input type="checkbox" name="allowSignup" ${s.allowSignup ? 'checked' : ''}></span></label></div>
        <h2>${t('payments')}</h2><label class="field">${t('paymentInfo')}<textarea name="paymentInfo" rows="4">${esc(s.paymentInfo)}</textarea></label>
        <h3>${t('stripe')}</h3><div class="grid2"><label class="field">${t('stripeKey')}<input type="password" name="stripeSecretKey" class="ltr" value="${esc(s.stripeSecretKey)}" autocomplete="off"></label><label class="field">${t('stripeHook')}<input type="password" name="stripeWebhookSecret" class="ltr" value="${esc(s.stripeWebhookSecret)}" autocomplete="off"></label></div>
        <p class="small muted" style="margin:0">${t('stripeHelp')} <code>${esc(webhookUrl)}</code></p>
        <div class="row"><button class="btn primary" type="submit">${t('save')}</button></div></form>
      <form class="card" id="pf" style="max-width:480px"><h2>${t('pwTitle')}</h2><label class="field" for="pc">${t('current')}<input type="password" id="pc" autocomplete="current-password"></label><label class="field" for="pn">${t('next')}<input type="password" id="pn" autocomplete="new-password"></label><div class="err" id="pe"></div><div class="row"><button class="btn primary" type="submit">${t('change')}</button></div></form>
      <p class="muted small">Doroos · ${esc(session.version)} · MIT</p></div>`;
    const f = $('#sf');
    f.onsubmit = async (e) => {
      e.preventDefault();
      const body = {};
      for (const k of ['siteName', 'tagline', 'about', 'footer', 'whatsapp', 'currency', 'currencyCode', 'color', 'paymentInfo', 'stripeSecretKey', 'stripeWebhookSecret']) body[k] = f[k].value;
      body.allowSignup = f.allowSignup.checked;
      try { await api('/api/settings', { method: 'PUT', body: { settings: body } }); currency = body.currency; toast(t('saved')); } catch (err) { toast(err.message); }
    };
    $('#pf').onsubmit = async (e) => { e.preventDefault(); try { await api('/api/password', { method: 'POST', body: { current: $('#pc').value, next: $('#pn').value } }); toast(t('saved')); } catch (err) { $('#pe').textContent = err.message; } };
  }
  boot();
})();
