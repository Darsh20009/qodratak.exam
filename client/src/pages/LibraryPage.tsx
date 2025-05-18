import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Bookmark, 
  BookOpen, 
  Filter, 
  Search, 
  ChevronDown,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { TestQuestion } from "@shared/types";
import { SaveToFolderButton } from "@/components/SaveToFolderButton";

const LibraryPage: React.FC = () => {
  const [search, setSearch] = useState<string>("");
  const [category, setCategory] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [dialect, setDialect] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  // Get all questions
  const { data: questions, isLoading } = useQuery<TestQuestion[]>({
    queryKey: ['/api/questions'],
    queryFn: async () => {
      const response = await fetch('/api/questions');
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }
      return response.json();
    },
  });

  // Apply filters and search
  const filteredQuestions = questions?.filter(q => {
    let match = true;
    
    // Category filter
    if (category && q.category !== category) {
      match = false;
    }
    
    // Difficulty filter
    if (difficulty && q.difficulty !== difficulty) {
      match = false;
    }
    
    // Dialect filter
    if (dialect && q.dialect !== dialect) {
      match = false;
    }
    
    // Search text - improved to handle Arabic text better
    if (search) {
      const searchLower = search.toLowerCase();
      const textLower = q.text.toLowerCase();
      const searchTerms = searchLower.split(/\s+/);
      
      // Check if all search terms are found in the question text
      const allTermsFound = searchTerms.every(term => 
        textLower.includes(term)
      );
      
      if (!allTermsFound) {
        match = false;
      }
    }
    
    return match;
  });

  // Group questions by category
  const groupedQuestions = filteredQuestions?.reduce((acc, question) => {
    const category = question.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(question);
    return acc;
  }, {} as Record<string, TestQuestion[]>);

  // Count questions by category
  const getQuestionCount = (category: string | null) => {
    if (!questions) return 0;
    if (!category) return questions.length;
    return questions.filter(q => q.category === category).length;
  };

  const handleSearch = () => {
    // Search is applied in the filteredQuestions
  };

  const toggleQuestion = (id: number) => {
    if (expandedQuestion === id) {
      setExpandedQuestion(null);
    } else {
      setExpandedQuestion(id);
    }
  };

  // Format difficulty label
  const formatDifficulty = (difficulty: string) => {
    switch(difficulty) {
      case 'beginner': return 'مبتدئ';
      case 'intermediate': return 'متوسط';
      case 'advanced': return 'متقدم';
      case 'expert': return 'خبير';
      default: return difficulty;
    }
  };

  // Format category label
  const formatCategory = (category: string) => {
    switch(category) {
      case 'verbal': return 'لفظي';
      case 'quantitative': return 'كمي';
      case 'qiyas': return 'قياس';
      case 'custom': return 'مخصص';
      default: return category;
    }
  };

  // Format dialect label
  const formatDialect = (dialect?: string) => {
    if (!dialect) return 'الفصحى';
    
    switch(dialect) {
      case 'standard': return 'الفصحى';
      case 'saudi': return 'السعودية';
      case 'egyptian': return 'المصرية';
      case 'gulf': return 'الخليجية';
      case 'levantine': return 'الشامية';
      case 'maghrebi': return 'المغاربية';
      default: return dialect;
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-2 text-center lg:text-right">مكتبة الأسئلة</h1>
      <p className="text-muted-foreground mb-8 text-center lg:text-right">
        تصفح أكثر من 10,000 سؤال وإجابة مصنفة حسب المجال والمستوى
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar - Filters */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                <span>الفلترة والبحث</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">البحث</label>
                <div className="relative">
                  <Input
                    placeholder="ابحث عن سؤال..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pr-10 flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="absolute left-1 top-1/2 -translate-y-1/2 hover:bg-transparent"
                    onClick={handleSearch}
                  >
                    <Search className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                  </Button>
                  {search && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute right-1 top-1/2 -translate-y-1/2 hover:bg-transparent"
                      onClick={() => setSearch('')}
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                    </Button>
                  )}
                </div>
                {search && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    اكتب كلمة البحث واضغط Enter للبحث
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">المجال</label>
                <Select
                  value={category || "all"}
                  onValueChange={(value) => setCategory(value === "all" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="جميع المجالات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المجالات</SelectItem>
                    <SelectItem value="verbal">لفظي</SelectItem>
                    <SelectItem value="quantitative">كمي</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">المستوى</label>
                <Select
                  value={difficulty || "all"}
                  onValueChange={(value) => setDifficulty(value === "all" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="جميع المستويات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المستويات</SelectItem>
                    <SelectItem value="beginner">مبتدئ</SelectItem>
                    <SelectItem value="intermediate">متوسط</SelectItem>
                    <SelectItem value="advanced">متقدم</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">اللهجة</label>
                <Select
                  value={dialect || "all"}
                  onValueChange={(value) => setDialect(value === "all" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="جميع اللهجات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع اللهجات</SelectItem>
                    <SelectItem value="standard">الفصحى</SelectItem>
                    <SelectItem value="saudi">السعودية</SelectItem>
                    <SelectItem value="egyptian">المصرية</SelectItem>
                    <SelectItem value="gulf">الخليجية</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-2">إحصائيات</h3>
                <ul className="space-y-1 text-sm">
                  <li className="flex justify-between">
                    <span>إجمالي الأسئلة:</span>
                    <Badge variant="secondary">{getQuestionCount(null)}</Badge>
                  </li>
                  <li className="flex justify-between">
                    <span>الأسئلة اللفظية:</span>
                    <Badge variant="secondary">{getQuestionCount('verbal')}</Badge>
                  </li>
                  <li className="flex justify-between">
                    <span>الأسئلة الكمية:</span>
                    <Badge variant="secondary">{getQuestionCount('quantitative')}</Badge>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="mr-2">جاري التحميل...</span>
            </div>
          ) : filteredQuestions && filteredQuestions.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  الأسئلة ({filteredQuestions.length})
                </h2>
                <div className="text-sm text-muted-foreground">
                  {search || category || difficulty || dialect ? "نتائج الفلترة" : "جميع الأسئلة"}
                </div>
              </div>

              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">الكل</TabsTrigger>
                  <TabsTrigger value="verbal">لفظي</TabsTrigger>
                  <TabsTrigger value="quantitative">كمي</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="space-y-4">
                  {Object.entries(groupedQuestions || {}).map(([category, questions]) => (
                    <div key={category} className="space-y-2">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        <span>{formatCategory(category)}</span>
                        <Badge>{questions.length}</Badge>
                      </h3>
                      <QuestionsList 
                        questions={questions} 
                        expandedQuestion={expandedQuestion}
                        toggleQuestion={toggleQuestion}
                        formatDifficulty={formatDifficulty}
                        formatDialect={formatDialect}
                      />
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="verbal" className="space-y-4">
                  {groupedQuestions?.verbal && (
                    <QuestionsList 
                      questions={groupedQuestions.verbal} 
                      expandedQuestion={expandedQuestion}
                      toggleQuestion={toggleQuestion}
                      formatDifficulty={formatDifficulty}
                      formatDialect={formatDialect}
                    />
                  )}
                </TabsContent>
                
                <TabsContent value="quantitative" className="space-y-4">
                  {groupedQuestions?.quantitative && (
                    <QuestionsList 
                      questions={groupedQuestions.quantitative} 
                      expandedQuestion={expandedQuestion}
                      toggleQuestion={toggleQuestion}
                      formatDifficulty={formatDifficulty}
                      formatDialect={formatDialect}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <Card className="bg-muted/50">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-bold mb-2">لم يتم العثور على أسئلة</h3>
                <p className="text-muted-foreground">
                  جرب تغيير معايير الفلترة أو البحث عن شيء آخر
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

interface QuestionsListProps {
  questions: TestQuestion[];
  expandedQuestion: number | null;
  toggleQuestion: (id: number) => void;
  formatDifficulty: (difficulty: string) => string;
  formatDialect: (dialect?: string) => string;
}

const QuestionsList: React.FC<QuestionsListProps> = ({ 
  questions, 
  expandedQuestion, 
  toggleQuestion,
  formatDifficulty,
  formatDialect
}) => {
  return (
    <div className="space-y-2">
      {questions.map(question => (
        <Card key={question.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div 
              className="cursor-pointer flex justify-between items-start"
              onClick={() => toggleQuestion(question.id)}
            >
              <CardTitle className="text-base">{question.text}</CardTitle>
              <ChevronDown className={`h-5 w-5 transition-transform ${
                expandedQuestion === question.id ? 'transform rotate-180' : ''
              }`} />
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline">
                {formatDifficulty(question.difficulty)}
              </Badge>
              <Badge variant="outline">
                {formatDialect(question.dialect)}
              </Badge>
              {question.topic && (
                <Badge variant="outline">
                  {question.topic}
                </Badge>
              )}
            </div>
          </CardHeader>
          
          {expandedQuestion === question.id && (
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">الخيارات:</h4>
                  <ul className="space-y-1">
                    {question.options.map((option, idx) => (
                      <li 
                        key={idx} 
                        className={`p-2 rounded ${idx === question.correctOptionIndex ? 'bg-green-100 dark:bg-green-900/20 border border-green-500' : ''}`}
                      >
                        {idx === question.correctOptionIndex && (
                          <span className="text-green-600 dark:text-green-400 font-bold ml-2">✓</span>
                        )}
                        {option}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {question.explanation && (
                  <div>
                    <h4 className="font-medium">الشرح:</h4>
                    <p className="p-2">{question.explanation}</p>
                  </div>
                )}
                
                <div className="flex justify-end pt-2">
                  <SaveToFolderButton 
                    questionId={question.id} 
                    buttonText="حفظ في مجلد"
                    variant="outline"
                    size="sm"
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};

export default LibraryPage;