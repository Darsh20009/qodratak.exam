import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon, SendIcon, LoaderCircleIcon, BrainCircuitIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import AiAssistant from "@/components/AiAssistant";

const dialects = [
  { value: "standard", label: "الفصحى" },
  { value: "saudi", label: "السعودية" },
  { value: "egyptian", label: "المصرية" },
  { value: "gulf", label: "الخليجية" },
];

const difficulties = [
  { value: "beginner", label: "مبتدئ" },
  { value: "intermediate", label: "متوسط" },
  { value: "advanced", label: "متقدم" },
];

const categories = [
  { value: "verbal", label: "قدرات لفظية" },
  { value: "quantitative", label: "قدرات كمية" },
];

interface SearchResult {
  question: {
    id: number;
    text: string;
    options: string[];
    correctOptionIndex: number;
    category: string;
    difficulty: string;
    dialect?: string;
    keywords?: string[];
  };
  matchType: 'exact' | 'similar' | 'keyword';
  similarity?: number;
  matchedKeywords?: string[];
}

const AskQuestionPage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedDialect, setSelectedDialect] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: searchResults, isLoading, refetch } = useQuery<SearchResult[]>({
    queryKey: ['/api/questions/search', query],
    queryFn: async () => {
      if (!query.trim()) return [];
      
      // Build query params
      const params = new URLSearchParams();
      params.append('query', query);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
      if (selectedDialect) params.append('dialect', selectedDialect);
      
      const response = await fetch(`/api/questions/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to search questions');
      }
      return response.json();
    },
    enabled: false, // Don't run immediately
  });

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        title: "الرجاء إدخال نص البحث",
        description: "يرجى كتابة سؤال أو كلمات مفتاحية للبحث",
        variant: "destructive",
      });
      return;
    }

    try {
      await refetch();
      // Add to history if not already there
      if (!searchHistory.includes(query)) {
        setSearchHistory((prev) => [query, ...prev].slice(0, 5));
      }
    } catch (error) {
      toast({
        title: "حدث خطأ أثناء البحث",
        description: "يرجى المحاولة مرة أخرى لاحقاً",
        variant: "destructive",
      });
    }
  };

  const handleHistoryClick = (historyItem: string) => {
    setQuery(historyItem);
    // Wait for state update and then search
    setTimeout(() => {
      refetch();
    }, 0);
  };

  // Get all the questions for the AI assistant
  const { data: allQuestions } = useQuery({
    queryKey: ['/api/questions'],
    queryFn: async () => {
      const response = await fetch('/api/questions');
      if (!response.ok) {
        throw new Error('Failed to get all questions');
      }
      return response.json();
    },
  });

  // Handle question selection from AI assistant
  const handleQuestionSelect = (question: any) => {
    // Search for this question
    setQuery(question.text);
    setTimeout(() => {
      refetch();
    }, 0);
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-4 text-center lg:text-right">اسأل سؤال</h1>
      <p className="text-muted-foreground mb-8 text-center lg:text-right">
        ابحث في أكثر من 10,000 سؤال وإجابة في مختلف المجالات اللفظية والكمية بلهجات متعددة
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left sidebar - Filters */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <Card>
            <CardHeader>
              <CardTitle>خيارات البحث</CardTitle>
              <CardDescription>حدد معايير البحث للحصول على نتائج أدق</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">النوع</label>
                <div className="flex flex-wrap gap-2">
                  <Badge 
                    className={`cursor-pointer ${selectedCategory === null ? 'bg-primary' : 'bg-secondary hover:bg-secondary/80'}`}
                    onClick={() => setSelectedCategory(null)}
                  >
                    الكل
                  </Badge>
                  {categories.map((category) => (
                    <Badge
                      key={category.value}
                      className={`cursor-pointer ${selectedCategory === category.value ? 'bg-primary' : 'bg-secondary hover:bg-secondary/80'}`}
                      onClick={() => setSelectedCategory(category.value)}
                    >
                      {category.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">المستوى</label>
                <div className="flex flex-wrap gap-2">
                  <Badge 
                    className={`cursor-pointer ${selectedDifficulty === null ? 'bg-primary' : 'bg-secondary hover:bg-secondary/80'}`}
                    onClick={() => setSelectedDifficulty(null)}
                  >
                    الكل
                  </Badge>
                  {difficulties.map((difficulty) => (
                    <Badge
                      key={difficulty.value}
                      className={`cursor-pointer ${selectedDifficulty === difficulty.value ? 'bg-primary' : 'bg-secondary hover:bg-secondary/80'}`}
                      onClick={() => setSelectedDifficulty(difficulty.value)}
                    >
                      {difficulty.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">اللهجة</label>
                <div className="flex flex-wrap gap-2">
                  <Badge 
                    className={`cursor-pointer ${selectedDialect === null ? 'bg-primary' : 'bg-secondary hover:bg-secondary/80'}`}
                    onClick={() => setSelectedDialect(null)}
                  >
                    الكل
                  </Badge>
                  {dialects.map((dialect) => (
                    <Badge
                      key={dialect.value}
                      className={`cursor-pointer ${selectedDialect === dialect.value ? 'bg-primary' : 'bg-secondary hover:bg-secondary/80'}`}
                      onClick={() => setSelectedDialect(dialect.value)}
                    >
                      {dialect.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
            
            {searchHistory.length > 0 && (
              <>
                <Separator />
                <CardHeader>
                  <CardTitle>سجل البحث</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {searchHistory.map((item, index) => (
                      <li key={index}>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-right" 
                          onClick={() => handleHistoryClick(item)}
                        >
                          {item}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </>
            )}
          </Card>
        </div>

        {/* Main content - Search and Results */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>البحث</CardTitle>
              <CardDescription>اكتب سؤالك أو الكلمات المفتاحية</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="ابحث عن سؤال أو موضوع..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                  dir="rtl"
                />
                <Button onClick={handleSearch} disabled={isLoading}>
                  {isLoading ? (
                    <LoaderCircleIcon className="animate-spin h-4 w-4 mr-2" />
                  ) : (
                    <SearchIcon className="h-4 w-4 mr-2" />
                  )}
                  بحث
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Assistant */}
          <div className="mb-8">
            {allQuestions && (
              <AiAssistant
                questions={allQuestions}
                onQuestionSelect={handleQuestionSelect}
                className="h-[400px]"
              />
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <LoaderCircleIcon className="animate-spin h-8 w-8 text-primary" />
              <span className="mr-2">جاري البحث...</span>
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-xl font-bold">النتائج ({searchResults.length})</h3>
              
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">الكل</TabsTrigger>
                  <TabsTrigger value="exact">مطابق</TabsTrigger>
                  <TabsTrigger value="similar">مشابه</TabsTrigger>
                  <TabsTrigger value="keyword">كلمات مفتاحية</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="space-y-4">
                  {searchResults.map((result, index) => (
                    <ResultCard key={index} result={result} />
                  ))}
                </TabsContent>
                
                <TabsContent value="exact" className="space-y-4">
                  {searchResults
                    .filter(result => result.matchType === 'exact')
                    .map((result, index) => (
                      <ResultCard key={index} result={result} />
                    ))}
                </TabsContent>
                
                <TabsContent value="similar" className="space-y-4">
                  {searchResults
                    .filter(result => result.matchType === 'similar')
                    .map((result, index) => (
                      <ResultCard key={index} result={result} />
                    ))}
                </TabsContent>
                
                <TabsContent value="keyword" className="space-y-4">
                  {searchResults
                    .filter(result => result.matchType === 'keyword')
                    .map((result, index) => (
                      <ResultCard key={index} result={result} />
                    ))}
                </TabsContent>
              </Tabs>
            </div>
          ) : searchResults && searchResults.length === 0 && query.trim() ? (
            <Card className="bg-muted/50">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-bold mb-2">لم يتم العثور على نتائج</h3>
                <p className="text-muted-foreground">
                  حاول تغيير كلمات البحث أو استخدام مصطلحات مختلفة
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const ResultCard: React.FC<{ result: SearchResult }> = ({ result }) => {
  const [expanded, setExpanded] = useState(false);
  
  const getMatchTypeLabel = () => {
    switch (result.matchType) {
      case 'exact':
        return { label: 'مطابق', color: 'bg-green-500' };
      case 'similar':
        return { label: 'مشابه', color: 'bg-blue-500' };
      case 'keyword':
        return { label: 'كلمات مفتاحية', color: 'bg-purple-500' };
      default:
        return { label: 'نتيجة', color: 'bg-gray-500' };
    }
  };

  const getDifficultyLabel = () => {
    switch (result.question.difficulty) {
      case 'beginner':
        return 'مبتدئ';
      case 'intermediate':
        return 'متوسط';
      case 'advanced':
        return 'متقدم';
      default:
        return result.question.difficulty;
    }
  };

  const getCategoryLabel = () => {
    switch (result.question.category) {
      case 'verbal':
        return 'لفظي';
      case 'quantitative':
        return 'كمي';
      default:
        return result.question.category;
    }
  };

  const getDialectLabel = () => {
    switch (result.question.dialect) {
      case 'standard':
        return 'الفصحى';
      case 'saudi':
        return 'السعودية';
      case 'egyptian':
        return 'المصرية';
      case 'gulf':
        return 'الخليجية';
      default:
        return result.question.dialect || 'الفصحى';
    }
  };

  const matchType = getMatchTypeLabel();
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg leading-tight">
            {result.question.text}
          </CardTitle>
          <Badge className={`${matchType.color} text-white`}>
            {matchType.label}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline">
            {getCategoryLabel()}
          </Badge>
          <Badge variant="outline">
            {getDifficultyLabel()}
          </Badge>
          <Badge variant="outline">
            {getDialectLabel()}
          </Badge>
          {result.similarity && (
            <Badge variant="outline">
              تطابق: {Math.round(result.similarity * 100)}%
            </Badge>
          )}
        </div>
        {result.matchedKeywords && result.matchedKeywords.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            <span className="text-sm text-muted-foreground">الكلمات المطابقة:</span>
            {result.matchedKeywords.map((keyword, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pb-2">
        <Button 
          variant="ghost" 
          className="w-full text-primary" 
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'إخفاء الإجابة' : 'عرض الإجابة'}
        </Button>
        
        {expanded && (
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">الخيارات:</h4>
              <ul className="space-y-1">
                {result.question.options.map((option, idx) => (
                  <li 
                    key={idx} 
                    className={`p-2 rounded ${idx === result.question.correctOptionIndex ? 'bg-green-100 dark:bg-green-900/20 border border-green-500' : ''}`}
                  >
                    {idx === result.question.correctOptionIndex && (
                      <span className="text-green-600 dark:text-green-400 font-bold ml-2">✓</span>
                    )}
                    {option}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium">الإجابة الصحيحة:</h4>
              <p className="p-2">{result.question.options[result.question.correctOptionIndex]}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AskQuestionPage;