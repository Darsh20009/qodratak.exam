import { useEffect, useMemo, useState } from 'react';
import { Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Clock3, FileCheck2, Flag, Grid2X2, ListChecks, RotateCcw, Save, Send, ShieldCheck } from 'lucide-react';

type Section = {
  name: string;
  shortName: string;
  type: 'لفظي' | 'كمي';
  range: [number, number];
  description: string;
};

const sections: Section[] = [
  { name: 'استيعاب المقروء', shortName: 'المقروء', type: 'لفظي', range: [1, 24], description: 'اقرأ النص ثم أجب عن الأسئلة المرتبطة به.' },
  { name: 'العلاقات اللفظية', shortName: 'العلاقات', type: 'لفظي', range: [25, 48], description: 'اختر الكلمة أو العلاقة الأكثر اتساقًا.' },
  { name: 'المفردات والسياق', shortName: 'المفردات', type: 'لفظي', range: [49, 72], description: 'استدل من السياق واختر الإجابة الأنسب.' },
  { name: 'الاستدلال الكمي', shortName: 'الاستدلال', type: 'كمي', range: [73, 96], description: 'حلّل المعطيات واختر الناتج الصحيح.' },
  { name: 'المسائل الحسابية', shortName: 'الحساب', type: 'كمي', range: [97, 120], description: 'أجرِ العمليات اللازمة للوصول إلى الحل.' },
];

const passage = 'تتغير المدن باستمرار، لكن بعض المساحات الصغيرة تستطيع أن تصنع فرقًا كبيرًا في حياة سكانها. فالحديقة القريبة ليست مكانًا للراحة فحسب؛ إنها مساحة يلتقي فيها الجيران، ويتعلم فيها الأطفال مراقبة الطبيعة، ويجد فيها المارّ فرصة لالتقاط أنفاسه. وتزداد قيمة هذه المساحات حين تُصمَّم لتناسب من يستخدمونها فعلًا، لا لتكون مجرد صورة جميلة.';
const verbalPrompts = [
  ['علاقة «الكتاب» بـ«القراءة» تشبه علاقة «المفتاح» بـ:', 'الباب', 'الفتح', 'المعدن', 'الجيب'],
  ['أكمل العبارة: ازداد وضوح الفكرة حين أضاف الكاتب مثالًا ...', 'غامضًا', 'مناسبًا', 'بعيدًا', 'متأخرًا'],
  ['أقرب معنى لكلمة «يقتصد» في سياق: يقتصد في استخدام الماء:', 'يؤجل', 'يرشد', 'يمنع', 'يكرر'],
  ['أي الكلمات تختلف عن بقية المجموعة؟', 'مقياس', 'مسطرة', 'ميزان', 'نافذة'],
  ['اختر الكلمة التي تكمل النمط: هادئ، أكثر هدوءًا، ...', 'الأهدأ', 'الهادئ', 'هدوء', 'يهدأ'],
];
const quantitativePrompts = [
  ['إذا كان ثمن ٣ دفاتر ١٨ ريالًا، فكم ثمن ٥ دفاتر بالسعر نفسه؟', '٢٤', '٢٧', '٣٠', '٣٦'],
  ['عدد إذا أضيف إليه ٧ أصبح ٢٢. ما العدد؟', '١٣', '١٤', '١٥', '١٦'],
  ['قطعت حافلة ١٢٠ كيلومترًا في ساعتين. ما متوسط سرعتها؟', '٤٠ كم/س', '٥٠ كم/س', '٦٠ كم/س', '٧٠ كم/س'],
  ['ما العدد التالي في النمط: ٤، ٨، ١٦، ٣٢، ...؟', '٤٠', '٤٨', '٦٠', '٦٤'],
  ['مستطيل طوله ٩ سم وعرضه ٤ سم. ما محيطه؟', '١٣ سم', '٢٦ سم', '٣٦ سم', '٤٠ سم'],
];
const letters = ['أ', 'ب', 'ج', 'د'];

