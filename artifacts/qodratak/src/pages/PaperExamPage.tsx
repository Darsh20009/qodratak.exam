import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import ExamSetupStep from '@/components/paper-exam/ExamSetupStep';
import DownloadStep from '@/components/paper-exam/DownloadStep';
import AnswerInputStep from '@/components/paper-exam/AnswerInputStep';
import ResultsStep from '@/components/paper-exam/ResultsStep';
import PDFGenerationModal from '@/components/paper-exam/PDFGenerationModal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Question {
  id: number;
  category: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  hint?: string;
  imageUrl?: string;
}

interface PaperExam {
  id: number;
  title: string;
  totalQuestions: number;
  trialQuestions: number;
  examType: string;
  timeLimit: number;
  status: string;
  questions: Question[];
  answerKey: any[];
}

interface ExamResult {
  totalScore: number;
  verbalScore?: number;
  quantitativeScore?: number;
  totalPercentage: number;
  verbalPercentage?: number;
  quantitativePercentage?: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedQuestions: number;
  incorrectQuestions?: {
    questionIndex: number;
    question: Question;
    userAnswer: number;
    correctAnswer: number;
  }[];
}

type ExamStep = 'setup' | 'download' | 'input' | 'results';

export default function PaperExamPage() {
  const { toast } = useToast();
  const [step, setStep] = useState<ExamStep>('setup');
  const [currentExam, setCurrentExam] = useState<PaperExam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [pdfModal, setPdfModal] = useState({
    isOpen: false,
    currentPage: 0,
    totalPages: 0,
    fileName: ''
  });

  const fetchQuestions = async (examId: number, totalQuestions: number = 120) => {
    try {
      console.log('جاري تحميل الأسئلة...', { examId, totalQuestions });
      const response = await apiRequest('GET', `/api/paper-exams/${examId}/questions?count=${totalQuestions}`);

      if (!response.ok) {
        throw new Error(`فشل في تحميل الأسئلة: ${response.status}`);
      }

      const data = await response.json();
      console.log('تم تحميل الأسئلة:', data.length);

      if (!data || data.length === 0) {
        toast({
          title: 'تنبيه',
          description: 'لا توجد أسئلة متاحة حالياً. جاري المحاولة مرة أخرى...',
          variant: 'destructive',
        });
        return;
      }

      setQuestions(data);
      toast({
        title: 'تم التحميل',
        description: `تم تحميل ${data.length} سؤال بنجاح`,
      });
    } catch (error) {
      console.error('خطأ في تحميل الأسئلة:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل الأسئلة. حاول مرة أخرى',
        variant: 'destructive',
      });
    }
  };

  const convertHtmlPageToPdf = async (htmlElement: HTMLElement): Promise<HTMLCanvasElement> => {
    await document.fonts.ready;
    await new Promise(resolve => setTimeout(resolve, 30));

    const canvas = await html2canvas(htmlElement, {
      scale: 0.9,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 794,
      windowHeight: 1123,
      imageTimeout: 0,
      removeContainer: true,
      foreignObjectRendering: false,
    });

    return canvas;
  };

  const generateExamHTML = async () => {
    if (!currentExam || !questions.length) {
      toast({
        title: 'خطأ',
        description: 'لا توجد أسئلة متاحة للتنزيل',
        variant: 'destructive',
      });
      return;
    }

    setPdfModal({
      isOpen: true,
      currentPage: 0,
      totalPages: 0,
      fileName: 'ملف الاختبار'
    });

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      let isFirstPage = true;

      // تقسيم ذكي ومنظم: الأسئلة الطويلة تأخذ صفحة كاملة
      const pages: { questions: Question[], startIdx: number }[] = [];
      let questionIndex = 0;
      
      while (questionIndex < questions.length) {
        const question = questions[questionIndex];
        const isLongQuestion = question.text && question.text.length > 400;
        
        if (isLongQuestion) {
          // سؤال طويل = صفحة كاملة
          pages.push({ questions: [question], startIdx: questionIndex });
          questionIndex++;
        } else {
          // أسئلة عادية: 5 في كل صفحة
          const pageQuestions: Question[] = [];
          const startIdx = questionIndex;
          
          for (let i = 0; i < 5 && questionIndex < questions.length; i++) {
            const q = questions[questionIndex];
            // تأكد أنه ليس سؤال طويل
            if (q.text && q.text.length > 400) {
              break; // توقف وابدأ صفحة جديدة
            }
            pageQuestions.push(q);
            questionIndex++;
          }
          
          if (pageQuestions.length > 0) {
            pages.push({ questions: pageQuestions, startIdx });
          }
        }
      }

      const htmlPages = pages.length;
      setPdfModal(prev => ({ ...prev, totalPages: htmlPages }));

      let currentPdfPage = 0; // تتبع رقم صفحة PDF الفعلي

      for (let pageNum = 0; pageNum < htmlPages; pageNum++) {
        setPdfModal(prev => ({ ...prev, currentPage: pageNum + 1 }));
        const { questions: pageQuestions, startIdx } = pages[pageNum];

        const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Cairo', Arial, sans-serif;
            background: white;
            direction: rtl;
            text-align: right;
            width: 794px;
            padding: 15px;
        }

        .page-container {
            width: 100%;
            background: white;
        }

        .header {
            border: 2px solid #000;
            padding: 12px;
            text-align: center;
            margin-bottom: 12px;
            border-radius: 6px;
        }

        .logo {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 5px;
            color: #000;
        }

        .exam-title {
            font-size: 16px;
            font-weight: 600;
            color: #000;
        }

        .question-box {
            border: 2px solid #000;
            padding: 12px;
            margin-bottom: 10px;
            border-radius: 6px;
            background: white;
            display: flex;
            flex-direction: column;
        }

        .question-header {
            display: flex;
            align-items: flex-start;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid #ddd;
        }

        .question-number {
            border: 2px solid #000;
            color: #000;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            font-weight: 700;
            font-size: 15px;
            flex-shrink: 0;
            margin-left: 10px;
            background: white;
        }

        .question-text {
            font-size: 14px;
            line-height: 1.8;
            flex: 1;
            padding-top: 4px;
            color: #000;
            font-weight: 600;
        }

        .options {
            display: grid;
            gap: 8px;
            margin-top: 10px;
        }

        .option {
            border: 2px solid #000;
            padding: 10px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            background: white;
            min-height: 38px;
        }

        .option-letter {
            border: 2px solid #000;
            color: #000;
            width: 26px;
            height: 26px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            font-weight: 700;
            font-size: 14px;
            margin-left: 8px;
            flex-shrink: 0;
            background: white;
        }

        .option-text {
            font-size: 14px;
            line-height: 1.7;
            color: #000;
            font-weight: 500;
        }

        .footer {
            border: 1px solid #000;
            padding: 8px;
            text-align: center;
            margin-top: 12px;
            border-radius: 4px;
            color: #000;
        }

        .page-number {
            font-size: 12px;
            margin-bottom: 3px;
        }

        .copyright {
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="page-container">
        <div class="header">
            <div class="logo">قدراتك</div>
            <div class="exam-title">${currentExam.title || 'اختبار قدراتك'}</div>
        </div>

        ${pageQuestions.map((question, idx) => {
            const isLong = question.text && question.text.length > 400;
            return `
            <div class="question-box ${isLong ? 'long-question' : ''}">
                <div class="question-header">
                    <div class="question-number">${startIdx + idx + 1}</div>
                    <div class="question-text">${question.text || `السؤال ${startIdx + idx + 1}`}</div>
                </div>
                <div class="options">
                    ${question.options.map((option, optIdx) => `
                        <div class="option">
                            <div class="option-letter">${['أ', 'ب', 'ج', 'د'][optIdx]}</div>
                            <div class="option-text">${option}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;}).join('')}
    </div>
</body>
</html>`;

        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '0';
        tempDiv.innerHTML = htmlContent;
        document.body.appendChild(tempDiv);

        await new Promise(resolve => setTimeout(resolve, 50));

        const canvas = await convertHtmlPageToPdf(tempDiv);

        document.body.removeChild(tempDiv);

        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const maxPageHeight = 297; // A4 height in mm
        
        // إذا الصورة أطول من A4، قسمها على صفحات متعددة
        if (imgHeight > maxPageHeight) {
          const pagesNeeded = Math.ceil(imgHeight / maxPageHeight);
          
          for (let i = 0; i < pagesNeeded; i++) {
            if (!isFirstPage) {
              pdf.addPage();
            }
            isFirstPage = false;
            
            const sourceY = (i * maxPageHeight * canvas.width) / imgWidth;
            const sourceHeight = Math.min((maxPageHeight * canvas.width) / imgWidth, canvas.height - sourceY);
            
            const pageCanvas = document.createElement('canvas');
            pageCanvas.width = canvas.width;
            pageCanvas.height = sourceHeight;
            const ctx = pageCanvas.getContext('2d');
            
            if (ctx) {
              ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);
              const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.85);
              const pageImgHeight = (sourceHeight * imgWidth) / canvas.width;
              pdf.addImage(pageImgData, 'JPEG', 0, 0, imgWidth, pageImgHeight);
            }
          }
        } else {
          if (!isFirstPage) {
            pdf.addPage();
          }
          isFirstPage = false;
          
          pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
        }

        await new Promise(resolve => setTimeout(resolve, 50));
        
        if (pageNum % 3 === 0) {
          await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 100)));
        }
      }

      // إضافة ترقيم الصفحات في النهاية
      const totalPdfPages = pdf.getNumberOfPages();
      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);
      
      for (let i = 1; i <= totalPdfPages; i++) {
        pdf.setPage(i);
        pdf.text(`صفحة ${i} من ${totalPdfPages}`, 105, 290, { align: 'center' });
        pdf.text(`منصة قدراتك © ${new Date().getFullYear()}`, 105, 294, { align: 'center' });
      }

      pdf.save(`اختبار_${currentExam.title || 'قدراتك'}.pdf`);

      await new Promise(resolve => setTimeout(resolve, 1000));

      setPdfModal({ isOpen: false, currentPage: 0, totalPages: 0, fileName: '' });

      toast({
        title: '✅ تم التنزيل بنجاح',
        description: `تم تنزيل ملف الاختبار (${questions.length} سؤال)`,
      });
    } catch (error) {
      console.error('خطأ في تنزيل الملف:', error);
      setPdfModal({ isOpen: false, currentPage: 0, totalPages: 0, fileName: '' });
      const errorMsg = error instanceof Error ? error.message : 'خطأ غير معروف';
      toast({
        title: 'خطأ في إنشاء PDF',
        description: `فشل الإنشاء. حاول تقليل عدد الأسئلة أو جرّب مرة أخرى. (${errorMsg})`,
        variant: 'destructive',
      });
    }
  };

  const generateBubbleSheetHTML = async () => {
    if (!currentExam || !questions.length) {
      toast({
        title: 'خطأ',
        description: 'لا يوجد اختبار أو أسئلة لتنزيل ورقة الإجابة',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'جاري إنشاء PDF...',
      description: 'إنشاء ورقة الإجابة...',
      duration: 30000,
    });

    try {
      const QUESTIONS_PER_PAGE = 70;
      const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
      const pdf = new jsPDF('p', 'mm', 'a4');
      let isFirstPage = true;
      
      const trialCount = currentExam.trialQuestions || 0;
      const scoredCount = questions.length - trialCount;

      for (let pageNum = 0; pageNum < totalPages; pageNum++) {
        toast({
          title: 'جاري الإنشاء...',
          description: `صفحة ${pageNum + 1} من ${totalPages}`,
          duration: 1500,
        });
        const startIdx = pageNum * QUESTIONS_PER_PAGE;
        const endIdx = Math.min(startIdx + QUESTIONS_PER_PAGE, questions.length);
        const pageQuestionsCount = endIdx - startIdx;

        const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Cairo', Arial, sans-serif;
            background: white;
            direction: rtl;
            text-align: right;
            width: 794px;
            padding: 20px;
        }

        .container {
            background: white;
        }

        .header {
            padding: 8px;
            text-align: center;
            margin-bottom: 10px;
        }

        .sheet-title {
            font-size: 12px;
            font-weight: 600;
            color: #000;
            margin-bottom: 8px;
        }

        .instructions {
            border: 1px solid #ddd;
            padding: 6px;
            margin-bottom: 10px;
            border-radius: 4px;
            background: white;
        }

        .instructions-title {
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 4px;
            text-align: center;
            color: #333;
        }

        .instruction-item {
            font-size: 9px;
            margin: 2px 0;
            padding-right: 5px;
            color: #555;
        }

        .answer-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 4px;
        }

        .question-box {
            border: 1px solid #000;
            padding: 4px;
            text-align: center;
            border-radius: 3px;
        }

        .question-num {
            font-weight: 700;
            font-size: 10px;
            margin-bottom: 4px;
            color: #000;
        }

        .bubbles {
            display: flex;
            justify-content: space-around;
            gap: 2px;
        }

        .bubble {
            width: 12px;
            height: 12px;
            border: 1.5px solid #000;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 8px;
            color: #000;
        }
        
        .question-box.trial {
            border-color: #3b82f6;
            background: #eff6ff;
        }
        
        .question-box.trial .question-num {
            color: #2563eb;
        }
        
        .question-box.trial .bubble {
            border-color: #3b82f6;
            color: #2563eb;
        }

        .footer {
            background: #1f2937;
            color: white;
            padding: 8px;
            text-align: center;
            margin-top: 10px;
            border-radius: 4px;
        }
        
        .trial-notice {
            border: 2px solid #3b82f6;
            background: #eff6ff;
            padding: 8px;
            margin-bottom: 10px;
            border-radius: 4px;
            text-align: center;
        }
        
        .trial-notice-title {
            font-size: 11px;
            font-weight: 700;
            color: #2563eb;
            margin-bottom: 3px;
        }
        
        .trial-notice-text {
            font-size: 9px;
            color: #1e40af;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="sheet-title">ورقة الإجابة - ${currentExam.title || 'اختبار قدراتك'}</div>
        </div>

        <div class="instructions">
            <div class="instructions-title">تعليمات: استخدم قلم رصاص • ظلل الدائرة بالكامل • تأكد من رقم السؤال</div>
        </div>
        
        ${trialCount > 0 ? `
        <div class="trial-notice">
            <div class="trial-notice-title">⚠️ ملاحظة مهمة</div>
            <div class="trial-notice-text">الأسئلة الزرقاء (${scoredCount + 1} - ${questions.length}) هي أسئلة تجريبية ولا تحسب في الدرجة النهائية • عددها ${trialCount} سؤال</div>
        </div>
        ` : ''}

        <div class="answer-grid">
            ${Array.from({ length: pageQuestionsCount }, (_, i) => {
              const questionNum = startIdx + i + 1;
              const isTrial = questionNum > scoredCount;
              return `
                <div class="question-box${isTrial ? ' trial' : ''}">
                    <div class="question-num">س ${questionNum}</div>
                    <div class="bubbles">
                        ${['أ', 'ب', 'ج', 'د'].map(letter => `
                            <div class="bubble">${letter}</div>
                        `).join('')}
                    </div>
                </div>
              `;
            }).join('')}
        </div>

        <div class="footer">
            <div style="font-size: 12px; margin-bottom: 5px;">صفحة ${pageNum + 1} من ${totalPages}</div>
            <div style="font-size: 11px;">منصة قدراتك © ${new Date().getFullYear()}</div>
        </div>
    </div>
</body>
</html>`;

        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.innerHTML = htmlContent;
        document.body.appendChild(tempDiv);

        await new Promise(resolve => setTimeout(resolve, 50));

        const canvas = await convertHtmlPageToPdf(tempDiv);

        document.body.removeChild(tempDiv);

        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (!isFirstPage) {
          pdf.addPage();
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
        isFirstPage = false;

        await new Promise(resolve => setTimeout(resolve, 10));
      }

      pdf.save(`ورقة_إجابة_${currentExam.title || 'اختبار_قدراتك'}.pdf`);

      toast({
        title: '✅ تم التنزيل بنجاح',
        description: `تم تنزيل ورقة الإجابة (${questions.length} سؤال)`,
      });
    } catch (error) {
      console.error('خطأ في تنزيل الملف:', error);
      const errorMsg = error instanceof Error ? error.message : 'خطأ غير معروف';
      toast({
        title: 'خطأ',
        description: `فشل تنزيل ورقة الإجابة. (${errorMsg})`,
        variant: 'destructive',
      });
    }
  };


  const generateBubbleSheetWithAnswers = async () => {
    if (!currentExam || !questions.length) {
      toast({
        title: 'خطأ',
        description: 'لا يوجد اختبار أو أسئلة متاحة',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'جاري إنشاء PDF...',
      description: 'إنشاء ورقة الإجابة المحلولة بنظام الألوان الإبداعي...',
      duration: 30000,
    });

    try {
      const QUESTIONS_PER_PAGE = 70;
      const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
      const pdf = new jsPDF('p', 'mm', 'a4');
      let isFirstPage = true;
      
      const trialCount = currentExam.trialQuestions || 0;
      const scoredCount = questions.length - trialCount;
      
      // 🎯 نظام توزيع ذكي للأسئلة التجريبية (موزعة عبر الاختبار وليس آخر 20)
      const trialIndices = new Set<number>();
      if (trialCount > 0) {
        const positions = [];
        for (let i = 0; i < questions.length; i++) {
          positions.push(i);
        }
        // خلط عشوائي
        positions.sort(() => Math.random() - 0.5);
        // اختيار أول trialCount مواقع عشوائية
        for (let i = 0; i < trialCount; i++) {
          trialIndices.add(positions[i]);
        }
      }

      for (let pageNum = 0; pageNum < totalPages; pageNum++) {
        toast({
          title: 'جاري الإنشاء...',
          description: `صفحة ${pageNum + 1} من ${totalPages}`,
          duration: 1500,
        });
        const startIdx = pageNum * QUESTIONS_PER_PAGE;
        const endIdx = Math.min(startIdx + QUESTIONS_PER_PAGE, questions.length);
        const pageQuestions = questions.slice(startIdx, endIdx);

        const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Cairo', Arial, sans-serif;
            background: white;
            direction: rtl;
            text-align: right;
            width: 794px;
            padding: 20px;
        }

        .container {
            background: white;
        }

        .header {
            padding: 8px;
            text-align: center;
            margin-bottom: 10px;
        }

        .sheet-title {
            font-size: 12px;
            font-weight: 600;
            color: #000;
            margin-bottom: 8px;
        }

        .notice {
            border: 1px solid #ddd;
            background: white;
            padding: 6px;
            margin-bottom: 10px;
            border-radius: 4px;
            text-align: center;
        }

        .notice-title {
            font-size: 11px;
            font-weight: 600;
            color: #333;
        }

        .answer-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 4px;
        }

        .question-box {
            border: 1px solid #ccc;
            padding: 4px;
            text-align: center;
            border-radius: 3px;
        }

        .question-num {
            font-weight: 700;
            font-size: 10px;
            margin-bottom: 4px;
            color: #000;
        }

        .bubbles {
            display: flex;
            justify-content: space-around;
            gap: 2px;
        }

        .bubble {
            width: 12px;
            height: 12px;
            border: 1.5px solid #888;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 8px;
            color: #000;
            background: white;
        }

        .bubble.correct {
            background: #10b981;
            color: white;
            border-color: #10b981;
            font-weight: 700;
        }
        
        /* 🎨 نظام الألوان الإبداعي: أحمر (لفظي) + أخضر (كمي) + أزرق (تجريبي موزع) */
        .question-box.verbal {
            border-color: #ef4444;
            background: #fef2f2;
        }
        
        .question-box.verbal .question-num {
            color: #dc2626;
        }
        
        .question-box.verbal .bubble {
            border-color: #ef4444;
        }
        
        .question-box.quantitative {
            border-color: #10b981;
            background: #f0fdf4;
        }
        
        .question-box.quantitative .question-num {
            color: #059669;
        }
        
        .question-box.quantitative .bubble {
            border-color: #10b981;
        }
        
        .question-box.trial {
            border-color: #3b82f6;
            background: #eff6ff;
        }
        
        .question-box.trial .question-num {
            color: #2563eb;
        }
        
        .question-box.trial .bubble {
            border-color: #3b82f6;
            color: #2563eb;
        }

        .footer {
            background: #1f2937;
            color: white;
            padding: 8px;
            text-align: center;
            margin-top: 10px;
            border-radius: 4px;
        }
        
        .trial-notice {
            border: 2px solid #3b82f6;
            background: #eff6ff;
            padding: 8px;
            margin-bottom: 10px;
            border-radius: 4px;
            text-align: center;
        }
        
        .trial-notice-title {
            font-size: 11px;
            font-weight: 700;
            color: #2563eb;
            margin-bottom: 3px;
        }
        
        .trial-notice-text {
            font-size: 9px;
            color: #1e40af;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="sheet-title">ورقة الإجابة المحلولة - ${currentExam.title || 'اختبار قدراتك'}</div>
        </div>

        <div class="notice">
            <div class="notice-title">🎨 نظام الألوان الإبداعي: 🔴 أحمر (لفظي) • 🟢 أخضر (كمي) • 🔵 أزرق (تجريبي موزع)</div>
        </div>
        
        ${trialCount > 0 ? `
        <div class="trial-notice">
            <div class="trial-notice-title">⚠️ ملاحظة مهمة</div>
            <div class="trial-notice-text">الأسئلة الزرقاء (${trialCount} سؤال موزع عبر الاختبار) هي أسئلة تجريبية ولا تحسب في الدرجة النهائية</div>
        </div>
        ` : ''}

        <div class="answer-grid">
            ${pageQuestions.map((question, i) => {
              const questionNum = startIdx + i + 1;
              const globalIndex = startIdx + i;
              const isTrial = trialIndices.has(globalIndex);
              const isVerbal = !isTrial && (question?.category === 'verbal' || question?.category === 'لفظي');
              const isQuantitative = !isTrial && (question?.category === 'quantitative' || question?.category === 'كمي');
              const correctIndex = question?.correctOptionIndex ?? 0;
              
              let cssClass = 'question-box';
              if (isTrial) cssClass += ' trial';
              else if (isVerbal) cssClass += ' verbal';
              else if (isQuantitative) cssClass += ' quantitative';
              
              return `
                <div class="${cssClass}">
                    <div class="question-num">س ${questionNum}</div>
                    <div class="bubbles">
                        ${['أ', 'ب', 'ج', 'د'].map((letter, idx) => `
                            <div class="bubble ${idx === correctIndex ? 'correct' : ''}">${letter}</div>
                        `).join('')}
                    </div>
                </div>
              `;
            }).join('')}
        </div>

        <div class="footer">
            <div style="font-size: 12px; margin-bottom: 5px;">صفحة ${pageNum + 1} من ${totalPages}</div>
            <div style="font-size: 11px;">منصة قدراتك © ${new Date().getFullYear()}</div>
        </div>
    </div>
</body>
</html>`;

        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.innerHTML = htmlContent;
        document.body.appendChild(tempDiv);

        await new Promise(resolve => setTimeout(resolve, 50));

        const canvas = await convertHtmlPageToPdf(tempDiv);

        document.body.removeChild(tempDiv);

        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (!isFirstPage) {
          pdf.addPage();
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
        isFirstPage = false;

        await new Promise(resolve => setTimeout(resolve, 10));
      }

      pdf.save(`ورقة_إجابة_محلولة_${currentExam.title || 'اختبار_قدراتك'}.pdf`);

      toast({
        title: '✅ تم التنزيل بنجاح',
        description: `تم تنزيل ورقة الإجابة المحلولة (${questions.length} سؤال)`,
      });
    } catch (error) {
      console.error('خطأ في تنزيل الملف:', error);
      const errorMsg = error instanceof Error ? error.message : 'خطأ غير معروف';
      toast({
        title: 'خطأ',
        description: `فشل تنزيل ورقة الإجابة المحلولة. (${errorMsg})`,
        variant: 'destructive',
      });
    }
  };


  const generateQuickCorrectionHTML = async (correctCount: number) => {
    if (!currentExam || !questions.length) {
      toast({
        title: 'خطأ',
        description: 'لا توجد أسئلة متاحة',
        variant: 'destructive',
      });
      return;
    }

    const trialCount = currentExam.trialQuestions || 0;
    const scoredCount = questions.length - trialCount;
    
    if (correctCount > scoredCount) {
      toast({
        title: 'خطأ',
        description: `عدد الأسئلة الصحيحة لا يمكن أن يتجاوز ${scoredCount} (بدون التجريبي)`,
        variant: 'destructive',
      });
      return;
    }

    const wrongCount = scoredCount - correctCount;
    const percentage = ((correctCount / scoredCount) * 100).toFixed(2);
    
    let verbalCorrect = 0;
    let quantCorrect = 0;
    let verbalTotal = 0;
    let quantTotal = 0;
    
    questions.forEach((q, idx) => {
      const isTrial = (idx + 1) > scoredCount;
      if (!isTrial) {
        if (q.category === 'verbal' || q.category === 'لفظي') {
          verbalTotal++;
        } else if (q.category === 'quantitative' || q.category === 'كمي') {
          quantTotal++;
        }
      }
    });
    
    const ratio = verbalTotal > 0 ? correctCount / scoredCount : 0.5;
    verbalCorrect = Math.round(verbalTotal * ratio);
    quantCorrect = correctCount - verbalCorrect;
    
    const verbalPercentage = verbalTotal > 0 ? ((verbalCorrect / verbalTotal) * 100).toFixed(2) : '0.00';
    const quantPercentage = quantTotal > 0 ? ((quantCorrect / quantTotal) * 100).toFixed(2) : '0.00';

    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>نتيجة التصحيح السريع - ${currentExam.title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Cairo', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            direction: rtl;
        }
        
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header p {
            font-size: 18px;
            opacity: 0.95;
        }
        
        .results-summary {
            padding: 30px;
            background: #f8f9fa;
        }
        
        .score-card {
            background: white;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .score-card h2 {
            font-size: 24px;
            color: #2d3748;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        .stat-item {
            background: linear-gradient(135deg, #f6f8fb 0%, #e9ecef 100%);
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            border: 2px solid #dee2e6;
        }
        
        .stat-label {
            font-size: 14px;
            color: #6c757d;
            margin-bottom: 8px;
        }
        
        .stat-value {
            font-size: 28px;
            font-weight: 700;
            color: #2d3748;
        }
        
        .stat-value.success {
            color: #10b981;
        }
        
        .stat-value.danger {
            color: #ef4444;
        }
        
        .stat-value.primary {
            color: #667eea;
        }
        
        .questions-section {
            padding: 30px;
        }
        
        .question-card {
            background: white;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .question-card.trial {
            border-color: #3b82f6;
            background: #eff6ff;
        }
        
        .question-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e2e8f0;
        }
        
        .question-number {
            background: #667eea;
            color: white;
            padding: 8px 16px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 16px;
        }
        
        .question-card.trial .question-number {
            background: #3b82f6;
        }
        
        .question-category {
            background: #e2e8f0;
            color: #2d3748;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
        }
        
        .question-text {
            font-size: 18px;
            line-height: 1.8;
            color: #2d3748;
            margin-bottom: 20px;
            font-weight: 500;
        }
        
        .options-grid {
            display: grid;
            gap: 12px;
            margin-bottom: 20px;
        }
        
        .option {
            display: flex;
            align-items: center;
            padding: 15px;
            border-radius: 8px;
            border: 2px solid #e2e8f0;
            background: #f8f9fa;
            transition: all 0.3s;
        }
        
        .option.correct {
            border-color: #10b981;
            background: #d1fae5;
        }
        
        .option-letter {
            width: 35px;
            height: 35px;
            border-radius: 50%;
            background: #667eea;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            margin-left: 15px;
            flex-shrink: 0;
        }
        
        .option.correct .option-letter {
            background: #10b981;
        }
        
        .option-text {
            flex: 1;
            font-size: 16px;
            color: #2d3748;
        }
        
        .explanation {
            background: #fff3cd;
            border-right: 4px solid #ffc107;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
        }
        
        .explanation-title {
            font-weight: 700;
            color: #856404;
            margin-bottom: 8px;
            font-size: 16px;
        }
        
        .explanation-text {
            color: #856404;
            line-height: 1.6;
            font-size: 15px;
        }
        
        .hint {
            background: #d1ecf1;
            border-right: 4px solid #17a2b8;
            padding: 15px;
            border-radius: 8px;
            margin-top: 10px;
        }
        
        .hint-title {
            font-weight: 700;
            color: #0c5460;
            margin-bottom: 8px;
            font-size: 16px;
        }
        
        .hint-text {
            color: #0c5460;
            line-height: 1.6;
            font-size: 15px;
        }
        
        .trial-badge {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-right: 10px;
        }
        
        .footer {
            background: #2d3748;
            color: white;
            text-align: center;
            padding: 20px;
            font-size: 14px;
        }
        
        @media print {
            body {
                background: white;
            }
            
            .container {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 نتيجة التصحيح السريع</h1>
            <p>${currentExam.title || 'اختبار قدراتك'}</p>
        </div>
        
        <div class="results-summary">
            <div class="score-card">
                <h2>ملخص النتيجة</h2>
                
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-label">الأسئلة الصحيحة</div>
                        <div class="stat-value success">${correctCount}</div>
                    </div>
                    
                    <div class="stat-item">
                        <div class="stat-label">الأسئلة الخاطئة</div>
                        <div class="stat-value danger">${wrongCount}</div>
                    </div>
                    
                    <div class="stat-item">
                        <div class="stat-label">النسبة المئوية</div>
                        <div class="stat-value primary">${percentage}%</div>
                    </div>
                    
                    <div class="stat-item">
                        <div class="stat-label">إجمالي الأسئلة</div>
                        <div class="stat-value">${scoredCount}</div>
                    </div>
                </div>
                
                ${verbalTotal > 0 || quantTotal > 0 ? `
                <div class="stats-grid" style="margin-top: 20px;">
                    ${verbalTotal > 0 ? `
                    <div class="stat-item">
                        <div class="stat-label">اللفظي (${verbalCorrect}/${verbalTotal})</div>
                        <div class="stat-value">${verbalPercentage}%</div>
                    </div>
                    ` : ''}
                    
                    ${quantTotal > 0 ? `
                    <div class="stat-item">
                        <div class="stat-label">الكمي (${quantCorrect}/${quantTotal})</div>
                        <div class="stat-value">${quantPercentage}%</div>
                    </div>
                    ` : ''}
                </div>
                ` : ''}
                
                ${trialCount > 0 ? `
                <div style="margin-top: 20px; padding: 15px; background: #eff6ff; border: 2px solid #3b82f6; border-radius: 10px; text-align: center;">
                    <strong style="color: #2563eb;">⚠️ ملاحظة:</strong>
                    <span style="color: #1e40af;">تم استبعاد ${trialCount} سؤال تجريبي من الحساب (الأسئلة ${scoredCount + 1} - ${questions.length})</span>
                </div>
                ` : ''}
            </div>
        </div>
        
        <div class="questions-section">
            <h2 style="font-size: 28px; color: #2d3748; margin-bottom: 25px; text-align: center;">
                📚 جميع الأسئلة مع الشرح الكامل
            </h2>
            
            ${questions.map((q, idx) => {
              const questionNum = idx + 1;
              const isTrial = questionNum > scoredCount;
              const letters = ['أ', 'ب', 'ج', 'د'];
              
              return `
                <div class="question-card${isTrial ? ' trial' : ''}">
                    <div class="question-header">
                        <div class="question-number">
                            ${isTrial ? '<span class="trial-badge">تجريبي</span>' : ''}
                            سؤال ${questionNum}
                        </div>
                        <div class="question-category">${q.category === 'verbal' || q.category === 'لفظي' ? 'لفظي' : 'كمي'}</div>
                    </div>
                    
                    <div class="question-text">${q.text || 'نص السؤال'}</div>
                    
                    <div class="options-grid">
                        ${q.options.map((option, optIdx) => `
                            <div class="option${optIdx === q.correctOptionIndex ? ' correct' : ''}">
                                <div class="option-letter">${letters[optIdx]}</div>
                                <div class="option-text">${option}</div>
                            </div>
                        `).join('')}
                    </div>
                    
                    ${q.explanation ? `
                    <div class="explanation">
                        <div class="explanation-title">💡 الشرح:</div>
                        <div class="explanation-text">${q.explanation}</div>
                    </div>
                    ` : ''}
                    
                    ${q.hint ? `
                    <div class="hint">
                        <div class="hint-title">💭 تلميح:</div>
                        <div class="hint-text">${q.hint}</div>
                    </div>
                    ` : ''}
                </div>
              `;
            }).join('')}
        </div>
        
        <div class="footer">
            <p>منصة قدراتك © ${new Date().getFullYear()} • جميع الحقوق محفوظة</p>
            <p style="margin-top: 10px; font-size: 12px; opacity: 0.8;">تم إنشاء هذا التقرير بواسطة نظام التصحيح السريع</p>
        </div>
    </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `تصحيح_سريع_${currentExam.title || 'اختبار'}_${correctCount}_من_${scoredCount}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: '✅ تم التنزيل بنجاح',
      description: `تم إنشاء ملف التصحيح السريع (${correctCount}/${scoredCount} صحيح - ${percentage}%)`,
    });
  };

  const handleExamCreated = async (exam: PaperExam) => {
    console.log('تم إنشاء اختبار جديد:', exam);
    setCurrentExam(exam);
    await fetchQuestions(exam.id, exam.totalQuestions);
    setStep('download');
  };

  const handleDownloadComplete = () => {
    setStep('input');
  };

  const handleAnswersSubmitted = (result: ExamResult) => {
    console.log('تم تقديم الإجابات:', result);
    setExamResult(result);
    setStep('results');
  };

  const handleRestart = () => {
    setStep('setup');
    setCurrentExam(null);
    setQuestions([]);
    setExamResult(null);
  };

  const renderCurrentStep = () => {
    switch (step) {
      case 'setup':
        return <ExamSetupStep onExamCreated={handleExamCreated} />;
      case 'download':
        return (
          <DownloadStep
            exam={currentExam!}
            questions={questions}
            generateExamHTML={generateExamHTML}
            generateBubbleSheetHTML={generateBubbleSheetHTML}
            generateBubbleSheetWithAnswers={generateBubbleSheetWithAnswers}
            generateQuickCorrectionHTML={generateQuickCorrectionHTML}
            onProceed={handleDownloadComplete}
          />
        );
      case 'input':
        return (
          <AnswerInputStep
            exam={currentExam!}
            onSubmit={handleAnswersSubmitted}
          />
        );
      case 'results':
        return (
          <ResultsStep
            exam={currentExam!}
            result={examResult!}
            questions={questions}
            onRestart={handleRestart}
          />
        );
      default:
        return <ExamSetupStep onExamCreated={handleExamCreated} />;
    }
  };

  return (
    <>
      <PDFGenerationModal
        isOpen={pdfModal.isOpen}
        currentPage={pdfModal.currentPage}
        totalPages={pdfModal.totalPages}
        fileName={pdfModal.fileName}
      />

      <div className="container mx-auto px-4 py-8 max-w-6xl" dir="rtl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-right">إعداد الاختبار الورقي</h1>
          <p className="text-muted-foreground text-right">
            أنشئ اختبارًا ورقيًا كاملاً مع ورقة الإجابة والتصحيح التلقائي
          </p>
        </header>

        <main>
          {renderCurrentStep()}
        </main>
      </div>
    </>
  );
}