
import React, { useState, useEffect, useMemo } from "react";
import { useLocation, Link } from "wouter";
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
  FilterIcon,
  SearchIcon,
  HeartIcon,
  Sigma,          
  Brain,          
  Blend,          
  LibraryBig,     
  UserCircle2,    
  FileText,       
  DownloadCloud,
  EyeIcon,
  XIcon,
  SparklesIcon,
  FlameIcon,
  ZapIcon,
  TrendingUpIcon,
  BookmarkIcon,
  ClockIcon,
  UsersIcon,
  AwardIcon,
  GlobeIcon,
  ChevronRightIcon,
  PlayIcon,
  PauseIcon,
  VolumeXIcon,
  Volume2Icon,
  RefreshCwIcon,
  ShareIcon,
  GridIcon,
  ListIcon,
  SlidersIcon,
  TrophyIcon,
  CalendarIcon,
  MessageSquareIcon
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";

// واجهة الكتاب المحدثة
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
  isFeatured?: boolean;
  isNew?: boolean;
  isTrending?: boolean;
  readingTime?: number; // بالدقائق
  tags?: string[];
  summary?: string;
  chapters?: number;
  lastUpdated?: string;
  audioAvailable?: boolean;
  interactiveContent?: boolean;
  practiceQuestions?: number;
}

