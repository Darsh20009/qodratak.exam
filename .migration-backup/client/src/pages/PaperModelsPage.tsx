import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Download, Loader2, CheckCircle, TrendingUp, Award, BarChart3, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Exam {
  id: number;
  name: string;
  modelNumber: number;
  allQuestions: any[]; // Mixed array of all questions in order
  totalQuestions: number;
  verbalCount: number;
  quantitativeCount: number;
  trialVerbalCount: number;
  trialQuantCount: number;
}

interface ModelResult {
  id: number;
  modelId: number;
  modelNumber: number;
  verbalCorrect: number;
  verbalTotal: number;
  quantitativeCorrect: number;
  quantitativeTotal: number;
  verbalPercentage: number;
  quantitativePercentage: number;
  totalPercentage: number;
  completedAt: Date;
}

export default function PaperModelsPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState<{ [key: number]: boolean }>({});
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [verbalCorrect, setVerbalCorrect] = useState("");
  const [quantCorrect, setQuantCorrect] = useState("");
  
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadMessage, setDownloadMessage] = useState("");
  const [downloadTimeElapsed, setDownloadTimeElapsed] = useState(0);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  
  const [examStarted, setExamStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(120 * 60);
  const [timerMode, setTimerMode] = useState<'full' | 'practice'>('full');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (examStarted && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setExamStarted(false);
            toast({
              title: "انتهى الوقت!",
              description: "انتهى وقت الاختبار",
              variant: "destructive",
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [examStarted, timeRemaining, toast]);

  const startExamTimer = (mode: 'full' | 'practice') => {
    const initialTime = mode === 'full' ? 120 * 60 : 10 * 60;
    setTimerMode(mode);
    setTimeRemaining(initialTime);
    setExamStarted(true);
    toast({
      title: mode === 'full' ? "بدأ العد التنازلي - ساعتين" : "بدأ العد التنازلي - 10 دقائق",
      description: mode === 'full' ? "وقت الاختبار الحقيقي" : "وقت التمرين السريع",
    });
  };

  const stopExamTimer = () => {
    setExamStarted(false);
    toast({
      title: "تم إيقاف المؤقت",
      description: "يمكنك إعادة البدء في أي وقت",
    });
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Fetch exams automatically
  const { data: examsData, isLoading: examsLoading, error: examsError } = useQuery({
    queryKey: ['/api/paper-models'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/paper-models', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching paper models:', error);
        throw error;
      }
    },
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch results and averages
  const { data: resultsData } = useQuery({
    queryKey: ['/api/paper-model-results'],
    enabled: !!examsData?.exams && examsData.exams.length > 0,
  });

  // Fetch download statistics
  const { data: downloadsData } = useQuery({
    queryKey: ['/api/paper-model-downloads'],
    enabled: !!examsData?.exams && examsData.exams.length > 0,
  });

  const exams: Exam[] = examsData?.exams || [];
  const results: ModelResult[] = (resultsData as any)?.results || [];
  const averages = (resultsData as any)?.averages || {
    totalExams: 0,
    verbalAverage: 0,
    quantitativeAverage: 0,
    totalAverage: 0,
  };
  const downloadCounts = (downloadsData as any)?.downloadCounts || {};

  // Track download mutation
  const trackDownloadMutation = useMutation({
    mutationFn: async (data: { modelId: number; modelNumber: number; downloadType: string }) => {
      return await apiRequest('POST', '/api/paper-model-download', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/paper-model-downloads'] });
    },
  });

  // Submit result mutation
  const submitResultMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/paper-model-result', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/paper-model-results'] });
      toast({
        title: "تم حفظ النتيجة بنجاح",
        description: "يمكنك الآن مشاهدة الإحصائيات المحدثة",
      });
      setShowResultDialog(false);
      setSelectedExam(null);
      setVerbalCorrect("");
      setQuantCorrect("");
    },
    onError: (error: any) => {
      if (error.existing) {
        toast({
          title: "تنبيه",
          description: "تم تسجيل نتيجة لهذا النموذج من قبل",
          variant: "destructive",
        });
      } else {
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء حفظ النتيجة",
          variant: "destructive",
        });
      }
    },
  });

  const handleSubmitResult = () => {
    if (!selectedExam) return;

    const verbal = parseInt(verbalCorrect);
    const quant = parseInt(quantCorrect);

    if (isNaN(verbal) || isNaN(quant) || verbal < 0 || verbal > 53 || quant < 0 || quant > 47) {
      toast({
        title: "خطأ في الإدخال",
        description: "اللفظي من 0 إلى 53، الكمي من 0 إلى 47",
        variant: "destructive",
      });
      return;
    }

    submitResultMutation.mutate({
      modelId: selectedExam.id,
      modelNumber: selectedExam.modelNumber,
      verbalCorrect: verbal,
      quantCorrect: quant,
    });
  };

  const hasResult = (examId: number) => {
    return results.some(r => r.modelId === examId);
  };

  const getResult = (examId: number) => {
    return results.find(r => r.modelId === examId);
  };

  // Generate answer key with colors (red=verbal, green=quantitative, blue=trial)
  const generateColoredAnswerKey = async (exam: Exam) => {
    setLoading({ ...loading, [exam.id]: true });

    try {
      // allQuestions already has questionType and isTrial properties
      const html = generateAnswerKeyHTML(exam.allQuestions, exam.name);
      await convertHtmlToPdfAndDownload(html, `ورقة_الإجابة_المحلولة_${exam.name}.pdf`);

      // Track download
      trackDownloadMutation.mutate({
        modelId: exam.id,
        modelNumber: exam.modelNumber,
        downloadType: 'answer_key'
      });

      toast({
        title: "تم التحميل بنجاح",
        description: `ورقة الإجابة المحلولة - ${exam.name}`,
      });
    } catch (error) {
      console.error("Error generating answer key:", error);
      toast({
        title: "خطأ في إنشاء الملف",
        description: "حدث خطأ أثناء إنشاء ورقة الإجابة",
        variant: "destructive",
      });
    } finally {
      setLoading({ ...loading, [exam.id]: false });
    }
  };

  // NEW: Generate questions with answers and explanations
  const generateQuestionsWithExplanations = async (exam: Exam) => {
    setLoading({ ...loading, [exam.id]: true });

    try {
      toast({
        title: "جاري إنشاء ملف الأسئلة مع الشرح...",
        description: "قد يستغرق هذا بضع دقائق",
      });

      const html = generateQuestionsExplanationsHTML(exam.allQuestions, exam.name);
      await convertHtmlToPdfAndDownload(html, `أسئلة_مع_شرح_${exam.name}.pdf`);

      // Track download
      trackDownloadMutation.mutate({
        modelId: exam.id,
        modelNumber: exam.modelNumber,
        downloadType: 'questions_with_explanations'
      });

      toast({
        title: "تم التحميل بنجاح",
        description: `ملف الأسئلة مع الشرح - ${exam.name}`,
      });
    } catch (error) {
      console.error("Error generating questions with explanations:", error);
      toast({
        title: "خطأ في إنشاء الملف",
        description: "حدث خطأ أثناء إنشاء ملف الأسئلة مع الشرح",
        variant: "destructive",
      });
    } finally {
      setLoading({ ...loading, [exam.id]: false });
    }
  };

  // Generate full exam with bubble sheet
  const generateFullExam = async (exam: Exam) => {
    setLoading({ ...loading, [exam.id]: true });

    try {
      toast({
        title: "جاري إنشاء الاختبار...",
        description: "قد يستغرق هذا بضع دقائق",
      });

      const html = generateFullExamHTML(exam.allQuestions, exam.name);
      await convertHtmlToPdfAndDownload(html, `اختبار_${exam.name}.pdf`);

      // Track download
      trackDownloadMutation.mutate({
        modelId: exam.id,
        modelNumber: exam.modelNumber,
        downloadType: 'full_exam'
      });

      toast({
        title: "تم التحميل بنجاح",
        description: `اختبار ${exam.name} الكامل`,
      });
    } catch (error) {
      console.error("Error generating exam:", error);
      toast({
        title: "خطأ في إنشاء الملف",
        description: "حدث خطأ أثناء إنشاء الاختبار",
        variant: "destructive",
      });
    } finally {
      setLoading({ ...loading, [exam.id]: false });
    }
  };

  const generateAnswerKeyHTML = (questions: any[], examName: string) => {
    const questionsPerPage = 40;
    const totalPages = Math.ceil(questions.length / questionsPerPage);
    
    let pagesHtml = '';
    
    for (let page = 0; page < totalPages; page++) {
      const startIdx = page * questionsPerPage;
      const endIdx = Math.min(startIdx + questionsPerPage, questions.length);
      const pageQuestions = questions.slice(startIdx, endIdx);
      
      pagesHtml += `
        <div class="page" style="page-break-after: always;">
          <div style="text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px;">
            <h2 style="margin: 0; font-size: 18px; font-family: Arial;">ورقة الإجابة المحلولة - ${examName}</h2>
            <p style="margin: 5px 0; font-size: 12px;">صفحة ${page + 1} من ${totalPages}</p>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 10px;">
            ${pageQuestions.map((q, idx) => {
              const questionNum = startIdx + idx + 1;
              let color = '#000';
              let bgColor = '#fff';
              
              if (q.isTrial) {
                color = '#0066ff';
                bgColor = '#e6f2ff';
              } else if (q.questionType === 'verbal') {
                color = '#cc0000';
                bgColor = '#ffe6e6';
              } else {
                color = '#009900';
                bgColor = '#e6ffe6';
              }
              
              return `
                <div style="border: 1px solid #000; padding: 8px; background: ${bgColor};">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="font-weight: bold; font-size: 16px; min-width: 30px; color: ${color};">${questionNum}</div>
                    <div style="display: flex; gap: 5px; flex: 1;">
                      ${['أ', 'ب', 'ج', 'د'].map((option, optIdx) => {
                        const correctIndex = q.correctOptionIndex !== undefined ? q.correctOptionIndex : q.correctOption;
                        const isCorrect = correctIndex === optIdx;
                        return `
                        <div style="
                          width: 25px;
                          height: 25px;
                          border: 2px solid ${color};
                          border-radius: 50%;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          font-size: 12px;
                          font-weight: bold;
                          background: ${isCorrect ? color : '#fff'};
                          color: ${isCorrect ? '#fff' : color};
                        ">
                          ${option}
                        </div>
                      `;
                      }).join('')}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }
    
    return `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <style>
          @page { size: A4; margin: 10mm; }
          body { font-family: Arial; margin: 0; padding: 0; }
          .page { width: 210mm; min-height: 297mm; padding: 10mm; }
        </style>
      </head>
      <body>${pagesHtml}</body>
      </html>
    `;
  };

  const generateFullExamHTML = (questions: any[], examName: string) => {
    const bubbleSheetPages = generateBubbleSheetPages(questions.length, examName);
    const questionPages = generateQuestionPages(questions, examName);
    
    return `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <style>
          @page { size: A4; margin: 10mm; }
          body { font-family: Arial; margin: 0; padding: 0; color: #000; }
          .page { width: 210mm; min-height: 297mm; padding: 10mm; page-break-after: always; }
        </style>
      </head>
      <body>
        ${bubbleSheetPages}
        ${questionPages}
      </body>
      </html>
    `;
  };

  const generateBubbleSheetPages = (totalQuestions: number, examName: string) => {
    const questionsPerPage = 60;
    const totalPages = Math.ceil(totalQuestions / questionsPerPage);
    
    let pagesHtml = '';
    
    for (let page = 0; page < totalPages; page++) {
      const startIdx = page * questionsPerPage;
      const endIdx = Math.min(startIdx + questionsPerPage, totalQuestions);
      const pageQuestions = endIdx - startIdx;
      
      pagesHtml += `
        <div class="page">
          <div style="text-align: center; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 8px;">
            <h2 style="margin: 0; font-size: 16px;">ورقة الإجابة - ${examName}</h2>
            <p style="margin: 3px 0; font-size: 11px;">صفحة ${page + 1} من ${totalPages}</p>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
            ${Array.from({ length: pageQuestions }, (_, idx) => {
              const questionNum = startIdx + idx + 1;
              return `
                <div style="border: 1px solid #000; padding: 6px; display: flex; align-items: center; gap: 8px;">
                  <div style="font-weight: bold; font-size: 14px; min-width: 25px; color: #000;">${questionNum}</div>
                  <div style="display: flex; gap: 4px;">
                    ${['أ', 'ب', 'ج', 'د'].map(option => `
                      <div style="
                        width: 22px;
                        height: 22px;
                        border: 2px solid #000;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 11px;
                        font-weight: bold;
                        color: #000;
                      ">
                        ${option}
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }
    
    return pagesHtml;
  };

  const generateQuestionPages = (questions: any[], examName: string) => {
    const questionsPerPage = 5;
    const totalPages = Math.ceil(questions.length / questionsPerPage);
    
    let pagesHtml = '';
    
    for (let page = 0; page < totalPages; page++) {
      const startIdx = page * questionsPerPage;
      const endIdx = Math.min(startIdx + questionsPerPage, questions.length);
      const pageQuestions = questions.slice(startIdx, endIdx);
      
      pagesHtml += `
        <div class="page">
          <div style="text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 8px;">
            <h2 style="margin: 0; font-size: 16px;">${examName}</h2>
            <p style="margin: 3px 0; font-size: 11px;">صفحة ${page + 1} من ${totalPages} (الأسئلة)</p>
          </div>
          
          ${pageQuestions.map((q, idx) => {
            const questionNum = startIdx + idx + 1;
            const isLongQuestion = q.text.length > 250;
            
            return `
              <div style="
                border: 2px solid #000;
                padding: ${isLongQuestion ? '20px' : '15px'};
                margin-bottom: 15px;
                min-height: ${isLongQuestion ? '240px' : '150px'};
              ">
                <div style="display: flex; align-items: flex-start; gap: 10px; border-bottom: 1px solid #000; padding-bottom: 8px; margin-bottom: 10px;">
                  <div style="
                    background: #fff;
                    border: 2px solid #000;
                    width: 35px;
                    height: 35px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    font-weight: bold;
                    flex-shrink: 0;
                    color: #000;
                  ">
                    ${questionNum}
                  </div>
                  <div style="flex: 1; font-size: ${isLongQuestion ? '15px' : '16px'}; line-height: 1.8; color: #000;">
                    ${q.text}
                  </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 10px;">
                  ${q.options.map((option: string, optIdx: number) => `
                    <div style="display: flex; align-items: center; gap: 6px; padding: 8px;">
                      <div style="
                        border: 2px solid #000;
                        width: 28px;
                        height: 28px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 14px;
                        font-weight: bold;
                        flex-shrink: 0;
                        color: #000;
                      ">
                        ${['أ', 'ب', 'ج', 'د'][optIdx]}
                      </div>
                      <div style="font-size: ${isLongQuestion ? '14px' : '15px'}; line-height: 1.6; color: #000;">
                        ${option}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
    
    return pagesHtml;
  };

  // NEW: Generate HTML for questions with full explanations
  const generateQuestionsExplanationsHTML = (questions: any[], examName: string) => {
    const questionsPerPage = 2; // 2 questions per page for readability
    const totalPages = Math.ceil(questions.length / questionsPerPage);
    
    let pagesHtml = '';
    
    for (let page = 0; page < totalPages; page++) {
      const startIdx = page * questionsPerPage;
      const endIdx = Math.min(startIdx + questionsPerPage, questions.length);
      const pageQuestions = questions.slice(startIdx, endIdx);
      
      pagesHtml += `
        <div class="page">
          <div style="text-align: center; margin-bottom: 15px; border-bottom: 3px solid #000; padding-bottom: 10px;">
            <h2 style="margin: 0; font-size: 18px;">أسئلة مع الشرح - ${examName}</h2>
            <p style="margin: 5px 0; font-size: 12px;">صفحة ${page + 1} من ${totalPages}</p>
          </div>
          
          ${pageQuestions.map((q, idx) => {
            const questionNum = startIdx + idx + 1;
            const correctIndex = q.correctOptionIndex !== undefined ? q.correctOptionIndex : q.correctOption;
            const correctLetter = ['أ', 'ب', 'ج', 'د'][correctIndex];
            const explanation = q.explanation || 'لا يوجد شرح متاح لهذا السؤال';
            
            // Determine question type and color
            let typeLabel = '';
            let typeColor = '#000';
            if (q.isTrial) {
              typeLabel = 'تجريبي';
              typeColor = '#0066ff';
            } else if (q.questionType === 'verbal') {
              typeLabel = 'لفظي';
              typeColor = '#cc0000';
            } else {
              typeLabel = 'كمي';
              typeColor = '#009900';
            }
            
            return `
              <div style="
                border: 3px solid ${typeColor};
                padding: 20px;
                margin-bottom: 20px;
                background: #fff;
                border-radius: 8px;
              ">
                <!-- Question Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px solid ${typeColor}; padding-bottom: 10px;">
                  <div style="
                    background: ${typeColor};
                    color: #fff;
                    padding: 8px 15px;
                    font-size: 18px;
                    font-weight: bold;
                    border-radius: 5px;
                  ">
                    السؤال ${questionNum}
                  </div>
                  <div style="
                    background: #f0f0f0;
                    color: ${typeColor};
                    padding: 6px 12px;
                    font-size: 14px;
                    font-weight: bold;
                    border: 2px solid ${typeColor};
                    border-radius: 5px;
                  ">
                    ${typeLabel}
                  </div>
                </div>
                
                <!-- Question Text -->
                <div style="
                  font-size: 16px;
                  line-height: 2;
                  color: #000;
                  margin-bottom: 15px;
                  padding: 10px;
                  background: #f9f9f9;
                  border-right: 4px solid ${typeColor};
                ">
                  ${q.text}
                </div>
                
                <!-- Options -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                  ${q.options.map((option: string, optIdx: number) => {
                    const isCorrect = correctIndex === optIdx;
                    const optionLetter = ['أ', 'ب', 'ج', 'د'][optIdx];
                    
                    return `
                      <div style="
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 10px;
                        border: 2px solid ${isCorrect ? '#00aa00' : '#ddd'};
                        background: ${isCorrect ? '#e6ffe6' : '#fff'};
                        border-radius: 5px;
                      ">
                        <div style="
                          background: ${isCorrect ? '#00aa00' : '#fff'};
                          border: 2px solid ${isCorrect ? '#00aa00' : '#666'};
                          color: ${isCorrect ? '#fff' : '#000'};
                          width: 32px;
                          height: 32px;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          font-size: 16px;
                          font-weight: bold;
                          flex-shrink: 0;
                          border-radius: 50%;
                        ">
                          ${optionLetter}
                        </div>
                        <div style="
                          font-size: 14px;
                          line-height: 1.6;
                          color: ${isCorrect ? '#006600' : '#000'};
                          font-weight: ${isCorrect ? 'bold' : 'normal'};
                        ">
                          ${option}
                        </div>
                        ${isCorrect ? `<div style="color: #00aa00; font-size: 18px; margin-right: auto;">✓</div>` : ''}
                      </div>
                    `;
                  }).join('')}
                </div>
                
                <!-- Correct Answer Label -->
                <div style="
                  background: #00aa00;
                  color: #fff;
                  padding: 8px 15px;
                  font-size: 15px;
                  font-weight: bold;
                  margin-bottom: 10px;
                  border-radius: 5px;
                  text-align: center;
                ">
                  الإجابة الصحيحة: ${correctLetter}
                </div>
                
                <!-- Explanation -->
                <div style="
                  background: #fffbeb;
                  border: 2px solid #f59e0b;
                  border-right: 4px solid #f59e0b;
                  padding: 15px;
                  border-radius: 5px;
                ">
                  <div style="
                    color: #f59e0b;
                    font-weight: bold;
                    font-size: 15px;
                    margin-bottom: 8px;
                  ">
                    📖 الشرح:
                  </div>
                  <div style="
                    font-size: 14px;
                    line-height: 1.8;
                    color: #333;
                  ">
                    ${explanation}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
    
    return `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <style>
          @page { size: A4; margin: 10mm; }
          body { font-family: Arial; margin: 0; padding: 0; }
          .page { width: 210mm; min-height: 297mm; padding: 10mm; page-break-after: always; }
        </style>
      </head>
      <body>${pagesHtml}</body>
      </html>
    `;
  };

  const convertHtmlToPdfAndDownload = async (html: string, filename: string) => {
    setShowProgressDialog(true);
    setDownloadProgress(0);
    setDownloadMessage("جاري التحضير...");
    setDownloadTimeElapsed(0);

    const startTime = Date.now();
    const timeInterval = setInterval(() => {
      setDownloadTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    try {
      const pages = container.querySelectorAll('.page');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const totalPages = pages.length;
      
      setDownloadMessage(`جاري معالجة ${totalPages} صفحة...`);
      
      for (let i = 0; i < totalPages; i++) {
        const pageElement = pages[i] as HTMLElement;
        
        setDownloadMessage(`معالجة الصفحة ${i + 1} من ${totalPages}...`);
        setDownloadProgress(Math.floor(((i + 1) / totalPages) * 100));
        
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        const canvas = await html2canvas(pageElement, {
          scale: 1.0,
          useCORS: true,
          logging: false,
          windowWidth: 794,
          windowHeight: 1123,
          imageTimeout: 0,
          removeContainer: true,
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.75);
        
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
        
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      setDownloadMessage("جاري حفظ الملف...");
      setDownloadProgress(100);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      pdf.save(filename);
      
      clearInterval(timeInterval);
      setTimeout(() => {
        setShowProgressDialog(false);
      }, 500);
    } catch (error) {
      clearInterval(timeInterval);
      setShowProgressDialog(false);
      throw error;
    } finally {
      document.body.removeChild(container);
    }
  };

  if (examsLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
            <h3 className="text-xl font-bold">جاري تحضير النماذج...</h3>
            <p className="text-muted-foreground mt-2">
              يتم الآن إنشاء 36 نموذج فريد بدون تكرار
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              قد يستغرق هذا بضع ثوان...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (examsError) {
    console.error('Paper models error:', examsError);
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md border-red-200 bg-red-50 dark:bg-red-900/10">
            <CardContent className="p-6 text-center">
              <div className="text-red-600 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">
                خطأ في تحميل النماذج
              </h3>
              <p className="text-red-700 dark:text-red-300 mb-4">
                {examsError instanceof Error ? examsError.message : 'حدث خطأ أثناء تحميل النماذج'}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                يرجى تسجيل الدخول أولاً للوصول إلى النماذج الورقية
              </p>
              <Button 
                onClick={() => window.location.reload()} 
                className="bg-red-600 hover:bg-red-700"
              >
                إعادة المحاولة
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!exams || exams.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">لا توجد نماذج متاحة</h3>
              <p className="text-muted-foreground mb-4">
                لم يتم العثور على نماذج ورقية. جاري التحميل...
              </p>
              <Button onClick={() => window.location.reload()}>
                تحديث الصفحة
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
            نماذج الورقي
          </h1>
          <p className="text-xl text-muted-foreground">
            {exams.length} اختبار ورقي احترافي بدون تكرار
          </p>
          
          {/* Timer Controls */}
          {!examStarted && (
            <Card className="max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-emerald-600 dark:from-blue-900/20 dark:to-emerald-600/20 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-bold">مؤقت الاختبار</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  جرّب حل الاختبار في وقت محدد لمحاكاة الاختبار الحقيقي
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    onClick={() => startExamTimer('full')}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    بدء المؤقت - ساعتين (وقت حقيقي)
                  </Button>
                  <Button
                    onClick={() => startExamTimer('practice')}
                    variant="outline"
                    className="border-green-400 hover:bg-green-100 dark:hover:bg-green-100/20"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    تمرين سريع - 10 دقائق
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Statistics Cards */}
        {averages.totalExams > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Award className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">عدد الاختبارات</p>
                    <p className="text-2xl font-bold text-blue-600">{averages.totalExams}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-red-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">متوسط اللفظي</p>
                    <p className="text-2xl font-bold text-red-600">{averages.verbalAverage}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">متوسط الكمي</p>
                    <p className="text-2xl font-bold text-green-600">{averages.quantitativeAverage}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-600 to-emerald-600 dark:from-green-600/20 dark:to-emerald-600/20 border-green-400">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Award className="w-8 h-8 text-green-700" />
                  <div>
                    <p className="text-sm text-muted-foreground">المتوسط الإجمالي</p>
                    <p className="text-2xl font-bold text-green-700">{averages.totalAverage}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Exams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((exam) => {
            const result = getResult(exam.id);
            const completed = hasResult(exam.id);

            return (
              <Card 
                key={exam.id} 
                className={`border-2 hover:border-blue-400 transition-colors ${
                  completed ? 'bg-green-50 dark:bg-green-900/10 border-green-300' : ''
                }`}
                data-testid={`card-model-${exam.modelNumber}`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-6 h-6 text-blue-600" />
                      {exam.name}
                    </div>
                    {completed && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </CardTitle>
                  {downloadCounts[exam.modelNumber]?.total > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                      <Download className="w-3 h-3" />
                      <span>تم التنزيل {downloadCounts[exam.modelNumber].total} مرة</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {result ? (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-green-300 space-y-2">
                      <h4 className="font-bold text-center mb-2">النتيجة المسجلة</h4>
                      <div className="flex justify-between text-sm">
                        <span>اللفظي:</span>
                        <span className="font-bold text-red-600">
                          {result.verbalCorrect}/53 ({result.verbalPercentage}%)
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>الكمي:</span>
                        <span className="font-bold text-green-600">
                          {result.quantitativeCorrect}/47 ({result.quantitativePercentage}%)
                        </span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t">
                        <span>المجموع:</span>
                        <span className="font-bold text-green-700">
                          {result.totalPercentage}%
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>أسئلة لفظية:</span>
                          <span className="font-bold text-red-600">65 سؤال (12 تجريبي)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>أسئلة كمية:</span>
                          <span className="font-bold text-green-600">55 سؤال (8 تجريبي)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>المجموع:</span>
                          <span className="font-bold">120 سؤال</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Button
                          onClick={() => {
                            setSelectedExam(exam);
                            setShowResultDialog(true);
                          }}
                          variant="default"
                          className="w-full bg-gradient-to-r from-green-600 to-amber-600 hover:from-green-600 hover:to-amber-600"
                          data-testid={`button-enter-result-${exam.modelNumber}`}
                        >
                          <Award className="w-4 h-4 mr-2" />
                          إدخال النتيجة يدوياً
                        </Button>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Button
                      onClick={() => generateColoredAnswerKey(exam)}
                      disabled={loading[exam.id]}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      data-testid={`button-answer-key-${exam.modelNumber}`}
                    >
                      {loading[exam.id] ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          جاري التحميل...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          البابل شيت المحلول
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => generateQuestionsWithExplanations(exam)}
                      disabled={loading[exam.id]}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                      data-testid={`button-questions-explanations-${exam.modelNumber}`}
                    >
                      {loading[exam.id] ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          جاري التحميل...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          الأسئلة مع الشرح
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => generateFullExam(exam)}
                      disabled={loading[exam.id]}
                      variant="outline"
                      className="w-full"
                      data-testid={`button-full-exam-${exam.modelNumber}`}
                    >
                      {loading[exam.id] ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          جاري التحميل...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          الاختبار الكامل
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="space-y-2 text-sm">
                <p className="font-bold">ملاحظات مهمة:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>كل اختبار يحتوي على 120 سؤال فريد (لا تكرار بين الاختبارات)</li>
                  <li>البابل شيت المحلول: أحمر=لفظي، أخضر=كمي، أزرق=تجريبي</li>
                  <li>الاختبار الكامل: يبدأ بصفحتي بابل شيت ثم الأسئلة</li>
                  <li>التصميم أبيض وأسود فقط (موفر للحبر)</li>
                  <li>النتائج المحسوبة تستثني الأسئلة التجريبية (53 لفظي + 47 كمي = 100)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timer Bar - Fixed at bottom */}
      {examStarted && (
        <div className="fixed left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg bottom-16 md:bottom-0">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-3xl font-mono font-bold">
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-sm">
                  {timerMode === 'full' ? 'وقت الاختبار الحقيقي (ساعتين)' : 'وقت التمرين (10 دقائق)'}
                </div>
              </div>
              <Button
                onClick={stopExamTimer}
                variant="outline"
                size="sm"
                className="bg-white/20 hover:bg-white/30 border-white/40"
              >
                إيقاف المؤقت
              </Button>
            </div>
            <div className="mt-2 bg-white/20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-1000"
                style={{ 
                  width: `${(timeRemaining / (timerMode === 'full' ? 120 * 60 : 10 * 60)) * 100}%` 
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Download Progress Dialog */}
      <Dialog open={showProgressDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>جاري التحميل...</DialogTitle>
            <DialogDescription>
              الرجاء الانتظار حتى اكتمال التحميل
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
              <p className="text-lg font-medium mb-2">{downloadMessage}</p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>الوقت المستغرق:</span>
                <span className="font-mono font-bold">{downloadTimeElapsed}s</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>التقدم</span>
                <span className="font-bold">{downloadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-emerald-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-xs text-center text-muted-foreground">
                نصيحة: لا تغلق هذه النافذة حتى اكتمال التحميل
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Result Input Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إدخال نتيجة {selectedExam?.name}</DialogTitle>
            <DialogDescription>
              أدخل عدد الإجابات الصحيحة (بدون الأسئلة التجريبية)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                عدد الإجابات الصحيحة في القسم اللفظي (من 0 إلى 53)
              </label>
              <Input
                type="number"
                min="0"
                max="53"
                value={verbalCorrect}
                onChange={(e) => setVerbalCorrect(e.target.value)}
                placeholder="مثال: 45"
                data-testid="input-verbal-correct"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                عدد الإجابات الصحيحة في القسم الكمي (من 0 إلى 47)
              </label>
              <Input
                type="number"
                min="0"
                max="47"
                value={quantCorrect}
                onChange={(e) => setQuantCorrect(e.target.value)}
                placeholder="مثال: 40"
                data-testid="input-quant-correct"
              />
            </div>
            <Button
              onClick={handleSubmitResult}
              className="w-full"
              disabled={submitResultMutation.isPending}
              data-testid="button-submit-result"
            >
              {submitResultMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  حفظ النتيجة
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
