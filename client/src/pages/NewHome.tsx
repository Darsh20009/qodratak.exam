import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { LoadingScreen } from "@/components/LoadingScreen";
import { usePageLoading } from "@/hooks/useLoading";
import { 
  BookOpenIcon, 
  BrainCircuitIcon, 
  ClipboardIcon,
  GamepadIcon,
  GraduationCapIcon,
  HelpCircleIcon, 
  Sparkles,
  TrophyIcon,
  UserIcon,
  RocketIcon,
  CrownIcon,
  DiamondIcon,
  StarIcon,
  ClockIcon,
  TargetIcon,
  ZapIcon,
  TrendingUpIcon,
  AwardIcon,
  ShieldIcon,
  HeartIcon,
  LightbulbIcon,
  FlameIcon,
  UsersIcon,
  CheckCircleIcon,
  GiftIcon,
  CalendarIcon
} from "lucide-react";
import { 
  GraduationCapIcon, 
  BrainCircuitIcon,
  BookOpenIcon,
  Clock,
  FolderIcon,
  HelpCircleIcon,
  GamepadIcon,
  BarChart3,
  Lightbulb,
  Download,
  Target,
  Trophy,
  Sparkles,
  ArrowRightIcon,
  Zap,
  Rocket
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const mainFeatures = [
  {
    title: "اختبارات قياس",
    description: "محاكاة دقيقة لاختبار قياس - 120 سؤال في 120 دقيقة",
    icon: GraduationCapIcon,
    href: "/qiyas",
    gradient: "from-blue-500 via-blue-600 to-indigo-600"
  },
  {
    title: "اختبار القدرات",
    description: "تمارين القدرات اللفظية والكمية مع تقييم ذكي",
    icon: BrainCircuitIcon,
    href: "/abilities",
    gradient: "from-purple-500 via-purple-600 to-pink-600"
  },
  {
    title: "المكتبة",
    description: "مجموعة شاملة من الكتب والمراجع التعليمية",
    icon: BookOpenIcon,
    href: "/library",
    gradient: "from-emerald-500 via-emerald-600 to-teal-600"
  },
  {
    title: "إدارة الوقت",
    description: "أدوات متقدمة لتنظيم الوقت وزيادة الإنتاجية",
    icon: Clock,
    href: "/time-management",
    gradient: "from-orange-500 via-orange-600 to-red-600"
  }
];

const quickActions = [
  { title: "المجلدات", icon: FolderIcon, href: "/folders", color: "bg-gradient-to-r from-cyan-500 to-blue-500" },
  { title: "اسأل الذكي", icon: HelpCircleIcon, href: "/ask", color: "bg-gradient-to-r from-green-500 to-emerald-500" },
  { title: "التحديات", icon: GamepadIcon, href: "/challenges", color: "bg-gradient-to-r from-purple-500 to-pink-500" },
  { title: "النتائج", icon: BarChart3, href: "/test-results", color: "bg-gradient-to-r from-yellow-500 to-orange-500" },
  { title: "الكتب", icon: Lightbulb, href: "/books", color: "bg-gradient-to-r from-indigo-500 to-purple-500" },
  { title: "تحميل التطبيق", icon: Download, href: "/install", color: "bg-gradient-to-r from-rose-500 to-pink-500" }
];

const stats = [
  { label: "أسئلة متاحة", value: "7,000+", icon: Target },
  { label: "مستخدم نشط", value: "∞", icon: Trophy },
  { label: "نجاح مضمون", value: "100%", icon: Sparkles }
];

export default function NewHome() {
  const [user, setUser] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const isLoading = usePageLoading(2000); // تحميل لمدة ثانيتين

const isPremiumUser = user && (user.subscription?.type === 'Pro' || user.subscription?.type === 'Pro Life' || user.subscription?.type === 'Pro Live');
  const isNightMode = currentTime.getHours() >= 18 || currentTime.getHours() <= 6;

  // إظهار شاشة التحميل
  if (isLoading) {
    return <LoadingScreen message="جاري تحضير منصة قدراتك..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-gradient-shift"></div>
          <div className="absolute -top-40 -right-32 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
        </div>

        <div className="relative z-10 container mx-auto px-6 py-20">
          <div className="text-center space-y-8">
            {/* Header */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <Rocket className="w-5 h-5 text-yellow-400" />
                <span className="text-sm font-medium">منصة قدراتك المطورة</span>
                <Sparkles className="w-5 h-5 text-yellow-400" />
              </div>

              <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
                قدراتك
              </h1>

              <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
                رحلتك نحو التميز في اختبارات القدرات والقياس
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <stat.icon className="w-6 h-6 text-yellow-400" />
                    <span className="text-3xl font-bold text-white">{stat.value}</span>
                  </div>
                  <p className="text-blue-200 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Features */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">الميزات الرئيسية</h2>
          <p className="text-xl text-gray-300">كل ما تحتاجه للنجاح في اختباراتك</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mainFeatures.map((feature, index) => (
            <Link key={index} href={feature.href}>
              <Card className="group relative overflow-hidden bg-white/5 backdrop-blur-sm border-white/20 hover:bg-white/10 transition-all duration-300 hover:scale-105 cursor-pointer">
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl text-white group-hover:text-blue-200 transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-center leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">الوصول السريع</h2>
          <p className="text-xl text-gray-300">أدوات وميزات إضافية في متناول يدك</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <div className="group relative overflow-hidden rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105 cursor-pointer">
                <div className={`absolute inset-0 ${action.color} opacity-80 group-hover:opacity-100 transition-opacity`}></div>
                <div className="relative z-10">
                  <action.icon className="w-8 h-8 mx-auto mb-3 text-white group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="font-bold text-white text-sm">{action.title}</h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-3xl p-12 border border-white/20">
          <div className="space-y-6">
            <Zap className="w-16 h-16 mx-auto text-yellow-400" />
            <h2 className="text-4xl md:text-5xl font-bold">ابدأ رحلتك الآن</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              انضم إلى آلاف الطلاب الذين حققوا النجاح في اختباراتهم
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/qiyas">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-4 text-lg font-bold rounded-xl">
                  ابدأ اختبار قياس
                  <ArrowRightIcon className="w-5 h-5 mr-2" />
                </Button>
              </Link>
              <Link href="/install">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg font-bold rounded-xl">
                  تحميل التطبيق
                  <Download className="w-5 h-5 mr-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}