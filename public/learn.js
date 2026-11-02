/* Doroos student area: sign in, my courses, checkout and the lesson player */
(function () {
  'use strict';
  var S = {
    ar: { my: 'كورساتي', courses: 'كل الكورسات', account: 'حسابي', logout: 'خروج', login: 'دخول', signup: 'حساب جديد', name: 'الاسم', email: 'الإيميل', phone: 'الموبايل', emailOrPhone: 'الإيميل أو الموبايل', password: 'كلمة السر', pwHint: '6 حروف على الأقل', needOne: 'اكتب الإيميل أو الموبايل (واحد منهم كفاية)', go: 'يلا', forgot: 'نسيت كلمة السر؟ كلّمنا على واتساب ونعملك واحدة جديدة.', noCourses: 'لسه مشتركتش في أي كورس.', browse: 'شوف الكورسات', continue: 'كمّل', start: 'ابدأ', pendingT: 'مستني تأكيد الدفع', done: 'خلّصت', lessons: 'درس', of: 'من',
      buyTitle: 'الاشتراك في', price: 'السعر', coupon: 'كود خصم', apply: 'تطبيق', total: 'الإجمالي', free: 'مجاني', enrollFree: 'اشترك مجاناً', card: 'ادفع بالكارت', manual: 'تحويل (إنستاباي / محفظة / بنك)', reference: 'رقم العملية أو الرقم اللي حوّلت منه', sendRef: 'بعت التحويل', pendingMsg: 'استلمنا طلبك ✓ هنفتحلك الكورس أول ما نتأكد من التحويل.', paidWait: 'بنتأكد من الدفع…', paidOk: 'تم الدفع ✓ الكورس اتفتح.', noPay: 'الدفع مش متاح دلوقتي. كلّمنا على واتساب.', loginFirst: 'اعمل حساب أو ادخل الأول عشان تشترك.',
      markDone: 'خلّصت الدرس ✓', undo: 'لسه مخلّصتش', next: 'الدرس اللي بعده ←', locked: 'الدرس ده للمشتركين بس.', enroll: 'اشترك في الكورس', progress: 'التقدم', preview: 'مجاني', min: 'د', noVideo: '',
      changePw: 'تغيير كلمة السر', current: 'الحالية', newPw: 'الجديدة', save: 'حفظ', saved: 'اتحفظ ✓', notFound: 'الكورس ده مش موجود.', whatsapp: 'كلّمنا على واتساب',
      e_exists: 'فيه حساب بالإيميل أو الموبايل ده. جرّب تدخل.', e_wrong_login: 'البيانات غلط', e_short_password: 'كلمة السر قصيرة', e_bad_email: 'الإيميل مش مظبوط', e_name_and_contact: 'اكتب اسمك والإيميل أو الموبايل', e_too_many: 'محاولات كتير، استنى شوية', e_bad_coupon: 'الكود ده مش شغال', e_reference_required: 'اكتب رقم العملية', e_signup_closed: 'التسجيل مقفول دلوقتي', e_wrong_password: 'كلمة السر الحالية غلط' },
    en: { my: 'My courses', courses: 'All courses', account: 'Account', logout: 'Sign out', login: 'Sign in', signup: 'Create account', name: 'Name', email: 'Email', phone: 'Mobile', emailOrPhone: 'Email or mobile', password: 'Password', pwHint: 'At least 6 characters', needOne: 'Email or mobile (one is enough)', go: 'Continue', forgot: 'Forgot your password? Message us and we will set a new one.', noCourses: 'You have not joined a course yet.', browse: 'Browse courses', continue: 'Continue', start: 'Start', pendingT: 'Waiting for payment confirmation', done: 'Completed', lessons: 'lessons', of: 'of',
      buyTitle: 'Enroll in', price: 'Price', coupon: 'Coupon code', apply: 'Apply', total: 'Total', free: 'Free', enrollFree: 'Enroll for free', card: 'Pay by card', manual: 'Bank or wallet transfer', reference: 'Transfer reference', sendRef: 'I have paid', pendingMsg: 'Got it ✓ The course opens as soon as we confirm your transfer.', paidWait: 'Confirming your payment…', paidOk: 'Payment received ✓ The course is open.', noPay: 'Payments are not available right now. Please message us.', loginFirst: 'Create an account or sign in to enroll.',
      markDone: 'Mark as done ✓', undo: 'Not done yet', next: 'Next lesson →', locked: 'This lesson is for enrolled students.', enroll: 'Enroll in this course', progress: 'Progress', preview: 'Free', min: 'm', noVideo: '',
      changePw: 'Change password', current: 'Current', newPw: 'New', save: 'Save', saved: 'Saved ✓', notFound: 'This course does not exist.', whatsapp: 'Message us on WhatsApp',
      e_exists: 'An account with this email or mobile exists. Try signing in.', e_wrong_login: 'Wrong details', e_short_password: 'Password is too short', e_bad_email: 'Check the email', e_name_and_contact: 'Enter your name and an email or mobile', e_too_many: 'Too many tries, please wait', e_bad_coupon: 'This code does not work', e_reference_required: 'Enter the transfer reference', e_signup_closed: 'Sign-up is closed right now', e_wrong_password: 'Current password is wrong' },
  };
  var L = 'ar', site = {}, me = null, m = document.getElementById('m');
  function t(k) { return S[L][k] != null ? S[L][k] : k; }
  function err(code) { return S[L]['e_' + code] || code || 'Error'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(s, r) { return (r || document).querySelector(s); }
  function api(p, body) {
    return fetch(p, { method: body ? 'POST' : 'GET', headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin' })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, status: r.status, data: d }; }); });
  }
  function money(n) { return Number(n) > 0 ? Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' ' + esc(site.currency) : t('free'); }
  function rich(text) {
    return String(text || '').split(/\n{2,}/).map(function (block) {
      var html = '', para = [], list = [];
      function fp() { if (para.length) html += '<p>' + para.map(esc).join('<br>') + '</p>'; para = []; }
      function fl() { if (list.length) html += '<ul>' + list.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>'; list = []; }
      block.split('\n').forEach(function (line) { var m = /^\s*[-•]\s+(.*)$/.exec(line); if (m) { fp(); list.push(m[1]); } else { fl(); para.push(line); } });
      fp(); fl();
      return html;
    }).join('');
  }
  function nav() {
    $('#logo').textContent = site.siteName || 'Doroos';
    $('#nav').innerHTML = '<a href="/">' + t('courses') + '</a>' + (me ? '<a href="#/">' + t('my') + '</a><a href="#/account">' + t('account') + '</a>' : '');
  }

  function boot() {
    return api('/api/s/session').then(function (r) {
      site = r.data.site; me = r.data.student;
      L = site.lang === 'en' ? 'en' : 'ar';
      document.documentElement.lang = L; document.documentElement.dir = L === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.style.setProperty('--c', site.color);
      document.title = t('my') + ' · ' + (site.siteName || 'Doroos');
      nav();
      route();
    });
  }
  window.addEventListener('hashchange', route);

  function route() {
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('/').filter(Boolean).map(decodeURIComponent);
    window.scrollTo(0, 0);
    if (parts[0] === 'buy') return buy(parts[1]);
    if (parts[0] === 'paid') return paid(parts[1]);
    if (parts[0] === 'account') return me ? account() : auth();
    if (parts[0]) return player(parts[0], parts[1]);
    return me ? mine() : auth();
  }

  function auth(note) {
    var mode = 'signup';
    function draw() {
      m.innerHTML = '<section class="card auth">' + (note ? '<p class="notice">' + esc(note) + '</p>' : '') +
        '<div class="tabs"><button type="button" data-m="signup" aria-pressed="' + (mode === 'signup') + '">' + t('signup') + '</button><button type="button" data-m="login" aria-pressed="' + (mode === 'login') + '">' + t('login') + '</button></div>' +
        '<form id="af" class="auth" style="margin:0">' + (mode === 'signup'
          ? '<label>' + t('name') + '<input name="name" autocomplete="name" required></label><label>' + t('email') + '<input name="email" type="email" autocomplete="email" dir="ltr"></label><label>' + t('phone') + '<input name="phone" type="tel" autocomplete="tel" dir="ltr"></label><p class="muted" style="margin:0;font-size:.85rem">' + t('needOne') + '</p>'
          : '<label>' + t('emailOrPhone') + '<input name="login" autocomplete="username" dir="ltr" required></label>') +
        '<label>' + t('password') + (mode === 'signup' ? ' <span class="muted" style="font-weight:400">' + t('pwHint') + '</span>' : '') + '<input name="password" type="password" autocomplete="' + (mode === 'signup' ? 'new-password' : 'current-password') + '" required></label>' +
        '<p class="err" id="e" role="alert"></p><button class="btn big" type="submit">' + t('go') + '</button>' + (mode === 'login' ? '<p class="muted" style="margin:0;font-size:.9rem">' + t('forgot') + '</p>' : '') + '</form></section>';
      m.querySelectorAll('[data-m]').forEach(function (b) { b.onclick = function () { mode = b.dataset.m; draw(); }; });
      $('#af').onsubmit = function (ev) {
        ev.preventDefault();
        var f = ev.target, body = mode === 'signup' ? { name: f.name.value, email: f.email.value, phone: f.phone.value, password: f.password.value } : { login: f.login.value, password: f.password.value };
        api('/api/s/' + mode, body).then(function (r) { if (!r.ok) { $('#e').textContent = err(r.data.error); return; } boot(); });
      };
    }
    draw();
  }

  function mine() {
    api('/api/s/my').then(function (r) {
      var list = r.data.enrollments || [];
      m.innerHTML = '<h1 style="margin:0">' + t('my') + '</h1>' + (list.length ? '<div class="mine">' + list.map(function (e) {
        var c = e.course, p = e.progress;
        return '<a class="course" href="#/' + encodeURIComponent(c.slug) + (e.next ? '/' + e.next : '') + '">' + (c.cover ? '<img src="/media/' + esc(c.cover) + '" alt="">' : '<div class="ph" aria-hidden="true">' + esc((c.title || '?').charAt(0)) + '</div>') +
          '<div class="body"><h2>' + esc(c.title) + '</h2>' + (e.status === 'pending' ? '<span class="pill warn">' + t('pendingT') + '</span>' : '<div class="bar" role="progressbar" aria-valuenow="' + p.percent + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + p.percent + '%"></i></div><span class="muted" style="font-size:.9rem">' + (p.percent === 100 ? t('done') + ' ✓' : p.done + ' ' + t('of') + ' ' + p.total + ' ' + t('lessons')) + '</span>') + '</div></a>';
      }).join('') + '</div>' : '<section class="card"><p>' + t('noCourses') + '</p><a class="btn" href="/">' + t('browse') + '</a></section>');
    });
  }

  function buy(slug) {
    api('/api/s/course/' + encodeURIComponent(slug)).then(function (r) {
      if (!r.ok) { m.innerHTML = '<section class="card">' + t('notFound') + '</section>'; return; }
      var c = r.data.course, e = r.data.enrollment;
      if (e && e.status === 'active') { location.hash = '#/' + encodeURIComponent(c.slug); return; }
      if (!me) return auth(t('loginFirst'));
      var coupon = '', total = Number(c.price);
      function draw(msg) {
        var payOpts = '';
        if (total <= 0) payOpts = '<button class="btn big" id="free" type="button">' + t('enrollFree') + '</button>';
        else {
          if (site.cards) payOpts += '<button class="btn big" id="card" type="button">' + t('card') + '</button>';
          if (site.paymentInfo) payOpts += '<section class="card" style="display:grid;gap:10px"><h2>' + t('manual') + '</h2><pre class="pay">' + esc(site.paymentInfo) + '</pre><label>' + t('reference') + '<input id="ref" dir="auto"></label><button class="btn big" id="man" type="button">' + t('sendRef') + '</button></section>';
          if (!payOpts) payOpts = '<p class="notice">' + t('noPay') + '</p>' + (site.whatsapp ? '<a class="btn" href="https://wa.me/' + esc(site.whatsapp.replace(/\D/g, '')) + '">' + t('whatsapp') + '</a>' : '');
        }
        m.innerHTML = '<section class="card auth" style="max-width:560px">' + '<h1 style="margin:0;font-size:1.4rem">' + t('buyTitle') + ' ' + esc(c.title) + '</h1>' +
          (e && e.status === 'pending' && e.method === 'manual' ? '<p class="notice">' + t('pendingMsg') + '</p>' : '') +
          '<div class="row"><span>' + t('price') + '</span><span class="spacer"></span><b>' + money(c.price) + '</b></div>' +
          (Number(c.price) > 0 ? '<form class="row" id="cf"><input id="cp" placeholder="' + t('coupon') + '" value="' + esc(coupon) + '" dir="ltr" style="flex:1"><button class="btn ghost" type="submit">' + t('apply') + '</button></form>' : '') +
          '<div class="row" style="font-size:1.2rem"><b>' + t('total') + '</b><span class="spacer"></span><b>' + money(total) + '</b></div><p class="err" id="e" role="alert">' + esc(msg || '') + '</p>' + payOpts + '</section>';
        var cf = $('#cf');
        if (cf) cf.onsubmit = function (ev) { ev.preventDefault(); var code = $('#cp').value.trim(); api('/api/s/quote', { courseId: c.id, coupon: code }).then(function (q) { if (!q.ok) return draw(err(q.data.error)); coupon = code; total = q.data.total; draw(); }); };
        var go = function (method, extra) {
          return api('/api/s/checkout', Object.assign({ courseId: c.id, coupon: coupon, method: method }, extra || {})).then(function (x) {
            if (!x.ok) { $('#e').textContent = err(x.data.error); return; }
            if (x.data.status === 'redirect') location.href = x.data.url;
            else if (x.data.status === 'active') location.hash = '#/' + encodeURIComponent(c.slug);
            else { e = { status: 'pending', method: 'manual' }; draw(); }
          });
        };
        if ($('#free')) $('#free').onclick = function () { go('free'); };
        if ($('#card')) $('#card').onclick = function () { this.disabled = true; go('card'); };
        if ($('#man')) $('#man').onclick = function () { go('manual', { reference: $('#ref').value }); };
      }
      draw();
    });
  }

  function paid(slug) {
    var tries = 0;
    m.innerHTML = '<section class="card"><p>' + t('paidWait') + '</p></section>';
    (function check() {
      api('/api/s/course/' + encodeURIComponent(slug)).then(function (r) {
        if (r.ok && r.data.enrollment && r.data.enrollment.status === 'active') { m.innerHTML = '<section class="card"><p class="notice good">' + t('paidOk') + '</p><a class="btn" href="#/' + encodeURIComponent(slug) + '">' + t('start') + '</a></section>'; return; }
        if (++tries < 20) setTimeout(check, 2000);
      });
    })();
  }

  function player(slug, lessonId) {
    api('/api/s/course/' + encodeURIComponent(slug)).then(function (r) {
      if (!r.ok) { m.innerHTML = '<section class="card">' + t('notFound') + '</section>'; return; }
      var c = r.data.course, ls = r.data.lessons, e = r.data.enrollment, active = e && e.status === 'active';
      var cur = ls.find(function (l) { return l.id === lessonId; }) || ls.find(function (l) { return l.open && !l.done; }) || ls[0];
      if (!cur) { m.innerHTML = '<section class="card"><h1>' + esc(c.title) + '</h1></section>'; return; }
      var idx = ls.indexOf(cur), next = ls[idx + 1];
      var side = '<nav class="card side" aria-label="' + esc(c.title) + '"><b style="padding:4px 10px">' + esc(c.title) + '</b>' + (active ? '<div style="padding:0 10px 8px"><div class="bar"><i style="width:' + r.data.progress.percent + '%"></i></div></div>' : '') +
        ls.map(function (l, i) { return '<a href="#/' + encodeURIComponent(c.slug) + '/' + l.id + '" aria-current="' + (l.id === cur.id) + '" class="' + (l.open ? '' : 'locked') + '"><span class="ck ' + (l.done ? 'on' : '') + '">' + (l.done ? '✓' : l.open ? i + 1 : '🔒') + '</span><span style="flex:1">' + esc(l.title) + '</span>' + (l.free && !active ? '<span class="pill">' + t('preview') + '</span>' : '') + (l.durationMin ? '<span class="muted" style="font-size:.8rem">' + l.durationMin + t('min') + '</span>' : '') + '</a>'; }).join('') + '</nav>';
      m.innerHTML = '<div class="player"><div id="lesson" style="display:grid;gap:14px"></div>' + side + '</div>';
      var box = $('#lesson');
      if (!cur.open) {
        box.innerHTML = '<section class="card"><h1 style="margin-top:0;font-size:1.4rem">' + esc(cur.title) + '</h1><p>' + t('locked') + '</p>' + (e && e.status === 'pending' ? '<p class="notice">' + t('pendingMsg') + '</p>' : '<a class="btn" href="#/buy/' + encodeURIComponent(c.slug) + '">' + t('enroll') + '</a>') + '</section>';
        return;
      }
      api('/api/s/lesson/' + cur.id).then(function (x) {
        if (!x.ok) { box.innerHTML = '<section class="card"><p>' + t('locked') + '</p><a class="btn" href="#/buy/' + encodeURIComponent(c.slug) + '">' + t('enroll') + '</a></section>'; return; }
        var l = x.data.lesson, v = l.video, media = '';
        if (v && v.type === 'embed') media = '<div class="video"><iframe src="' + esc(v.src) + '" title="' + esc(l.title) + '" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>';
        else if (v && (v.type === 'file' || v.type === 'url')) media = '<div class="video"><video src="' + esc(v.src) + '" controls controlsList="nodownload" playsinline preload="metadata"></video></div>';
        box.innerHTML = media + '<section class="card"><h1 style="margin-top:0;font-size:1.4rem">' + esc(l.title) + '</h1>' + rich(l.body) +
          '<div class="row">' + (active ? '<button class="btn ' + (cur.done ? 'ghost' : '') + '" id="dn" type="button">' + (cur.done ? t('undo') : t('markDone')) + '</button>' : '<a class="btn" href="#/buy/' + encodeURIComponent(c.slug) + '">' + t('enroll') + '</a>') + '<span class="spacer"></span>' +
          (next ? '<a class="btn ghost" href="#/' + encodeURIComponent(c.slug) + '/' + next.id + '">' + t('next') + '</a>' : '') + '</div></section>';
        var dn = $('#dn');
        if (dn) dn.onclick = function () {
          api('/api/s/lesson/' + cur.id + '/done', { done: !cur.done }).then(function () {
            if (!cur.done && next) location.hash = '#/' + encodeURIComponent(c.slug) + '/' + next.id; else player(slug, cur.id);
          });
        };
      });
    });
  }

  function account() {
    m.innerHTML = '<section class="card auth"><h1 style="margin:0;font-size:1.4rem">' + esc(me.name) + '</h1><p class="muted" style="margin:0" dir="ltr">' + esc(me.email || me.phone) + '</p>' +
      '<form id="pf" class="auth" style="margin:0"><h2 style="margin:0">' + t('changePw') + '</h2><label>' + t('current') + '<input name="current" type="password" autocomplete="current-password"></label><label>' + t('newPw') + '<input name="next" type="password" autocomplete="new-password"></label><p class="err" id="e"></p><button class="btn" type="submit">' + t('save') + '</button></form>' +
      '<button class="btn ghost" id="lo" type="button">' + t('logout') + '</button></section>';
    $('#pf').onsubmit = function (ev) { ev.preventDefault(); var f = ev.target; api('/api/s/password', { current: f.current.value, next: f.next.value }).then(function (r) { $('#e').textContent = r.ok ? t('saved') : err(r.data.error); }); };
    $('#lo').onclick = function () { api('/api/s/logout', {}).then(function () { location.hash = '#/'; boot(); }); };
  }
  boot();
})();
