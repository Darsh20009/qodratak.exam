import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search,
  Brain,
  Calculator,
  FileText,
  TrendingUp,
  Star,
  CheckCircle,
  AlertCircle,
  Target,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Grid3X3,
  List
} from 'lucide-react';
import { fuzzySearch } from '@/lib/fuzzySearch';
import { useDebounce } from '@/hooks/use-debounce';

interface TahsiliQuestion {
  id: number;
  category: 'رياضيات' | 'فيزياء' | 'كيمياء' | 'أحياء' | 'جيولوجيا' | 'علوم_البيئة';
  subcategory: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  difficulty: 'مبتدئ' | 'متوسط' | 'متقدم';
  topic: string;
  explanation?: string;
  section: number;
  keywords: string[];
}

const TahsiliQuestionBank: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [selectedDifficulty, setSelectedDifficulty] = useState('الكل');
  const [selectedSubcategory, setSelectedSubcategory] = useState('الكل');
  const [selectedTopic, setSelectedTopic] = useState('الكل');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAnswers, setShowAnswers] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<TahsiliQuestion | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('cards');
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const questionsPerPage = 12;

  // محاكاة بيانات أسئلة التحصيلي
  const tahsiliQuestions: TahsiliQuestion[] = [
    {
      id: 1,
      category: 'رياضيات',
      subcategory: 'الجبر',
      text: 'إذا كان x + 3 = 7، فما قيمة x؟',
      options: ['2', '4', '5', '6'],
      correctOptionIndex: 1,
      difficulty: 'مبتدئ',
      topic: 'المعادلات الخطية',
      explanation: 'لحل المعادلة x + 3 = 7، نطرح 3 من كلا الطرفين: x = 7 - 3 = 4',
      section: 1,
      keywords: ['جبر', 'معادلة', 'خطية']
    },
    {
      id: 2,
      category: 'فيزياء',
      subcategory: 'الميكانيكا',
      text: 'ما هي وحدة قياس السرعة في النظام الدولي؟',
      options: ['م/ث', 'كم/ساعة', 'ميل/ساعة', 'عقدة'],
      correctOptionIndex: 0,
      difficulty: 'مبتدئ',
      topic: 'الوحدات والقياس',
      explanation: 'وحدة السرعة في النظام الدولي هي متر في الثانية (م/ث)',
      section: 1,
      keywords: ['سرعة', 'وحدات', 'قياس']
    },
    {
      id: 3,
      category: 'كيمياء',
      subcategory: 'الكيمياء العامة',
      text: 'ما هو العدد الذري للكربون؟',
      options: ['4', '6', '8', '12'],
      correctOptionIndex: 1,
      difficulty: 'مبتدئ',
      topic: 'الجدول الدوري',
      explanation: 'العدد الذري للكربون هو 6، وهو عدد البروتونات في نواة ذرة الكربون',
      section: 1,
      keywords: ['كربون', 'عدد ذري', 'جدول دوري']
    },
    {
      id: 4,
      category: 'أحياء',
      subcategory: 'علم الخلية',
      text: 'ما هو الجزء المسؤول عن التحكم في الخلية؟',
      options: ['السيتوبلازم', 'النواة', 'الغشاء الخلوي', 'الميتوكوندريا'],
      correctOptionIndex: 1,
      difficulty: 'مبتدئ',
      topic: 'تركيب الخلية',
      explanation: 'النواة هي مركز التحكم في الخلية وتحتوي على الحمض النووي',
      section: 1,
      keywords: ['خلية', 'نواة', 'تحكم']
    },
    {
      id: 5,
      category: 'رياضيات',
      subcategory: 'الهندسة',
      text: 'ما هي مساحة المثلث الذي قاعدته 8 سم وارتفاعه 6 سم؟',
      options: ['24 سم²', '48 سم²', '14 سم²', '32 سم²'],
      correctOptionIndex: 0,
      difficulty: 'متوسط',
      topic: 'مساحة الأشكال',
      explanation: 'مساحة المثلث = ½ × القاعدة × الارتفاع = ½ × 8 × 6 = 24 سم²',
      section: 2,
      keywords: ['مثلث', 'مساحة', 'هندسة']
    },
    {
      id: 6,
      category: 'فيزياء',
      subcategory: 'الكهرباء',
      text: 'ما هو قانون أوم؟',
      options: ['V = I × R', 'P = V × I', 'E = mc²', 'F = ma'],
      correctOptionIndex: 0,
      difficulty: 'متوسط',
      topic: 'الدوائر الكهربائية',
      explanation: 'قانون أوم ينص على أن الجهد يساوي التيار مضروباً في المقاومة (V = I × R)',
      section: 2,
      keywords: ['أوم', 'كهرباء', 'قانون']
    }
  ];

  const categories = ['الكل', 'رياضيات', 'فيزياء', 'كيمياء', 'أحياء', 'جيولوجيا', 'علوم_البيئة'];
  const difficulties = ['الكل', 'مبتدئ', 'متوسط', 'متقدم'];
  
  // استخراج الفئات الفرعية والمواضيع من الأسئلة
  const subcategories = ['الكل', ...Array.from(new Set(tahsiliQuestions.map(q => q.subcategory)))];
  const topics = ['الكل', ...Array.from(new Set(tahsiliQuestions.map(q => q.topic)))];

  const categoryColors = {
    'رياضيات': 'from-blue-500 to-cyan-500',
    'فيزياء': 'from-green-600 to-amber-600',
    'كيمياء': 'from-emerald-500 to-teal-500',
    'أحياء': 'from-green-500 to-lime-500',
    'جيولوجيا': 'from-amber-500 to-orange-500',
    'علوم_البيئة': 'from-teal-500 to-green-500'
  };

  const categoryIcons = {
    'رياضيات': Calculator,
    'فيزياء': Target,
    'كيمياء': FileText,
    'أحياء': Brain,
    'جيولوجيا': Star,
    'علوم_البيئة': TrendingUp
  };

  // فلترة الأسئلة مع بحث متقدم
  const filteredQuestions = tahsiliQuestions.filter(question => {
    let matchesSearch = true;
    
    if (debouncedSearchQuery.trim()) {
      // استخدام fuzzy search للبحث المتقدم
      const searchableContent = [
        question.text,
        question.topic,
        question.subcategory,
        question.explanation || '',
        ...question.keywords,
        ...question.options
      ].join(' ');
      
      const fuzzyResult = fuzzySearch(debouncedSearchQuery, searchableContent);
      matchesSearch = fuzzyResult;
    }
    
    const matchesCategory = selectedCategory === 'الكل' || question.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'الكل' || question.difficulty === selectedDifficulty;
    const matchesSubcategory = selectedSubcategory === 'الكل' || question.subcategory === selectedSubcategory;
    const matchesTopic = selectedTopic === 'الكل' || question.topic === selectedTopic;
    
    return matchesSearch && matchesCategory && matchesDifficulty && matchesSubcategory && matchesTopic;
  });

  // إعادة تعيين الصفحة عند تغيير الفلاتر
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedDifficulty, selectedSubcategory, selectedTopic, debouncedSearchQuery]);
  
  // تقسيم النتائج على صفحات
  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);
  const startIndex = (currentPage - 1) * questionsPerPage;
  const paginatedQuestions = filteredQuestions.slice(startIndex, startIndex + questionsPerPage);

  // إحصائيات
  const stats = {
    total: tahsiliQuestions.length,
    byCategory: categories.slice(1).map(cat => ({
      name: cat,
      count: tahsiliQuestions.filter(q => q.category === cat).length,
      color: categoryColors[cat as keyof typeof categoryColors]
    })),
    byDifficulty: difficulties.slice(1).map(diff => ({
      name: diff,
      count: tahsiliQuestions.filter(q => q.difficulty === diff).length
    }))
  };

  const QuestionCard = ({ question, index }: { question: TahsiliQuestion; index: number }) => {
    const CategoryIcon = categoryIcons[question.category as keyof typeof categoryIcons];
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ scale: 1.02, y: -5 }}
        className="cursor-pointer"
        onClick={() => setSelectedQuestion(question)}
        data-testid={`question-card-${question.id}`}
      >
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 overflow-hidden group h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${categoryColors[question.category]} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <CategoryIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-white">{question.category}</CardTitle>
                  <CardDescription className="text-blue-200 text-xs">{question.subcategory}</CardDescription>
                </div>
              </div>
              <Badge className={`text-xs ${
                question.difficulty === 'مبتدئ' ? 'bg-green-500/20 text-green-200' :
                question.difficulty === 'متوسط' ? 'bg-orange-500/20 text-orange-200' :
                'bg-red-500/20 text-red-200'
              }`}>
                {question.difficulty}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-white text-sm mb-3 line-clamp-3">{question.text}</p>
            <div className="flex items-center justify-between text-xs text-blue-200">
              <span>القسم {question.section}</span>
              <span>{question.options.length} خيارات</span>
            </div>
            {question.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {question.keywords.slice(0, 3).map((keyword, idx) => (
                  <Badge key={idx} className="bg-blue-500/20 text-blue-200 text-xs px-2 py-0.5">
                    {keyword}
                  </Badge>
                ))}
                {question.keywords.length > 3 && (
                  <Badge className="bg-gray-500/20 text-gray-300 text-xs px-2 py-0.5">
                    +{question.keywords.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-teal-500 text-white p-6">
      {/* خلفية متحركة */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-emerald-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-amber-500/10 to-orange-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* العنوان الرئيسي */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-blue-400 via-green-600 to-amber-600 bg-clip-text text-transparent mb-4">
            بنك أسئلة التحصيلي 🎯
          </h1>
          <p className="text-xl text-blue-200">مجموعة شاملة من الأسئلة المتخصصة للاختبار التحصيلي</p>
        </motion.div>

        {/* إحصائيات سريعة */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white" data-testid="text-total">{stats.total}</div>
              <div className="text-blue-200 text-sm">إجمالي الأسئلة</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white" data-testid="text-categories-count">{categories.length - 1}</div>
              <div className="text-blue-200 text-sm">المواد</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white" data-testid="text-difficulties-count">{difficulties.length - 1}</div>
              <div className="text-blue-200 text-sm">مستويات الصعوبة</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white" data-testid="text-results-count">{filteredQuestions.length}</div>
              <div className="text-blue-200 text-sm">نتائج البحث</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* أدوات البحث والفلترة */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20"
        >
          <div className="space-y-4">
            {/* صف الفلاتر الأول */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* بحث */}
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="بحث متقدم في الأسئلة والمواضيع والشرح..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  data-testid="input-search"
                />
              </div>
              
              {/* أدوات العرض */}
              <div className="flex gap-2">
                <Button
                  onClick={() => setViewMode(viewMode === 'cards' ? 'list' : 'cards')}
                  className="bg-white/10 hover:bg-white/20 flex-1"
                  data-testid="button-toggle-view"
                >
                  {viewMode === 'cards' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
                  <span className="mr-2">{viewMode === 'cards' ? 'قائمة' : 'بطاقات'}</span>
                </Button>
                <Button
                  onClick={() => setShowAnswers(!showAnswers)}
                  className={`flex-1 ${showAnswers ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-white/10 hover:bg-white/20'}`}
                  data-testid="button-show-answers"
                >
                  {showAnswers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span className="mr-2">{showAnswers ? 'إخفاء' : 'عرض'} الإجابات</span>
                </Button>
              </div>
            </div>
            
            {/* صف الفلاتر الثاني */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* فلترة حسب المادة */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white" data-testid="select-category">
                  <SelectValue placeholder="اختر المادة" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* فلترة حسب الفئة الفرعية */}
              <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white" data-testid="select-subcategory">
                  <SelectValue placeholder="الفئة الفرعية" />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map(subcategory => (
                    <SelectItem key={subcategory} value={subcategory}>{subcategory}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* فلترة حسب الموضوع */}
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white" data-testid="select-topic">
                  <SelectValue placeholder="الموضوع" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map(topic => (
                    <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* فلترة حسب الصعوبة */}
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white" data-testid="select-difficulty">
                  <SelectValue placeholder="مستوى الصعوبة" />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map(difficulty => (
                    <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* عرض الأسئلة */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {paginatedQuestions.length > 0 ? (
            viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {paginatedQuestions.map((question, index) => (
                  <QuestionCard key={question.id} question={question} index={index} />
                ))}
              </div>
            ) : (
              <div className="space-y-4 mb-8">
                {paginatedQuestions.map((question, index) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 cursor-pointer hover:bg-white/15 transition-all"
                    onClick={() => setSelectedQuestion(question)}
                    data-testid={`question-list-${question.id}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${categoryColors[question.category]} flex items-center justify-center flex-shrink-0`}>
                        {React.createElement(categoryIcons[question.category], { className: "w-6 h-6 text-white" })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white text-sm">{question.category}</h3>
                            <span className="text-blue-200 text-xs">• {question.subcategory}</span>
                          </div>
                          <Badge className={`text-xs ${
                            question.difficulty === 'مبتدئ' ? 'bg-green-500/20 text-green-200' :
                            question.difficulty === 'متوسط' ? 'bg-orange-500/20 text-orange-200' :
                            'bg-red-500/20 text-red-200'
                          }`}>
                            {question.difficulty}
                          </Badge>
                        </div>
                        <p className="text-white text-sm mb-2 line-clamp-2">{question.text}</p>
                        <div className="flex items-center justify-between text-xs text-blue-200">
                          <span>القسم {question.section} • {question.topic}</span>
                          <span>{question.options.length} خيارات</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-12" data-testid="text-no-results">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">لا توجد أسئلة</h3>
              <p className="text-gray-400">جرب تعديل معايير البحث للعثور على أسئلة</p>
            </div>
          )}
        </motion.div>

        {/* التصفح بين الصفحات */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center items-center gap-4 mb-8"
          >
            <Button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="bg-white/10 hover:bg-white/20 disabled:opacity-50"
              data-testid="button-prev-page"
            >
              <ChevronLeft className="w-4 h-4" />
              السابق
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="text-white" data-testid="text-page-info">صفحة {currentPage} من {totalPages}</span>
            </div>
            
            <Button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="bg-white/10 hover:bg-white/20 disabled:opacity-50"
              data-testid="button-next-page"
            >
              التالي
              <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </div>

      {/* مودال عرض السؤال المفصل */}
      {selectedQuestion && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedQuestion(null)}
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${categoryColors[selectedQuestion.category]} flex items-center justify-center`}>
                    {React.createElement(categoryIcons[selectedQuestion.category], { className: "w-6 h-6 text-white" })}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedQuestion.category}</h3>
                    <p className="text-blue-200">{selectedQuestion.subcategory}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedQuestion(null)}
                  className="text-white hover:bg-white/10"
                  data-testid="button-close-modal"
                >
                  إغلاق
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">السؤال:</h4>
                  <p className="text-white bg-white/5 p-4 rounded-lg">{selectedQuestion.text}</p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">الخيارات:</h4>
                  <div className="space-y-2">
                    {selectedQuestion.options.map((option, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border transition-colors ${
                          showAnswers && index === selectedQuestion.correctOptionIndex
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                            : 'bg-white/5 border-white/20 text-white'
                        }`}
                        data-testid={`option-${index}-${selectedQuestion.id}`}
                      >
                        <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                        {option}
                        {showAnswers && index === selectedQuestion.correctOptionIndex && (
                          <CheckCircle className="w-4 h-4 text-emerald-400 inline mr-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {showAnswers && selectedQuestion.explanation && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-400" />
                      الشرح:
                    </h4>
                    <p className="text-white bg-amber-500/10 border border-amber-400/20 p-4 rounded-lg">
                      {selectedQuestion.explanation}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/20">
                  <div className="text-center">
                    <div className="text-sm text-blue-200">الصعوبة</div>
                    <Badge className={`mt-1 ${
                      selectedQuestion.difficulty === 'مبتدئ' ? 'bg-green-500/20 text-green-200' :
                      selectedQuestion.difficulty === 'متوسط' ? 'bg-orange-500/20 text-orange-200' :
                      'bg-red-500/20 text-red-200'
                    }`}>
                      {selectedQuestion.difficulty}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-blue-200">القسم</div>
                    <div className="text-white font-semibold mt-1">{selectedQuestion.section}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-blue-200">الموضوع</div>
                    <div className="text-white font-semibold mt-1 text-sm">{selectedQuestion.topic}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-blue-200">الخيارات</div>
                    <div className="text-white font-semibold mt-1">{selectedQuestion.options.length}</div>
                  </div>
                </div>

                {selectedQuestion.keywords.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-blue-200 mb-2">الكلمات المفتاحية:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedQuestion.keywords.map((keyword, idx) => (
                        <Badge key={idx} className="bg-blue-500/20 text-blue-200 text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default TahsiliQuestionBank;