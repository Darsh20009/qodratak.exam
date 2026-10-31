import { getQuestionImageUrls } from "../lib/questionImages";
import { resolveFoundationAssetUrl } from "../lib/foundationVideoUrl";
import { shouldHideImageBackedQuantitativeQuestionText } from "../lib/questionTextVisibility";

export interface PrintableModelQuestion {
  id: number | string;
  category?: string;
  text?: string;
  options?: string[];
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  isTrial?: boolean;
  correctOptionIndex?: number;
  correctOption?: number;
}

const optionLetters = ["أ", "ب", "ج", "د", "هـ"];
const sectionNames = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس"];
const arabicNumber = (number: number) => number.toLocaleString("ar-SA");
const readModelNumber = (name: string) => {
  const numberText = name.match(/[0-9٠-٩۰-۹]+/)?.[0];
  if (!numberText) return 1;
  const normalized = numberText.replace(/[٠-٩۰-۹]/g, (digit) => {
    const code = digit.charCodeAt(0);
    const zeroCode = code >= "٠".charCodeAt(0) && code <= "٩".charCodeAt(0)
      ? "٠".charCodeAt(0)
      : "۰".charCodeAt(0);
    return String(code - zeroCode);
  });
  const modelNumber = Number(normalized);
  return Number.isSafeInteger(modelNumber) && modelNumber > 0 ? modelNumber : 1;
};

const escapeHtml = (value: unknown) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

function page(content: string, className = "") {
  return `<section class="sheet ${className}">${content}</section>`;
}

function makeBubbleSheet(questions: PrintableModelQuestion[], examName: string, solved: boolean) {
  const perPage = 120;
  const totalPages = Math.ceil(questions.length / perPage);
  return Array.from({ length: totalPages }, (_, pageIndex) => {
    const start = pageIndex * perPage;
    const items = questions.slice(start, start + perPage);
    const columns = Array.from({ length: 5 }, (_, columnIndex) => {
      const columnQuestions = items.slice(columnIndex * 24, (columnIndex + 1) * 24);
      return `<div class="bubble-column">${columnQuestions.map((question, rowIndex) => {
        const questionNumber = start + columnIndex * 24 + rowIndex + 1;
        const correctIndex = question.correctOptionIndex ?? question.correctOption;
        return `<div class="bubble-row">
          <span class="bubble-number">${arabicNumber(questionNumber)}</span>
          <div class="bubble-options">${optionLetters.slice(0, Math.max(2, Math.min(5, question.options?.length || 4))).map((letter, optionIndex) =>
            `<span class="bubble ${solved && correctIndex === optionIndex ? "filled" : ""}">${letter}</span>`,
          ).join("")}</div>
        </div>`;
      }).join("")}</div>`;
    }).join("");
    return page(`<header class="running-head"><span>قدراتك</span><span>ورقة الإجابة ${solved ? "المحلولة" : "الفارغة"}</span></header>
      <h1 class="sheet-title">${escapeHtml(examName)}</h1>
      <div class="student-lines">
        <span>اسم الطالب: <i></i></span><span>رقم الهوية: <i></i></span><span>التاريخ: <i></i></span>
      </div>
      <div class="bubble-instructions">ظلّل دائرة واحدة أمام رقم السؤال بقلم رصاص. لا تضع علامة خارج الدائرة.</div>
      <div class="bubble-grid">${columns}</div>
      <div class="answer-note">ملاحظات لجنة الاختبار</div>
      <footer class="sheet-foot">الأسئلة ${arabicNumber(start + 1)}–${arabicNumber(start + items.length)} من ${arabicNumber(questions.length)} · صفحة ${arabicNumber(pageIndex + 1)} من ${arabicNumber(totalPages)}</footer>`, "answer-sheet");
  }).join("");
}

function makeSections(questions: PrintableModelQuestion[]) {
  const count = Math.min(5, questions.length);
  return Array.from({ length: count }, (_, index) => {
    const start = Math.floor(index * questions.length / count);
    const end = Math.floor((index + 1) * questions.length / count);
    return {
      number: index + 1,
      start,
      end,
      questions: questions.slice(start, end),
    };
  });
}

