/// <reference lib="dom" />
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoCanvas, useVideoPlayer, VideoPausedContext } from '@/lib/video';
import { C } from './Scenes';
import { ClipScene, Chip, Tile, Btn, H, col, rowS, type Clip } from './ExtraChapters';
import { Greeting } from './viewer';

/**
 * Role guides (?film=admin | institution | teacher). Copy is taken from the real pages
 * (AdminDashboard NAV_ITEMS/ADMIN_PAGE_TIPS, InstitutionPortalPage, TeacherHomePage, TeacherSystemPage).
 * These pages require sign-in, so every screen is an anonymized illustrative panel ("رسم توضيحي من الصفحة"),
 * with placeholder members (طالب ١ …) and "—" instead of real values. Unfinished teacher features
 * (assignments, messaging) are deliberately not shown.
 */
const B = import.meta.env.BASE_URL;
const display = "'Tajawal', sans-serif";
const body = "'IBM Plex Sans Arabic', sans-serif";
const ink = '#1F2933';

function Search({ t }: { t: string }) {
  return <div style={{ fontFamily: body, fontSize: '2.3vmin', color: '#7A838C', background: '#fff', border: '0.25vmin solid #E4DED2', borderRadius: '1.2vmin', padding: '0.9vmin 1.6vmin' }}>⌕ {t}</div>;
}
function Member({ n, s, tag, act, i = 0 }: { n: string; s: string; tag?: string; act?: string; i?: number }) {
  return (
    <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 + i * 0.35 }}
      className="flex items-center justify-between" style={{ background: '#fff', border: '0.25vmin solid #E4DED2', borderRadius: '1.2vmin', padding: '1vmin 1.6vmin' }}>
      <div><div style={{ fontFamily: display, fontWeight: 800, fontSize: '2.6vmin', color: ink }}>{n}</div><div style={{ fontFamily: body, fontSize: '1.9vmin', color: '#56606B' }}>{s}</div></div>
      <div className="flex items-center" style={{ gap: '1vmin' }}>
        {tag && <span style={{ fontFamily: body, fontWeight: 700, fontSize: '1.9vmin', background: '#E3F4EE', color: '#1F6B55', borderRadius: '0.8vmin', padding: '0.3vmin 1vmin' }}>{tag}</span>}
        {act && <span style={{ fontFamily: display, fontWeight: 800, fontSize: '2vmin', background: C.navy, color: '#fff', borderRadius: '0.8vmin', padding: '0.4vmin 1.2vmin' }}>{act}</span>}
      </div>
    </motion.div>
  );
}

