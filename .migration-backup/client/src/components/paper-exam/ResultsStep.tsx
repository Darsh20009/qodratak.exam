import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, TrendingUp, Target, RotateCcw, Download, FileText, AlertCircle, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: number;
  category: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  hint?: string;
}

interface QuestionDetail {
  questionNumber: number;
  questionId: number;
  category: string;
  status: 'correct' | 'wrong' | 'skipped';
  userAnswer: number | null;
  correctAnswer: number;
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
  questionDetails?: QuestionDetail[];
}

interface PaperExam {
  id: number;
  title: string;
  totalQuestions: number;
  trialQuestions: number;
  examType: string;
  timeLimit: number;
  status: string;
}

interface ResultsStepProps {
  exam: PaperExam;
  result: ExamResult;
  questions: Question[];
  onRestart: () => void;
}

export default function ResultsStep({ exam, result, questions, onRestart }: ResultsStepProps) {
  const { toast } = useToast();

  const generateResultsHTML = () => {
    try {
      const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقرير النتائج - ${exam.title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html, body {
            font-family: 'Cairo', sans-serif;
            background: #f5f5f5;
            direction: rtl;
            text-align: right;
            line-height: 1.8;
        }

        body {
            padding: 20px;
        }

        .container {
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            border: 3px solid #000;
        }

        .header {
            border: 3px solid #000;
            padding: 30px;
            text-align: center;
            background: white;
        }

        .header-icon {
            font-size: 64px;
            margin-bottom: 15px;
        }

        .title {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 10px;
        }

        .subtitle {
            font-size: 20px;
            font-weight: 600;
            opacity: 0.95;
        }

        .score-section {
            padding: 30px;
            border: 3px solid #000;
            text-align: center;
            background: white;
        }

        .overall-score {
            font-size: 80px;
            font-weight: 900;
            color: #000;
            margin: 20px 0;
        }

        .score-label {
            font-size: 20px;
            font-weight: 600;
            color: #000;
            margin-bottom: 10px;
        }

        .score-message {
            font-size: 18px;
            font-weight: 600;
            color: #000;
            margin-top: 10px;
        }

        .content {
            padding: 30px;
        }

        .section {
            margin-bottom: 25px;
            padding: 20px;
            border: 2px solid #000;
            background: white;
        }

        .section-title {
            font-size: 22px;
            font-weight: 700;
            color: #000;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #000;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-top: 15px;
        }

        .stat-box {
            background: white;
            padding: 15px;
            border: 2px solid #000;
            text-align: center;
        }

        .stat-value {
            font-size: 32px;
            font-weight: 700;
            color: #000;
        }

        .stat-label {
            font-size: 14px;
            color: #000;
            margin-top: 5px;
        }

        .sections-performance {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-top: 15px;
        }

        .performance-box {
            background: white;
            padding: 20px;
            border: 2px solid #000;
            text-align: center;
        }

        .performance-box.verbal {
            border: 2px solid #000;
            background: white;
        }

        .performance-box.quantitative {
            border: 2px solid #000;
            background: white;
        }

        .performance-title {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 10px;
        }

        .performance-box.verbal .performance-title {
            color: #000;
        }

        .performance-box.quantitative .performance-title {
            color: #000;
        }

        .performance-score {
            font-size: 48px;
            font-weight: 900;
            margin: 15px 0;
            color: #000;
        }

        .footer {
            border: 2px solid #000;
            padding: 25px;
            text-align: center;
            margin-top: 20px;
            background: white;
            color: #000;
        }

        .footer-note {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 10px;
        }

        .footer-brand {
            font-size: 24px;
            font-weight: 700;
            color: #000;
        }

        @media print {
            html, body {
                background: white;
                padding: 0;
                margin: 0;
                direction: rtl;
                text-align: right;
            }

            body {
                padding: 0 !important;
                max-width: 210mm;
                margin: 0 auto;
            }


            .container {
                max-width: 100%;
                border: none;
                margin: 0 auto;
            }

            .section, .header, .score-section, .footer {
                page-break-inside: avoid;
                break-inside: avoid;
            }

            @page {
                margin: 15mm 10mm;
                size: A4 portrait;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-icon">🏆</div>
            <div class="title">تقرير النتائج الكامل</div>
            <div class="subtitle">${exam.title || 'اختبار قدراتك'}</div>
        </div>

        <div class="score-section">
            <div class="score-label">النسبة الإجمالية</div>
            <div class="overall-score">${result.totalPercentage}%</div>
            <div class="score-message">${result.totalPercentage >= 90 ? 'ممتاز! أداء رائع جداً 🎉' : result.totalPercentage >= 80 ? 'جيد جداً! أداء مميز 👏' : result.totalPercentage >= 70 ? 'جيد! استمر في التحسن 💪' : result.totalPercentage >= 60 ? 'لا بأس، يمكنك التحسن 📈' : 'يحتاج إلى مزيد من التدريب 📚'}</div>
        </div>

        <div class="content">
            ${result.verbalPercentage !== undefined && result.quantitativePercentage !== undefined ? `
            <div class="section">
                <div class="section-title">📊 أداء الأقسام</div>
                <div class="sections-performance">
                    <div class="performance-box verbal">
                        <div class="performance-title">القسم اللفظي</div>
                        <div class="performance-score">${result.verbalPercentage}%</div>
                        <div class="stat-label">${result.verbalScore} إجابة صحيحة</div>
                    </div>
                    <div class="performance-box quantitative">
                        <div class="performance-title">القسم الكمي</div>
                        <div class="performance-score">${result.quantitativePercentage}%</div>
                        <div class="stat-label">${result.quantitativeScore} إجابة صحيحة</div>
                    </div>
                </div>
            </div>
            ` : ''}

            <div class="section">
                <div class="section-title">📈 الإحصائيات التفصيلية</div>
                <div class="stats-grid">
                    <div class="stat-box">
                        <div class="stat-value">${exam.totalQuestions}</div>
                        <div class="stat-label">إجمالي الأسئلة</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${result.correctAnswers}</div>
                        <div class="stat-label">إجابات صحيحة</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${result.wrongAnswers}</div>
                        <div class="stat-label">إجابات خاطئة</div>
                    </div>
                </div>

                <div class="stats-grid" style="margin-top: 15px;">
                    <div class="stat-box">
                        <div class="stat-value">${result.skippedQuestions}</div>
                        <div class="stat-label">أسئلة متروكة</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${((result.correctAnswers / exam.totalQuestions) * 100).toFixed(1)}%</div>
                        <div class="stat-label">معدل الصواب</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${((result.wrongAnswers / exam.totalQuestions) * 100).toFixed(1)}%</div>
                        <div class="stat-label">معدل الخطأ</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="footer">
            <div class="footer-note">استمر في التدريب لتحقيق أفضل النتائج 💪</div>
            <div class="footer-brand">منصة قدراتك</div>
        </div>
    </div>
</body>
</html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `تقرير_النتائج_${exam.title || 'اختبار'}.html`;
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

      toast({
        title: '✅ تم التنزيل بنجاح',
        description: 'تم تنزيل تقرير النتائج. افتحه في المتصفح للطباعة',
      });
    } catch (error) {
      console.error('Error generating results report:', error);
      toast({
        title: 'خطأ',
        description: 'فشل إنشاء تقرير النتائج. حاول مرة أخرى',
        variant: 'destructive',
      });
    }
  };

  const generateMistakesPDF = () => {
    // جمع الأسئلة الخاطئة والمتروكة
    const incorrectItems = result.incorrectQuestions || [];
    const totalMistakes = incorrectItems.length + result.skippedQuestions;

    if (totalMistakes === 0) {
      toast({
        title: 'لا توجد أخطاء أو أسئلة متروكة',
        description: 'تهانينا! أجبت على جميع الأسئلة بشكل صحيح',
      });
      return;
    }

    try {
      const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقرير الأخطاء - ${exam.title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html, body {
            font-family: 'Cairo', sans-serif;
            background: #f5f5f5;
            direction: rtl;
            text-align: right;
            line-height: 1.8;
        }

        body {
            padding: 20px;
        }


        .container {
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            border: 3px solid #dc2626;
        }

        .header {
            background: #dc2626;
            color: white;
            padding: 25px;
            text-align: center;
            border-bottom: 3px solid #b91c1c;
        }

        .header-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }

        .title {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
        }

        .subtitle {
            font-size: 18px;
            font-weight: 600;
            opacity: 0.95;
        }

        .summary {
            padding: 20px;
            background: #fee2e2;
            border-bottom: 2px solid #dc2626;
        }

        .summary-title {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 12px;
            color: #dc2626;
        }

        .summary-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
        }

        .stat-box {
            background: white;
            padding: 12px;
            border: 2px solid #dc2626;
            text-align: center;
        }

        .stat-value {
            font-size: 24px;
            font-weight: 700;
            color: #dc2626;
        }

        .stat-label {
            font-size: 14px;
            color: #4b5563;
            margin-top: 4px;
        }

        .content {
            padding: 25px;
        }

        .mistake-block {
            margin-bottom: 30px;
            padding: 20px;
            border: 2px solid #dc2626;
            background: #fef2f2;
            page-break-inside: avoid;
        }

        .mistake-header {
            background: #dc2626;
            color: white;
            padding: 12px 18px;
            margin: -20px -20px 20px -20px;
            font-size: 18px;
            font-weight: 700;
        }

        .question-text {
            font-size: 17px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 15px;
            padding: 15px;
            background: white;
            border-right: 4px solid #dc2626;
        }

        .answers-section {
            margin-top: 15px;
        }

        .answer-row {
            padding: 12px;
            margin: 8px 0;
            border: 2px solid #e5e7eb;
            background: white;
        }

        .answer-label {
            font-weight: 700;
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 5px;
        }

        .answer-text {
            font-size: 16px;
            font-weight: 600;
        }

        .correct-answer {
            border-color: #10b981;
            background: #d1fae5;
        }

        .correct-answer .answer-label {
            color: #059669;
        }

        .correct-answer .answer-text {
            color: #047857;
        }

        .wrong-answer {
            border-color: #ef4444;
            background: #fee2e2;
        }

        .wrong-answer .answer-label {
            color: #dc2626;
        }

        .wrong-answer .answer-text {
            color: #b91c1c;
        }

        .explanation {
            margin-top: 15px;
            padding: 15px;
            background: #dbeafe;
            border: 2px solid #3b82f6;
            border-right: 4px solid #3b82f6;
        }

        .explanation-title {
            font-weight: 700;
            font-size: 16px;
            color: #1e40af;
            margin-bottom: 8px;
        }

        .explanation-text {
            font-size: 15px;
            color: #1e3a8a;
            line-height: 1.8;
        }

        .hint {
            margin-top: 12px;
            padding: 12px;
            background: #fef3c7;
            border: 2px solid #f59e0b;
            border-right: 4px solid #f59e0b;
        }

        .hint-title {
            font-weight: 700;
            font-size: 15px;
            color: #92400e;
            margin-bottom: 6px;
        }

        .hint-text {
            font-size: 14px;
            color: #78350f;
        }

        .footer {
            background: #1f2937;
            color: white;
            padding: 20px;
            text-align: center;
            margin-top: 20px;
        }

        .footer-note {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .footer-brand {
            font-size: 20px;
            font-weight: 700;
            color: #fbbf24;
        }

        @media print {
            html, body {
                background: white;
                padding: 0;
                margin: 0;
            }

            body {
                padding: 0 !important;
            }


            .container {
                max-width: 100%;
                border: none;
                margin: 0;
            }

            .mistake-block, .header, .summary, .footer {
                page-break-inside: avoid;
                break-inside: avoid;
            }

            @page {
                margin: 10mm;
                size: A4 portrait;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-icon">⚠️</div>
            <div class="title">تقرير الأخطاء والشرح</div>
            <div class="subtitle">${exam.title || 'اختبار قدراتك'}</div>
        </div>

        <div class="summary">
            <div class="summary-title">📊 ملخص الأداء</div>
            <div class="summary-stats">
                <div class="stat-box">
                    <div class="stat-value">${result.totalPercentage}%</div>
                    <div class="stat-label">النسبة الإجمالية</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${result.wrongAnswers}</div>
                    <div class="stat-label">إجابات خاطئة</div>
                </div>
                <div class="stat-box" style="border-color: #94a3b8; background: #f1f5f9;">
                    <div class="stat-value" style="color: #64748b;">${result.skippedQuestions}</div>
                    <div class="stat-label">أسئلة متروكة</div>
                </div>
            </div>
        </div>

        <div class="content">
            ${result.incorrectQuestions && result.incorrectQuestions.length > 0 ? `
                <div style="margin-bottom: 30px;">
                    <h2 style="color: #dc2626; font-size: 22px; font-weight: 700; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #dc2626;">
                        ❌ الإجابات الخاطئة (${result.incorrectQuestions.length})
                    </h2>
                    ${result.incorrectQuestions.map((mistake, index) => `
                        <div class="mistake-block">
                            <div class="mistake-header">
                                ❌ خطأ رقم ${index + 1} - السؤال ${mistake.questionIndex + 1}
                            </div>

                            <div class="question-text">
                                ${mistake.question.text || `السؤال ${mistake.questionIndex + 1}`}
                            </div>

                            <div class="answers-section">
                                <div class="answer-row wrong-answer">
                                    <div class="answer-label">إجابتك (خاطئة)</div>
                                    <div class="answer-text">
                                        ${String.fromCharCode(1571 + mistake.userAnswer)} - ${mistake.question.options[mistake.userAnswer] || 'لم يتم الاختيار'}
                                    </div>
                                </div>

                                <div class="answer-row correct-answer">
                                    <div class="answer-label">الإجابة الصحيحة</div>
                                    <div class="answer-text">
                                        ${String.fromCharCode(1571 + mistake.correctAnswer)} - ${mistake.question.options[mistake.correctAnswer]}
                                    </div>
                                </div>
                            </div>

                            ${mistake.question.explanation ? `
                                <div class="explanation">
                                    <div class="explanation-title">💡 الشرح التفصيلي</div>
                                    <div class="explanation-text">${mistake.question.explanation}</div>
                                </div>
                            ` : ''}

                            ${mistake.question.hint ? `
                                <div class="hint">
                                    <div class="hint-title">🎯 نصيحة</div>
                                    <div class="hint-text">${mistake.question.hint}</div>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            ${result.skippedQuestions > 0 ? `
                <div style="margin-top: 30px;">
                    <h2 style="color: #64748b; font-size: 22px; font-weight: 700; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #64748b;">
                        ⏭️ الأسئلة المتروكة (${result.skippedQuestions})
                    </h2>
                    ${questions.map((q, index) => {
                        const isSkipped = !result.incorrectQuestions?.find(m => m.questionIndex === index) && 
                                         result.correctAnswers !== exam.totalQuestions - result.skippedQuestions;
                        if (!isSkipped) return '';

                        return `
                            <div class="mistake-block" style="border-color: #94a3b8; background: #f8fafc;">
                                <div class="mistake-header" style="background: #64748b;">
                                    ⏭️ سؤال متروك - السؤال ${index + 1}
                                </div>

                                <div class="question-text">
                                    ${q.text || `السؤال ${index + 1}`}
                                </div>

                                <div class="answers-section">
                                    <div class="answer-row" style="border-color: #94a3b8; background: #f1f5f9;">
                                        <div class="answer-label" style="color: #64748b;">لم يتم الإجابة</div>
                                        <div class="answer-text" style="color: #64748b;">لم تقم باختيار إجابة</div>
                                    </div>

                                    <div class="answer-row correct-answer">
                                        <div class="answer-label">الإجابة الصحيحة</div>
                                        <div class="answer-text">
                                            ${String.fromCharCode(1571 + q.correctOptionIndex)} - ${q.options[q.correctOptionIndex]}
                                        </div>
                                    </div>
                                </div>

                                ${q.explanation ? `
                                    <div class="explanation">
                                        <div class="explanation-title">💡 الشرح التفصيلي</div>
                                        <div class="explanation-text">${q.explanation}</div>
                                    </div>
                                ` : ''}

                                ${q.hint ? `
                                    <div class="hint">
                                        <div class="hint-title">🎯 نصيحة</div>
                                        <div class="hint-text">${q.hint}</div>
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).filter(Boolean).join('')}
                </div>
            ` : ''}
        </div>

        <div class="footer">
            <div class="footer-note">استمر في التدريب لتحسين نتائجك 💪</div>
            <div class="footer-brand">منصة قدراتك</div>
        </div>
    </div>
</body>
</html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `تقرير_الأخطاء_${exam.title || 'اختبار'}.html`;
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

      toast({
        title: '✅ تم التنزيل بنجاح',
        description: `تم تنزيل تقرير الأخطاء والأسئلة المتروكة (${totalMistakes} سؤال). افتحه في المتصفح للطباعة`,
      });
    } catch (error) {
      console.error('Error generating mistakes report:', error);
      toast({
        title: 'خطأ',
        description: 'فشل إنشاء تقرير الأخطاء. حاول مرة أخرى',
        variant: 'destructive',
      });
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 60) return 'text-blue-600 dark:text-blue-400';
    if (percentage >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreMessage = (percentage: number) => {
    if (percentage >= 90) return 'ممتاز! أداء رائع جداً 🎉';
    if (percentage >= 80) return 'جيد جداً! أداء مميز 👏';
    if (percentage >= 70) return 'جيد! استمر في التحسن 💪';
    if (percentage >= 60) return 'لا بأس، يمكنك التحسن 📈';
    return 'يحتاج إلى مزيد من التدريب 📚';
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">نتيجة الاختبار</CardTitle>
          <CardDescription>{exam.title}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Score */}
          <div className="text-center p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border-2 border-primary/20">
            <div className="text-sm font-semibold text-muted-foreground mb-2">النسبة الإجمالية</div>
            <div className={`text-7xl font-bold ${getScoreColor(result.totalPercentage)}`}>
              {result.totalPercentage}%
            </div>
            <p className="text-lg text-muted-foreground mt-3">
              {getScoreMessage(result.totalPercentage)}
            </p>
          </div>

          {/* Section Scores */}
          {(result.verbalPercentage !== undefined || result.quantitativePercentage !== undefined) && (
            <div className="grid grid-cols-2 gap-4">
              {result.verbalPercentage !== undefined && (
                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-2 border-green-300 dark:border-green-700">
                  <CardContent className="pt-6 text-center">
                    <div className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">
                      القسم اللفظي
                    </div>
                    <div className={`text-5xl font-bold ${getScoreColor(result.verbalPercentage)}`}>
                      {result.verbalPercentage}%
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {result.verbalScore} إجابة صحيحة
                    </p>
                    <Progress value={result.verbalPercentage} className="h-2 mt-3" />
                  </CardContent>
                </Card>
              )}

              {result.quantitativePercentage !== undefined && (
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-2 border-blue-300 dark:border-blue-700">
                  <CardContent className="pt-6 text-center">
                    <div className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                      القسم الكمي
                    </div>
                    <div className={`text-5xl font-bold ${getScoreColor(result.quantitativePercentage)}`}>
                      {result.quantitativePercentage}%
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {result.quantitativeScore} إجابة صحيحة
                    </p>
                    <Progress value={result.quantitativePercentage} className="h-2 mt-3" />
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {result.correctAnswers}
                </div>
                <p className="text-sm text-muted-foreground mt-1">إجابات صحيحة</p>
              </CardContent>
            </Card>

            <Card className="bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {result.wrongAnswers}
                </div>
                <p className="text-sm text-muted-foreground mt-1">إجابات خاطئة</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                  {result.skippedQuestions}
                </div>
                <p className="text-sm text-muted-foreground mt-1">أسئلة متروكة</p>
              </CardContent>
            </Card>
          </div>

          {/* عرض تفاصيل جميع الأسئلة */}
          {result.questionDetails && result.questionDetails.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b-2 pb-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold">تفاصيل جميع الأسئلة (1-{result.questionDetails.length})</h3>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                {result.questionDetails.map((detail) => {
                  const icons = {
                    correct: { icon: '✓', bg: 'bg-green-500', text: 'text-white', border: 'border-green-600' },
                    wrong: { icon: '✗', bg: 'bg-red-500', text: 'text-white', border: 'border-red-600' },
                    skipped: { icon: '—', bg: 'bg-gray-300', text: 'text-gray-700', border: 'border-gray-400' },
                  };

                  const style = icons[detail.status];

                  return (
                    <div
                      key={detail.questionNumber}
                      className={`
                        ${style.bg} ${style.text} ${style.border}
                        border-2 rounded-lg p-2 text-center font-bold
                        transition-all duration-200 hover:scale-110 hover:shadow-lg
                        cursor-pointer
                      `}
                      title={`السؤال ${detail.questionNumber}: ${
                        detail.status === 'correct' ? 'صحيح ✓' :
                        detail.status === 'wrong' ? 'خطأ ✗' :
                        'متروك —'
                      }`}
                    >
                      <div className="text-xs">{detail.questionNumber}</div>
                      <div className="text-lg leading-none">{style.icon}</div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-center gap-6 text-sm mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-500 border-2 border-green-600 rounded flex items-center justify-center text-white font-bold">✓</div>
                  <span>صحيح</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-500 border-2 border-red-600 rounded flex items-center justify-center text-white font-bold">✗</div>
                  <span>خطأ</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-300 border-2 border-gray-400 rounded flex items-center justify-center text-gray-700 font-bold">—</div>
                  <span>متروك</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={generateResultsHTML}
                variant="outline"
                className="flex-1"
                data-testid="button-download-results"
              >
                <Download className="w-4 h-4 ml-2" />
                تنزيل تقرير النتائج
              </Button>
              <Button
                onClick={generateMistakesPDF}
                variant="outline"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950"
                data-testid="button-download-mistakes"
              >
                <AlertCircle className="w-4 h-4 ml-2" />
                تحميل الأخطاء والمتروك مع الشرح
              </Button>
            </div>
            <Button
              onClick={onRestart}
              className="w-full"
              size="lg"
              data-testid="button-new-exam"
            >
              <RotateCcw className="w-4 h-4 ml-2" />
              اختبار جديد
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}