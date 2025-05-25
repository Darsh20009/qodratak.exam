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
  HeartIcon,
  // أيقونات جديدة للتصميم الإبداعي
  Sigma,          // للرياضيات (كمي)
  Brain,          // للفظي
  Blend,          // للمختلط
  LibraryBig,     // للمرجعي (استخدمت LibraryBig بدلاً من Library)
  UserCircle2,    // للمؤلف
  FileText,       // لعدد الصفحات
  DownloadCloud   // لعدد التحميلات
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

  const books: Book[] = [
    {
      id: 1,
      title: "المعاصر 9",
      subject: "كمي",
      originalPrice: 120,
      memberPrice: 0,
      downloadUrl: "https://drive.google.com/file/d/1vBeR0lDF_ZhVMFadujozMz1n8iGjo3TU/view?usp=sharing",
      description: "كتاب شامل لقسم الكمي في اختبار القدرات العامة، يحتوي على شرح مفصل ومسائل متنوعة.",
      author: "فريق المعاصر",
      pages: 304,
      language: "العربية",
      publishYear: 2024,
      rating: 4.8,
      downloads: 1250,
      category: 'math',
      difficulty: 'intermediate'
    },
    {
      id: 2,
      title : "اللفظي السالم",
      subject: "لفظي",
      originalPrice: 95,
      memberPrice: 0,
      downloadUrl: "https://drive.google.com/file/d/1trZBHpzWxIEXZJ054TWJeEka1kyfovn0/view?usp=sharing",
      description: "مرجع شامل للقسم اللفظي مع استراتيجيات حل متقدمة.",
      author: "أحمد السالم",
      pages: 304,
      language: "العربية",
      publishYear: 2024,
      rating: 4.6,
      downloads: 980,
      category: 'verbal',
      difficulty: 'advanced'
    },
    {
      id: 3,
      title: "كتاب الجودة لفظي",
      subject: "لفظي",
      originalPrice: 50,
      memberPrice: 0,
      downloadUrl: "https://drive.google.com/file/d/1yLVdyLWHbMRU76H4CAE1xsoQnY90WycB/view?usp=sharing",
      description: "كتاب متكامل يغطي جميع أقسام اختبار القدرات العامة.",
      author: "مجموعة خبراء",
      pages: 152,
      language: "العربية",
      publishYear: 2024,
      rating: 4.9,
      downloads: 2100,
      category: 'verbal',
      difficulty: 'intermediate'
    },
    {
      id: 4,
      title: "ملخص التناظر اللفظي 95",
      subject: "لفظي",
      originalPrice: 150,
      memberPrice: 0,
      downloadUrl: "https://drive.google.com/file/d/1Xono8K03uOdBU-apUrPWzz5_8gNuFR6B/view?usp=sharing",
      description: "مراجعة شاملة لأساسيات لفظي المطلوبة في القدرات.",
      author: "أ. ايهاب عبدالعظيم",
      pages: 116,
      language: "العربية",
      publishYear: 2023,
      rating: 4.4,
      downloads: 750,
      category: 'reference', // تم تغيير الفئة لتجربة أيقونة مختلفة
      difficulty: 'beginner'
    },
    {
      id: 5,
      title: "120 نموذج لفظي",
      subject: "لفظي",
      originalPrice: 263,
      memberPrice: 0,
      downloadUrl: "https://drive.google.com/file/d/1UlfnYNvPQYBmBuY-hKEgRsGSjC0iuNhx/view?usp=sharing",
      description: "120 نموذج لفظي بإعداد فريق كبير جدًا.",
      author: "أكاديمية محوسب", // تم تصحيح الاسم
      pages: 920,
      language: "العربية",
      publishYear: 2024,
      rating: 4.3,
      downloads: 3650,
      category: 'mixed', // تم تغيير الفئة لتجربة أيقونة مختلفة
      difficulty: 'intermediate'
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
      toast({ title: "يجب تسجيل الدخول", description: "سجل دخولك أولاً للوصول للكتب", variant: "destructive" });
      setLocation("/profile");
      return;
    }
    if (!isSubscribed) {
      toast({ title: "اشتراك مطلوب", description: "هذا المحتوى متاح للمشتركين فقط", variant: "destructive" });
      setLocation("/subscription");
      return;
    }
    window.open(book.downloadUrl, '_blank');
    toast({ title: "تم فتح الكتاب!", description: `استمتع بقراءة "${book.title}"`, className: "bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700" });
  };

  const toggleFavorite = (bookId: number) => {
    const newFavorites = favoriteBooks.includes(bookId) 
      ? favoriteBooks.filter(id => id !== bookId)
      : [...favoriteBooks, bookId];
    setFavoriteBooks(newFavorites);
    localStorage.setItem("favoriteBooks", JSON.stringify(newFavorites));
    toast({ title: favoriteBooks.includes(bookId) ? "تم الإزالة من المفضلة" : "تم الإضافة للمفضلة", description: "يمكنك العثور على كتبك المفضلة بسهولة" });
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

  const renderStars = (rating: number, starColorClass: string) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon 
        key={i} 
        className={`h-4 w-4 ${i < Math.floor(rating) ? `${starColorClass} fill-current` : 'text-gray-300 dark:text-gray-600'}`} 
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
          <Button onClick={() => setLocation("/profile")} size="lg">تسجيل الدخول</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header (نفس تصميم الهيدر السابق) */}
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

      {/* رسالة الاشتراك (نفس التصميم السابق) */}
      {!isSubscribed && (
        <Card className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-700">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4"><GiftIcon className="h-12 w-12 text-amber-500" /></div>
            <CardTitle className="text-2xl text-amber-800 dark:text-amber-200">🎁 انضم لعالم الكتب المجانية!</CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">اشترك الآن واحصل على وصول مجاني لجميع الكتب التعليمية</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => setLocation("/subscription")} size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
              <CrownIcon className="h-5 w-5 mr-2" /> اشترك الآن
            </Button>
          </CardContent>
        </Card>
      )}

      {/* الفلاتر (نفس التصميم السابق) */}
      <Card className="mb-8">
        <CardHeader><CardTitle className="flex items-center gap-2"><FilterIcon className="h-5 w-5" /> البحث والفلترة</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium block mb-2">البحث</label>
              <div className="relative">
                <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="ابحث عن كتاب..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-10"/>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">التصنيف</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger><SelectValue placeholder="جميع التصنيفات" /></SelectTrigger>
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
                <SelectTrigger><SelectValue placeholder="جميع المستويات" /></SelectTrigger>
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

      {/* شبكة عرض الكتب - التصميم الإبداعي الجديد */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
        {filteredBooks.map((book) => {
          // مكون أيقونة الفئة الديناميكي
          const CategoryIcon = ({ category, className }: { category: string, className?: string }) => {
            switch (category) {
              case 'math': return <Sigma className={className} />;
              case 'verbal': return <Brain className={className} />;
              case 'mixed': return <Blend className={className} />;
              case 'reference': return <LibraryBig className={className} />;
              default: return <BookOpenIcon className={className} />;
            }
          };

          // الأنماط اللونية المعتمدة على الفئة
          const categoryStyles = {
            math:    { bg: 'bg-blue-500',    text: 'text-blue-600',    darkText: 'dark:text-blue-400',    gradientFrom: 'from-blue-500/20',    iconColor: 'text-blue-500',    badgeBg: 'bg-blue-100 dark:bg-blue-900/30',    badgeText: 'text-blue-700 dark:text-blue-300'   },
            verbal:  { bg: 'bg-emerald-500', text: 'text-emerald-600', darkText: 'dark:text-emerald-400', gradientFrom: 'from-emerald-500/20',iconColor: 'text-emerald-500',badgeBg: 'bg-emerald-100 dark:bg-emerald-900/30',badgeText: 'text-emerald-700 dark:text-emerald-300'},
            mixed:   { bg: 'bg-amber-500',   text: 'text-amber-600',   darkText: 'dark:text-amber-400',   gradientFrom: 'from-amber-500/20',  iconColor: 'text-amber-500',  badgeBg: 'bg-amber-100 dark:bg-amber-900/30',  badgeText: 'text-amber-700 dark:text-amber-300' },
            reference: { bg: 'bg-purple-500', text: 'text-purple-600', darkText: 'dark:text-purple-400', gradientFrom: 'from-purple-500/20',iconColor: 'text-purple-500',badgeBg: 'bg-purple-100 dark:bg-purple-900/30',badgeText: 'text-purple-700 dark:text-purple-300'},
            default: { bg: 'bg-gray-500',    text: 'text-gray-600',    darkText: 'dark:text-gray-400',    gradientFrom: 'from-gray-500/20',  iconColor: 'text-gray-500',  badgeBg: 'bg-gray-100 dark:bg-gray-900/30',  badgeText: 'text-gray-700 dark:text-gray-300'   }
          };
          const currentStyle = categoryStyles[book.category as keyof typeof categoryStyles] || categoryStyles.default;

          return (
            <Card 
              key={book.id} 
              className="group flex flex-col overflow-hidden rounded-2xl border dark:border-slate-800 bg-card shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out hover:-translate-y-1.5"
            >
              <CardHeader className={`relative p-0 ${currentStyle.gradientFrom} to-transparent bg-gradient-to-br border-b dark:border-slate-800`}>
                <div className="p-6 flex flex-col items-center text-center">
                  <div className={`mb-3.5 rounded-full p-3 bg-white dark:bg-slate-800/60 shadow-md`}>
                    <CategoryIcon category={book.category} className={`h-10 w-10 ${currentStyle.iconColor} opacity-90`} />
                  </div>
                  <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-100 leading-tight mb-1.5 group-hover:text-primary transition-colors">
                    {book.title}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className={`${currentStyle.badgeBg} ${currentStyle.badgeText} text-xs px-2.5 py-1 rounded-full font-medium`}>{getCategoryLabel(book.category)}</Badge>
                    <Badge variant="outline" className="text-xs border-border/50 dark:border-slate-700 px-2.5 py-1 rounded-full font-medium">{getDifficultyLabel(book.difficulty)}</Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleFavorite(book.id)}
                  className="absolute top-3.5 right-3.5 h-9 w-9 rounded-full bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-700 backdrop-blur-sm"
                  aria-label="إضافة إلى المفضلة"
                >
                  <HeartIcon className={`h-5 w-5 transition-all ${favoriteBooks.includes(book.id) ? 'fill-red-500 text-red-500' : 'text-slate-500 dark:text-slate-400 group-hover:text-red-400'}`} />
                </Button>
              </CardHeader>

              <CardContent className="p-5 flex-grow space-y-4 text-sm">
                <p className="text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                  {book.description}
                </p>

                <Separator className="my-4 dark:bg-slate-700/60" />

                <div className="space-y-3 text-slate-600 dark:text-slate-400">
                  <div className="flex items-center">
                    <UserCircle2 className={`h-5 w-5 mr-3 ${currentStyle.text} ${currentStyle.darkText} opacity-80`} />
                    <span>المؤلف: <strong className="text-slate-700 dark:text-slate-300">{book.author}</strong></span>
                  </div>
                  <div className="flex items-center">
                    <FileText className={`h-5 w-5 mr-3 ${currentStyle.text} ${currentStyle.darkText} opacity-80`} />
                    <span>عدد الصفحات: <strong className="text-slate-700 dark:text-slate-300">{book.pages}</strong></span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                       {renderStars(book.rating, `${currentStyle.text} ${currentStyle.darkText}`)}
                       <span className="ml-2 text-xs font-medium">({book.rating.toFixed(1)})</span>
                    </div>
                    <div className="flex items-center text-xs">
                      <DownloadCloud className={`h-4 w-4 mr-1.5 ${currentStyle.text} ${currentStyle.darkText} opacity-70`} />
                      <span className="font-medium text-slate-700 dark:text-slate-300">{book.downloads}</span>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-5 border-t dark:border-slate-800 mt-auto bg-slate-50 dark:bg-slate-800/30">
                <div className="w-full space-y-3.5">
                  <div className="flex items-end justify-between">
                    <div> {/* معلومات السعر */}
                      {isSubscribed ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`text-2xl font-bold ${currentStyle.text} ${currentStyle.darkText}`}>مجاني</span>
                          <GiftIcon className={`h-6 w-6 ${currentStyle.text} ${currentStyle.darkText}`} />
                        </div>
                      ) : ( // غير مشترك
                        <div>
                          <div className={`text-xl font-bold ${book.memberPrice === 0 ? `${currentStyle.text} ${currentStyle.darkText}` : 'text-primary'}`}>
                            {book.memberPrice === 0 ? `مجاني` : `${book.memberPrice} ريال`}
                          </div>
                          {book.memberPrice === 0 && <p className="text-xs text-muted-foreground">(للمشتركين فقط)</p>}
                          {book.originalPrice > book.memberPrice && book.memberPrice !== 0 && ( 
                              <div className="text-xs text-muted-foreground">
                                السعر الأصلي: <span className="line-through">{book.originalPrice} ريال</span>
                              </div>
                          )}
                        </div>
                      )}
                    </div>
                    {(!isSubscribed && book.originalPrice > book.memberPrice && book.memberPrice > 0) && (
                        <Badge className={`${currentStyle.badgeBg} ${currentStyle.badgeText} text-xs h-fit px-2.5 py-1 rounded-full font-semibold`}>
                          وفر {book.originalPrice - book.memberPrice} ر.س!
                        </Badge>
                    )}
                  </div>

                  <Button 
                    onClick={() => handleDownload(book)} 
                    className={`w-full group/btn font-semibold ${isSubscribed ? `${currentStyle.bg} hover:opacity-95` : 'bg-primary hover:bg-primary/90'} text-white`}
                    disabled={!isSubscribed}
                  >
                    {isSubscribed ? (
                      <>
                        <DownloadIcon className="h-4.5 w-4.5 mr-2 group-hover/btn:translate-y-0.5 transition-transform duration-200" />
                        تحميل الكتاب الآن
                      </>
                    ) : (
                      <>
                        <LockIcon className="h-4.5 w-4.5 mr-2" />
                        اشترك الآن للتحميل
                      </>
                    )}
                    <ExternalLinkIcon className="h-4 w-4 ml-auto opacity-0 group-hover/btn:opacity-70 transition-opacity duration-300" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* رسالة عدم وجود كتب (نفس التصميم السابق) */}
      {filteredBooks.length === 0 && (
        <Card className="text-center py-12 mt-8">
          <CardContent>
            <BookOpenIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">لا توجد كتب متطابقة</h3>
            <p className="text-muted-foreground">جرب تغيير معايير البحث أو الفلترة</p>
          </CardContent>
        </Card>
      )}

      {/* الإحصائيات (نفس التصميم السابق) */}
      {isSubscribed && (
        <Card className="mt-10 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <CardHeader className="text-center"><CardTitle className="text-2xl text-blue-800 dark:text-blue-200">📊 إحصائيات مكتبتك</CardTitle></CardHeader>
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
                <div className="text-3xl font-bold text-purple-600">{books.reduce((total, book) => total + book.originalPrice, 0)}</div>
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