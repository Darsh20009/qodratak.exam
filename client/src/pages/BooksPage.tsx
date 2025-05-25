
import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  BookOpenIcon, 
  DownloadIcon, 
  ExternalLinkIcon,
  LockIcon,
  UnlockIcon,
  CrownIcon,
  DiamondIcon,
  StarIcon,
  GiftIcon,
  ShoppingCartIcon,
  ArrowRightIcon,
  FilterIcon,
  SearchIcon,
  HeartIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Book {
  id: number;
  title: string;
  subject: string;
  originalPrice: number;
  memberPrice: number;
  downloadUrl: string;
  description: string;
  author: string;
  pages: number;
  language: string;
  publishYear: number;
  coverImage?: string;
  rating: number;
  downloads: number;
  category: 'math' | 'verbal' | 'mixed' | 'reference';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

const BooksPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [favoriteBooks, setFavoriteBooks] = useState<number[]>([]);

  // بيانات الكتب التجريبية
  const books: Book[] = [
    {
      id: 1,
      title: "المعاصر 9",
      subject: "كمي",
      originalPrice: 120,
      memberPrice: 0,
      downloadUrl: "https://drive.google.com/file/d/1vBeR0lDF_ZhVMFadujozMz1n8iGjo3TU/view?usp=sharing",
      description: "كتاب شامل لقسم الكمي في اختبار القدرات العامة، يحتوي على شرح مفصل ومسائل متنوعة",
      author: "فريق المعاصر",
      pages: 280,
      language: "العربية",
      publishYear: 2024,
      rating: 4.8,
      downloads: 1250,
      category: 'math',
      difficulty: 'intermediate'
    },
    {
      id: 2,
      title: "اللفظي المتقدم",
      subject: "لفظي",
      originalPrice: 95,
      memberPrice: 0,
      downloadUrl: "https://example.com/book2",
      description: "مرجع شامل للقسم اللفظي مع استراتيجيات حل متقدمة",
      author: "د. أحمد السعدي",
      pages: 320,
      language: "العربية",
      publishYear: 2024,
      rating: 4.6,
      downloads: 980,
      category: 'verbal',
      difficulty: 'advanced'
    },
    {
      id: 3,
      title: "دليل القدرات الشامل",
      subject: "مختلط",
      originalPrice: 150,
      memberPrice: 0,
      downloadUrl: "https://example.com/book3",
      description: "كتاب متكامل يغطي جميع أقسام اختبار القدرات العامة",
      author: "مجموعة خبراء",
      pages: 450,
      language: "العربية",
      publishYear: 2024,
      rating: 4.9,
      downloads: 2100,
      category: 'mixed',
      difficulty: 'intermediate'
    },
    {
      id: 4,
      title: "أساسيات الرياضيات",
      subject: "كمي",
      originalPrice: 80,
      memberPrice: 0,
      downloadUrl: "https://example.com/book4",
      description: "مراجعة شاملة لأساسيات الرياضيات المطلوبة في القدرات",
      author: "أ. فاطمة النور",
      pages: 200,
      language: "العربية",
      publishYear: 2023,
      rating: 4.4,
      downloads: 750,
      category: 'math',
      difficulty: 'beginner'
    },
    {
      id: 5,
      title: "مرجع المفردات",
      subject: "لفظي",
      originalPrice: 70,
      memberPrice: 0,
      downloadUrl: "https://example.com/book5",
      description: "قاموس شامل للمفردات والمصطلحات المهمة في الاختبارات",
      author: "د. سارة الأحمد",
      pages: 180,
      language: "العربية",
      publishYear: 2024,
      rating: 4.3,
      downloads: 650,
      category: 'reference',
      difficulty: 'beginner'
    }
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error parsing stored user:", e);
      }
    }

    // تحميل الكتب المفضلة
    const storedFavorites = localStorage.getItem("favoriteBooks");
    if (storedFavorites) {
      try {
        setFavoriteBooks(JSON.parse(storedFavorites));
      } catch (e) {
        console.error("Error parsing favorite books:", e);
      }
    }
  }, []);

  const isSubscribed = user?.subscription?.type === 'Pro' || user?.subscription?.type === 'Pro Life' || user?.subscription?.type === 'Pro Live';

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || book.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === "all" || book.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const handleDownload = (book: Book) => {
    if (!user) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "سجل دخولك أولاً للوصول للكتب",
        variant: "destructive"
      });
      setLocation("/profile");
      return;
    }

    if (!isSubscribed) {
      toast({
        title: "اشتراك مطلوب",
        description: "هذا المحتوى متاح للمشتركين فقط",
        variant: "destructive"
      });
      setLocation("/subscription");
      return;
    }

    // فتح الرابط في نافذة جديدة
    window.open(book.downloadUrl, '_blank');
    
    toast({
      title: "تم فتح الكتاب!",
      description: `استمتع بقراءة "${book.title}"`,
      className: "bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700"
    });
  };

  const toggleFavorite = (bookId: number) => {
    const newFavorites = favoriteBooks.includes(bookId) 
      ? favoriteBooks.filter(id => id !== bookId)
      : [...favoriteBooks, bookId];
    
    setFavoriteBooks(newFavorites);
    localStorage.setItem("favoriteBooks", JSON.stringify(newFavorites));
    
    toast({
      title: favoriteBooks.includes(bookId) ? "تم الإزالة من المفضلة" : "تم الإضافة للمفضلة",
      description: "يمكنك العثور على كتبك المفضلة بسهولة",
    });
  };

  const getCategoryLabel = (category: string) => {
    switch(category) {
      case 'math': return 'كمي';
      case 'verbal': return 'لفظي';
      case 'mixed': return 'مختلط';
      case 'reference': return 'مرجعي';
      default: return category;
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch(difficulty) {
      case 'beginner': return 'مبتدئ';
      case 'intermediate': return 'متوسط';
      case 'advanced': return 'متقدم';
      default: return difficulty;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon 
        key={i} 
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  if (!user) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <LockIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-3xl font-bold mb-4">مكتبة الكتب</h1>
          <p className="text-lg text-muted-foreground mb-6">
            سجل دخولك للوصول إلى مكتبتنا الحصرية من الكتب التعليمية
          </p>
          <Button onClick={() => setLocation("/profile")} size="lg">
            تسجيل الدخول
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <BookOpenIcon className="h-16 w-16 text-primary" />
            {isSubscribed && (
              <div className="absolute -top-2 -right-2">
                {user?.subscription?.type === 'Pro Life' || user?.subscription?.type === 'Pro Live' ? (
                  <DiamondIcon className="h-6 w-6 text-purple-500" />
                ) : (
                  <CrownIcon className="h-6 w-6 text-amber-500" />
                )}
              </div>
            )}
          </div>
        </div>
        
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          📚 مكتبة الكتب الحصرية
        </h1>
        
        <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
          مجموعة مختارة من أفضل الكتب التعليمية لتطوير قدراتك ومهاراتك
        </p>

        {isSubscribed && (
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 px-4 py-2 rounded-full border border-green-200 dark:border-green-700">
            <UnlockIcon className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              لديك وصول كامل لجميع الكتب مجاناً!
            </span>
          </div>
        )}
      </div>

      {!isSubscribed && (
        <Card className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-700">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <GiftIcon className="h-12 w-12 text-amber-500" />
            </div>
            <CardTitle className="text-2xl text-amber-800 dark:text-amber-200">
              🎁 انضم لعالم الكتب المجانية!
            </CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">
              اشترك الآن واحصل على وصول مجاني لجميع الكتب التعليمية
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => setLocation("/subscription")} 
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              <CrownIcon className="h-5 w-5 mr-2" />
              اشترك الآن
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilterIcon className="h-5 w-5" />
            البحث والفلترة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium block mb-2">البحث</label>
              <div className="relative">
                <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن كتاب..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium block mb-2">التصنيف</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع التصنيفات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع التصنيفات</SelectItem>
                  <SelectItem value="math">كمي</SelectItem>
                  <SelectItem value="verbal">لفظي</SelectItem>
                  <SelectItem value="mixed">مختلط</SelectItem>
                  <SelectItem value="reference">مرجعي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium block mb-2">المستوى</label>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
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
          </div>
        </CardContent>
      </Card>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBooks.map((book) => (
          <Card key={book.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <CardHeader className="relative">
              <div className="absolute top-4 right-4 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleFavorite(book.id)}
                  className="h-8 w-8 bg-white/80 dark:bg-black/80 hover:bg-white dark:hover:bg-black backdrop-blur-sm"
                >
                  <HeartIcon className={`h-4 w-4 ${favoriteBooks.includes(book.id) ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
                </Button>
              </div>
              
              <div className="h-32 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                <BookOpenIcon className="h-16 w-16 text-primary" />
              </div>
              
              <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                {book.title}
              </CardTitle>
              
              <CardDescription className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline">{getCategoryLabel(book.category)}</Badge>
                <Badge variant="outline">{getDifficultyLabel(book.difficulty)}</Badge>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {book.description}
              </p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المؤلف:</span>
                  <span className="font-medium">{book.author}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الصفحات:</span>
                  <span className="font-medium">{book.pages} صفحة</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">التقييم:</span>
                  <div className="flex items-center gap-1">
                    {renderStars(book.rating)}
                    <span className="text-xs text-muted-foreground ml-1">({book.downloads})</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  {isSubscribed ? (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-green-600">مجاني</span>
                      <GiftIcon className="h-5 w-5 text-green-600" />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-lg font-bold text-primary">{book.memberPrice} ريال</div>
                      <div className="text-sm text-muted-foreground line-through">{book.originalPrice} ريال</div>
                    </div>
                  )}
                </div>
                
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                  وفر {book.originalPrice} ريال
                </Badge>
              </div>
            </CardContent>

            <CardFooter>
              <Button 
                onClick={() => handleDownload(book)} 
                className="w-full group/btn"
                disabled={!isSubscribed}
              >
                {isSubscribed ? (
                  <>
                    <DownloadIcon className="h-4 w-4 mr-2 group-hover/btn:animate-bounce" />
                    تحميل الكتاب
                  </>
                ) : (
                  <>
                    <LockIcon className="h-4 w-4 mr-2" />
                    اشترك للتحميل
                  </>
                )}
                <ExternalLinkIcon className="h-4 w-4 mr-2" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredBooks.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpenIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">لا توجد كتب متطابقة</h3>
            <p className="text-muted-foreground">جرب تغيير معايير البحث أو الفلترة</p>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      {isSubscribed && (
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-blue-800 dark:text-blue-200">
              📊 إحصائيات مكتبتك
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-blue-600">{books.length}</div>
                <div className="text-sm text-muted-foreground">كتاب متاح</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-green-600">{favoriteBooks.length}</div>
                <div className="text-sm text-muted-foreground">كتاب مفضل</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-purple-600">
                  {books.reduce((total, book) => total + book.originalPrice, 0)}
                </div>
                <div className="text-sm text-muted-foreground">ريال موفر</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BooksPage;
