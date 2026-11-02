// Server-rendered public pages (catalog and course pages) so search engines and link previews see real content.

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const T = {
  ar: { courses: 'الكورسات', free: 'مجاني', lessons: 'درس', minutes: 'دقيقة', enroll: 'اشترك في الكورس', open: 'كمّل الكورس', preview: 'مشاهدة مجانية', curriculum: 'محتوى الكورس', about: 'عن الكورس', my: 'كورساتي', login: 'دخول', notFound: 'الصفحة دي مش موجودة.', home: 'الرئيسية', empty: 'لسه مفيش كورسات منشورة.', contact: 'تواصل معانا', students: 'طالب', powered: 'بيشتغل بـ', instructor: 'المحاضر' },
  en: { courses: 'Courses', free: 'Free', lessons: 'lessons', minutes: 'min', enroll: 'Enroll in this course', open: 'Continue the course', preview: 'Free preview', curriculum: 'Course content', about: 'About this course', my: 'My courses', login: 'Sign in', notFound: 'This page does not exist.', home: 'Home', empty: 'No published courses yet.', contact: 'Contact us', students: 'students', powered: 'Powered by', instructor: 'Instructor' },
};

export const priceText = (course, s) => (Number(course.price) > 0 ? `${Number(course.price).toLocaleString('en-US', { maximumFractionDigits: 2 })} ${esc(s.currency)}` : T[s.lang === 'en' ? 'en' : 'ar'].free);

/** Very small text formatter: paragraphs, line breaks and "- " lists. Everything is escaped first. */
export function richText(text) {
  return String(text || '').split(/\n{2,}/).map((block) => {
    let html = '', para = [], list = [];
    const flushPara = () => { if (para.length) html += `<p>${para.map(esc).join('<br>')}</p>`; para = []; };
    const flushList = () => { if (list.length) html += `<ul>${list.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`; list = []; };
    for (const line of block.split('\n')) {
      const m = /^\s*[-•]\s+(.*)$/.exec(line);
      if (m) { flushPara(); list.push(m[1]); } else { flushList(); para.push(line); }
    }
    flushPara(); flushList();
    return html;
  }).join('');
}

function layout(s, { title, description, body, canonical, image }) {
  const t = T[s.lang === 'en' ? 'en' : 'ar'];
  const dir = s.lang === 'en' ? 'ltr' : 'rtl';
  return `<!DOCTYPE html>
<html lang="${s.lang === 'en' ? 'en' : 'ar'}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
${canonical ? `<link rel="canonical" href="${esc(canonical)}"><meta property="og:url" content="${esc(canonical)}">` : ''}
${image ? `<meta property="og:image" content="${esc(image)}">` : ''}
<meta name="theme-color" content="${esc(s.color)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/site.css">
<style>:root{--c:${esc(s.color)}}</style>
</head>
<body>
<header class="top"><div class="wrap"><a class="logo" href="/">${esc(s.siteName || 'Doroos')}</a><nav><a href="/">${t.courses}</a><a class="btn sm" href="/learn">${t.my}</a></nav></div></header>
<main class="wrap">${body}</main>
<footer class="foot"><div class="wrap">${s.footer ? `<p>${esc(s.footer)}</p>` : ''}${s.whatsapp ? `<p><a href="https://wa.me/${esc(String(s.whatsapp).replace(/\D/g, ''))}" rel="noopener">${t.contact}</a></p>` : ''}<p class="muted">${t.powered} <a href="https://github.com/mashraf1997/doroos" rel="noopener">Doroos</a></p></div></footer>
</body>
</html>`;
}