const ADMIN: Record<string, Clip> = {
  a_overview: { url: '/admin', eyebrow: 'لوحة الإدارة', title: 'نظرة عامة', bullets: ['راجع الاشتراكات والطلبات المعلقة أولًا', 'إجراءات سريعة للمهام المتكررة', 'حدّث البيانات بعد أي إجراء'],
    panel: () => (<div style={col()}><H t="نظرة عامة" /><div style={rowS('1.2vmin')}><Tile k="الطلاب" v="—" /><Tile k="اشتراكات نشطة" v="—" tone={C.coral} /><Tile k="اختبارات اليوم" v="—" /></div>
      <div style={rowS()}>{['الطلاب', 'المدرسون', 'الاشتراكات', 'بنك الأسئلة', 'الإعلانات', 'الدعم الفني'].map((t, i) => <Chip key={t} t={t} on={i === 2} />)}</div>
      <Member n="طلبات اشتراك معلقة" s="بانتظار المراجعة" act="مراجعة" /></div>) },
  a_accounts: { url: '/admin', eyebrow: 'الطلاب · المدرسون · إدارة الحسابات', title: 'الحسابات', bullets: ['ابحث بالاسم أو البريد أو الجوال', 'افتح ملف الطالب: التقدم والاختبارات', 'عطّل الحساب بدل حذفه'],
    panel: () => (<div style={col('1.1vmin')}><div style={rowS()}><Chip t="طالب" on /><Chip t="مدرس" /><Chip t="ولي أمر" /><Chip t="مسؤول مؤسسة" /></div><Search t="بحث بالبريد أو الاسم أو الجوال" />
      {['طالب ١', 'طالب ٢', 'طالب ٣'].map((n, i) => <Member key={n} n={n} s="@مستخدم · آخر زيارة —" tag="نشط" act="الملف" i={i} />)}</div>) },
  a_subs: { url: '/admin', eyebrow: 'الاشتراكات', title: 'مراجعة الاشتراكات', bullets: ['افتح الإيصال وتحقق من العملية', 'اعتمد، أو ارفض بسبب واضح', 'تأكد من حالة الاشتراك بعد الحفظ'],
    panel: () => (<div style={col()}><div style={rowS()}><Chip t="الكل" /><Chip t="قيد المراجعة" on /><Chip t="نشط" /><Chip t="منتهي" /></div>
      <Member n="طالب ١ · تحويل بنكي" s="الإيصال مرفق" tag="قيد المراجعة" />
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.2 }} style={{ background: '#fff', borderRadius: '1.2vmin', height: '9vmin', display: 'grid', placeItems: 'center', fontFamily: body, fontSize: '2.2vmin', color: '#56606B', border: '0.25vmin dashed #CFC8BC' }}>صورة الإيصال</motion.div>
      <div style={rowS('1.4vmin')}><div style={{ flex: 1 }}><Btn t="اعتماد" tone="#2E9C7E" /></div><div style={{ flex: 1 }}><Btn t="رفض مع السبب" tone="#D9604A" /></div></div></div>) },
  a_questions: { url: '/admin', eyebrow: 'المحتوى', title: 'بنك الأسئلة', bullets: ['ابحث قبل إضافة سؤال مكرر', 'راجع الصور والإجابة الصحيحة', 'بلاغات الأسئلة وأسئلة الطلاب للمراجعة'],
    panel: () => (<div style={col('1.1vmin')}><div style={rowS()}><Chip t="بنك الأسئلة" on /><Chip t="بلاغات الأسئلة" /><Chip t="أسئلة الطلاب للمراجعة" /></div><Search t="بحث في الأسئلة" />
      <div style={{ background: '#fff', borderRadius: '1.2vmin', padding: '1.2vmin', border: '0.25vmin solid #E4DED2' }}><div style={{ fontFamily: display, fontWeight: 800, fontSize: '2.6vmin', color: ink }}>نص السؤال …</div>
        <div style={{ ...rowS(), marginTop: '1vmin' }}>{['أ', 'ب', 'ج', 'د'].map((t, i) => <motion.span key={t} animate={i === 2 ? { backgroundColor: ['#ECE7DD', '#ECE7DD', '#BFE6D9'] } : {}} transition={{ delay: 2.4, duration: 0.6 }} style={{ fontFamily: display, fontWeight: 800, fontSize: '2.4vmin', padding: '0.5vmin 2vmin', borderRadius: '0.8vmin', background: '#ECE7DD', color: ink }}>{t}</motion.span>)}</div></div>
      <Member n="بلاغ على سؤال" s="ملاحظة طالب · بانتظار المراجعة" act="مراجعة" i={3} /></div>) },
  a_announce: { url: '/admin', eyebrow: 'الإعلانات · مركز الإشعارات', title: 'التواصل', bullets: ['عنوان مختصر ورسالة مباشرة', 'حدد الجمهور وتاريخ الانتهاء', 'إشعار داخل المنصة مع خيار واتساب'],
    panel: () => (<div style={col('1.1vmin')}><H t="إعلان جديد" /><Search t="العنوان" /><div style={{ background: '#fff', border: '0.25vmin solid #E4DED2', borderRadius: '1.2vmin', height: '8vmin', padding: '1vmin 1.6vmin', fontFamily: body, fontSize: '2.2vmin', color: '#7A838C' }}>الرسالة…</div>
      <div style={rowS()}><Chip t="الجمهور: الكل" on /><Chip t="تاريخ الانتهاء" /><Chip t="إرسال واتساب" on /></div><Btn t="نشر" /></div>) },
  a_support: { url: '/admin', eyebrow: 'الدعم الفني · البريد الإلكتروني', title: 'الدعم', bullets: ['ابدأ بالتذاكر المفتوحة والأقدم', 'أضف ملاحظة قبل تغيير الحالة', 'صندوق info@qodratak.sa: اقرأ ورد'],
    panel: () => (<div style={col('1.1vmin')}><div style={rowS()}><Chip t="مفتوحة" on /><Chip t="قيد المعالجة" /><Chip t="مغلقة" /></div>
      {['تذكرة دعم ١', 'تذكرة دعم ٢'].map((n, i) => <Member key={n} n={n} s="الموضوع · —" tag="مفتوحة" i={i} />)}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.4 }} style={{ background: '#fff', border: '0.25vmin solid #E4DED2', borderRadius: '1.2vmin', padding: '1vmin 1.6vmin', fontFamily: body, fontSize: '2.2vmin', color: '#7A838C' }}>ملاحظة المعالجة…</motion.div></div>) },
  a_institutions: { url: '/admin', eyebrow: 'طلبات المؤسسات · المؤسسات', title: 'المؤسسات', bullets: ['راجع طلبات المؤسسات واعتمدها', 'ملف المؤسسة: المعلمون والطلاب', 'الأعداد مقابل الحد الأقصى'],
    panel: () => (<div style={col('1.1vmin')}><Member n="مؤسسة تعليمية (مثال)" s="مدرسة · المدينة" tag="قيد المراجعة" act="اعتماد" />
      <div style={rowS('1.2vmin')}><Tile k="المعلمون / الحد" v="— / —" /><Tile k="الطلاب / الحد" v="— / —" tone={C.coral} /></div>
      <div style={rowS()}><Chip t="المعلمون" on /><Chip t="الطلاب" /></div>{['معلم ١', 'معلم ٢'].map((n, i) => <Member key={n} n={n} s="@مستخدم" i={i + 2} />)}</div>) },
  a_settings: { url: '/admin', eyebrow: 'إعدادات المنصة · المحتوى', title: 'الإعدادات', bullets: ['راجع القيمة الحالية واحفظ كل قسم', 'اختبر الصفحة العامة بعد تعديل الأسعار', 'محتوى التأسيس والاختبارات الموسمية'],
    panel: () => (<div style={col('1.1vmin')}><H t="خطة الاشتراك" /><div style={rowS('1.2vmin')}><Tile k="المدة بالأيام" v="—" /><Tile k="السعر" v="—" tone={C.coral} /></div>
      <div style={rowS()}><Chip t="إعدادات المنصة" on /><Chip t="محتوى التأسيس والمراجعات" /><Chip t="الاختبارات الموسمية" /></div><Btn t="حفظ القسم" /></div>) },
};