function questionCopy(number: number, section: Section) {
  if (section.name === 'استيعاب المقروء') {
    const prompts = [
      'وفقًا للنص، ما إحدى فوائد الحديقة القريبة؟',
      'ما الذي يرفع قيمة المساحات الصغيرة بحسب الكاتب؟',
      'ما الفكرة الرئيسة التي يدور حولها النص؟',
      'يمكن فهم عبارة «التقاط أنفاسه» على أنها:',
      'أي وصف ينسجم مع موقف الكاتب من الحدائق؟',
    ];
    return { prompt: prompts[(number - 1) % prompts.length], choices: ['تعزيز التواصل والراحة', 'زيادة سرعة التنقل', 'تقليل مساحة الأحياء', 'استبدال الطرق بالمباني'] };
  }
  const pool = section.type === 'كمي' ? quantitativePrompts : verbalPrompts;
  const row = pool[(number + Math.floor(number / 4)) % pool.length];
  return { prompt: row[0], choices: row.slice(1) };
}

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return [hours, minutes, secs].map((value) => String(value).padStart(2, '0')).join(':');
}

export default function PaperSimulator() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [activeSection, setActiveSection] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState(1);
  const [flagged, setFlagged] = useState<number[]>([]);
  const [remaining, setRemaining] = useState(2 * 60 * 60 + 47 * 60 + 18);
  const [saved, setSaved] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const answeredCount = Object.keys(answers).length;
  const active = sections[activeSection];
  const sectionQuestions = useMemo(() => Array.from({ length: 24 }, (_, index) => active.range[0] + index), [active]);

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining((time) => Math.max(0, time - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (saved) return;
    const timeout = window.setTimeout(() => setSaved(true), 700);
    return () => window.clearTimeout(timeout);
  }, [answers, flagged, saved]);

  const goToQuestion = (number: number) => {
    const sectionIndex = sections.findIndex((item) => number >= item.range[0] && number <= item.range[1]);
    setActiveSection(sectionIndex);
    setActiveQuestion(number);
    document.getElementById(`question-${number}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const chooseAnswer = (number: number, choice: number) => {
    if (submitted) return;
    setAnswers((current) => {
      if (current[number] === choice) {
        const next = { ...current };
        delete next[number];
        return next;
      }
      return { ...current, [number]: choice };
    });
    setSaved(false);
  };

  const toggleFlag = (number: number) => {
    setFlagged((current) => current.includes(number) ? current.filter((item) => item !== number) : [...current, number]);
    setSaved(false);
  };

  const chooseSection = (index: number) => {
    setActiveSection(index);
    setActiveQuestion(sections[index].range[0]);
    document.getElementById(`section-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div dir="rtl" className="paper-simulator min-h-screen bg-[#eee9df] text-[#342f2a]">
      <style>{`
        .paper-simulator { font-family: "Tajawal", "Noto Sans Arabic", sans-serif; }
        .paper-simulator * { box-sizing: border-box; }
        .paper-scroll::-webkit-scrollbar { width: 9px; }
        .paper-scroll::-webkit-scrollbar-track { background: #eee9df; }
        .paper-scroll::-webkit-scrollbar-thumb { background: #d2c9bd; border: 2px solid #eee9df; border-radius: 10px; }
        .paper-grain { background-image: radial-gradient(rgba(105,87,68,.055) .65px, transparent .65px); background-size: 7px 7px; }
        @media (max-width: 1023px) { .paper-desktop { display: none !important; } .paper-mobile-warning { display: flex !important; } }
      `}</style>
      <div className="paper-mobile-warning hidden min-h-screen flex-col items-center justify-center px-8 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff7ef] text-[#df714d] shadow-sm"><RotateCcw size={28} /></div>
        <p className="mb-2 text-xs font-bold tracking-[.22em] text-[#d97755]">قدراتك · محاكاة ورقية</p>
        <h1 className="mb-3 text-2xl font-extrabold">هذه التجربة تحتاج مساحة أوسع</h1>
        <p className="max-w-sm text-sm leading-7 text-[#716960]">لأفضل قراءة واستخدام لورقة التظليل، افتح المحاكاة على حاسوب أو جهاز آيباد بالوضع الأفقي.</p>
        <div className="mt-8 flex items-center gap-2 rounded-full border border-[#dfd4c7] bg-[#f6f2eb] px-4 py-2 text-xs text-[#716960]"><Grid2X2 size={14} /> العرض متاح من ١٠٢٤ بكسل فما فوق</div>
      </div>

      <div className="paper-desktop flex min-h-screen flex-col">
        <header className="z-20 flex h-[76px] shrink-0 items-center justify-between border-b border-[#e4ddd3] bg-[#faf8f3] px-7 shadow-[0_2px_12px_rgba(65,51,35,.035)]">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e87c57] text-white"><FileCheck2 size={20} /></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-extrabold tracking-tight">محاكاة الاختبار الورقي</span>
                <span className="h-1 w-1 rounded-full bg-[#d4c9bc]" />
                <span className="text-xs text-[#8f8579]">النموذج التدريبي ٠١</span>
              </div>
              <p className="mt-0.5 text-[11px] text-[#988e83]">تجربة تدريبية · ١٢٠ سؤالًا · غير رسمية</p>
            </div>
          </div>
          <div className="flex items-center gap-7">
            <div className="flex items-center gap-2 text-xs text-[#7e776e]" aria-live="polite">
              <span className={`h-2 w-2 rounded-full ${saved ? 'bg-[#7b9b79]' : 'animate-pulse bg-[#de9468]'}`} />
              <span>{saved ? 'تم الحفظ محليًا' : 'جارٍ الحفظ'}</span>
              <Save size={14} className="text-[#a39a8f]" />
            </div>
            <div className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 ${remaining < 300 ? 'border-[#edb9a8] bg-[#fff0eb] text-[#b95138]' : 'border-[#e8dfd4] bg-white text-[#4c453d]'}`}>
              <Clock3 size={17} className="text-[#dc7955]" />
              <span className="font-mono text-[16px] font-bold tracking-[.08em]" dir="ltr">{formatTime(remaining)}</span>
              <span className="text-[10px] text-[#92877c]">الوقت المتبقي</span>
            </div>
            <button onClick={() => setShowConfirm(true)} disabled={submitted} className="flex items-center gap-2 rounded-xl bg-[#e47a55] px-4 py-2.5 text-xs font-bold text-white shadow-[0_3px_8px_rgba(196,97,66,.16)] transition hover:bg-[#d96947] disabled:opacity-60">
              <Send size={14} /> تسليم الاختبار
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <main className="paper-scroll min-w-0 flex-1 overflow-y-auto px-7 py-7">
            <div className="mx-auto max-w-[900px]">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="mb-1 text-[11px] font-bold tracking-[.13em] text-[#c66f51]">كتيّب الأسئلة</p>
                  <h1 className="text-[21px] font-extrabold">اختبار القدرات العامة <span className="text-[#a99c8d]">/</span> تدريب</h1>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-[#ded5c9] bg-[#f7f3ec] px-3 py-1.5 text-[11px] text-[#81776c]">
                  <ShieldCheck size={14} className="text-[#7d9a78}" /> إجاباتك محفوظة على هذا الجهاز
                </div>
              </div>

              <div className="mb-5 grid grid-cols-5 gap-2.5">
                {sections.map((section, index) => {
                  const count = Array.from({ length: 24 }, (_, i) => section.range[0] + i).filter((num) => answers[num] !== undefined && answers[num] >= 0).length;
                  return <button key={section.name} onClick={() => chooseSection(index)} className={`group flex min-h-[72px] items-center justify-between rounded-xl border px-3.5 text-right transition ${activeSection === index ? 'border-[#e8a186] bg-[#fff7f2] shadow-[0_3px_10px_rgba(111,79,58,.06)]' : 'border-[#e3dacf] bg-[#f8f5ef] hover:border-[#d7b19e]'}`}>
                    <div>
                      <div className="mb-1 flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold ${section.type === 'لفظي' ? 'text-[#bc735b]' : 'text-[#788c73]'}`}>{section.type}</span>
                        <span className="text-[9px] text-[#aa9e91]">{String(section.range[0]).padStart(2, '٠')}–{String(section.range[1]).replace(/\d/g, (digit) => '٠١٢٣٤٥٦٧٨٩'[Number(digit)])}</span>
                      </div>
                      <p className={`text-[12px] font-bold ${activeSection === index ? 'text-[#493a31]' : 'text-[#71685f]'}`}>{section.shortName}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-[#9c9083]">{count}<span className="text-[#c1b6a9">/٢٤</span></span>
                  </button>;
                })}
              </div>

              <div className="mb-4 flex items-center justify-between rounded-xl border border-[#e5ddd2] bg-[#f8f5ef] px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0e5d9] text-[#bd7656]"><ListChecks size={16} /></span>
                  <div><p className="text-xs font-bold">{active.name}</p><p className="mt-0.5 text-[10px] text-[#92877b]">{active.description}</p></div>
                </div>
                <div className="text-left text-[10px] text-[#9a9085]"><span className="font-semibold text-[#6e645a]">{active.range[0]}—{active.range[1]}</span><span className="mr-1">من ١٢٠</span></div>
              </div>

              {activeSection === 0 && <article className="paper-grain mb-4 rounded-xl border border-[#e7ded2] bg-[#fffdf8] px-7 py-5 shadow-[0_2px_8px_rgba(70,53,34,.035)]">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-[.14em] text-[#c98162]">نص القراءة · تدريب</span>
                  <span className="rounded-full bg-[#f4eee5] px-2.5 py-1 text-[9px] text-[#918579]">الأسئلة ١–٢٤</span>
                </div>
                <p className="text-[13px] leading-[2.15] text-[#51483f]">{passage}</p>
              </article>}

              {sectionQuestions.map((number, index) => {
                const question = questionCopy(number, active);
                const answered = answers[number] !== undefined && answers[number] >= 0;
                return <article id={`question-${number}`} key={number} onMouseEnter={() => setActiveQuestion(number)} className={`mb-3 scroll-mt-5 rounded-xl border bg-[#fffdf9] px-5 py-[18px] shadow-[0_2px_8px_rgba(70,53,34,.025)] transition ${activeQuestion === number ? 'border-[#e9b29b]' : 'border-[#e5ddd2]'}`}>
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className={`flex h-7 min-w-7 items-center justify-center rounded-lg px-1 text-[11px] font-bold ${answered ? 'bg-[#eaf0e8] text-[#65805e]' : 'bg-[#f1ebe2] text-[#80766b]'}`}>{String(number).replace(/\d/g, (digit) => '٠١٢٣٤٥٦٧٨٩'[Number(digit)])}</span>
                      <div>
                        <span className="mb-1 block text-[9px] font-bold text-[#b3836e]">سؤال {index + 1} من ٢٤</span>
                        <h2 className="text-[13px] font-bold leading-6 text-[#453e37]">{question.prompt}</h2>
                      </div>
                    </div>
                    <button onClick={() => toggleFlag(number)} aria-label={flagged.includes(number) ? 'إزالة علامة المراجعة' : 'وضع علامة للمراجعة'} className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${flagged.includes(number) ? 'bg-[#fff0e7] text-[#dd7952]' : 'text-[#b5aa9d] hover:bg-[#f7f1e8] hover:text-[#bb795e]'}`}><Flag size={15} fill={flagged.includes(number) ? 'currentColor' : 'none'} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pr-10">
                    {question.choices.map((choice, choiceIndex) => <button key={`${number}-${choiceIndex}`} onClick={() => chooseAnswer(number, choiceIndex)} aria-pressed={answers[number] === choiceIndex} className={`flex min-h-[42px] items-center gap-2.5 rounded-lg border px-3 text-right transition ${answers[number] === choiceIndex ? 'border-[#df8968] bg-[#fff5ef] text-[#754a39]' : 'border-[#eee8df] bg-[#fdfbf7] text-[#696158] hover:border-[#dbc7b5] hover:bg-[#fbf6ee]'}`}>
                      <span className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${answers[number] === choiceIndex ? 'border-[#dc805f] bg-[#e77b56] text-white' : 'border-[#d7cfc4] bg-white text-[#9a8f83]'}`}>{letters[choiceIndex]}</span>
                      <span className="text-[11px] leading-5">{choice}</span>
                    </button>)}
                  </div>
                </article>;
              })}

              <div className="flex items-center justify-between rounded-xl border border-[#e4dacf] bg-[#f8f4ed] px-4 py-3">
                <button disabled={activeSection === 0} onClick={() => chooseSection(Math.max(0, activeSection - 1))} className="flex items-center gap-1 text-xs font-bold text-[#8c8175] hover:text-[#c66f51] disabled:opacity-40"><ChevronRight size={16} /> القسم السابق</button>
                <span className="text-[10px] text-[#a09589]">يمكنك التنقل بين الأقسام في أي وقت</span>
                <button disabled={activeSection === 4} onClick={() => chooseSection(Math.min(4, activeSection + 1))} className="flex items-center gap-1 text-xs font-bold text-[#8c8175] hover:text-[#c66f51] disabled:opacity-40">القسم التالي <ChevronLeft size={16} /></button>
              </div>
            </div>
          </main>

          <aside className="w-[334px] shrink-0 border-r border-[#e2d9ce] bg-[#f8f5ef] px-5 py-6">
            <div className="sticky top-6">
              <div className="mb-5 flex items-start justify-between">
                <div><p className="mb-1 text-[10px] font-bold tracking-[.12em] text-[#c47a5c]">نموذج الإجابة</p><h2 className="text-[17px] font-extrabold">ورقة التظليل</h2></div>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e5dbce] bg-[#fffdf8] text-[#a68c77]"><Grid2X2 size={16} /></span>
              </div>
              <div className="mb-4 rounded-xl border border-[#e5dacf] bg-[#fffdf8] p-3.5">
                <div className="mb-2 flex items-center justify-between text-[10px] text-[#8e8378]">
                  <span>الإجابات المكتملة</span><span className="font-bold text-[#51483f]">{answeredCount} <span className="font-normal text-[#a79b8d">من ١٢٠</span></span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#eee8df]"><div className="h-full rounded-full bg-[#e78a67] transition-all duration-300" style={{ width: `${(answeredCount / 120) * 100}%` }} /></div>
                <div className="mt-2.5 flex justify-between text-[9px] text-[#a0968a]"><span>المراجعة: {flagged.length}</span><span>المتبقي: {120 - answeredCount}</span></div>
              </div>
              <div className="mb-3 grid grid-cols-3 gap-2 text-[9px] text-[#8d8378]">
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full border border-[#d2c9be] bg-white" /> بلا إجابة</span>
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full border border-[#7e9a78] bg-[#eaf0e8]" /> تمت الإجابة</span>
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full border border-[#dc8965] bg-[#fff0e7]" /> للمراجعة</span>
              </div>
              <div className="paper-scroll max-h-[calc(100dvh-305px)] space-y-2 overflow-y-auto pl-1">
                {sections.map((section, sectionIndex) => <section key={section.name} id={`section-${sectionIndex}`} className={`rounded-xl border p-3 transition ${activeSection === sectionIndex ? 'border-[#e8c0ad] bg-[#fffaf5]' : 'border-[#e8e0d6] bg-[#f5f1ea]'}`}>
                  <button onClick={() => chooseSection(sectionIndex)} className="mb-2.5 flex w-full items-center justify-between text-right">
                    <span className="flex items-center gap-2"><i className={`h-1.5 w-1.5 rounded-full ${section.type === 'لفظي' ? 'bg-[#d58b70]' : 'bg-[#84947c]'}`} /><span className="text-[10px] font-bold text-[#6c6258]">{section.name}</span></span>
                    <span className="flex items-center gap-1 text-[9px] text-[#a0968a]">{section.range[0]}–{section.range[1]} <ChevronDown size={12} /></span>
                  </button>
                  <div className="grid grid-cols-6 gap-1.5">
                    {Array.from({ length: 24 }, (_, index) => {
                      const number = section.range[0] + index;
                      const current = number === activeQuestion;
                      const answered = answers[number] !== undefined && answers[number] >= 0;
                      const isFlagged = flagged.includes(number);
                      return <button key={number} onClick={() => goToQuestion(number)} aria-label={`السؤال ${number}${answered ? ' تمت الإجابة' : ' بلا إجابة'}`} aria-current={current ? 'step' : undefined} className={`relative flex h-[34px] items-center justify-center rounded-lg border text-[10px] font-semibold transition hover:-translate-y-px ${current ? 'border-[#de8562] bg-[#e77b56] text-white shadow-[0_2px_5px_rgba(197,102,69,.18)]' : isFlagged ? 'border-[#dfaa8e] bg-[#fff0e7] text-[#b45f43]' : answered ? 'border-[#c1d1bc] bg-[#eaf0e8] text-[#668061]' : 'border-[#e5ddd3] bg-[#fffdf9] text-[#8d8378] hover:border-[#dfbaa7]'}`}>
                        {String(number).replace(/\d/g, (digit) => '٠١٢٣٤٥٦٧٨٩'[Number(digit)])}
                        {isFlagged && !current && <i className="absolute left-1 top-1 h-1 w-1 rounded-full bg-[#d77d59]" />}
                        {answered && !current && !isFlagged && <Check size={9} className="absolute left-0.5 top-0.5 text-[#779070]" />}
                      </button>;
                    })}
                  </div>
                </section>)}
              </div>
              <div className="mt-4 rounded-xl border border-[#e5dacf] bg-[#f3eee6] px-3 py-2.5 text-[9px] leading-5 text-[#958a7d]">
                <span className="font-bold text-[#82766a]">تلميح:</span> اضغط رقم السؤال للانتقال إليه، ثم اختر دائرة الإجابة على صفحة الأسئلة. يمكن التحديد بالماوس أو قلم الشاشة.
              </div>
              <button onClick={() => setShowConfirm(true)} disabled={submitted} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#e47a55] py-3 text-xs font-bold text-white transition hover:bg-[#d96947] disabled:opacity-60"><CheckCircle2 size={15} /> مراجعة وتسليم الاختبار</button>
            </div>
          </aside>
        </div>
      </div>

      {showConfirm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#352b24]/35 p-5 backdrop-blur-[2px]" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowConfirm(false); }}>
        <div dir="rtl" role="dialog" aria-modal="true" aria-labelledby="submit-title" className="w-full max-w-[420px] rounded-2xl border border-[#e7ddd1] bg-[#fffdf8] p-6 shadow-[0_18px_55px_rgba(55,41,28,.2)]">
          {submitted ? <div className="py-3 text-center">
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#eaf0e8] text-[#688665]"><CheckCircle2 size={23} /></span>
            <h2 id="submit-title" className="mb-2 text-lg font-extrabold">تم تسليم المحاكاة</h2>
            <p className="mb-5 text-sm leading-6 text-[#81776c]">هذه تجربة تدريبية محلية. إجاباتك محفوظة في هذه الصفحة فقط.</p>
            <button onClick={() => setShowConfirm(false)} className="rounded-xl bg-[#e47a55] px-5 py-2.5 text-xs font-bold text-white">العودة إلى الكتيّب</button>
          </div> : <>
            <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff1e8] text-[#d87753]"><Send size={18} /></span>
            <h2 id="submit-title" className="mb-1 text-lg font-extrabold">هل تريد تسليم الاختبار؟</h2>
            <p className="mb-5 text-xs leading-6 text-[#877c70]">بعد التسليم لن تتمكن من تعديل الإجابات. هذه المحاكاة لا ترسل أي بيانات إلى خادم.</p>
            <div className="mb-5 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-[#f6f1e9] p-3"><span className="block text-[10px] text-[#9b9083]">تمت الإجابة</span><strong className="mt-1 block text-[18px]">{answeredCount}<small className="mr-1 text-[10px] font-normal text-[#a39789]">من ١٢٠</small></strong></div>
              <div className="rounded-xl bg-[#f6f1e9] p-3"><span className="block text-[10px] text-[#9b9083]">بلا إجابة</span><strong className="mt-1 block text-[18px]">{120 - answeredCount}<small className="mr-1 text-[10px] font-normal text-[#a39789]">سؤال</small></strong></div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowConfirm(false)} className="rounded-xl border border-[#e4dbd0] px-4 py-2.5 text-xs font-bold text-[#72685e] hover:bg-[#f8f4ed]">متابعة الحل</button>
              <button onClick={() => { setSubmitted(true); setShowConfirm(true); }} className="rounded-xl bg-[#e47a55] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#d96947]">تسليم الآن</button>
            </div>
          </>}
        </div>
      </div>}
    </div>
  );
}
