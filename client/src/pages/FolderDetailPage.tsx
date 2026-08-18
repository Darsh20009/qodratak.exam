import React from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Play, 
  Clock, 
  FileText, 
  ArrowLeft,
  Eye,
  BookOpen,
  Timer,
  Award,
  Star,
  Heart,
  Plus,
  Search,
  Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface Question {
  id: number;
  text: string;
  category: string;
  subcategory: string;
  difficulty: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
}

interface Folder {
  id: number;
  name: string;
  description: string;
  color: string;
  icon: string;
  userId: number;
  createdAt?: string;
}

export default function FolderDetailPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const folderId = location.split('/folders/')[1]?.split('?')[0]; // Remove query params if any
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedQuestions, setSelectedQuestions] = React.useState<number[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = React.useState<string>("all");

  // Folder data
  const { data: folder, isLoading: folderLoading } = useQuery<Folder>({
    queryKey: [`/api/folders/${folderId}`],
    enabled: !!folderId
  });

  // Folder questions
  const { data: questions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: [`/api/folders/${folderId}/questions`],
    enabled: !!folderId
  });

  // All available questions from library
  const { data: allQuestions = [], isLoading: allQuestionsLoading } = useQuery<Question[]>({
    queryKey: ['/api/questions'],
    enabled: isDialogOpen
  });

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (!Array.isArray(questions) || !questions.length) {
      return {
        totalQuestions: 0,
        verbalQuestions: 0,
        quantitativeQuestions: 0,
        difficultyBreakdown: { easy: 0, medium: 0, hard: 0 }
      };
    }

    const verbal = questions.filter((q: any) => q.category === 'verbal').length;
    const quantitative = questions.filter((q: any) => q.category === 'quantitative').length;
    
    const easy = questions.filter((q: any) => q.difficulty === 'easy').length;
    const medium = questions.filter((q: any) => q.difficulty === 'medium').length;
    const hard = questions.filter((q: any) => q.difficulty === 'hard').length;

    return {
      totalQuestions: questions.length,
      verbalQuestions: verbal,
      quantitativeQuestions: quantitative,
      difficultyBreakdown: { easy, medium, hard }
    };
  }, [questions]);

  // Filter available questions
  const filteredQuestions = React.useMemo(() => {
    if (!Array.isArray(allQuestions)) return [];
    
    return allQuestions.filter(q => {
      // Filter by category
      if (categoryFilter !== "all" && q.category !== categoryFilter) return false;
      
      // Filter by difficulty
      if (difficultyFilter !== "all" && q.difficulty !== difficultyFilter) return false;
      
      // Filter by search query
      if (searchQuery && !q.text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      
      // Exclude already added questions
      if (questions.some((fq: Question) => fq.id === q.id)) return false;
      
      return true;
    });
  }, [allQuestions, categoryFilter, difficultyFilter, searchQuery, questions]);

  // Add questions mutation
  const addQuestionsMutation = useMutation({
    mutationFn: async (questionIds: number[]) => {
      const promises = questionIds.map(async (questionId) => {
        const response = await fetch(`/api/folders/${folderId}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId })
        });
        if (!response.ok) throw new Error('Failed to add question');
        return response.json();
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/folders/${folderId}/questions`] });
      setSelectedQuestions([]);
      setIsDialogOpen(false);
      toast({
        title: "تمت الإضافة بنجاح",
        description: `تم إضافة ${selectedQuestions.length} سؤال للمجلد`
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إضافة الأسئلة",
        variant: "destructive"
      });
    }
  });

  const handleToggleQuestion = (questionId: number) => {
    setSelectedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleAddQuestions = () => {
    if (selectedQuestions.length === 0) {
      toast({
        title: "تنبيه",
        description: "الرجاء اختيار سؤال واحد على الأقل",
        variant: "destructive"
      });
      return;
    }
    addQuestionsMutation.mutate(selectedQuestions);
  };

  // Generate creative HTML test
  const generateCreativeTest = (withTimer = false) => {
    if (!Array.isArray(questions) || !questions.length) {
      toast({
        title: "لا توجد أسئلة",
        description: "يجب إضافة أسئلة للمجلد أولاً",
        variant: "destructive"
      });
      return;
    }

    const timePerQuestion = withTimer ? 60 : 0; // 1 minute per question
    const totalTime = withTimer ? questions.length * 60 : 0;

    const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>اختبار ${(folder as Folder)?.name || 'مخصص'}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Cairo', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        
        .container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 30px;
            text-align: center;
            margin-bottom: 30px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        
        .title {
            font-size: 2.5rem;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }
        
        .timer {
            font-size: 1.8rem;
            font-weight: 600;
            color: #e74c3c;
            margin: 20px 0;
            ${!withTimer ? 'display: none;' : ''}
        }
        
        .question-card {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
        }
        
        .question-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        }
        
        .question-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .question-number {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 10px 20px;
            border-radius: 50px;
            font-weight: 600;
        }
        
        .question-category {
            background: #f8f9fa;
            color: #495057;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9rem;
        }
        
        .question-text {
            font-size: 1.3rem;
            font-weight: 600;
            margin-bottom: 25px;
            line-height: 1.6;
            color: #2c3e50;
        }
        
        .options {
            display: grid;
            gap: 15px;
        }
        
        .option {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 15px;
            padding: 15px 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 1.1rem;
        }
        
        .option:hover {
            background: #e3f2fd;
            border-color: #2196f3;
        }
        
        .option.selected {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border-color: #667eea;
        }
        
        .controls {
            text-align: center;
            margin: 30px 0;
        }
        
        .btn {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 50px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            margin: 0 10px;
            transition: all 0.3s ease;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        
        .results {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 30px;
            text-align: center;
            display: none;
        }
        
        .score {
            font-size: 3rem;
            font-weight: 700;
            margin: 20px 0;
        }
        
        .score.excellent { color: #27ae60; }
        .score.good { color: #f39c12; }
        .score.poor { color: #e74c3c; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">اختبار ${(folder as Folder)?.name || 'مخصص'}</h1>
            <p>عدد الأسئلة: ${questions.length}</p>
            ${withTimer ? `<div class="timer" id="timer">الوقت المتبقي: ${Math.floor(totalTime / 60)}:00</div>` : ''}
        </div>
        
        <div id="test-container">
            ${questions.map((q: any, index: number) => `
                <div class="question-card" data-question="${index}">
                    <div class="question-header">
                        <div class="question-number">السؤال ${index + 1}</div>
                        <div class="question-category">${q.category === 'verbal' ? 'لفظي' : 'كمي'} - ${q.subcategory}</div>
                    </div>
                    <div class="question-text">${q.text}</div>
                    <div class="options">
                        ${q.options.map((option: string, optIndex: number) => `
                            <div class="option" onclick="selectOption(${index}, ${optIndex})" data-option="${optIndex}">
                                ${String.fromCharCode(65 + optIndex)}) ${option}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="controls">
            <button class="btn" onclick="submitTest()">انهاء الاختبار</button>
        </div>
        
        <div class="results" id="results">
            <h2>نتائج الاختبار</h2>
            <div class="score" id="score"></div>
            <div id="details"></div>
        </div>
    </div>

    <script>
        let answers = {};
        let startTime = Date.now();
        ${withTimer ? `let timeLeft = ${totalTime};` : ''}
        
        function selectOption(questionIndex, optionIndex) {
            const questionCard = document.querySelector(\`[data-question="\${questionIndex}"]\`);
            const options = questionCard.querySelectorAll('.option');
            
            options.forEach(opt => opt.classList.remove('selected'));
            options[optionIndex].classList.add('selected');
            
            answers[questionIndex] = optionIndex;
        }
        
        function submitTest() {
            const correct = ${JSON.stringify(questions.map((q: any) => q.correctOptionIndex))};
            let score = 0;
            
            Object.keys(answers).forEach(qIndex => {
                if (answers[qIndex] === correct[qIndex]) {
                    score++;
                }
            });
            
            const percentage = Math.round((score / ${questions.length}) * 100);
            const timeTaken = Math.round((Date.now() - startTime) / 1000);
            
            document.getElementById('test-container').style.display = 'none';
            document.querySelector('.controls').style.display = 'none';
            const resultsDiv = document.getElementById('results');
            resultsDiv.style.display = 'block';
            
            const scoreDiv = document.getElementById('score');
            scoreDiv.textContent = percentage + '%';
            
            if (percentage >= 80) scoreDiv.className = 'score excellent';
            else if (percentage >= 60) scoreDiv.className = 'score good';
            else scoreDiv.className = 'score poor';
            
            document.getElementById('details').innerHTML = \`
                <p>الدرجة: \${score} من \${${questions.length}}</p>
                <p>الوقت المستغرق: \${Math.floor(timeTaken / 60)}:\${(timeTaken % 60).toString().padStart(2, '0')}</p>
                <p>الأسئلة الصحيحة: \${score}</p>
                <p>الأسئلة الخاطئة: \${${questions.length} - score}</p>
            \`;
        }
        
        ${withTimer ? `
        function updateTimer() {
            if (timeLeft <= 0) {
                submitTest();
                return;
            }
            
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            document.getElementById('timer').textContent = 
                \`الوقت المتبقي: \${minutes}:\${seconds.toString().padStart(2, '0')}\`;
            
            timeLeft--;
        }
        
        setInterval(updateTimer, 1000);
        ` : ''}
    </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `اختبار_${(folder as Folder)?.name || 'مخصص'}_${withTimer ? 'بوقت_محدد' : 'بدون_وقت'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "تم التحميل بنجاح",
      description: `تم إنشاء اختبار ${withTimer ? 'بوقت محدد' : 'بدون وقت'} وتحميله`,
    });
  };

  // Download questions as HTML
  const downloadQuestions = () => {
    if (!Array.isArray(questions) || !questions.length) {
      toast({
        title: "لا توجد أسئلة",
        description: "يجب إضافة أسئلة للمجلد أولاً",
        variant: "destructive"
      });
      return;
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>أسئلة ${(folder as Folder)?.name || 'المجلد'}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Cairo', sans-serif;
            background: #f8f9fa;
            color: #333;
            line-height: 1.6;
            padding: 20px;
        }
        
        .container {
            max-width: 900px;
            margin: 0 auto;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            margin-bottom: 30px;
        }
        
        .question {
            background: white;
            border-radius: 10px;
            padding: 25px;
            margin-bottom: 20px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        .question-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
        }
        
        .question-number {
            background: #667eea;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: 600;
        }
        
        .question-category {
            background: #e3f2fd;
            color: #1976d2;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9rem;
        }
        
        .question-text {
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 15px;
            color: #2c3e50;
        }
        
        .options {
            margin-bottom: 15px;
        }
        
        .option {
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        
        .option.correct {
            background: #e8f5e8;
            color: #2e7d32;
            font-weight: 600;
            padding: 10px;
            border-radius: 5px;
            border: none;
            margin: 5px 0;
        }
        
        .explanation {
            background: #f0f7ff;
            padding: 15px;
            border-radius: 8px;
            margin-top: 10px;
            border-right: 4px solid #2196f3;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>أسئلة ${(folder as Folder)?.name || 'المجلد'}</h1>
            <p>العدد الكلي: ${questions.length} سؤال</p>
        </div>
        
        ${questions.map((q: any, index: number) => `
            <div class="question">
                <div class="question-header">
                    <div class="question-number">السؤال ${index + 1}</div>
                    <div class="question-category">${q.category === 'verbal' ? 'لفظي' : 'كمي'} - ${q.subcategory}</div>
                </div>
                <div class="question-text">${q.text}</div>
                <div class="options">
                    ${q.options.map((option: string, optIndex: number) => `
                        <div class="option ${optIndex === q.correctOptionIndex ? 'correct' : ''}">
                            ${String.fromCharCode(65 + optIndex)}) ${option}
                            ${optIndex === q.correctOptionIndex ? ' ✓' : ''}
                        </div>
                    `).join('')}
                </div>
                ${q.explanation ? `<div class="explanation"><strong>الشرح:</strong> ${q.explanation}</div>` : ''}
            </div>
        `).join('')}
    </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `أسئلة_${(folder as Folder)?.name || 'المجلد'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "تم التحميل بنجاح",
      description: "تم تحميل ملف HTML يحتوي على جميع الأسئلة والإجابات",
    });
  };

  if (folderLoading || questionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">جاري تحميل المجلد...</p>
        </div>
      </div>
    );
  }

  if (!folderId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">معرف المجلد غير صحيح</h2>
          <Button onClick={() => navigate('/folders')}>العودة للمجلدات</Button>
        </div>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">مجلد غير موجود</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">المجلد رقم {folderId} غير موجود</p>
          <Button onClick={() => navigate('/folders')}>العودة للمجلدات</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="outline" 
              onClick={() => navigate('/folders')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              العودة للمجلدات
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-emerald-600 rounded-3xl blur-2xl opacity-20"></div>
            <Card className="relative bg-white dark:bg-gray-800 border-0">
              <CardHeader className="text-center pb-8">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl"
                    style={{ backgroundColor: (folder as Folder)?.color || '#4f46e5' }}
                  >
                    {(folder as Folder)?.icon === 'star' ? <Star /> : (folder as Folder)?.icon === 'heart' ? <Heart /> : <BookOpen />}
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  {(folder as Folder)?.name}
                </CardTitle>
                <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                  {(folder as Folder)?.description || 'مجموعة أسئلة مختارة بعناية'}
                </p>
              </CardHeader>
            </Card>
          </div>
        </motion.div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-br from-blue-50 to-teal-500 dark:from-blue-900/20 dark:to-teal-500/20">
            <CardContent className="p-6 text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-3 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">{stats.totalQuestions}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">إجمالي الأسئلة</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <CardContent className="p-6 text-center">
              <FileText className="w-8 h-8 mx-auto mb-3 text-green-600" />
              <div className="text-2xl font-bold text-green-600">{stats.verbalQuestions}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">أسئلة لفظية</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-600 to-amber-600 dark:from-green-600/20 dark:to-amber-600/20">
            <CardContent className="p-6 text-center">
              <Award className="w-8 h-8 mx-auto mb-3 text-green-700" />
              <div className="text-2xl font-bold text-green-700">{stats.quantitativeQuestions}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">أسئلة كمية</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 mx-auto mb-3 text-amber-600" />
              <div className="text-lg font-bold text-amber-600">
                {stats.totalQuestions > 0 ? Math.round((stats.difficultyBreakdown.hard / stats.totalQuestions) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">أسئلة صعبة</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          {/* Download Questions */}
          <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={downloadQuestions}>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Download className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">تحميل الأسئلة</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                احصل على ملف HTML إبداعي يحتوي على جميع الأسئلة والإجابات
              </p>
              <Badge variant="secondary">HTML تصميم إبداعي</Badge>
            </CardContent>
          </Card>

          {/* Generate Test with Timer */}
          <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={() => generateCreativeTest(true)}>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Timer className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">اختبار بوقت محدد</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                إنشاء اختبار تفاعلي بوقت محدد (دقيقة لكل سؤال)
              </p>
              <Badge variant="destructive">دقيقة/سؤال</Badge>
            </CardContent>
          </Card>

          {/* Generate Test without Timer */}
          <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={() => generateCreativeTest(false)}>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">اختبار بدون وقت</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                إنشاء اختبار تفاعلي بدون حدود زمنية للمراجعة المريحة
              </p>
              <Badge className="bg-green-100 text-green-800">مرونة كاملة</Badge>
            </CardContent>
          </Card>
        </motion.div>

        {/* Questions List */}
        {Array.isArray(questions) && questions.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  معاينة الأسئلة ({questions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {questions.map((question: any, index: number) => (
                    <div key={question.id || index} className="border rounded-lg p-4 dark:border-gray-700">
                      <div className="flex items-start justify-between mb-2">
                        <Badge 
                          variant={question.category === 'verbal' ? 'default' : 'secondary'}
                          className="mb-2"
                        >
                          {question.category === 'verbal' ? 'لفظي' : 'كمي'} - {question.subcategory}
                        </Badge>
                        <span className="text-sm text-gray-500">#{index + 1}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                        {question.text}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Plus className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">لا توجد أسئلة بعد</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  ابدأ بإضافة أسئلة لهذا المجلد لتتمكن من إنشاء اختبارات مخصصة
                </p>
                <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-questions">
                  إضافة أسئلة من بنك الأسئلة
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Question Library Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>إضافة أسئلة من المكتبة</DialogTitle>
            <DialogDescription>
              اختر الأسئلة التي تريد إضافتها للمجلد ({selectedQuestions.length} محدد)
            </DialogDescription>
          </DialogHeader>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 py-4 border-b">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="ابحث في الأسئلة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
                data-testid="input-search-questions"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40" data-testid="select-category">
                <SelectValue placeholder="الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="verbal">لفظي</SelectItem>
                <SelectItem value="quantitative">كمي</SelectItem>
              </SelectContent>
            </Select>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-full sm:w-40" data-testid="select-difficulty">
                <SelectValue placeholder="الصعوبة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="easy">سهل</SelectItem>
                <SelectItem value="medium">متوسط</SelectItem>
                <SelectItem value="hard">صعب</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Questions List */}
          <div className="flex-1 overflow-y-auto space-y-2 py-4">
            {allQuestionsLoading ? (
              <div className="text-center py-8 text-gray-500">
                جاري تحميل الأسئلة...
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد أسئلة متاحة
              </div>
            ) : (
              filteredQuestions.map((question) => (
                <div
                  key={question.id}
                  className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700 cursor-pointer"
                  onClick={() => handleToggleQuestion(question.id)}
                  data-testid={`question-item-${question.id}`}
                >
                  <Checkbox
                    checked={selectedQuestions.includes(question.id)}
                    onCheckedChange={() => handleToggleQuestion(question.id)}
                    data-testid={`checkbox-question-${question.id}`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant={question.category === 'verbal' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {question.category === 'verbal' ? 'لفظي' : 'كمي'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {question.difficulty === 'easy' ? 'سهل' :
                         question.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {question.subcategory}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {question.text}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setSelectedQuestions([]);
              }}
              data-testid="button-cancel"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleAddQuestions}
              disabled={selectedQuestions.length === 0 || addQuestionsMutation.isPending}
              data-testid="button-confirm-add"
            >
              {addQuestionsMutation.isPending ? (
                "جاري الإضافة..."
              ) : (
                `إضافة ${selectedQuestions.length} سؤال`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}