const INSTITUTION: Record<string, Clip> = {
  i_board: { url: '/institution', eyebrow: 'لوحة مدير المؤسسة', title: 'لوحتك', bullets: ['مدة المؤسسة من التفعيل حتى الانتهاء', 'الطلاب والمعلمون النشطون مقابل الحد', 'بلا معلم مُسند، وببيانات أداء كافية'],
    panel: () => (<div style={col()}><div style={{ background: C.navy, borderRadius: '1.4vmin', padding: '1.4vmin 1.8vmin', color: '#fff' }}><div style={{ fontFamily: body, fontWeight: 700, fontSize: '1.9vmin', color: C.mint }}>لوحة مدير المؤسسة</div><div style={{ fontFamily: display, fontWeight: 900, fontSize: '3.6vmin' }}>اسم مؤسستك</div></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1vmin' }}><Tile k="الطلاب النشطون" v="— / —" /><Tile k="المعلمون النشطون" v="— / —" tone={C.coral} /><Tile k="بلا معلم مُسند" v="—" tone={C.coral} /><Tile k="ببيانات أداء كافية" v="—" /></div></div>) },
  i_codes: { url: '/institution', eyebrow: 'تبويب الأكواد', title: 'أكواد الانضمام', bullets: ['كود الطالب متعدد الاستخدام', 'كود المعلم لمرة واحدة ومرتبط بجواله', 'صلاحية حتى ٩٠ يومًا، ووصف اختياري'],
    panel: () => (<div style={col('1.1vmin')}><div style={rowS()}><Chip t="طالب" on /><Chip t="معلم" /></div><div style={rowS('1vmin')}><div style={{ flex: 1 }}><Search t="عدد الاستخدامات" /></div><div style={{ flex: 1 }}><Search t="أيام الصلاحية" /></div></div><Search t="وصف (مثل: الصف الثالث)" /><Btn t="إصدار" />
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 2.6 }} style={{ textAlign: 'center', background: '#fff', borderRadius: '1.2vmin', padding: '1vmin', fontFamily: body, fontWeight: 700, fontSize: '4vmin', letterSpacing: '0.3em', color: ink }} dir="ltr">••••••</motion.div></div>) },
  i_students: { url: '/institution', eyebrow: 'تبويب الطلاب', title: 'الطلاب والإسناد', bullets: ['ابحث بالاسم أو المستخدم أو الجوال', '«إسناد معلمين»: كل معلم يرى طلابه فقط', '«النتائج»: نتائج الطالب المحفوظة'],
    panel: () => (<div style={col('1.1vmin')}><Search t="بحث بالاسم أو المستخدم أو الجوال" />{['طالب ١', 'طالب ٢', 'طالب ٣'].map((n, i) => <Member key={n} n={n} s={i === 2 ? 'لا يوجد معلم مُسند' : 'المعلمون: معلم ١'} act={i === 2 ? 'إسناد معلمين' : 'النتائج'} i={i} />)}</div>) },
  i_teachers: { url: '/institution', eyebrow: 'تبويب المعلمين', title: 'المعلمون والعضوية', bullets: ['عدد الطلاب المسندين لكل معلم', 'إلغاء العضوية بعد كتابة «إلغاء»', 'لا تُحذف سجلات تعلّم الطالب'],
    panel: () => (<div style={col('1.1vmin')}>{['معلم ١', 'معلم ٢'].map((n, i) => <Member key={n} n={n} s="— طالب مُسند" i={i} />)}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.4 }} style={{ background: '#fff', border: '0.4vmin solid #C4553F', borderRadius: '1.4vmin', padding: '1.2vmin 1.6vmin', ...col('0.8vmin') }}>
        <div style={{ fontFamily: display, fontWeight: 900, fontSize: '2.8vmin', color: '#A3402E' }}>إلغاء العضوية</div><Search t="اكتب «إلغاء» للتأكيد" /></motion.div></div>) },
  i_perf: { url: '/institution', eyebrow: 'مؤشرات الأداء', title: 'اقرأ الأداء بوعي', bullets: ['مبنية على المحاولات المرصودة فقط', '٣ محاولات و٣٠ سؤالًا قبل عرض مستوى', 'وصفية، وليست ضمانًا للإتقان'],
    panel: () => (<div style={col()}><H t="نتائج الطالب" /><div style={rowS('1.2vmin')}><Tile k="المحاولات" v="—" /><Tile k="الأسئلة المرصودة" v="—" tone={C.coral} /></div>
      <Member n="طالب ١" s="آخر محاولة —" tag="بيانات غير كافية بعد" /></div>) },
};