// بيانات الكتب المحدثة
const booksData: Book[] = [
  {
    id: 11,
    title: "كتاب محوسبات قدراتك",
    subject: "محوسبات",
    originalPrice: 52,
    memberPrice: 0,
    downloadUrl: "/api/download/book/محوسبات-قدراتك-الإصدار-1_1761600838002.pdf",
    description: "كتاب محوسبات قدراتك - الإصدار الأول. دليلك الشامل لفهم وإتقان اختبارات القدرات المحوسبة بأحدث الطرق والاستراتيجيات الفعالة.",
    summary: "دليل شامل للاختبارات المحوسبة مع استراتيجيات حديثة",
    author: "فريق قدراتك",
    pages: 150,
    chapters: 10,
    language: "العربية",
    publishYear: 2025,
    rating: 5.0,
    downloads: 0,
    category: 'reference',
    difficulty: 'intermediate',
    isFeatured: true,
    isNew: true,
    isTrending: true,
    readingTime: 300,
    lastUpdated: "2025-10-27",
    audioAvailable: false,
    interactiveContent: false,
    practiceQuestions: 0,
    tags: ["محوسبات", "القدرات", "استراتيجيات", "دليل شامل"]
  },
  {
    id: 10,
    title: "المعاصر 10 - التأسيس الكمي المتطور",
    subject: "تأسيس كمي",
    originalPrice: 150,
    memberPrice: 0,
    downloadUrl: "https://drive.google.com/file/d/1yMMOO2dA47t3ihsg4l9S2HIcPdLYyIY2/view?usp=sharing",
    description: "أحدث إصدار من سلسلة المعاصر للتأسيس الكمي المتطور! يحتوي على استراتيجيات حديثة ومبتكرة لإتقان القسم الكمي من الصفر حتى الاحتراف، مع تطبيقات تفاعلية وأمثلة محلولة بطرق إبداعية.",
    summary: "الإصدار الأحدث للتأسيس الكمي مع طرق إبداعية وتطبيقات تفاعلية حديثة",
    author: "فريق المعاصر التطويري",
    pages: 380,
    chapters: 15,
    language: "العربية",
    publishYear: 2025,
    rating: 4.9,
    downloads: 0,
    category: 'math',
    difficulty: 'beginner',
    isFeatured: true,
    isNew: true,
    isTrending: true,
    readingTime: 520,
    lastUpdated: "2025-01-01",
    audioAvailable: true,
    interactiveContent: true,
    practiceQuestions: 350,
    tags: ["التأسيس الكمي", "طرق إبداعية", "تطبيقات تفاعلية", "الأساسيات المتطورة", "استراتيجيات مبتكرة"]
  },
  {
    id: 1,
    title: "المعاصر 9",
    subject: "كمي",
    originalPrice: 120,
    memberPrice: 0,
    downloadUrl: "https://drive.google.com/file/d/1vBeR0lDF_ZhVMFadujozMz1n8iGjo3TU/view?usp=sharing",
    description: "كتاب شامل لقسم الكمي في اختبار القدرات العامة، يحتوي على شرح مفصل ومسائل متنوعة مع أحدث التحديثات والاستراتيجيات الفعالة لتحقيق أعلى الدرجات.",
    summary: "دليل متكامل للقسم الكمي مع تركيز خاص على الاستراتيجيات المتقدمة",
    author: "فريق المعاصر",
    pages: 304,
    chapters: 12,
    language: "العربية",
    publishYear: 2024,
    rating: 4.8,
    downloads: 1250,
    category: 'math',
    difficulty: 'intermediate',
    isFeatured: true,
    isNew: true,
    isTrending: true,
    readingTime: 480,
    lastUpdated: "2024-01-15",
    audioAvailable: true,
    interactiveContent: true,
    practiceQuestions: 250,
    tags: ["الهندسة", "الجبر", "الإحصاء", "التحليل"]
  },
  {
    id: 2,
    title: "اللفظي السالم",
    subject: "لفظي",
    originalPrice: 95,
    memberPrice: 0,
    downloadUrl: "https://drive.google.com/file/d/1trZBHpzWxIEXZJ054TWJeEka1kyfovn0/view?usp=sharing",
    description: "مرجع شامل للقسم اللفظي مع استراتيجيات حل متقدمة وتمارين مكثفة لضمان الفهم الكامل والتفوق في الاختبار.",
    summary: "استراتيجيات متقدمة للقسم اللفظي مع تمارين تطبيقية شاملة",
    author: "أحمد السالم",
    pages: 304,
    chapters: 10,
    language: "العربية",
    publishYear: 2024,
    rating: 4.6,
    downloads: 980,
    category: 'verbal',
    difficulty: 'advanced',
    isTrending: true,
    readingTime: 320,
    lastUpdated: "2024-02-01",
    audioAvailable: false,
    interactiveContent: true,
    practiceQuestions: 180,
    tags: ["التناظر", "إكمال الجمل", "القراءة", "المرادفات"]
  },
  {
    id: 3,
    title: "كتاب الجودة لفظي",
    subject: "لفظي",
    originalPrice: 50,
    memberPrice: 0,
    downloadUrl: "https://drive.google.com/file/d/1yLVdyLWHbMRU76H4CAE1xsoQnY90WycB/view?usp=sharing",
    description: "كتاب متكامل يغطي جميع أقسام اختبار القدرات العامة بأسلوب سهل ومبسط، مثالي للمراجعة السريعة والمركزة.",
    summary: "دليل مبسط وشامل لجميع أقسام القدرات العامة",
    author: "مجموعة خبراء",
    pages: 152,
    chapters: 8,
    language: "العربية",
    publishYear: 2024,
    rating: 4.9,
    downloads: 2100,
    category: 'verbal',
    difficulty: 'intermediate',
    isNew: true,
    readingTime: 240,
    lastUpdated: "2024-01-20",
    audioAvailable: true,
    interactiveContent: false,
    practiceQuestions: 120,
    tags: ["مراجعة سريعة", "أساسيات", "تطبيقات"]
  },
  {
    id: 4,
    title: "ملخص التناظر اللفظي 95",
    subject: "لفظي",
    originalPrice: 150,
    memberPrice: 0,
    downloadUrl: "https://drive.google.com/file/d/1Xono8K03uOdBU-apUrPWzz5_8gNuFR6B/view?usp=sharing",
    description: "مراجعة شاملة لأساسيات لفظي المطلوبة في القدرات، مع التركيز على أهم الأنماط والأسئلة المتكررة.",
    summary: "ملخص مركز للتناظر اللفظي مع الأنماط المتكررة",
    author: "أ. ايهاب عبدالعظيم",
    pages: 116,
    chapters: 6,
    language: "العربية",
    publishYear: 2023,
    rating: 4.4,
    downloads: 750,
    category: 'reference',
    difficulty: 'beginner',
    readingTime: 180,
    lastUpdated: "2023-12-10",
    audioAvailable: false,
    interactiveContent: false,
    practiceQuestions: 95,
    tags: ["التناظر", "أنماط", "مراجعة"]
  },
  {
    id: 5,
    title: "120 نموذج لفظي",
    subject: "لفظي",
    originalPrice: 263,
    memberPrice: 0,
    downloadUrl: "https://drive.google.com/file/d/1UlfnYNvPQYBmBuY-hKEgRsGSjC0iuNhx/view?usp=sharing",
    description: "مجموعة ضخمة تضم 120 نموذجاً لاختبارات القسم اللفظي، مصممة لمحاكاة الاختبار الفعلي وتدريبك بشكل مكثف.",
    summary: "مجموعة شاملة من النماذج التدريبية للقسم اللفظي",
    author: "أكاديمية محوسب",
    pages: 920,
    chapters: 15,
    language: "العربية",
    publishYear: 2024,
    rating: 4.3,
    downloads: 3650,
    category: 'mixed',
    difficulty: 'intermediate',
    isFeatured: true,
    readingTime: 1200,
    lastUpdated: "2024-03-01",
    audioAvailable: false,
    interactiveContent: true,
    practiceQuestions: 3600,
    tags: ["نماذج", "تدريب", "محاكاة", "اختبارات"]
  },
  {
    id: 6,
    title: "كتاب التحصيلي - ناصر عبدالكريم",
    subject: "التحصيلي",
    originalPrice: 180,
    memberPrice: 0,
    downloadUrl: "https://drive.google.com/file/d/1FX5M1vnUJU-5n3MWgt6m6A8VMkAnBwLL/view?usp=sharing",
    description: "كتاب شامل للتحصيلي الدراسي من إعداد الأستاذ ناصر عبدالكريم، يغطي جميع المواد الأساسية بأسلوب واضح ومنهجي لضمان التفوق في الاختبار التحصيلي.",
    summary: "دليل متكامل للاختبار التحصيلي مع تطبيقات شاملة",
    author: "ناصر عبدالكريم",
    pages: 450,
    chapters: 18,
    language: "العربية",
    publishYear: 2024,
    rating: 4.7,
    downloads: 1850,
    category: 'reference',
    difficulty: 'advanced',
    isFeatured: true,
    isNew: true,
    readingTime: 600,
    lastUpdated: "2024-09-01",
    audioAvailable: false,
    interactiveContent: true,
    practiceQuestions: 800,
    tags: ["التحصيلي", "مراجعة شاملة", "تطبيقات", "تفوق"]
  },
  {
    id: 7,
    title: "ملزمة 1443 هجريا القدرات العامة",
    subject: "مختلط",
    originalPrice: 150,
    memberPrice: 0,
    downloadUrl: "https://drive.google.com/file/d/17t2v2TPEosMPnG1zDdxcsnYUjP-5Z7Cs/view?usp=sharing",
    description: "ملزمة شاملة للقدرات العامة للعام 1443 هجري، تتضمن مراجعة مكثفة للقسمين الكمي واللفظي مع نماذج تطبيقية ونصائح هامة للاختبار.",
    summary: "ملزمة مطورة للقدرات العامة بأحدث المعايير",
    author: "فريق الإعداد الأكاديمي",
    pages: 320,
    chapters: 12,
    language: "العربية",
    publishYear: 2022,
    rating: 4.5,
    downloads: 2200,
    category: 'mixed',
    difficulty: 'intermediate',
    isTrending: true,
    readingTime: 480,
    lastUpdated: "2022-08-15",
    audioAvailable: false,
    interactiveContent: false,
    practiceQuestions: 400,
    tags: ["القدرات العامة", "1443 هجري", "كمي", "لفظي", "نماذج"]
  }
];

