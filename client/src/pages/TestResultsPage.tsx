

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLocation } from 'wouter';
import MistakeChallengeModal from '@/components/MistakeChallengeModal';
import { 
  Trophy, 
  Clock, 
  BookText, 
  Calculator, 
  Star, 
  Target, 
  Award, 
  TrendingUp,
  Brain,
  Zap,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Download,
  Share2,
  Sparkles,
  Medal,
  Crown,
  Flame,
  Swords,
  Shield,
  Gamepad2,
  RefreshCw,
  FileDown,
  Palette,
  Code,
  Eye,
  ExternalLink,
  Gift,
  Lightbulb,
  Music,
  Rocket,
  Coffee,
  Heart,
  Layers,
  BookOpen,
  PenTool
} from 'lucide-react';

interface TestResult {
  testName?: string;
  subcategory?: string;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  timeSpent: number;
  date: string;
  answers?: Record<string, string>;
  questions?: any[];
  examType?: string;
  score?: number;
  timeTaken?: number;
}

export default function TestResultsPage() {
  const [, setLocation] = useLocation();
  const [result, setResult] = useState<TestResult | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleBackToRecords = () => {
    setLocation('/records');
  };

  const handleChallengeMode = (timed: boolean) => {
    if (!result) return;
    
    // تحضير بيانات الأخطاء للتحدي
    const wrongAnswers = [];
    if (result.answers && result.questions) {
      result.questions.forEach((question, index) => {
        const userAnswer = result.answers![index.toString()];
        const correctAnswer = question.correctOptionIndex?.toString() || question.correct_answer;
        if (userAnswer !== correctAnswer) {
          wrongAnswers.push({
            ...question,
            userAnswer,
            index
          });
        }
      });
    }

    // حفظ بيانات التحدي
    const challengeData = {
      type: 'mistake_challenge',
      mode: timed ? 'timed' : 'untimed',
      questions: wrongAnswers,
      originalTest: {
        testName: result.testName,
        subcategory: result.subcategory,
        originalScore: result.correctAnswers,
        originalTotal: result.totalQuestions
      },
      timeLimit: timed ? Math.max(wrongAnswers.length * 60, 300) : null // دقيقة لكل سؤال، بحد أدنى 5 دقائق
    };

    localStorage.setItem('mistakeChallenge', JSON.stringify(challengeData));
    setLocation('/mistake-challenge');
  };

  const getWrongAnswersCount = () => {
    if (!result || !result.answers || !result.questions) return 0;
    
    let wrongCount = 0;
    result.questions.forEach((question, index) => {
      const userAnswer = result.answers![index.toString()];
      const correctAnswer = question.correctOptionIndex?.toString() || question.correct_answer;
      if (userAnswer !== correctAnswer) {
        wrongCount++;
      }
    });
    return wrongCount;
  };

  const generateMistakesHTML = () => {
    if (!result || !result.answers || !result.questions) return '';

    const wrongAnswers = [];
    result.questions.forEach((question, index) => {
      const userAnswer = result.answers![index.toString()];
      const correctAnswer = question.correctOptionIndex?.toString() || question.correct_answer;
      if (userAnswer !== correctAnswer) {
        wrongAnswers.push({
          ...question,
          userAnswer: userAnswer || 'لم يتم الإجابة',
          userAnswerText: question.options ? question.options[parseInt(userAnswer || '0')] || 'لم يتم الإجابة' : 'لم يتم الإجابة',
          correctAnswerText: question.options ? question.options[question.correctOptionIndex] : 'غير متوفر',
          questionNumber: index + 1
        });
      }
    });

    const currentDate = new Date().toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقرير الأخطاء - ${result.testName}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Tajawal', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
            color: #333;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 30px 60px rgba(0,0,0,0.3);
            overflow: hidden;
            position: relative;
        }
        
        .header {
            background: linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3);
            background-size: 400% 400%;
            animation: gradientShift 8s ease infinite;
            padding: 40px;
            text-align: center;
            color: white;
            position: relative;
            overflow: hidden;
        }
        
        @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
            background-size: 30px 30px;
            animation: floating 20s linear infinite;
        }
        
        @keyframes floating {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        .header h1 {
            font-size: 3rem;
            font-weight: 900;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            position: relative;
            z-index: 1;
        }
        
        .header .emoji {
            font-size: 4rem;
            margin-bottom: 20px;
            animation: bounce 2s infinite;
        }
        
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 40px;
            background: linear-gradient(45deg, #f8f9fa, #e9ecef);
        }
        
        .stat-card {
            background: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            border: 3px solid transparent;
            background-clip: padding-box;
            position: relative;
            transition: transform 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
        }
        
        .stat-card::before {
            content: '';
            position: absolute;
            top: -3px;
            left: -3px;
            right: -3px;
            bottom: -3px;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
            border-radius: 18px;
            z-index: -1;
        }
        
        .stat-number {
            font-size: 2.5rem;
            font-weight: 900;
            color: #ff6b6b;
            margin-bottom: 10px;
        }
        
        .stat-label {
            font-size: 1.1rem;
            color: #666;
            font-weight: 500;
        }
        
        .questions-container {
            padding: 40px;
        }
        
        .section-title {
            font-size: 2.5rem;
            font-weight: 700;
            text-align: center;
            margin-bottom: 40px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .question-card {
            background: white;
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
            border-left: 6px solid #ff6b6b;
            position: relative;
            overflow: hidden;
        }
        
        .question-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb);
        }
        
        .question-number {
            position: absolute;
            top: -10px;
            right: 20px;
            background: linear-gradient(135deg, #ff6b6b, #ff8e53);
            color: white;
            padding: 10px 20px;
            border-radius: 0 0 15px 15px;
            font-weight: 700;
            font-size: 1.1rem;
        }
        
        .question-text {
            font-size: 1.3rem;
            font-weight: 600;
            margin-bottom: 20px;
            margin-top: 20px;
            color: #333;
            line-height: 1.6;
        }
        
        .answers-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .answer-section {
            padding: 20px;
            border-radius: 15px;
            position: relative;
        }
        
        .user-answer {
            background: linear-gradient(135deg, #ff6b6b20, #ff8e5320);
            border: 2px solid #ff6b6b;
        }
        
        .correct-answer {
            background: linear-gradient(135deg, #4ecdc420, #44a08d20);
            border: 2px solid #4ecdc4;
        }
        
        .answer-label {
            font-weight: 700;
            font-size: 1.1rem;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .answer-text {
            font-size: 1.1rem;
            font-weight: 500;
            color: #555;
        }
        
        .explanation {
            background: linear-gradient(135deg, #667eea20, #764ba220);
            border: 2px solid #667eea;
            border-radius: 15px;
            padding: 20px;
            margin-top: 20px;
        }
        
        .explanation h4 {
            color: #667eea;
            font-weight: 700;
            margin-bottom: 10px;
            font-size: 1.2rem;
        }
        
        .explanation p {
            color: #555;
            line-height: 1.6;
            font-size: 1rem;
        }
        
        .footer {
            background: linear-gradient(135deg, #2c3e50, #3498db);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .footer h3 {
            font-size: 2rem;
            margin-bottom: 20px;
        }
        
        .tips {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        
        .tip {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        
        .tip h4 {
            font-size: 1.2rem;
            margin-bottom: 10px;
            color: #ecf0f1;
        }
        
        .tip p {
            color: #bdc3c7;
            line-height: 1.5;
        }
        
        .emoji-icon {
            font-size: 1.5rem;
            margin-left: 10px;
        }
        
        .date-stamp {
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(255,255,255,0.9);
            padding: 10px 20px;
            border-radius: 25px;
            font-weight: 600;
            color: #333;
            font-size: 0.9rem;
        }
        
        .decoration {
            position: absolute;
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: linear-gradient(45deg, rgba(255,107,107,0.3), rgba(72,219,251,0.3));
            animation: float 6s ease-in-out infinite;
        }
        
        .decoration:nth-child(1) { top: 10%; right: 10%; animation-delay: 0s; }
        .decoration:nth-child(2) { bottom: 10%; left: 10%; animation-delay: 2s; }
        .decoration:nth-child(3) { top: 50%; right: 5%; animation-delay: 4s; }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
        }
        
        @media print {
            body { background: white; }
            .container { box-shadow: none; }
            .decoration { display: none; }
        }
        
        @media (max-width: 768px) {
            .answers-grid { grid-template-columns: 1fr; }
            .header h1 { font-size: 2rem; }
            .stats { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="decoration"></div>
        <div class="decoration"></div>
        <div class="decoration"></div>
        
        <div class="date-stamp">${currentDate}</div>
        
        <div class="header">
            <div class="emoji">🎯</div>
            <h1>تقرير مراجعة الأخطاء</h1>
            <p style="font-size: 1.3rem; opacity: 0.9; position: relative; z-index: 1;">
                ${result.testName} - ${result.subcategory}
            </p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${wrongAnswers.length}</div>
                <div class="stat-label">إجمالي الأخطاء</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${result.totalQuestions}</div>
                <div class="stat-label">إجمالي الأسئلة</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${result.correctAnswers}</div>
                <div class="stat-label">الإجابات الصحيحة</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${result.percentage}%</div>
                <div class="stat-label">النسبة المئوية</div>
            </div>
        </div>
        
        <div class="questions-container">
            <h2 class="section-title">📝 تفاصيل الأخطاء للمراجعة</h2>
            
            ${wrongAnswers.map((question, index) => `
                <div class="question-card">
                    <div class="question-number">السؤال ${question.questionNumber}</div>
                    <div class="question-text">${question.text}</div>
                    
                    <div class="answers-grid">
                        <div class="answer-section user-answer">
                            <div class="answer-label">
                                <span class="emoji-icon">❌</span>
                                إجابتك
                            </div>
                            <div class="answer-text">${question.userAnswerText}</div>
                        </div>
                        
                        <div class="answer-section correct-answer">
                            <div class="answer-label">
                                <span class="emoji-icon">✅</span>
                                الإجابة الصحيحة
                            </div>
                            <div class="answer-text">${question.correctAnswerText}</div>
                        </div>
                    </div>
                    
                    ${question.explanation ? `
                        <div class="explanation">
                            <h4>💡 الشرح والتوضيح</h4>
                            <p>${question.explanation}</p>
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
        
        <div class="footer">
            <h3>🚀 نصائح للتحسن</h3>
            <div class="tips">
                <div class="tip">
                    <h4>📚 المراجعة المستمرة</h4>
                    <p>راجع هذه الأخطاء بانتظام وحاول فهم السبب وراء كل خطأ لتجنبه في المستقبل.</p>
                </div>
                <div class="tip">
                    <h4>⏰ التدريب المنتظم</h4>
                    <p>خصص 30 دقيقة يومياً للتدريب على الأسئلة المشابهة لهذه الأخطاء.</p>
                </div>
                <div class="tip">
                    <h4>🎯 التركيز على نقاط الضعف</h4>
                    <p>حدد الأنماط في أخطائك وركز على تقوية هذه المجالات بشكل خاص.</p>
                </div>
                <div class="tip">
                    <h4>💪 الممارسة العملية</h4>
                    <p>حل المزيد من الأسئلة المشابهة واستخدم استراتيجيات مختلفة للوصول للحل.</p>
                </div>
            </div>
            
            <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid rgba(255,255,255,0.3);">
                <p style="font-size: 1.2rem; opacity: 0.8;">
                    تم إنشاء هذا التقرير بواسطة منصة <strong>قدراتك</strong> 🌟
                </p>
                <p style="font-size: 1rem; opacity: 0.6; margin-top: 10px;">
                    منصة شاملة لتطوير القدرات والاستعداد للاختبارات المعيارية
                </p>
            </div>
        </div>
    </div>
</body>
</html>`;
  };

  const downloadMistakesHTML = () => {
    const htmlContent = generateMistakesHTML();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `اخطاء-${result?.testName || 'الاختبار'}-${new Date().toLocaleDateString('ar-EG')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const wrongAnswersCount = getWrongAnswersCount();

  useEffect(() => {
    console.log('TestResultsPage: Checking for stored result...');
    
    const possibleKeys = ['lastTestResult', 'currentTestResult', 'testResult'];
    let foundResult = null;
    
    for (const key of possibleKeys) {
      const storedResult = localStorage.getItem(key);
      console.log(`Checking key '${key}':`, storedResult);
      
      if (storedResult) {
        try {
          foundResult = JSON.parse(storedResult);
          console.log('Found result:', foundResult);
          break;
        } catch (error) {
          console.error(`Error parsing result from key '${key}':`, error);
        }
      }
    }
    
    if (foundResult) {
      // تنسيق البيانات لضمان التوافق
      const formattedResult: TestResult = {
        testName: foundResult.testName || 'اختبار القدرات',
        subcategory: foundResult.subcategory || foundResult.examType || 'عام',
        totalQuestions: foundResult.totalQuestions || foundResult.questions?.length || 0,
        correctAnswers: foundResult.correctAnswers || foundResult.score || 0,
        percentage: foundResult.percentage || (foundResult.correctAnswers && foundResult.totalQuestions ? Math.round((foundResult.correctAnswers / foundResult.totalQuestions) * 100) : 0),
        timeSpent: foundResult.timeSpent || foundResult.timeTaken || 0,
        date: foundResult.date || new Date().toISOString(),
        examType: foundResult.examType || 'verbal',
        answers: foundResult.answers,
        questions: foundResult.questions
      };
      
      setResult(formattedResult);
      
      // إظهار تأثير الكونفيتي إذا كانت النتيجة جيدة
      if (formattedResult.percentage >= 80) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    } else {
      // محاولة إنشاء نتيجة من URL params
      const urlParams = new URLSearchParams(window.location.search);
      const score = urlParams.get('score');
      const total = urlParams.get('total');
      const examType = urlParams.get('examType');
      const timeTaken = urlParams.get('timeTaken');
      
      if (score && total) {
        const mockResult: TestResult = {
          testName: 'اختبار القدرات',
          subcategory: examType === 'verbal' ? 'لفظي' : 'كمي',
          totalQuestions: parseInt(total),
          correctAnswers: parseInt(score),
          percentage: Math.round((parseInt(score) / parseInt(total)) * 100),
          timeSpent: timeTaken ? parseInt(timeTaken) : 0,
          date: new Date().toISOString(),
          examType: examType || 'verbal'
        };
        setResult(mockResult);
      }
    }

    // إيقاف الأنيميشن بعد ثانيتين
    setTimeout(() => setIsAnimating(false), 2000);
  }, []);

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-6"
          >
            <Clock className="h-10 w-10 text-white" />
          </motion.div>
          
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
            لا توجد نتيجة للعرض
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            يبدو أن بيانات النتيجة غير متوفرة. قد يكون السبب انتهاء صلاحية البيانات أو عدم إكمال الاختبار بشكل صحيح.
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={handleBackToRecords} 
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Trophy className="w-4 h-4 mr-2" />
              العودة لسجل الاختبارات
            </Button>
            
            <Button 
              onClick={() => setLocation('/verbal-tests')} 
              variant="outline"
              className="w-full border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Zap className="w-4 h-4 mr-2" />
              إجراء اختبار جديد
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { level: 'متفوق', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Crown, gradient: 'from-emerald-400 to-emerald-600' };
    if (percentage >= 80) return { level: 'ممتاز', color: 'text-blue-600', bg: 'bg-blue-50', icon: Medal, gradient: 'from-blue-400 to-blue-600' };
    if (percentage >= 70) return { level: 'جيد جداً', color: 'text-green-600', bg: 'bg-green-50', icon: Award, gradient: 'from-green-400 to-green-600' };
    if (percentage >= 60) return { level: 'جيد', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Star, gradient: 'from-yellow-400 to-yellow-600' };
    if (percentage >= 50) return { level: 'مقبول', color: 'text-orange-600', bg: 'bg-orange-50', icon: Target, gradient: 'from-orange-400 to-orange-600' };
    return { level: 'يحتاج تحسين', color: 'text-red-600', bg: 'bg-red-50', icon: AlertCircle, gradient: 'from-red-400 to-red-600' };
  };

  const getTimeFormatted = (seconds: number) => {
    if (seconds === 0) {
      return 'أقل من ثانية';
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      if (remainingSeconds > 0) {
        return `${minutes} دقيقة و ${remainingSeconds} ثانية`;
      } else {
        return `${minutes} دقيقة`;
      }
    }
    return `${seconds} ثانية`;
  };

  const performance = getPerformanceLevel(result.percentage);
  const PerformanceIcon = performance.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 relative overflow-hidden">
      {/* خلفية متحركة محسنة */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 6 + 2,
              height: Math.random() * 6 + 2,
              backgroundColor: `hsl(${Math.random() * 360}, 70%, 70%)`,
              opacity: 0.3,
            }}
            animate={{
              x: [0, Math.random() * 200 - 100, 0],
              y: [0, Math.random() * 200 - 100, 0],
              scale: [1, Math.random() * 2 + 0.5, 1],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: Math.random() * 10 + 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* تأثير الكونفيتي */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
                  left: `${Math.random() * 100}%`,
                  top: '-10px',
                }}
                initial={{ y: -50, rotate: 0 }}
                animate={{ 
                  y: window.innerHeight + 50, 
                  rotate: 360,
                  x: Math.random() * 200 - 100
                }}
                transition={{ 
                  duration: Math.random() * 3 + 2,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* العنوان الرئيسي المحسن */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <motion.div
              animate={isAnimating ? { rotate: 360, scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 1.5, repeat: isAnimating ? Infinity : 0 }}
              className="relative"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center shadow-2xl">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 flex items-center justify-center"
              >
                <Sparkles className="w-4 h-4 text-white" />
              </motion.div>
            </motion.div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                🎯 نتيجة الاختبار
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mt-2">
                {result.testName || 'اختبار القدرات'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* البطاقة الرئيسية للنتيجة المحسنة */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-8 overflow-hidden shadow-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-2 border-white/30">
            {/* شريط الأداء العلوي المتحرك */}
            <motion.div
              className={`h-4 bg-gradient-to-r ${performance.gradient}`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.5, delay: 0.5 }}
            />

            <CardHeader className="text-center pb-4 relative">
              <div className="absolute top-4 right-4">
                <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                  {new Date(result.date).toLocaleDateString('ar-EG')}
                </Badge>
              </div>
              
              <div className="flex items-center justify-center gap-4 mb-6">
                <motion.div
                  animate={{ scale: [1, 1.1, 1], rotateY: [0, 360, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className={`w-24 h-24 rounded-full ${performance.bg} flex items-center justify-center relative overflow-hidden`}
                >
                  <PerformanceIcon className={`w-12 h-12 ${performance.color}`} />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: [-100, 100] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  />
                </motion.div>
              </div>
              
              <CardTitle className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                {result.correctAnswers}/{result.totalQuestions}
              </CardTitle>
              
              <motion.div
                className={`text-4xl font-bold ${performance.color} mb-4`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, type: "spring", stiffness: 200 }}
              >
                {result.percentage}%
              </motion.div>
              
              <Badge className={`${performance.bg} ${performance.color} text-xl px-6 py-3 border-2 shadow-lg`}>
                {performance.level}
              </Badge>
            </CardHeader>

            <CardContent>
              {/* شريط التقدم المتحرك المحسن */}
              <div className="mb-8">
                <div className="relative">
                  <Progress 
                    value={result.percentage} 
                    className="h-6 bg-gray-200 dark:bg-gray-700"
                  />
                  <motion.div
                    className="absolute top-0 left-0 h-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${result.percentage}%` }}
                    transition={{ duration: 2, delay: 0.5 }}
                  />
                </div>
                <div className="flex justify-between mt-3 text-sm text-gray-500 dark:text-gray-400">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* إحصائيات مفصلة محسنة */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                      {result.subcategory === 'التناظر اللفظي' || result.examType === 'verbal' ? (
                        <BookText className="w-7 h-7 text-white" />
                      ) : (
                        <Calculator className="w-7 h-7 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">نوع الاختبار</div>
                      <div className="font-bold text-lg">
                        {result.subcategory || (result.examType === 'verbal' ? 'لفظي' : 'كمي')}
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-2xl border border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Clock className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">الوقت المستغرق</div>
                      <div className="font-bold text-lg">
                        {result.timeSpent >= 0 ? getTimeFormatted(result.timeSpent) : 'غير محدد'}
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-2xl border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                      <BarChart3 className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">معدل الإجابة</div>
                      <div className="font-bold text-lg">
                        {result.totalQuestions > 0 ? `${Math.round((result.correctAnswers / result.totalQuestions) * 100)}%` : '0%'}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* رسائل تحفيزية محسنة */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className={`${performance.bg} rounded-2xl p-6 border-2 border-dashed mb-8 relative overflow-hidden`}
              >
                <motion.div
                  className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                  animate={{ x: [-100, 200] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                />
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 ${performance.color.replace('text-', 'bg-').replace('-600', '-500')} rounded-xl flex items-center justify-center shadow-lg`}>
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold text-xl ${performance.color} mb-3`}>
                      {result.percentage >= 90 ? 'إنجاز استثنائي! 🎉✨' :
                       result.percentage >= 80 ? 'أداء ممتاز! 👏🌟' :
                       result.percentage >= 70 ? 'عمل رائع! 💪🔥' :
                       result.percentage >= 60 ? 'تقدم جيد! 📈⭐' :
                       result.percentage >= 50 ? 'بداية إيجابية! 🌟💫' :
                       'لا تيأس، استمر في المحاولة! 💯🚀'}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {result.percentage >= 90 ? 'أداؤك متفوق ويضعك في المقدمة. استمر في هذا المستوى الرائع وكن مصدر إلهام للآخرين!' :
                       result.percentage >= 80 ? 'أداء ممتاز يظهر فهماً عميقاً للمادة. أنت على الطريق الصحيح نحو التميز!' :
                       result.percentage >= 70 ? 'أداء جيد جداً يدل على استيعاب قوي. بقليل من التحسين ستصل للتميز بإذن الله!' :
                       result.percentage >= 60 ? 'أداء جيد يظهر تقدماً واضحاً. ركز على نقاط الضعف للوصول لمستوى أفضل!' :
                       result.percentage >= 50 ? 'بداية مقبولة تحتاج لمزيد من التدريب. لا تتوقف، النجاح يحتاج للمثابرة والصبر!' :
                       'لا تقلق، كل خبير كان مبتدئاً يوماً ما. راجع الأخطاء وتدرب أكثر، والنجاح حليفك!'}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* الأزرار المحسنة */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    onClick={handleBackToRecords}
                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 text-white px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 group"
                  >
                    <Trophy className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                    عرض سجل الاختبارات
                  </Button>
                </motion.div>

                {/* زر تحدي الأخطاء المحسن */}
                {wrongAnswersCount > 0 && (
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                  >
                    <Button
                      onClick={() => setIsChallengeModalOpen(true)}
                      className="relative bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 hover:from-red-600 hover:via-orange-600 hover:to-yellow-600 text-white px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{ x: [-100, 200] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      />
                      <div className="relative flex items-center gap-2">
                        <Swords className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        <span>تحدي الأخطاء</span>
                        <Badge className="bg-white/20 text-white text-xs px-2 py-1 animate-pulse">
                          {wrongAnswersCount}
                        </Badge>
                      </div>
                    </Button>
                  </motion.div>
                )}

                {/* زر تحميل الأخطاء HTML الجديد */}
                {wrongAnswersCount > 0 && (
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4 }}
                  >
                    <Button
                      onClick={downloadMistakesHTML}
                      className="relative bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{ x: [-100, 200] }}
                        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4 }}
                      />
                      <div className="relative flex items-center gap-2">
                        <FileDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                        <span>تحميل تقرير الأخطاء</span>
                        <Code className="w-4 h-4 opacity-70" />
                      </div>
                    </Button>
                  </motion.div>
                )}

                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => setLocation('/verbal-tests')}
                    variant="outline"
                    className="border-2 border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-8 py-4 text-lg transition-all duration-300 group"
                  >
                    <Flame className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    اختبار جديد
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* نصائح للتحسين المحسنة */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-2 border-indigo-200 dark:border-indigo-800 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Brain className="w-7 h-7 text-indigo-600" />
                💡 نصائح ذكية لتحسين الأداء
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {[
                    { icon: BookOpen, text: 'راجع الإجابات الخاطئة وافهم أسباب الخطأ بعمق' },
                    { icon: Clock, text: 'تدرب يومياً لمدة 30 دقيقة على الأقل بانتظام' },
                    { icon: Target, text: 'استخدم تقنيات إدارة الوقت أثناء الاختبار' }
                  ].map((tip, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1 + index * 0.1 }}
                      className="flex items-start gap-3 p-3 bg-white/50 rounded-lg hover:bg-white/70 transition-all duration-300"
                    >
                      <tip.icon className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{tip.text}</span>
                    </motion.div>
                  ))}
                </div>
                <div className="space-y-4">
                  {[
                    { icon: TrendingUp, text: 'ركز على نقاط الضعف في التدريب القادم' },
                    { icon: Lightbulb, text: 'اطلع على استراتيجيات حل الأسئلة المختلفة' },
                    { icon: Heart, text: 'احرص على النوم الكافي قبل الاختبارات' }
                  ].map((tip, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.3 + index * 0.1 }}
                      className="flex items-start gap-3 p-3 bg-white/50 rounded-lg hover:bg-white/70 transition-all duration-300"
                    >
                      <tip.icon className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{tip.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Modal تحدي الأخطاء */}
        <MistakeChallengeModal
          isOpen={isChallengeModalOpen}
          onClose={() => setIsChallengeModalOpen(false)}
          onSelectMode={handleChallengeMode}
        />
      </div>
    </div>
  );
}