const TEACHER: Record<string, Clip> = {
  t_inst: { url: '/teacher', eyebrow: 'إن كنت معلمًا في مؤسسة', title: 'طلابي المسندون', bullets: ['اسم المؤسسة ومدة وصولك', 'يظهر لك من أسندهم المدير فقط', 'ابحث في طلابك'],
    panel: () => (<div style={col('1.1vmin')}><div style={{ background: C.navy, borderRadius: '1.4vmin', padding: '1.2vmin 1.8vmin', color: '#fff' }}><div style={{ fontFamily: body, fontWeight: 700, fontSize: '1.9vmin', color: C.mint }}>معلم في مؤسسة</div><div style={{ fontFamily: display, fontWeight: 900, fontSize: '3.4vmin' }}>اسم المؤسسة</div></div>
      <Search t="بحث" /><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1vmin' }}>{['طالب ١', 'طالب ٢', 'طالب ٣', 'طالب ٤'].map((n, i) => <Member key={n} n={n} s="آخر محاولة —" i={i} />)}</div></div>) },
  t_results: { url: '/teacher', eyebrow: 'إن كنت معلمًا في مؤسسة', title: 'نتائج الطالب', bullets: ['اضغط بطاقة الطالب لتفتح نتائجه', 'نتائجه المحفوظة فقط', 'المستويات وصفية، وليست ضمانًا'],
    panel: () => (<div style={col()}><H t="طالب ١" /><div style={rowS('1.2vmin')}><Tile k="المحاولات" v="—" /><Tile k="آخر محاولة" v="—" tone={C.coral} /></div>{['اختبار ١', 'اختبار ٢'].map((n, i) => <Member key={n} n={n} s="النتيجة —" i={i + 1} />)}</div>) },
  t_classes: { url: '/teacher', eyebrow: 'إن كنت معلمًا مستقلًا', title: 'فصولي', bullets: ['الفصول والطلاب والنشطون ومن يحتاج متابعة', 'أنشئ فصلًا: الاسم والمادة والبرنامج', 'عدّل الفصل، أو احذفه بعد إزالة طلابه'],
    panel: () => (<div style={col('1.1vmin')}><div style={rowS('1vmin')}><Tile k="الفصول" v="—" /><Tile k="الطلاب" v="—" /><Tile k="النشطون" v="—" /><Tile k="يحتاجون متابعة" v="—" tone={C.coral} /></div>
      {['مجموعة أ · كمي', 'مجموعة ب · لفظي'].map((n, i) => <Member key={n} n={n} s="قدرات · — طالب" act="تعديل" i={i} />)}</div>) },
  t_roster: { url: '/teacher', eyebrow: 'إن كنت معلمًا مستقلًا', title: 'قائمة الفصل', bullets: ['أضف طالبًا بيوزر أو بريد أو جوال', 'المستوى والاختبارات وآخر زيارة', 'أزل الطالب من الفصل عند الحاجة'],
    panel: () => (<div style={col('1.1vmin')}><div style={rowS('1vmin')}><div style={{ flex: 2 }}><Search t="يوزر، بريد، أو جوال الطالب..." /></div><div style={{ flex: 1 }}><Btn t="إضافة طالب" /></div></div>
      {['طالب ١', 'طالب ٢', 'طالب ٣'].map((n, i) => <Member key={n} n={n} s="المستوى — · الاختبارات —" i={i} />)}</div>) },
  t_report: { url: '/teacher', eyebrow: 'إن كنت معلمًا مستقلًا', title: 'تقرير التقدم', bullets: ['فلتر الفترة والبرنامج والاختبار', 'متوسط الدرجة ونسبة الإكمال', 'القوة والضعف، وتصدير CSV'],
    panel: () => (<div style={col('1.1vmin')}><div style={rowS()}><Chip t="آخر ٣٠ يومًا" on /><Chip t="كل البرامج" /><Chip t="كل الاختبارات" /></div>
      <div style={rowS('1.2vmin')}><Tile k="متوسط الدرجة" v="—" /><Tile k="نسبة الإكمال" v="—" tone={C.coral} /><Tile k="اختبارات مكتملة" v="—" /></div>
      <Member n="طالب ١" s="القوة — · الضعف —" i={2} /><Btn t="تصدير CSV" /></div>) },
};

export const ROLE_FILMS = {
  admin: { title: 'دليل لوحة الإدارة', sub: 'كل أقسام الإدارة في دقيقة', clips: ADMIN },
  institution: { title: 'دليل لوحة المؤسسة', sub: 'أكوادك وطلابك ومعلموك', clips: INSTITUTION },
  teacher: { title: 'دليل المعلم', sub: 'لمعلم المؤسسة وللمعلم المستقل', clips: TEACHER },
} as const;
export type Role = keyof typeof ROLE_FILMS;

export function roleDurations(role: Role): Record<string, number> {
  const o: Record<string, number> = { r_intro: 4500 };
  for (const k of Object.keys(ROLE_FILMS[role].clips)) o[k] = 6500;
  o.r_outro = 5000;
  return o;
}

function RoleIntro({ role }: { role: Role }) {
  const f = ROLE_FILMS[role];
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center" dir="rtl" exit={{ opacity: 0, scale: 1.04, transition: { duration: 0.4 } }} style={{ gap: '2vmin' }}>
      <motion.img src={`${B}qodratak-icon-light.png`} initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}
        style={{ width: '11vmin', height: '11vmin', borderRadius: '2.8vmin', background: C.paper, padding: '0.9vmin', objectFit: 'contain' }} />
      <Greeting size="11vmin" />
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 0.5 }} style={{ fontFamily: display, fontWeight: 900, fontSize: '8vmin', color: '#fff' }}>{f.title}</motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} style={{ fontFamily: body, fontWeight: 600, fontSize: '4vmin', color: C.mint }}>{f.sub}</motion.div>
    </motion.div>
  );
}
function RoleOutro() {
  return (
    <motion.div className="absolute inset-0 overflow-hidden" exit={{ opacity: 0, transition: { duration: 0.4 } }}>
      <motion.div className="absolute rounded-full" style={{ left: '50%', top: '50%', width: '10vmin', height: '10vmin', margin: '-5vmin', background: C.paper }}
        initial={{ scale: 0 }} animate={{ scale: 30 }} transition={{ delay: 0.2, duration: 0.7, ease: [0.7, 0, 0.3, 1] }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center" dir="rtl">
        <motion.img src={`${B}qodratak-logo-transparent.png`} style={{ width: '46vmin' }} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.8, type: 'spring', stiffness: 240, damping: 15 }} />
        <motion.div style={{ fontFamily: display, fontWeight: 800, fontSize: '4vmin', color: C.ink, marginTop: '1vmin' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>الشاشات رسوم توضيحية بلا بيانات حقيقية</motion.div>
      </div>
    </motion.div>
  );
}

export default function RoleFilmTemplate({ role, durations, loop = true, paused = false, muted = false, onSceneChange }: {
  role: Role; durations: Record<string, number>; loop?: boolean; paused?: boolean; muted?: boolean; onSceneChange?: (k: string) => void;
}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop, paused });
  useEffect(() => { onSceneChange?.(currentSceneKey); }, [currentSceneKey, onSceneChange]);
  const base = currentSceneKey.replace(/_r[12]$/, '');
  const clips = ROLE_FILMS[role].clips as Record<string, Clip>;
  const starts = useRef<Record<string, number>>({});
  if (!Object.keys(starts.current).length) { let c = 0; for (const [k, v] of Object.entries(roleDurations(role))) { starts.current[k] = c / 1000; c += v; } }
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastKey = useRef<string | null>(null);
  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    a.volume = 0.5;
    if (paused) { a.pause(); return; }
    if (lastKey.current !== currentSceneKey) {
      lastKey.current = currentSceneKey;
      const t = starts.current[base] ?? 0;
      if (Math.abs(a.currentTime - t) > 0.18) a.currentTime = t;
    }
    a.play().catch(() => {});
  }, [currentSceneKey, base, muted, paused]);

  return (
    <VideoPausedContext.Provider value={paused}>
      <VideoCanvas aspectRatio="16:9" style={{ backgroundColor: C.navy }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 12% 18%, ${C.mint}22, transparent 34%), radial-gradient(circle at 88% 100%, ${C.coral}26, transparent 40%)` }} />
        <AnimatePresence mode="popLayout">
          {base === 'r_intro' ? <RoleIntro key={currentSceneKey} role={role} />
            : base === 'r_outro' ? <RoleOutro key={currentSceneKey} />
            : clips[base] ? <ClipScene key={currentSceneKey} k={base} clip={clips[base]} /> : null}
        </AnimatePresence>
        <audio ref={audioRef} src={`${B}audio/bg_music_full.mp3`} preload="auto" autoPlay muted={muted} />
      </VideoCanvas>
    </VideoPausedContext.Provider>
  );
}