// مكون أيقونة الفئة المحدث
const CategoryIcon = ({ category, className }: { category: string, className?: string }) => {
  switch (category) {
    case 'math': return <Sigma className={className} />;
    case 'verbal': return <Brain className={className} />;
    case 'mixed': return <Blend className={className} />;
    case 'reference': return <LibraryBig className={className} />;
    default: return <BookOpenIcon className={className} />;
  }
};

// الأنماط اللونية المحدثة
const categoryStyles = {
  math: { 
    bg: 'bg-primary',
    text: 'text-primary',
    darkText: 'dark:text-primary',
    gradientFrom: 'from-primary/10 to-transparent',
    iconColor: 'text-primary',
    badgeBg: 'bg-primary/10 dark:bg-primary/20',
    badgeText: 'text-primary',
    glowColor: 'shadow-none'
  },
  verbal: { 
    bg: 'bg-primary',
    text: 'text-primary',
    darkText: 'dark:text-primary',
    gradientFrom: 'from-primary/10 to-transparent',
    iconColor: 'text-primary',
    badgeBg: 'bg-primary/10 dark:bg-primary/20',
    badgeText: 'text-primary',
    glowColor: 'shadow-none'
  },
  mixed: { 
    bg: 'bg-primary',
    text: 'text-primary',
    darkText: 'dark:text-primary',
    gradientFrom: 'from-primary/10 to-transparent',
    iconColor: 'text-primary',
    badgeBg: 'bg-primary/10 dark:bg-primary/20',
    badgeText: 'text-primary',
    glowColor: 'shadow-none'
  },
  reference: { 
    bg: 'bg-primary',
    text: 'text-primary',
    darkText: 'dark:text-primary',
    gradientFrom: 'from-primary/10 to-transparent',
    iconColor: 'text-primary',
    badgeBg: 'bg-primary/10 dark:bg-primary/20',
    badgeText: 'text-primary',
    glowColor: 'shadow-none'
  },
  default: { 
    bg: 'bg-muted-foreground',
    text: 'text-muted-foreground',
    darkText: 'dark:text-muted-foreground',
    gradientFrom: 'from-muted/60 to-transparent',
    iconColor: 'text-muted-foreground',
    badgeBg: 'bg-muted',
    badgeText: 'text-muted-foreground',
    glowColor: 'shadow-none'
  }
};

// مساعدات التسميات
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

// مساعدة لرسم النجوم
const renderStars = (rating: number, starColorClass: string) => {
  return Array.from({ length: 5 }, (_, i) => (
    <StarIcon 
      key={i} 
      className={`h-4 w-4 ${i < Math.floor(rating) ? `${starColorClass} fill-current` : 'text-gray-300 dark:text-gray-600'}`} 
    />
  ));
};

// مكون بطاقة الكتاب المحدث
interface BookCardProps {
  book: Book;
  isSubscribed: boolean;
  isFavorite: boolean;
  onDownload: (book: Book) => void;
  onToggleFavorite: (bookId: number) => void;
  onShowDetails: (book: Book) => void;
  viewMode: 'grid' | 'list';
}

