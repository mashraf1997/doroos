import crypto from 'node:crypto';
import { defaultData } from './app.js';
import { hashPassword } from './auth.js';

// A small academy with three courses, students at different points, a pending transfer and a coupon.
// Videos are the Blender Foundation's open films on YouTube (Creative Commons).
const VIDEOS = ['https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'https://youtu.be/eRsGyueVLvQ', 'https://www.youtube.com/watch?v=WhWc3b3KhnY'];

export function buildDemo(demo) {
  const d = defaultData();
  const ar = demo.lang === 'ar';
  Object.assign(d.settings, ar
    ? { siteName: 'أكاديمية نيل', tagline: 'كورسات عملية قصيرة بالمصري، تتعلم وتطبّق من أول درس.', about: 'إحنا فريق صغير بنعمل كورسات عملية في التصوير والمحاسبة والبرمجة.\n\n- كل كورس فيه دروس قصيرة تقدر تتفرج عليها في أي وقت\n- الأسئلة على واتساب\n- شهادة إتمام', footer: 'أكاديمية نيل · القاهرة', paymentInfo: 'حوّل المبلغ على إنستاباي: nile.academy@instapay\nأو فودافون كاش: 01000000000\nواكتب رقم العملية أو رقم الموبايل اللي حوّلت منه.', whatsapp: '+201000000000' }
    : { siteName: 'Nile Academy', tagline: 'Short, practical courses. Learn by doing from the first lesson.', about: 'A small team making practical courses in photography, spreadsheets and coding.\n\n- Short lessons you can watch any time\n- Questions on WhatsApp\n- A certificate when you finish', footer: 'Nile Academy', paymentInfo: 'Send the amount by bank transfer to IBAN XX00 0000 0000 0000\nThen type the transfer reference below.', whatsapp: '+201000000000', lang: 'en', currency: 'USD', currencyCode: 'USD' });
  const courses = ar
    ? [['تصوير المنتجات بالموبايل', 'صوّر منتجاتك صور تبيع، من غير كاميرا ولا استوديو.', 499, 799, 'سارة حسن', ['ليه الصورة بتبيع؟', 'الإضاءة الطبيعية', 'خلفيات من البيت بـ 50 جنيه', 'زوايا التصوير', 'تعديل الصور على الموبايل', 'صور لإنستجرام وفيسبوك']],
       ['إكسل للمحاسبين وأصحاب المحلات', 'من أول جدول لحد تقرير الأرباح الشهري.', 349, 0, 'أحمد سمير', ['أول جدول', 'المعادلات الأساسية', 'VLOOKUP و XLOOKUP', 'الجداول المحورية', 'تقرير أرباح شهري']],
       ['مقدمة في البرمجة للمبتدئين', 'كورس مجاني تعرف منه البرمجة إيه وتبدأ منين.', 0, 0, 'كريم عادل', ['يعني إيه برمجة؟', 'أول برنامج', 'المتغيرات والشروط', 'تبدأ منين بعد كده؟']]]
    : [['Product photos with your phone', 'Take photos that sell, without a camera or a studio.', 49, 79, 'Sara Hassan', ['Why photos sell', 'Natural light', 'Backgrounds from home', 'Angles', 'Editing on your phone', 'Photos for Instagram']],
       ['Spreadsheets for shop owners', 'From your first table to a monthly profit report.', 35, 0, 'Ahmed Samir', ['Your first table', 'Basic formulas', 'Lookups', 'Pivot tables', 'A monthly profit report']],
       ['Coding for absolute beginners', 'A free course on what coding is and where to start.', 0, 0, 'Karim Adel', ['What is coding?', 'Your first program', 'Variables and conditions', 'Where to go next']]];
  const made = courses.map(([title, subtitle, price, comparePrice, instructor, lessons], ci) => {
    const c = { id: crypto.randomUUID(), slug: ['product-photos', 'excel-for-shops', 'coding-101'][ci], title, subtitle, description: ar ? `${subtitle}\n\nهتتعلم في الكورس ده:\n- ${lessons.slice(0, 3).join('\n- ')}\n\nمناسب للمبتدئين، ومش محتاج أي خبرة قبل كده.` : `${subtitle}\n\nIn this course:\n- ${lessons.slice(0, 3).join('\n- ')}\n\nFor beginners. No experience needed.`, cover: '', price, comparePrice, instructor, published: true, order: ci, createdAt: new Date(Date.now() - 90 * 864e5).toISOString() };
    d.courses.push(c);
    lessons.forEach((t, li) => d.lessons.push({ id: crypto.randomUUID(), courseId: c.id, title: t, body: ar ? `ملخص الدرس: ${t}.\n\nاتفرج على الفيديو، وبعدين جرّب بنفسك وابعتلنا النتيجة على واتساب.` : `Lesson summary: ${t}.\n\nWatch the video, then try it yourself.`, videoUrl: VIDEOS[(ci + li) % VIDEOS.length], free: li === 0, durationMin: 6 + ((ci * 5 + li * 3) % 12), order: li }));
    return c;
  });
  const names = ar ? ['منى أحمد', 'كريم عادل', 'سارة محمود', 'يوسف علي', 'نور حسن', 'هدى سمير', 'عمر خالد', 'ليلى طارق', 'آدم فؤاد', 'جنى وليد', 'مريم سعيد', 'زياد مصطفى'] : ['Mona', 'Karim', 'Sara', 'Youssef', 'Nour', 'Hoda', 'Omar', 'Layla', 'Adam', 'Jana', 'Mariam', 'Ziad'];
  const pass = hashPassword('student1234');
  names.forEach((name, i) => {
    const st = { id: crypto.randomUUID(), name, email: `student${i + 1}@example.com`, phone: '0100' + (3000000 + i), pass, createdAt: new Date(Date.now() - (80 - i * 6) * 864e5).toISOString(), lastSeen: new Date(Date.now() - i * 3600_000).toISOString() };
    d.students.push(st);
    made.forEach((c, ci) => {
      if ((i + ci) % 3 === 2 && ci !== 2) return;
      const pending = ci === 0 && i === 10;
      const ls = d.lessons.filter((l) => l.courseId === c.id);
      const doneN = pending ? 0 : Math.min(ls.length, (i * 3 + ci) % (ls.length + 1));
      const at = new Date(Date.now() - ((i * 7 + ci * 4) % 30) * 864e5 - (i + 1) * 3600_000).toISOString();
      d.enrollments.push({ id: crypto.randomUUID(), studentId: st.id, courseId: c.id, status: pending ? 'pending' : 'active', method: c.price ? (i % 3 ? 'manual' : 'card') : 'free', amount: c.price && i === 4 ? Math.round(c.price * 0.8) : c.price, reference: pending ? (ar ? 'إنستاباي 01003000010' : 'TRX-55102') : '', coupon: c.price && i === 4 ? 'WELCOME20' : '', checkoutId: '', createdAt: at, approvedAt: pending ? null : at, progress: Object.fromEntries(ls.slice(0, doneN).map((l) => [l.id, at])) });
    });
  });
  d.coupons.push({ id: crypto.randomUUID(), code: 'WELCOME20', percent: 20, courseId: '', maxUses: 100, used: 1, expires: '' });
  return d;
}