export function getPaperModelPrintPageCount(questionCount: number) {
  if (!Number.isSafeInteger(questionCount) || questionCount < 1) return 0;
  const sectionCount = Math.min(5, questionCount);
  let questionPageCount = 0;
  for (let index = 0; index < sectionCount; index += 1) {
    const start = Math.floor(index * questionCount / sectionCount);
    const end = Math.floor((index + 1) * questionCount / sectionCount);
    questionPageCount += Math.ceil((end - start) / 12);
  }
  return 1 + Math.ceil(questionCount / 120) + 1 + questionPageCount;
}

function makeQuestionPages(questions: PrintableModelQuestion[], offset: number, sectionNumber: number) {
  const perPage = 12;
  const pages: string[] = [];
  for (let start = 0; start < questions.length; start += perPage) {
    const batch = questions.slice(start, start + perPage);
    const cards = batch.map((question, localIndex) => {
      const number = offset + start + localIndex + 1;
      const images = getQuestionImageUrls(question);
      const hideText = shouldHideImageBackedQuantitativeQuestionText(question);
      const options = Array.isArray(question.options) ? question.options : [];
      const questionLength = String(question.text ?? "").length;
      const densityClass = questionLength > 600 ? "very-long-question" : questionLength > 320 ? "long-question" : "";
      const imageClass = images.length > 2 ? "many-images" : images.length > 1 ? "multiple-images" : "";
      return `<article class="question-card ${densityClass} ${imageClass}">
        <div class="question-heading"><b>${arabicNumber(number)}</b><span>س${arabicNumber(number)}:</span></div>
        ${!hideText && question.text ? `<p class="question-copy">${escapeHtml(question.text)}</p>` : ""}
        ${images.map((url) => `<img class="question-image" src="${escapeHtml(resolveFoundationAssetUrl(url))}" alt="صورة السؤال ${number}" loading="eager">`).join("")}
        <div class="option-grid">${options.map((option, optionIndex) => `<div class="option"><b>${optionLetters[optionIndex] ?? optionIndex + 1}</b><span>${escapeHtml(option)}</span></div>`).join("")}</div>
      </article>`;
    }).join("");
    pages.push(page(`<header class="running-head"><span>قدراتك · اختبار القدرات العامة</span><span>القسم ${sectionNumber}</span></header>
      <div class="question-grid">${cards}</div>
      <footer class="sheet-foot">الأسئلة ${arabicNumber(offset + start + 1)}–${arabicNumber(offset + start + batch.length)}</footer>`, "question-page"));
  }
  return pages.join("");
}