const BookCard: React.FC<BookCardProps> = ({ 
  book, 
  isSubscribed, 
  isFavorite, 
  onDownload, 
  onToggleFavorite, 
  onShowDetails,
  viewMode 
}) => {
  const currentStyle = categoryStyles[book.category as keyof typeof categoryStyles] || categoryStyles.default;
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  if (viewMode === 'list') {
    return (
      <Card className="flex items-center p-4 overflow-hidden rounded-xl border dark:border-slate-800 bg-card shadow-sm">
        <div className={`flex-shrink-0 w-16 h-16 rounded-lg ${currentStyle.bg} flex items-center justify-center mr-4 ${currentStyle.glowColor}`}>
          <CategoryIcon category={book.category} className="h-8 w-8 text-white" />
        </div>
        
        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
               <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 truncate">
                {book.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{book.author}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className={`${currentStyle.badgeBg} ${currentStyle.badgeText} text-xs`}>
                  {getCategoryLabel(book.category)}
                </Badge>
                {book.isNew && (
                  <Badge className="bg-muted text-muted-foreground text-xs">
                    جديد
                  </Badge>
                )}
                {book.isTrending && (
                  <Badge className="bg-muted text-muted-foreground text-xs">
                    <TrendingUpIcon className="h-3 w-3 mr-1" />
                    رائج
                  </Badge>
                )}
                {book.audioAvailable && (
                  <Badge className="bg-muted text-muted-foreground text-xs">
                    <Volume2Icon className="h-3 w-3 mr-1" />
                    صوتي
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <div className="flex items-center">
                {renderStars(book.rating, `${currentStyle.text} ${currentStyle.darkText}`)}
                <span className="text-xs ml-1 text-slate-600 dark:text-slate-400">({book.rating})</span>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${isSubscribed ? `${currentStyle.text} ${currentStyle.darkText}` : 'text-primary'}`}>
                  {isSubscribed ? 'مجاني' : `${book.memberPrice === 0 ? 'مجاني' : `${book.memberPrice} ريال`}`}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {book.downloads} تحميل
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite(book.id); }}
                  className="h-9 w-9"
                >
                  <HeartIcon className={`h-4 w-4 ${isFavorite ? 'fill-primary text-primary' : 'text-slate-400'}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button
            onClick={(e) => { e.stopPropagation(); onShowDetails(book); }}
            variant="outline"
            size="sm"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            عرض
          </Button>
          
          <Button
            onClick={(e) => { e.stopPropagation(); onDownload(book); }}
            className={`${isSubscribed ? currentStyle.bg : 'bg-primary'} text-white hover:opacity-90`}
            size="sm"
            disabled={!isSubscribed}
          >
            {isSubscribed ? (
              <>
                <DownloadIcon className="h-4 w-4 mr-1" />
                تحميل
              </>
            ) : (
              <>
                <LockIcon className="h-4 w-4 mr-1" />
                اشترك
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col overflow-hidden rounded-2xl border dark:border-slate-800 bg-card shadow-sm">
      <CardHeader className={`relative p-0 bg-gradient-to-br ${currentStyle.gradientFrom} border-b dark:border-slate-800`}>
        <div className="p-6 flex flex-col items-center text-center relative">
          {/* شارات الحالة */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {book.isFeatured && (
              <Badge className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                <SparklesIcon className="h-3 w-3 mr-1" />
                مميز
              </Badge>
            )}
            {book.isNew && (
              <Badge className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                جديد
              </Badge>
            )}
            {book.isTrending && (
              <Badge className="bg-muted text-foreground text-xs px-2 py-1 rounded-full">
                <FlameIcon className="h-3 w-3 mr-1" />
                رائج
              </Badge>
            )}
          </div>

          {/* زر المفضلة والمشاركة */}
          <div className="absolute top-3 right-3 flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(book.id); }}
                     className="h-8 w-8 rounded-full bg-muted hover:bg-muted/80"
                  >
                     <HeartIcon className={`h-4 w-4 ${isFavorite ? 'fill-primary text-primary' : 'text-slate-500 dark:text-slate-400'}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* أيقونة الكتاب */}
           <div className={`mb-4 rounded-full p-4 bg-muted ${currentStyle.glowColor}`}>
            <CategoryIcon category={book.category} className={`h-12 w-12 ${currentStyle.iconColor} opacity-90`} />
          </div>

           <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight mb-2">
            {book.title}
          </CardTitle>

          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{book.author}</p>

          {/* الشارات */}
          <div className="flex gap-2 flex-wrap justify-center">
            <Badge variant="secondary" className={`${currentStyle.badgeBg} ${currentStyle.badgeText} text-xs px-3 py-1 rounded-full font-medium`}>
              {getCategoryLabel(book.category)}
            </Badge>
            <Badge variant="outline" className="text-xs border-border/50 dark:border-slate-700 px-3 py-1 rounded-full font-medium">
              {getDifficultyLabel(book.difficulty)}
            </Badge>
            {book.audioAvailable && (
              <Badge className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
                <Volume2Icon className="h-3 w-3 mr-1" />
                صوتي
              </Badge>
            )}
            {book.interactiveContent && (
              <Badge className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
                <ZapIcon className="h-3 w-3 mr-1" />
                تفاعلي
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 flex-grow space-y-4 text-sm">
        <p className="text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
          {book.summary || book.description}
        </p>

        <Separator className="my-4 dark:bg-slate-700/60" />

        {/* معلومات سريعة */}
        <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center">
            <FileText className={`h-4 w-4 mr-2 ${currentStyle.text} ${currentStyle.darkText} opacity-80`} />
            <span>{book.pages} صفحة</span>
          </div>
          <div className="flex items-center">
            <ClockIcon className={`h-4 w-4 mr-2 ${currentStyle.text} ${currentStyle.darkText} opacity-80`} />
            <span>{book.readingTime} دقيقة</span>
          </div>
          <div className="flex items-center">
            <BookOpenIcon className={`h-4 w-4 mr-2 ${currentStyle.text} ${currentStyle.darkText} opacity-80`} />
            <span>{book.chapters} فصل</span>
          </div>
          <div className="flex items-center">
            <CalendarIcon className={`h-4 w-4 mr-2 ${currentStyle.text} ${currentStyle.darkText} opacity-80`} />
            <span>{book.publishYear}</span>
          </div>
        </div>

        {/* التقييم والتحميلات */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {renderStars(book.rating, `${currentStyle.text} ${currentStyle.darkText}`)}
            <span className="ml-2 text-xs font-medium text-slate-700 dark:text-slate-300">({book.rating.toFixed(1)})</span>
          </div>
          <div className="flex items-center text-xs">
            <DownloadCloud className={`h-4 w-4 mr-1.5 ${currentStyle.text} ${currentStyle.darkText} opacity-70`} />
            <span className="font-medium text-slate-700 dark:text-slate-300">{book.downloads.toLocaleString()}</span>
          </div>
        </div>

        {/* التقدم والإحصائيات */}
        {book.practiceQuestions && (
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-600 dark:text-slate-400">أسئلة التدريب</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{book.practiceQuestions}</span>
            </div>
            <Progress value={75} className="h-2" />
          </div>
        )}
      </CardContent>

      <CardFooter className="p-5 border-t dark:border-slate-800 mt-auto bg-slate-50 dark:bg-slate-800/30">
        <div className="w-full space-y-3">
          {/* السعر */}
          <div className="flex items-end justify-between">
            <div>
              {isSubscribed ? (
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${currentStyle.text} ${currentStyle.darkText}`}>مجاني</span>
                  <GiftIcon className={`h-6 w-6 ${currentStyle.text} ${currentStyle.darkText}`} />
                </div>
              ) : (
                <div>
                  <div className={`text-xl font-bold ${book.memberPrice === 0 ? `${currentStyle.text} ${currentStyle.darkText}` : 'text-primary'}`}>
                    {book.memberPrice === 0 ? 'مجاني' : `${book.memberPrice} ريال`}
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
              <Badge className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-semibold">
                وفر {book.originalPrice - book.memberPrice} ر.س!
              </Badge>
            )}
          </div>

          {/* الأزرار */}
          <div className="flex gap-2">
            <Button 
              onClick={(e) => { e.stopPropagation(); onShowDetails(book); }}
              variant="outline"
              className="flex-1 group/btn"
            >
               <EyeIcon className="h-4 w-4 mr-2" />
              تفاصيل
            </Button>
            <Button 
              onClick={(e) => { e.stopPropagation(); onDownload(book); }} 
               className={`flex-2 font-semibold ${isSubscribed ? currentStyle.bg : 'bg-primary hover:bg-primary/90'} text-white`}
              disabled={!isSubscribed}
            >
              {isSubscribed ? (
                <>
                   <DownloadIcon className="h-4 w-4 mr-2" />
                  تحميل
                </>
              ) : (
                <>
                  <LockIcon className="h-4 w-4 mr-2" />
                  اشترك الآن
                </>
              )}
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

// المكون الرئيسي للصفحة
const BooksPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [favoriteBooks, setFavoriteBooks] = useState<number[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<number[]>([0, 300]);
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [showOnlyNew, setShowOnlyNew] = useState(false);
  const [showOnlyTrending, setShowOnlyTrending] = useState(false);

  useEffect(() => {
    const storedFavorites = localStorage.getItem("favoriteBooks");
    if (storedFavorites) {
      try { setFavoriteBooks(JSON.parse(storedFavorites)); } catch (e) { console.error("Error parsing favorite books:", e); }
    }
  }, []);

  const isSubscribed = Boolean(
    user?.subscription?.isActive ||
    user?.subscription?.status === "active" ||
    user?.subscription?.type === "Pro" ||
    user?.subscription?.type === "Pro Life" ||
    user?.subscription?.type === "Pro Life Plus" ||
    user?.subscription?.type === "Pro Live"
  );

  // فلترة وترتيب الكتب
  const displayedBooks = useMemo(() => {
    let books = booksData
      .filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             book.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             book.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = selectedCategory === "all" || book.category === selectedCategory;
        const matchesDifficulty = selectedDifficulty === "all" || book.difficulty === selectedDifficulty;
        const matchesPrice = book.originalPrice >= priceRange[0] && book.originalPrice <= priceRange[1];
        const matchesRating = book.rating >= ratingFilter;
        const matchesNew = !showOnlyNew || book.isNew;
        const matchesTrending = !showOnlyTrending || book.isTrending;
        
        return matchesSearch && matchesCategory && matchesDifficulty && matchesPrice && matchesRating && matchesNew && matchesTrending;
      });

    books.sort((a, b) => {
      switch (sortBy) {
        case 'latest': return b.publishYear - a.publishYear;
        case 'rating': return b.rating - a.rating;
        case 'downloads': return b.downloads - a.downloads;
        case 'price_low': return a.originalPrice - b.originalPrice;
        case 'price_high': return b.originalPrice - a.originalPrice;
        case 'title_asc': return a.title.localeCompare(b.title);
        case 'reading_time': return (a.readingTime || 0) - (b.readingTime || 0);
        case 'featured': 
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return b.downloads - a.downloads;
        default: return 0;
      }
    });

    return books;
  }, [searchTerm, selectedCategory, selectedDifficulty, sortBy, priceRange, ratingFilter, showOnlyNew, showOnlyTrending]);

  const handleDownload = (book: Book) => {
    if (!user) {
      toast({ title: "يجب تسجيل الدخول", description: "سجل دخولك أولاً للوصول للكتب", variant: "destructive" });
      setLocation("/login");
      return;
    }
    if (!isSubscribed) {
      toast({ title: "اشتراك مطلوب", description: "هذا المحتوى متاح للمشتركين فقط", variant: "destructive" });
      return;
    }
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
      description: "يمكنك العثور على كتبك المفضلة بسهولة" 
    });
  };

  const handleShowDetails = (book: Book) => {
    setSelectedBook(book);
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
          <Button onClick={() => setLocation("/login")} size="lg">تسجيل الدخول</Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Dialog open={!!selectedBook} onOpenChange={(open) => !open && setSelectedBook(null)}>
        <div className="container py-8 space-y-8">
          {/* هيدر هادئ بتدرج العلامة فقط */}
          <div className="text-center">
            <div className="relative">
              <div className="flex justify-center mb-6">
                <div className="relative p-4 bg-gradient-to-br from-primary to-primary/70 rounded-3xl shadow-sm">
                  <BookOpenIcon className="h-14 w-14 text-primary-foreground" />
                  {isSubscribed && (
                    <div className="absolute -top-2 -right-2 p-2 bg-primary rounded-full shadow-sm">
                      {user?.subscription?.type === 'Pro Life' || user?.subscription?.type === 'Pro Life Plus' || user?.subscription?.type === 'Pro Live' ? (
                        <DiamondIcon className="h-5 w-5 text-primary-foreground" />
                      ) : (
                        <CrownIcon className="h-5 w-5 text-primary-foreground" />
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-black mb-4 text-foreground">
                📚 مكتبة الكتب الذكية
              </h1>
              
              <p className="text-xl text-muted-foreground mb-6 max-w-3xl mx-auto leading-relaxed">
                اكتشف عالماً من المعرفة مع مجموعة مختارة بعناية من أفضل الكتب التعليمية المتطورة
              </p>
              
              {isSubscribed && (
                <div className="inline-flex items-center gap-3 bg-primary/10 px-5 py-3 rounded-full border border-primary/20">
                  <UnlockIcon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold text-foreground">
                    لديك وصول كامل لجميع الكتب مجاناً
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* إحصائيات سريعة */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: BookOpenIcon, label: "كتاب متاح", value: booksData.length },
                  { icon: TrophyIcon, label: "كتاب مميز", value: booksData.filter(b => b.isFeatured).length },
                  { icon: FlameIcon, label: "كتاب رائج", value: booksData.filter(b => b.isTrending).length },
                  { icon: HeartIcon, label: "في المفضلة", value: favoriteBooks.length }
            ].map((stat, index) => (
              <Card key={index} className="text-center p-4 shadow-sm">
                <stat.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </Card>
            ))}
          </div>

          {/* رسالة الاشتراك المحدثة */}
          {!isSubscribed && (
            <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-background border-primary/20">
              <CardHeader className="text-center relative">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-primary rounded-full shadow-sm">
                    <GiftIcon className="h-11 w-11 text-primary-foreground" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-foreground mb-2">
                  انضم إلى مكتبة الكتب
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  اشترك الآن واحصل على وصول كامل للكتب التعليمية
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4 relative">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {[
                    { icon: DownloadIcon, title: "تحميل غير محدود", desc: "احصل على جميع الكتب مجاناً" },
                    { icon: ZapIcon, title: "محتوى تفاعلي", desc: "تجربة تعلم متطورة" },
                    { icon: Volume2Icon, title: "كتب صوتية", desc: "استمع أثناء التنقل" }
                  ].map((feature, index) => (
                    <div key={index} className="flex flex-col items-center p-4 bg-background/80 border border-border rounded-xl">
                      <feature.icon className="h-8 w-8 text-primary mb-2" />
                      <h4 className="font-semibold text-foreground">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground text-center">{feature.desc}</p>
                    </div>
                  ))}
                </div>
                <Button 
                  onClick={() => setLocation("/subscription")} 
                  size="lg" 
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <CrownIcon className="h-5 w-5 mr-2" />
                  ابدأ اشتراكك الآن
                </Button>
              </CardContent>
            </Card>
          )}

          {/* شريط البحث والفلاتر المحدث */}
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <SlidersIcon className="h-5 w-5" />
                  البحث والفلترة المتقدمة
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <FilterIcon className="h-4 w-4 mr-2" />
                    فلاتر متقدمة
                  </Button>
                  <div className="flex items-center gap-1 border rounded-lg p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <GridIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      <ListIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* البحث الرئيسي */}
              <div className="relative">
                <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="ابحث عن كتاب، مؤلف، أو موضوع..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pr-12 py-3 text-lg"
                />
              </div>

              {/* فلاتر أساسية */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="ترتيب حسب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">المميز والأكثر تحميلاً</SelectItem>
                    <SelectItem value="latest">الأحدث</SelectItem>
                    <SelectItem value="rating">الأعلى تقييماً</SelectItem>
                    <SelectItem value="downloads">الأكثر تحميلاً</SelectItem>
                    <SelectItem value="reading_time">وقت القراءة</SelectItem>
                    <SelectItem value="price_low">السعر: منخفض إلى مرتفع</SelectItem>
                    <SelectItem value="price_high">السعر: مرتفع إلى منخفض</SelectItem>
                    <SelectItem value="title_asc">أبجدي (أ-ي)</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button
                    variant={showOnlyNew ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowOnlyNew(!showOnlyNew)}
                    className="flex-1"
                  >
                    جديد
                  </Button>
                  <Button
                    variant={showOnlyTrending ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowOnlyTrending(!showOnlyTrending)}
                    className="flex-1"
                  >
                    رائج
                  </Button>
                </div>
              </div>

              {/* فلاتر متقدمة */}
              {showFilters && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium mb-3 block">نطاق السعر (ريال)</label>
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={300}
                        step={10}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{priceRange[0]} ريال</span>
                        <span>{priceRange[1]} ريال</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-3 block">التقييم الأدنى</label>
                      <Slider
                        value={[ratingFilter]}
                        onValueChange={(value) => setRatingFilter(value[0])}
                        max={5}
                        step={0.5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>0 نجوم</span>
                        <span>{ratingFilter} نجوم فما فوق</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* عرض النتائج */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              النتائج ({displayedBooks.length} كتاب)
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCwIcon className="h-4 w-4" />
              آخر تحديث: اليوم
            </div>
          </div>

          {/* شبكة/قائمة الكتب */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayedBooks.map((book) => (
                <DialogTrigger key={book.id} asChild>
                  <div onClick={() => handleShowDetails(book)} className="cursor-pointer">
                    <BookCard
                      book={book}
                      isSubscribed={isSubscribed}
                      isFavorite={favoriteBooks.includes(book.id)}
                      onDownload={handleDownload}
                      onToggleFavorite={toggleFavorite}
                      onShowDetails={handleShowDetails}
                      viewMode={viewMode}
                    />
                  </div>
                </DialogTrigger>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {displayedBooks.map((book) => (
                <DialogTrigger key={book.id} asChild>
                  <div onClick={() => handleShowDetails(book)} className="cursor-pointer">
                    <BookCard
                      book={book}
                      isSubscribed={isSubscribed}
                      isFavorite={favoriteBooks.includes(book.id)}
                      onDownload={handleDownload}
                      onToggleFavorite={toggleFavorite}
                      onShowDetails={handleShowDetails}
                      viewMode={viewMode}
                    />
                  </div>
                </DialogTrigger>
              ))}
            </div>
          )}

          {/* رسالة عدم وجود كتب */}
          {displayedBooks.length === 0 && (
            <Card className="text-center py-16">
              <CardContent>
                <BookOpenIcon className="h-20 w-20 mx-auto text-muted-foreground mb-6 opacity-50" />
                <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">لا توجد كتب متطابقة</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  جرب تعديل معايير البحث أو الفلترة للعثور على الكتب التي تبحث عنها
                </p>
                <Button onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                  setSelectedDifficulty("all");
                  setShowOnlyNew(false);
                  setShowOnlyTrending(false);
                  setPriceRange([0, 300]);
                  setRatingFilter(0);
                }}>
                  إعادة تعيين الفلاتر
                </Button>
              </CardContent>
            </Card>
          )}

          {/* الإحصائيات التفاعلية */}
          {isSubscribed && displayedBooks.length > 0 && (
            <Card className="bg-gradient-to-br from-primary/10 to-background border-primary/20">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-foreground mb-2">
                  إحصائيات مكتبتك
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  ملخص سريع لاستخدامك للمكتبة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center space-y-2 p-4 bg-background/80 border border-border rounded-xl">
                    <div className="text-4xl font-black text-primary">
                      {booksData.length}
                    </div>
                    <div className="text-sm font-semibold text-foreground">كتاب متاح</div>
                    <div className="text-xs text-muted-foreground">في جميع التصنيفات</div>
                  </div>
                  
                  <div className="text-center space-y-2 p-4 bg-background/80 border border-border rounded-xl">
                    <div className="text-4xl font-black text-primary">
                      {favoriteBooks.length}
                    </div>
                    <div className="text-sm font-semibold text-foreground">كتاب مفضل</div>
                    <div className="text-xs text-muted-foreground">في مجموعتك</div>
                  </div>
                  
                  <div className="text-center space-y-2 p-4 bg-background/80 border border-border rounded-xl">
                    <div className="text-4xl font-black text-primary">
                      {booksData.reduce((total, book) => total + (book.readingTime || 0), 0)}
                    </div>
                    <div className="text-sm font-semibold text-foreground">دقيقة قراءة</div>
                    <div className="text-xs text-muted-foreground">وقت إجمالي</div>
                  </div>
                  
                  <div className="text-center space-y-2 p-4 bg-background/80 border border-border rounded-xl">
                    <div className="text-4xl font-black text-primary">
                      {booksData.reduce((total, book) => total + book.originalPrice, 0)}
                    </div>
                    <div className="text-sm font-semibold text-foreground">ريال موفر</div>
                    <div className="text-xs text-muted-foreground">بالاشتراك</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* نافذة التفاصيل المحدثة */}
          {selectedBook && (() => {
            const currentStyle = categoryStyles[selectedBook.category as keyof typeof categoryStyles] || categoryStyles.default;
            return (
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0 border dark:border-slate-800">
                 <DialogHeader className={`relative p-6 bg-gradient-to-br ${currentStyle.gradientFrom} border-b dark:border-slate-800`}>
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 p-4 bg-white dark:bg-slate-800/60 rounded-2xl shadow-xl ${currentStyle.glowColor}`}>
                      <CategoryIcon category={selectedBook.category} className={`h-12 w-12 ${currentStyle.iconColor}`} />
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2 leading-tight">
                        {selectedBook.title}
                      </DialogTitle>
                      <DialogDescription className="text-lg text-slate-600 dark:text-slate-400 mb-3">
                        {selectedBook.author} | {selectedBook.publishYear}
                      </DialogDescription>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${currentStyle.badgeBg} ${currentStyle.badgeText} font-semibold`}>
                          {getCategoryLabel(selectedBook.category)}
                        </Badge>
                        <Badge variant="outline" className="border-slate-300 dark:border-slate-600">
                          {getDifficultyLabel(selectedBook.difficulty)}
                        </Badge>
                        {selectedBook.isNew && (
                          <Badge className="bg-muted text-muted-foreground">
                            جديد
                          </Badge>
                        )}
                        {selectedBook.isTrending && (
                          <Badge className="bg-muted text-muted-foreground">
                            <TrendingUpIcon className="h-3 w-3 mr-1" />
                            رائج
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                    <XIcon className="h-6 w-6" />
                    <span className="sr-only">إغلاق</span>
                  </DialogClose>
                </DialogHeader>

                <div className="p-6 space-y-6">
                  {/* الوصف */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-100">وصف الكتاب</h3>
                    <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                      {selectedBook.description}
                    </p>
                  </div>

                  {/* التقييم والتفاعل */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      {renderStars(selectedBook.rating, `${currentStyle.text} ${currentStyle.darkText}`)}
                      <span className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                        {selectedBook.rating.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <DownloadCloud className="h-5 w-5" />
                      <span className="font-medium">{selectedBook.downloads.toLocaleString()} تحميل</span>
                    </div>
                  </div>

                  {/* التفاصيل */}
                  <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="details">التفاصيل</TabsTrigger>
                      <TabsTrigger value="content">المحتوى</TabsTrigger>
                      <TabsTrigger value="features">الميزات</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="details" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {[
                          { icon: FileText, label: "عدد الصفحات", value: `${selectedBook.pages} صفحة` },
                          { icon: BookOpenIcon, label: "الفصول", value: `${selectedBook.chapters} فصل` },
                          { icon: ClockIcon, label: "وقت القراءة", value: `${selectedBook.readingTime} دقيقة` },
                          { icon: CalendarIcon, label: "آخر تحديث", value: selectedBook.lastUpdated },
                          { icon: GlobeIcon, label: "اللغة", value: selectedBook.language },
                          { icon: MessageSquareIcon, label: "أسئلة التدريب", value: `${selectedBook.practiceQuestions} سؤال` }
                        ].map((item, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <item.icon className={`h-5 w-5 ${currentStyle.text} ${currentStyle.darkText}`} />
                            <div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">{item.label}</div>
                              <div className="font-semibold text-slate-700 dark:text-slate-300">{item.value}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="content" className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">الموضوعات المغطاة</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedBook.tags?.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {selectedBook.summary && (
                        <div>
                          <h4 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">ملخص سريع</h4>
                          <p className="text-slate-600 dark:text-slate-400">{selectedBook.summary}</p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="features" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { 
                            feature: selectedBook.audioAvailable, 
                            icon: Volume2Icon, 
                            title: "نسخة صوتية", 
                            desc: "متوفر بصيغة صوتية للاستماع" 
                          },
                          { 
                            feature: selectedBook.interactiveContent, 
                            icon: ZapIcon, 
                            title: "محتوى تفاعلي", 
                            desc: "يحتوي على عناصر تفاعلية" 
                          },
                          { 
                            feature: selectedBook.practiceQuestions && selectedBook.practiceQuestions > 0, 
                            icon: AwardIcon, 
                            title: "أسئلة تدريبية", 
                            desc: `${selectedBook.practiceQuestions} سؤال للتدريب` 
                          },
                          { 
                            feature: selectedBook.isFeatured, 
                            icon: StarIcon, 
                            title: "كتاب مميز", 
                            desc: "من الكتب المختارة بعناية" 
                          }
                        ].map((item, index) => (
                          <div key={index} className={`p-4 rounded-lg border ${item.feature ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/40'}`}>
                            <div className="flex items-center gap-3">
                              <item.icon className={`h-6 w-6 ${item.feature ? 'text-primary' : 'text-muted-foreground'}`} />
                              <div>
                                <h5 className={`font-semibold ${item.feature ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {item.title}
                                </h5>
                                <p className="text-sm text-muted-foreground">
                                  {item.desc}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <DialogFooter className="p-6 border-t dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        onClick={() => toggleFavorite(selectedBook.id)}
                        className="group"
                      >
                          <HeartIcon className={`h-4 w-4 mr-2 ${favoriteBooks.includes(selectedBook.id) ? 'fill-primary text-primary' : ''}`} />
                        {favoriteBooks.includes(selectedBook.id) ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                      </Button>
                      
                      <Button variant="outline">
                        <ShareIcon className="h-4 w-4 mr-2" />
                        مشاركة
                      </Button>
                    </div>
                    
                    <Button 
                      onClick={() => handleDownload(selectedBook)} 
                       className={`font-semibold px-8 ${isSubscribed ? currentStyle.bg : 'bg-primary hover:bg-primary/90'} text-white`}
                      disabled={!isSubscribed}
                      size="lg"
                    >
                      {isSubscribed ? (
                        <>
                           <DownloadIcon className="h-5 w-5 mr-2" />
                          تحميل الكتاب الآن
                        </>
                      ) : (
                        <>
                          <LockIcon className="h-5 w-5 mr-2" />
                          اشترك الآن للتحميل
                        </>
                      )}
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            );
          })()}
        </div>
      </Dialog>
    </TooltipProvider>
  );
};

export default BooksPage;
