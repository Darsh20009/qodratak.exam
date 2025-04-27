import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  SearchIcon,
  Filter,
  GraduationCap,
  Calculator,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  BookIcon,
  ClockIcon,
  HashIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TestType, TestDifficulty } from "@shared/types";

// Interface for library questions
interface LibraryQuestion {
  id: number;
  category: TestType;
  text: string;
  options: string[];
  correctOptionIndex: number;
  difficulty: TestDifficulty;
  explanation?: string;
  topic?: string;
}

// Interface for search query
interface SearchQuery {
  text: string;
  category?: TestType;
  difficulty?: TestDifficulty;
  topic?: string;
}

// Topics for questions
const verbalTopics = [
  "المترادفات",
  "المتضادات",
  "التناظر اللفظي",
  "فهم النص",
  "إكمال الجمل",
  "تصنيف الكلمات",
  "استدلال منطقي"
];

const quantitativeTopics = [
  "الجبر",
  "الهندسة",
  "الحساب",
  "الإحصاء والاحتمالات",
  "المقارنات الكمية",
  "المتتاليات والمتسلسلات",
  "حل المسائل"
];

// Mock data for initial questions
const initialQuestions: LibraryQuestion[] = [
  {
    id: 1,
    category: "verbal",
    text: "أي الكلمات التالية أقرب في معناها إلى كلمة 'مثابرة'؟",
    options: ["إرهاق", "مواظبة", "مرونة", "سرعة"],
    correctOptionIndex: 1,
    difficulty: "beginner",
    explanation: "المثابرة تعني الاستمرار في العمل رغم الصعوبات، وهي قريبة في معناها من المواظبة.",
    topic: "المترادفات"
  },
  {
    id: 2,
    category: "verbal",
    text: "أي الكلمات التالية تعد عكساً لكلمة 'تقصير'؟",
    options: ["إهمال", "اجتهاد", "تكاسل", "عجز"],
    correctOptionIndex: 1,
    difficulty: "beginner",
    explanation: "عكس التقصير هو الاجتهاد، فالتقصير يعني عدم بذل الجهد الكافي، بينما الاجتهاد يعني بذل أقصى جهد.",
    topic: "المتضادات"
  },
  {
    id: 3,
    category: "verbal",
    text: "عالِم : علم كـ طبيب : ...",
    options: ["مريض", "صحة", "طب", "دواء"],
    correctOptionIndex: 2,
    difficulty: "intermediate",
    explanation: "العلاقة هي: الشخص ومجال تخصصه. العالِم تخصصه هو العلم، والطبيب تخصصه هو الطب.",
    topic: "التناظر اللفظي"
  },
  {
    id: 4,
    category: "quantitative",
    text: "إذا كان 20% من عدد ما يساوي 15، فما هو العدد؟",
    options: ["60", "75", "80", "90"],
    correctOptionIndex: 1,
    difficulty: "beginner",
    explanation: "20% × س = 15\nس = 15 ÷ 0.2 = 75",
    topic: "الحساب"
  },
  {
    id: 5,
    category: "quantitative",
    text: "مساحة مستطيل 48 متراً مربعاً، وطوله ضعف عرضه. ما هو محيط المستطيل؟",
    options: ["28 م", "32 م", "36 م", "40 م"],
    correctOptionIndex: 1,
    difficulty: "intermediate",
    explanation: "نفرض أن عرض المستطيل = س، وطوله = 2س.\nالمساحة = الطول × العرض = 2س × س = 2س² = 48\nس² = 24\nس = √24 = 4.9\nالطول = 2س = 9.8\nالمحيط = 2(الطول + العرض) = 2(9.8 + 4.9) = 2(14.7) = 29.4\nأقرب قيمة هي 28 م.",
    topic: "الهندسة"
  },
  {
    id: 6,
    category: "quantitative",
    text: "متتالية حسابية حدها الأول 5 والفرق المشترك 3. ما هو الحد العاشر؟",
    options: ["32", "35", "38", "41"],
    correctOptionIndex: 1,
    difficulty: "advanced",
    explanation: "في المتتالية الحسابية، الحد العام هو: أن = أ١ + (ن - 1)د\nحيث أ١ هي الحد الأول، د هي الفرق المشترك، ن هي رقم الحد.\nأ١٠ = 5 + (10 - 1)3 = 5 + 9(3) = 5 + 27 = 32",
    topic: "المتتاليات والمتسلسلات"
  },
  // يمكن إضافة المزيد من الأسئلة هنا
];