export function homePage(s, courses, stats, origin) {
  const t = T[s.lang === 'en' ? 'en' : 'ar'];
  const cards = courses.map((c) => `<a class="course" href="/c/${esc(c.slug)}">
      ${c.cover ? `<img src="/media/${esc(c.cover)}" alt="" loading="lazy">` : `<div class="ph" aria-hidden="true">${esc([...(c.title || '?')][0])}</div>`}
      <div class="body"><h2>${esc(c.title)}</h2>${c.subtitle ? `<p class="muted">${esc(c.subtitle)}</p>` : ''}
      <div class="meta"><span>${stats[c.id]?.lessons || 0} ${t.lessons}</span><b>${priceText(c, s)}${Number(c.comparePrice) > Number(c.price) ? ` <s class="muted">${Number(c.comparePrice).toLocaleString('en-US')}</s>` : ''}</b></div></div></a>`).join('');
  const body = `<section class="hero"><h1>${esc(s.siteName || 'Doroos')}</h1>${s.tagline ? `<p>${esc(s.tagline)}</p>` : ''}</section>
    ${courses.length ? `<div class="grid">${cards}</div>` : `<p class="muted">${t.empty}</p>`}
    ${s.about ? `<section class="card about">${richText(s.about)}</section>` : ''}`;
  return layout(s, { title: s.siteName || 'Doroos', description: s.tagline || s.siteName || '', body, canonical: origin + '/' });
}

export function coursePage(s, c, lessons, { origin, enrolled, students }) {
  const t = T[s.lang === 'en' ? 'en' : 'ar'];
  const total = lessons.reduce((x, l) => x + (Number(l.durationMin) || 0), 0);
  const list = lessons.map((l, i) => `<li><span class="n">${i + 1}</span><span class="t">${esc(l.title)}</span>${l.free ? `<a class="pill" href="/learn#/${esc(c.slug)}/${esc(l.id)}">${t.preview}</a>` : '<span class="lock" aria-hidden="true">🔒</span>'}${l.durationMin ? `<span class="muted">${l.durationMin} ${t.minutes}</span>` : ''}</li>`).join('');
  const cta = enrolled ? `<a class="btn big" href="/learn#/${esc(c.slug)}">${t.open}</a>` : `<a class="btn big" href="/learn#/buy/${esc(c.slug)}">${t.enroll}</a>`;
  const ld = { '@context': 'https://schema.org', '@type': 'Course', name: c.title, description: c.subtitle || String(c.description || '').slice(0, 300), provider: { '@type': 'Organization', name: s.siteName || 'Doroos', sameAs: origin }, offers: { '@type': 'Offer', price: Number(c.price) || 0, priceCurrency: /^[A-Z]{3}$/.test(s.currencyCode || '') ? s.currencyCode : undefined, category: Number(c.price) > 0 ? 'Paid' : 'Free' } };
  const body = `<p class="crumbs"><a href="/">${t.home}</a> / ${esc(c.title)}</p>
    <div class="course-head">
      <div><h1>${esc(c.title)}</h1>${c.subtitle ? `<p class="lead">${esc(c.subtitle)}</p>` : ''}
        <p class="muted">${lessons.length} ${t.lessons}${total ? ` · ${total} ${t.minutes}` : ''}${students ? ` · ${students} ${t.students}` : ''}${c.instructor ? ` · ${t.instructor}: ${esc(c.instructor)}` : ''}</p></div>
      <aside class="card buy">${c.cover ? `<img src="/media/${esc(c.cover)}" alt="">` : ''}<div class="price">${priceText(c, s)}${Number(c.comparePrice) > Number(c.price) ? ` <s class="muted">${Number(c.comparePrice).toLocaleString('en-US')}</s>` : ''}</div>${cta}</aside>
    </div>
    ${c.description ? `<section class="card"><h2>${t.about}</h2>${richText(c.description)}</section>` : ''}
    <section class="card"><h2>${t.curriculum}</h2><ol class="lessons">${list}</ol></section>
    <script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`;
  return layout(s, { title: `${c.title} · ${s.siteName || 'Doroos'}`, description: c.subtitle || String(c.description || '').slice(0, 160), body, canonical: `${origin}/c/${c.slug}`, image: c.cover ? `${origin}/media/${c.cover}` : '' });
}

export function notFoundPage(s) {
  const t = T[s.lang === 'en' ? 'en' : 'ar'];
  return layout(s, { title: '404', description: '', body: `<section class="hero"><h1>404</h1><p>${t.notFound}</p><p><a class="btn" href="/">${t.home}</a></p></section>` });
}