export function createPaperModelPrintHtml(
  questions: PrintableModelQuestion[],
  examName: string,
  mode: "exam" | "solved-answers" = "exam",
) {
  const safeName = escapeHtml(examName);
  const appBasePath = import.meta.env?.BASE_URL || "/";
  const modelNumber = readModelNumber(examName);
  const pages: string[] = [];

  if (mode === "solved-answers") {
    pages.push(makeBubbleSheet(questions, examName, true));
  } else {
    pages.push(page(`<div class="cover-brand">
        <img class="cover-logo" src="${appBasePath}qodratak-logo-transparent.png" alt="قدراتك">
        <span class="cover-brand-name">منصة قدراتك التعليمية</span>
      </div>
      <div class="cover-title-block">
        <h1 class="cover-title">اختبار القدرات العامة</h1>
        <p class="cover-subtitle">اختبار محاكي ${arabicNumber(modelNumber)}</p>
        <p class="cover-model-name">${safeName}</p>
      </div>
      <div class="cover-meta"><span>عدد الأسئلة <b>${arabicNumber(questions.length)}</b></span><span>خمسة أقسام</span></div>
      <div class="cover-declaration">
        <h2>إقرار وتعهد</h2>
        <p>أقرّ بأنني اطلعت على عدد صفحات الاختبار، وأتعهد بالإجابة بنفسي وعدم استخدام أي وسيلة غير مسموح بها.</p>
        <p>ألتزم بتظليل إجابة واحدة أمام رقم السؤال المطابق في ورقة الإجابة.</p>
        <div class="cover-student">
          <span>الاسم</span><i></i><span>التوقيع</span><i></i><span>التاريخ</span><i></i>
        </div>
      </div>
      <div class="cover-footer">منصة قدراتك التعليمية</div>
      <div class="cover-rule"></div>`, "cover"));

    pages.push(makeBubbleSheet(questions, examName, false));

    const sections = makeSections(questions);
    pages.push(page(`<header class="running-head"><span>قدراتك</span><span>${safeName} · دليل الاختبار</span></header>
      <h1 class="sheet-title">أقسام الاختبار وتعليماته</h1>
      <div class="sections-overview">${sections.map((section) => {
        const first = section.start + 1;
        const last = section.end;
        const minutes = Math.max(1, Math.round(section.questions.length * 26 / 24));
        return `<article class="section-overview-row">
          <strong>القسم ${sectionNames[section.number - 1]}</strong>
          <span>الأسئلة ${arabicNumber(first)}–${arabicNumber(last)}</span>
          <span>${arabicNumber(section.questions.length)} سؤالًا</span>
          <span>${arabicNumber(minutes)} دقيقة</span>
        </article>`;
      }).join("")}</div>
      <div class="section-instructions"><h2>تذكّر</h2>
        <ul><li>لكل سؤال إجابة صحيحة واحدة.</li><li>ظلّل إجابتك أمام رقم السؤال المطابق في ورقة الإجابة.</li></ul>
      </div>`, "sections-summary-page"));

    sections.forEach((section) => {
      pages.push(makeQuestionPages(section.questions, section.start, section.number));
    });
  }

    return `<!doctype html>
  <html lang="ar" dir="rtl"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${mode === "exam" ? "اختبار" : "ورقة إجابة محلولة"}_${safeName}</title>
    <style>
      @page { size: A4 portrait; margin: 0; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: #e8edf0; color: #172d3b; font-family: "Tajawal", "Arial", sans-serif; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .sheet { position: relative; width: 210mm; height: 297mm; margin: 8mm auto; padding: 14mm 15mm; background: #fff; overflow: hidden; page-break-after: always; break-after: page; }
      .sheet:last-child { page-break-after: auto; break-after: auto; }
      .running-head { display:flex; justify-content:space-between; align-items:center; color:#176e91; font-weight:800; font-size:11pt; border-bottom:1px solid #b6d9e5; padding-bottom:5mm; }
      .sheet-title { text-align:center; font-size:19pt; margin:12mm 0 8mm; color:#164c68; }
      .cover { display:flex; flex-direction:column; padding:17mm 15mm 20mm; background:linear-gradient(140deg,#fff 0 72%,#edf7fa 72%); }
      .cover:before { content:""; position:absolute; z-index:0; left:0; top:0; width:23mm; height:155mm; background:#0878b9; clip-path:polygon(0 0,100% 50%,0 100%); }
      .cover:after { content:""; position:absolute; z-index:0; left:-31mm; top:95mm; width:64mm; height:64mm; border:6mm solid #d5a500; border-radius:50%; }
      .cover > *:not(.cover-rule) { position:relative; z-index:1; }
      .cover-brand { display:flex; align-items:center; justify-content:space-between; min-height:34mm; }
      .cover-brand-name { color:#806443; font-weight:800; font-size:14pt; }
      .cover-logo { width:39mm; height:30mm; object-fit:contain; align-self:flex-start; margin:0 0 4mm; }
      .cover-title-block { text-align:center; margin:27mm 0 12mm; }
      .cover-kicker { color:#9a7546; font-size:15pt; font-weight:800; margin:0 0 4mm; }
      .cover-title { color:#126eaa; font-size:31pt; line-height:1.35; margin:0; }
      .cover-subtitle { font-size:19pt; color:#111; font-weight:800; margin:2mm 0; }
      .cover-model-name { font-size:12pt; color:#5a6570; margin:1mm 0 0; }
      .cover-meta { display:flex; justify-content:center; gap:8mm; margin:0 0 7mm; }
      .cover-meta span { border:1px solid #b7d5df; border-radius:2mm; padding:4mm 7mm; background:#f4fbfd; }
      .cover-declaration { margin-top:auto; padding:7mm 10mm; border:1.2px solid #5faec8; border-radius:4mm; font-size:12pt; line-height:1.8; background:#fff; }
      .cover-declaration h2 { color:#9a7546; text-align:center; font-size:15pt; margin:0 0 2mm; }
      .cover-declaration p { margin:1mm 0; }
      .cover-student { display:grid; grid-template-columns:auto 1fr auto 1fr auto 1fr; align-items:end; gap:3mm; margin-top:4mm; font-size:10pt; font-weight:700; }
      .cover-student i { display:block; border-bottom:1px dotted #617984; min-height:7mm; }
      .cover-footer { color:#176e91; font-weight:800; text-align:center; margin-top:4mm; }
      .cover-rule { position:absolute; bottom:0; right:0; height:5mm; width:100%; margin:0; background:linear-gradient(to bottom,#d4a000 0 1.5mm,#0878b9 1.5mm 5mm); }
      .sections-summary-page .sheet-title { margin:10mm 0 12mm; }
      .sections-overview { display:grid; gap:5mm; }
      .section-overview-row { display:grid; grid-template-columns:1.2fr 1.5fr 1fr 1fr; align-items:center; gap:3mm; min-height:22mm; padding:4mm 5mm; border:1px solid #9fcbd8; border-radius:2mm; color:#173d50; background:#f5fbfd; font-size:11pt; }
      .section-overview-row strong { color:#0878b9; font-size:13pt; }
      .section-instructions { margin-top:12mm; padding:7mm 9mm; border-right:3px solid #1681a8; background:#edf7fa; font-size:12pt; line-height:1.8; }
      .section-instructions h2 { margin:0 0 3mm; color:#9a7546; }
      .section-instructions ul { margin:0; padding-right:7mm; }
      .sheet-foot { position:absolute; bottom:10mm; left:15mm; right:15mm; text-align:center; color:#52707d; font-size:10pt; border-top:1px solid #c4d6dc; padding-top:4mm; }
      .answer-sheet { padding:12mm 13mm; }
      .answer-sheet .sheet-title { margin:6mm 0; }
      .student-lines { display:grid; grid-template-columns:1.3fr 1fr 1fr; gap:6mm; font-size:10pt; }
      .student-lines span { display:flex; gap:2mm; align-items:end; }
      .student-lines i { flex:1; border-bottom:1px solid #768d97; height:7mm; }
      .bubble-instructions { margin:7mm 0; padding:4mm; background:#edf7fa; border-right:3px solid #1681a8; font-size:10pt; }
      .bubble-grid { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:2mm; height:175mm; align-content:stretch; }
      .bubble-column { display:grid; grid-template-rows:repeat(24,minmax(0,1fr)); height:100%; border:1px solid #8fc5d5; border-radius:2mm; overflow:hidden; }
      .bubble-row { min-height:0; border-bottom:1px solid #d1e5eb; padding:0.4mm; display:flex; align-items:center; gap:0.5mm; }
      .bubble-number { min-width:6mm; text-align:center; font-size:6.2pt; font-weight:800; }
      .bubble-options { display:flex; justify-content:space-between; gap:0.4mm; flex:1; }
      .bubble { width:4.4mm; height:4.4mm; display:grid; place-items:center; border:1px solid #2887a5; border-radius:50%; color:#176e91; font-size:5.7pt; }
      .bubble.filled { color:#fff; background:#176e91; }
      .answer-note { position:absolute; bottom:15mm; right:13mm; left:13mm; height:12mm; border:1px dotted #8fb5c2; padding:2mm; color:#52707d; font-size:8pt; }
      .answer-sheet .sheet-foot { bottom:5mm; }
      .section-page { padding:13mm 10mm; }
      .section-marks { height:24mm; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #1b2c33; }
      .section-marks i { width:18mm; height:18mm; border:1.2px solid #222; border-radius:50%; background:repeating-linear-gradient(0deg,transparent 0 1.2mm,#d2d2d2 1.25mm 1.35mm),repeating-linear-gradient(90deg,transparent 0 1.2mm,#d2d2d2 1.25mm 1.35mm); }
      .section-marks b { border:1px solid #333; padding:3mm 5mm; font-size:10pt; }
      .section-center { position:absolute; top:65mm; bottom:48mm; right:25mm; left:25mm; display:flex; flex-direction:column; align-items:center; text-align:center; }
      .section-overline { font-size:18pt; font-weight:800; margin:12mm 0 4mm; }
      .section-center h1 { border:2px solid #222; font-size:24pt; padding:5mm 10mm; margin:0 0 12mm; }
      .section-center > p { font-size:15pt; margin:2mm; font-weight:700; }
      .section-rule { flex:1; }
      .section-note { align-self:flex-start; margin-right:10mm !important; }
      .section-center ul { align-self:stretch; text-align:right; font-size:14pt; line-height:2.2; }
      .section-page-number { position:absolute; bottom:9mm; left:50%; border:1px solid #333; padding:2mm 4mm; }
      .question-page { padding:11mm 12mm 15mm; }
      .question-page .running-head { padding-bottom:3mm; margin-bottom:4mm; font-size:9pt; }
      .question-grid { position:relative; display:grid; grid-auto-flow:column; direction:rtl; grid-template-columns:repeat(2,minmax(0,1fr)); grid-template-rows:repeat(6,minmax(0,1fr)); gap:1.5mm 5mm; height:252mm; }
      .question-grid:before { content:""; position:absolute; top:0; bottom:0; left:50%; border-left:0.35mm solid #333; }
      .question-card { border:0; border-bottom:0.25mm solid #d1d1d1; padding:1mm 2mm; overflow:hidden; display:flex; flex-direction:column; break-inside:avoid; }
      .question-card.long-question .question-copy { font-size:7.6pt; line-height:1.25; }
      .question-card.very-long-question .question-copy { font-size:6.5pt; line-height:1.1; }
      .question-card.multiple-images .question-image { max-height:13mm; }
      .question-card.many-images .question-image { max-height:8mm; }
      .single-question .question-image { max-height:110mm; }
      .question-heading { display:flex; align-items:center; gap:1.5mm; padding-bottom:0.8mm; color:#111; font-size:8.3pt; font-weight:800; }
      .question-heading b { display:grid; place-items:center; width:6mm; height:6mm; border:0.25mm solid #444; border-radius:50%; }
      .question-copy { margin:0.5mm 0; font-size:7.4pt; line-height:1.35; }
      .question-image { display:block; max-width:100%; width:auto; max-height:22mm; object-fit:contain; margin:0.5mm auto; }
      .option-grid { display:grid; grid-template-columns:1fr 1fr; gap:0.6mm 1mm; margin-top:auto; }
      .option { display:flex; align-items:flex-start; gap:1mm; font-size:7pt; line-height:1.25; }
      .option b { flex:none; border:0.25mm solid #607a84; min-width:4mm; text-align:center; font-size:6.6pt; }
      .question-page .sheet-foot { bottom:5mm; padding-top:2mm; font-size:8pt; }
      @media screen { .sheet { box-shadow:0 2mm 8mm #18344220; } }
      @media print { html,body { width:210mm; background:#fff; } .sheet { margin:0; box-shadow:none; } }
      @media screen and (max-width:700px) { .sheet { transform-origin:top right; } }
    </style>
    <script>
      window.addEventListener("load", function () {
        var images = Array.from(document.images);
        Promise.all(images.map(function (image) {
          if (image.complete) return Promise.resolve();
          return new Promise(function (resolve) {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", resolve, { once: true });
            setTimeout(resolve, 7000);
          });
        })).then(function () { setTimeout(function () { window.print(); }, 250); });
      });
    </script>
  </head><body>${pages.join("")}</body></html>`;
}