// Main component
const LibraryPage: React.FC = () => {
  const { toast } = useToast();
  
  // States
  const [questions, setQuestions] = useState<LibraryQuestion[]>(initialQuestions);
  const [filteredQuestions, setFilteredQuestions] = useState<LibraryQuestion[]>(initialQuestions);
  const [searchQuery, setSearchQuery] = useState<SearchQuery>({ text: "" });
  const [selectedQuestion, setSelectedQuestion] = useState<LibraryQuestion | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [questionsPerPage] = useState(10);
  const [isSearching, setIsSearching] = useState(false);
  
  // Calculate current questions
  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = filteredQuestions.slice(indexOfFirstQuestion, indexOfLastQuestion);
  
  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  // Effect for loading questions
  useEffect(() => {
    // In a real app, we would load questions from an API
    // For now, we'll use the initialQuestions
    setQuestions(initialQuestions);
    setFilteredQuestions(initialQuestions);
  }, []);
  
  // Handle search and filters
  const handleSearch = () => {
    setIsSearching(true);
    
    let results = [...questions];
    
    // Apply text search
    if (searchQuery.text) {
      results = results.filter(q => 
        q.text.includes(searchQuery.text) || 
        (q.explanation && q.explanation.includes(searchQuery.text))
      );
    }
    
    // Apply category filter
    if (searchQuery.category) {
      results = results.filter(q => q.category === searchQuery.category);
    }
    
    // Apply difficulty filter
    if (searchQuery.difficulty) {
      results = results.filter(q => q.difficulty === searchQuery.difficulty);
    }
    
    // Apply topic filter
    if (searchQuery.topic) {
      results = results.filter(q => q.topic === searchQuery.topic);
    }
    
    setFilteredQuestions(results);
    setCurrentPage(1);
    setIsSearching(false);
    
    // Show toast if no results
    if (results.length === 0) {
      toast({
        title: "لا توجد نتائج",
        description: "لم يتم العثور على أي سؤال مطابق لمعايير البحث",
        variant: "destructive",
      });
    }
  };
  
  // Reset search
  const resetSearch = () => {
    setSearchQuery({ text: "" });
    setFilteredQuestions(questions);
    setCurrentPage(1);
  };
  
  // Select a question to view
  const viewQuestion = (question: LibraryQuestion) => {
    setSelectedQuestion(question);
  };
  
  // Go back to questions list
  const backToList = () => {
    setSelectedQuestion(null);
  };
  
  // Get badge color based on difficulty
  const getDifficultyColor = (difficulty: TestDifficulty) => {
    switch (difficulty) {
      case "beginner": return "bg-green-500";
      case "intermediate": return "bg-yellow-500";
      case "advanced": return "bg-red-500";
      default: return "bg-blue-500";
    }
  };

  // Helper to get topics based on category
  const getTopics = (category?: TestType) => {
    if (!category || category === "verbal") {
      return verbalTopics;
    } else {
      return quantitativeTopics;
    }
  };
  
  // Render the question details view
  const renderQuestionDetail = () => {
    if (!selectedQuestion) return null;
    
    return (
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-4" 
          onClick={backToList}
        >
          <ChevronRight className="h-4 w-4 ml-1" />
          العودة للمكتبة
        </Button>
        
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <Badge className={cn("mb-2", getDifficultyColor(selectedQuestion.difficulty))}>
                  {selectedQuestion.difficulty === "beginner" ? "مبتدئ" : 
                   selectedQuestion.difficulty === "intermediate" ? "متوسط" : "متقدم"}
                </Badge>
                <Badge className="mb-2 mr-2 bg-muted text-muted-foreground">
                  {selectedQuestion.topic}
                </Badge>
              </div>
              <Badge variant="outline">
                {selectedQuestion.category === "verbal" ? "قدرات لفظية" : "قدرات كمية"}
              </Badge>
            </div>
            <CardTitle className="text-xl">
              {selectedQuestion.text}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {selectedQuestion.options.map((option, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-4 border rounded-lg",
                    index === selectedQuestion.correctOptionIndex
                      ? "bg-green-50 border-green-500"
                      : "bg-muted/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-sm",
                      index === selectedQuestion.correctOptionIndex
                        ? "bg-green-500 text-white"
                        : "bg-muted"
                    )}>
                      {index === selectedQuestion.correctOptionIndex ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div>{option}</div>
                  </div>
                </div>
              ))}
            </div>
            
            {selectedQuestion.explanation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <h3 className="font-medium mb-2">الشرح:</h3>
                <p className="text-sm whitespace-pre-line">{selectedQuestion.explanation}</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <div className="flex items-center text-sm text-muted-foreground">
              <BookIcon className="h-4 w-4 mr-1" />
              <span className="mr-4">
                {selectedQuestion.category === "verbal" ? "قدرات لفظية" : "قدرات كمية"}
              </span>
              <HashIcon className="h-4 w-4 mr-1" />
              <span className="mr-4">
                رقم السؤال: {selectedQuestion.id}
              </span>
            </div>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>أسئلة مشابهة</CardTitle>
            <CardDescription>أسئلة ذات صلة بنفس الموضوع</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {questions
                .filter(q => 
                  q.id !== selectedQuestion.id && 
                  q.topic === selectedQuestion.topic && 
                  q.category === selectedQuestion.category
                )
                .slice(0, 3)
                .map(question => (
                  <div 
                    key={question.id} 
                    className="p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                    onClick={() => viewQuestion(question)}
                  >
                    <div className="text-sm font-medium mb-1">{question.text}</div>
                    <div className="flex text-xs text-muted-foreground gap-2">
                      <Badge className={cn("text-xs", getDifficultyColor(question.difficulty))}>
                        {question.difficulty === "beginner" ? "مبتدئ" : 
                         question.difficulty === "intermediate" ? "متوسط" : "متقدم"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {question.topic}
                      </Badge>
                    </div>
                  </div>
                ))}
              
              {questions.filter(q => 
                q.id !== selectedQuestion.id && 
                q.topic === selectedQuestion.topic && 
                q.category === selectedQuestion.category
              ).length === 0 && (
                <div className="text-center p-4 text-muted-foreground">
                  لا توجد أسئلة مشابهة
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // Render the library view
  const renderLibrary = () => (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm mb-6">
        <h2 className="text-xl font-bold mb-4">البحث في المكتبة</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن سؤال..."
              className="pl-9"
              value={searchQuery.text}
              onChange={(e) => setSearchQuery({ ...searchQuery, text: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          
          <div>
            <Select
              value={searchQuery.category}
              onValueChange={(value) => setSearchQuery({ 
                ...searchQuery, 
                category: value as TestType,
                topic: undefined // Reset topic when category changes
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="نوع السؤال" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">الكل</SelectItem>
                <SelectItem value="verbal">قدرات لفظية</SelectItem>
                <SelectItem value="quantitative">قدرات كمية</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Select
              value={searchQuery.difficulty}
              onValueChange={(value) => setSearchQuery({ 
                ...searchQuery, 
                difficulty: value as TestDifficulty 
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="مستوى الصعوبة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">الكل</SelectItem>
                <SelectItem value="beginner">مبتدئ</SelectItem>
                <SelectItem value="intermediate">متوسط</SelectItem>
                <SelectItem value="advanced">متقدم</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Select
              value={searchQuery.topic}
              onValueChange={(value) => setSearchQuery({ ...searchQuery, topic: value })}
              disabled={!searchQuery.category}
            >
              <SelectTrigger>
                <SelectValue placeholder="الموضوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">الكل</SelectItem>
                {getTopics(searchQuery.category).map(topic => (
                  <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={resetSearch}>
            إعادة ضبط
          </Button>
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? "جاري البحث..." : "بحث"}
            <SearchIcon className="mr-2 h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">جميع الأسئلة</TabsTrigger>
          <TabsTrigger value="verbal">القدرات اللفظية</TabsTrigger>
          <TabsTrigger value="quantitative">القدرات الكمية</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <div className="grid gap-4">
            {currentQuestions.map(question => (
              <Card key={question.id} className="overflow-hidden">
                <div 
                  className={cn(
                    "h-1",
                    question.category === "verbal" ? "bg-blue-500" : "bg-purple-500"
                  )}
                ></div>
                <CardHeader className="p-4">
                  <div className="flex justify-between">
                    <div className="flex gap-2">
                      <Badge className={getDifficultyColor(question.difficulty)}>
                        {question.difficulty === "beginner" ? "مبتدئ" : 
                         question.difficulty === "intermediate" ? "متوسط" : "متقدم"}
                      </Badge>
                      {question.topic && (
                        <Badge variant="outline">{question.topic}</Badge>
                      )}
                    </div>
                    <Badge variant="secondary">
                      {question.category === "verbal" ? (
                        <BookOpen className="h-3 w-3 mr-1" />
                      ) : (
                        <Calculator className="h-3 w-3 mr-1" />
                      )}
                      {question.category === "verbal" ? "لفظي" : "كمي"}
                    </Badge>
                  </div>
                  <CardTitle className="text-base mt-2">{question.text}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-sm text-muted-foreground mb-3">الإجابة الصحيحة:</div>
                  <div className="p-2 bg-green-50 border border-green-200 rounded">
                    {question.options[question.correctOptionIndex]}
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button variant="outline" className="w-full" onClick={() => viewQuestion(question)}>
                    عرض التفاصيل
                  </Button>
                </CardFooter>
              </Card>
            ))}
            
            {filteredQuestions.length === 0 && (
              <div className="text-center p-8 bg-muted/20 rounded-lg">
                <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium mb-1">لا توجد نتائج</h3>
                <p className="text-muted-foreground">
                  لم يتم العثور على أي سؤال مطابق لمعايير البحث
                </p>
                <Button variant="outline" className="mt-4" onClick={resetSearch}>
                  إعادة ضبط البحث
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="verbal">
          <div className="grid gap-4">
            {currentQuestions
              .filter(q => q.category === "verbal")
              .map(question => (
                <Card key={question.id} className="overflow-hidden">
                  <div className="h-1 bg-blue-500"></div>
                  <CardHeader className="p-4">
                    <div className="flex justify-between">
                      <div className="flex gap-2">
                        <Badge className={getDifficultyColor(question.difficulty)}>
                          {question.difficulty === "beginner" ? "مبتدئ" : 
                           question.difficulty === "intermediate" ? "متوسط" : "متقدم"}
                        </Badge>
                        {question.topic && (
                          <Badge variant="outline">{question.topic}</Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-base mt-2">{question.text}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-sm text-muted-foreground mb-3">الإجابة الصحيحة:</div>
                    <div className="p-2 bg-green-50 border border-green-200 rounded">
                      {question.options[question.correctOptionIndex]}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button variant="outline" className="w-full" onClick={() => viewQuestion(question)}>
                      عرض التفاصيل
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            
            {filteredQuestions.filter(q => q.category === "verbal").length === 0 && (
              <div className="text-center p-8 bg-muted/20 rounded-lg">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium mb-1">لا توجد أسئلة لفظية</h3>
                <p className="text-muted-foreground">
                  لم يتم العثور على أي سؤال لفظي مطابق لمعايير البحث
                </p>
                <Button variant="outline" className="mt-4" onClick={resetSearch}>
                  إعادة ضبط البحث
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="quantitative">
          <div className="grid gap-4">
            {currentQuestions
              .filter(q => q.category === "quantitative")
              .map(question => (
                <Card key={question.id} className="overflow-hidden">
                  <div className="h-1 bg-purple-500"></div>
                  <CardHeader className="p-4">
                    <div className="flex justify-between">
                      <div className="flex gap-2">
                        <Badge className={getDifficultyColor(question.difficulty)}>
                          {question.difficulty === "beginner" ? "مبتدئ" : 
                           question.difficulty === "intermediate" ? "متوسط" : "متقدم"}
                        </Badge>
                        {question.topic && (
                          <Badge variant="outline">{question.topic}</Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-base mt-2">{question.text}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-sm text-muted-foreground mb-3">الإجابة الصحيحة:</div>
                    <div className="p-2 bg-green-50 border border-green-200 rounded">
                      {question.options[question.correctOptionIndex]}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button variant="outline" className="w-full" onClick={() => viewQuestion(question)}>
                      عرض التفاصيل
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            
            {filteredQuestions.filter(q => q.category === "quantitative").length === 0 && (
              <div className="text-center p-8 bg-muted/20 rounded-lg">
                <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium mb-1">لا توجد أسئلة كمية</h3>
                <p className="text-muted-foreground">
                  لم يتم العثور على أي سؤال كمي مطابق لمعايير البحث
                </p>
                <Button variant="outline" className="mt-4" onClick={resetSearch}>
                  إعادة ضبط البحث
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Pagination */}
      {filteredQuestions.length > questionsPerPage && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            {Array.from({ length: Math.ceil(filteredQuestions.length / questionsPerPage) }).map((_, i) => (
              <Button
                key={i}
                variant={i + 1 === currentPage ? "default" : "outline"}
                size="icon"
                onClick={() => paginate(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === Math.ceil(filteredQuestions.length / questionsPerPage)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      )}
    </div>
  );
  
  return (
    <div className="container py-6">
      <div className="flex items-center gap-2 mb-6">
        <GraduationCap className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">مكتبة الأسئلة</h1>
      </div>
      
      {selectedQuestion ? renderQuestionDetail() : renderLibrary()}
    </div>
  );
};

export default LibraryPage;