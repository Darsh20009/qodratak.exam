import { Link } from "wouter";
import { ArrowRight, BookOpen, CheckCircle2, CreditCard, HelpCircle, Target, Zap } from "lucide-react";

const journey = [
  ["التسجيل السريع", "أنشئ حسابك برقم الجوال عبر رمز التحقق الآمن، ثم حدد المسار المناسب: قدرات كمي أو لفظي أو تحصيلي."],
  ["الاختبار التشخيصي", "ابدأ باختبار أولي يوضح مستواك ونقاط القوة والضعف في فروع الاختبار."],
  ["المسار الذكي اليومي", "احصل على خطة يومية مخصصة تشمل أسئلة متدرجة الصعوبة وشروحات فورية لكل سؤال."],
  ["محاكاة الاختبار الفعلي", "تدرّب على نماذج تحاكي توقيت وهيكلة الاختبار مع تحليل واضح لأدائك وتقدير درجتك."],
];

const services = [
  ["بنك أسئلة تفاعلي شامل", "أسئلة مصنفة ومدققة تغطي المهارات الكمية واللفظية، مع شرح يساعدك على فهم طريقة الحل."],
  ["المدرب الذكي", "مساعد يحلل أخطاءك ويقترح استراتيجيات الحل السريع وأنواع التدريب المناسبة لك."],
  ["تقارير أداء دقيقة", "لوحة واضحة لمعدل الدقة وسرعة الحل ونقاط القوة والجوانب التي تحتاج إلى تطوير."],
];

const faqs = [
  ["ما هو اختبار القدرات العامة؟", "اختبار يقيس مهارات التفكير والتحليل والاستدلال اللفظي والكمي اللازمة للمرحلة الجامعية."],
  ["ما الفرق بين القدرات والتحصيلي؟", "القدرات يركز على المهارات العامة، بينما يقيس التحصيلي مدى استيعاب مواد المرحلة الثانوية."],
  ["هل يمكنني التدريب من الجوال؟", "نعم، منصة قدراتك تعمل عبر المتصفحات الحديثة على الجوال والأجهزة اللوحية والكمبيوتر."],
  ["هل توجد باقة مجانية؟", "نعم، يمكنك البدء بالمحتوى والاختبار التشخيصي المجاني، وتظهر تفاصيل أي اشتراك متاح في صفحة الأسعار."],
];

export default function FooterGuidePage() {
  return (
    <div className="min-h-screen bg-[#F7F4EE] text-[#172337]" dir="rtl">
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-black text-[#398B79] hover:text-[#17354A]">
          <ArrowRight className="h-4 w-4" />
          العودة إلى منصة قدراتك
        </Link>
        <header className="rounded-[2rem] bg-[#17354A] p-7 text-white shadow-xl sm:p-12">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#91D7C5] text-[#17354A]">
            <BookOpen className="h-7 w-7" />
          </div>
          <p className="text-sm font-black text-[#91D7C5]">دليل الخدمات وطريقة الاستخدام</p>
          <h1 className="mt-3 text-3xl font-black sm:text-5xl">ابدأ رحلتك في قدراتك بثقة</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-white/75">
            منصة قدرات التعليمية تساعد طلاب الثانوية في السعودية على الاستعداد لاختبارات القدرات والتحصيلي من خلال تدريب منظم، اختبارات محاكية، وتحليل يفهمه الطالب وولي الأمر.
          </p>
        </header>

        <section className="mt-8">
          <div className="mb-5 flex items-center gap-3">
            <Target className="h-6 w-6 text-[#398B79]" />
            <h2 className="text-2xl font-black text-[#17354A]">رحلة الطالب</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {journey.map(([title, description], index) => (
              <article key={title} className="rounded-3xl border border-[#D9E1E5] bg-white p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF2F5] text-lg font-black text-[#398B79]">{index + 1}</div>
                <h3 className="mt-5 font-black text-[#17354A]">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#5E7180]">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-5 flex items-center gap-3">
            <Zap className="h-6 w-6 text-[#FF8A70]" />
            <h2 className="text-2xl font-black text-[#17354A]">الخدمات والميزات</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {services.map(([title, description]) => (
              <article key={title} className="rounded-3xl border border-[#D9E1E5] bg-white p-6 shadow-sm">
                <CheckCircle2 className="h-6 w-6 text-[#398B79]" />
                <h3 className="mt-5 font-black text-[#17354A]">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#5E7180]">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-[#C9D9E0] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-[#398B79]" />
            <h2 className="text-2xl font-black text-[#17354A]">الأسعار ووسائل الدفع</h2>
          </div>
          <p className="mt-4 text-sm leading-8 text-[#5E7180]">تظهر الباقات والأسعار المتاحة في صفحة الأسعار، وتتم المعاملات عند تفعيل الاشتراكات عبر بوابات دفع إلكترونية آمنة تدعم مدى وApple Pay وVisa وMastercard.</p>
          <Link href="/pricing" className="mt-5 inline-flex rounded-xl bg-[#17354A] px-5 py-3 text-sm font-black text-white hover:bg-[#254d65]">عرض الأسعار والاشتراكات</Link>
        </section>

        <section className="mt-12">
          <div className="mb-5 flex items-center gap-3">
            <HelpCircle className="h-6 w-6 text-[#398B79]" />
            <h2 className="text-2xl font-black text-[#17354A]">أسئلة شائعة</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {faqs.map(([question, answer]) => (
              <article key={question} className="rounded-3xl border border-[#D9E1E5] bg-white p-6 shadow-sm">
                <h3 className="font-black text-[#17354A]">{question}</h3>
                <p className="mt-3 text-sm leading-7 text-[#5E7180]">{answer}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
