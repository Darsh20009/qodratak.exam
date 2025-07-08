import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  BookOpen,
  Calculator,
  Crown,
  Users,
  Zap,
  Target,
  Trophy,
  Clock,
  Brain,
  BarChart3,
  Star,
  CheckCircle,
  ArrowRight,
  Play,
  Award,
  PieChart,
  TrendingUp,
  Lightbulb,
  MessageSquare,
  Settings,
  Download,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Shield,
  Headphones,
  Heart,
  Sparkles
} from 'lucide-react';

export function UsageGuidePage() {
  const [activeSection, setActiveSection] = useState('overview');

  const features = [
    {
      icon: BookOpen,
      title: "اختبارات اللفظي",
      description: "اختبارات شاملة في التناظر اللفظي، إكمال الجمل، والاستيعاب المقروء",
      premium: false
    },
    {
      icon: Calculator,
      title: "اختبارات الكمي",
      description: "اختبارات متنوعة في الرياضيات والهندسة والإحصاء والجبر",
      premium: false
    },
    {
      icon: Target,
      title: "اختبار قياس كامل",
      description: "محاكاة كاملة لاختبار قياس (120 سؤال في 120 دقيقة)",
      premium: true
    },
    {
      icon: Brain,
      title: "تقييم القدرات",
      description: "اختبارات ذكية لتقييم مستواك وتحديد نقاط القوة والضعف",
      premium: true
    },
    {
      icon: Trophy,
      title: "بنك الأسئلة",
      description: "أكثر من 1500 سؤال منظم في اختبارات متسلسلة",
      premium: false
    },
    {
      icon: BarChart3,
      title: "التحليلات المتقدمة",
      description: "إحصائيات مفصلة وتقارير أداء شاملة",
      premium: true
    },
    {
      icon: MessageSquare,
      title: "المساعد الذكي",
      description: "مساعد ذكي مدعوم بالذكاء الاصطناعي للإجابة على أسئلتك",
      premium: false
    },
    {
      icon: Clock,
      title: "إدارة الوقت",
      description: "أدوات متقدمة لتنظيم الوقت والمهام والأهداف",
      premium: false
    }
  ];

  const subscriptionPlans = [
    {
      name: "المجاني",
      price: "0 ريال",
      description: "للمبتدئين",
      features: [
        "اختبار واحد يومياً (20 سؤال)",
        "الوصول للمساعد الذكي",
        "أدوات إدارة الوقت",
        "تطبيق الهاتف المحمول"
      ],
      color: "from-blue-500 to-cyan-500"
    },
    {
      name: "برو",
      price: "149 ريال",
      description: "شهرياً",
      features: [
        "اختبارات غير محدودة",
        "جميع أنواع الاختبارات",
        "التحليلات المتقدمة",
        "اختبارات قياس كاملة",
        "تقارير مفصلة",
        "دعم فني مميز"
      ],
      color: "from-purple-500 to-pink-500",
      popular: true
    },
    {
      name: "برو لايف",
      price: "299 ريال",
      description: "دفعة واحدة",
      features: [
        "جميع مميزات الباقة المميزة",
        "وصول مدى الحياة",
        "تحديثات مجانية",
        "دعم فني أولوية عالية",
        "ميزات حصرية قادمة"
      ],
      color: "from-yellow-500 to-orange-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-lg opacity-50"></div>
              <div className="relative p-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-2xl">
                <Lightbulb className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            دليل الاستخدام الشامل
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto font-medium">
            تعلم كيفية استخدام منصة قدراتك بكفاءة عالية لتحقيق أفضل النتائج في اختباراتك الأكاديمية
          </p>
        </motion.div>

        {/* Navigation Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-lg opacity-30"></div>
              <TabsList className="relative grid grid-cols-4 bg-black/30 backdrop-blur-xl border border-white/20 p-2 rounded-2xl">
                <TabsTrigger
                  value="overview"
                  className="flex items-center gap-2 px-6 py-3 text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-xl transition-all duration-300"
                >
                  <Globe className="h-4 w-4" />
                  نظرة عامة
                </TabsTrigger>
                <TabsTrigger
                  value="features"
                  className="flex items-center gap-2 px-6 py-3 text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-xl transition-all duration-300"
                >
                  <Star className="h-4 w-4" />
                  المميزات
                </TabsTrigger>
                <TabsTrigger
                  value="tutorial"
                  className="flex items-center gap-2 px-6 py-3 text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-xl transition-all duration-300"
                >
                  <Play className="h-4 w-4" />
                  شرح الاستخدام
                </TabsTrigger>
                <TabsTrigger
                  value="pricing"
                  className="flex items-center gap-2 px-6 py-3 text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500 data-[state=active]:text-white rounded-xl transition-all duration-300"
                >
                  <Crown className="h-4 w-4" />
                  الباقات
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <Card className="bg-black/20 backdrop-blur-xl border border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <Target className="h-6 w-6 text-blue-400" />
                    ما هي منصة قدراتك؟
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-white/80 leading-relaxed">
                    منصة قدراتك هي أول منصة تعليمية عربية متخصصة في التحضير لاختبارات القدرات والمهارات الأكاديمية، 
                    مع التركيز على اختبار قياس المعتمد في المملكة العربية السعودية.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-500/20 rounded-lg">
                      <h4 className="text-2xl font-bold text-blue-400">1500+</h4>
                      <p className="text-sm text-white/70">سؤال أصيل</p>
                    </div>
                    <div className="text-center p-4 bg-purple-500/20 rounded-lg">
                      <h4 className="text-2xl font-bold text-purple-400">10+</h4>
                      <p className="text-sm text-white/70">نوع اختبار</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/20 backdrop-blur-xl border border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <Sparkles className="h-6 w-6 text-purple-400" />
                    لماذا قدراتك؟
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <p className="text-white/80">أسئلة أصيلة مطابقة لاختبار قياس الفعلي</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <p className="text-white/80">تحليلات ذكية لتتبع تقدمك ونقاط ضعفك</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <p className="text-white/80">واجهة عربية متقدمة مصممة للطلاب العرب</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <p className="text-white/80">مساعد ذكي مدعوم بالذكاء الاصطناعي</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-black/20 backdrop-blur-xl border border-white/20 text-white h-full hover:scale-105 transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <feature.icon className="h-8 w-8 text-blue-400" />
                        {feature.premium && (
                          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                            مميز
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-white/80 leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          {/* Tutorial Tab */}
          <TabsContent value="tutorial" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Getting Started */}
              <Card className="bg-black/20 backdrop-blur-xl border border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <Play className="h-6 w-6 text-green-400" />
                    البدء السريع
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                      <div>
                        <h4 className="font-semibold">إنشاء حساب</h4>
                        <p className="text-white/70 text-sm">قم بالتسجيل باستخدام بريدك الإلكتروني أو Google</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                      <div>
                        <h4 className="font-semibold">اختر نوع الاختبار</h4>
                        <p className="text-white/70 text-sm">ابدأ بالاختبارات المجانية أو ترقى للباقة المميزة</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                      <div>
                        <h4 className="font-semibold">ابدأ التدريب</h4>
                        <p className="text-white/70 text-sm">اختبر نفسك وراجع النتائج والتحليلات</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Platform Availability */}
              <Card className="bg-black/20 backdrop-blur-xl border border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <Download className="h-6 w-6 text-orange-400" />
                    متاح على جميع الأجهزة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-500/20 rounded-lg">
                      <Smartphone className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                      <h4 className="font-semibold text-sm">الهواتف الذكية</h4>
                      <p className="text-xs text-white/70">Android & iOS</p>
                    </div>
                    <div className="text-center p-4 bg-purple-500/20 rounded-lg">
                      <Tablet className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                      <h4 className="font-semibold text-sm">الأجهزة اللوحية</h4>
                      <p className="text-xs text-white/70">iPad & Android</p>
                    </div>
                    <div className="text-center p-4 bg-pink-500/20 rounded-lg">
                      <Monitor className="h-8 w-8 text-pink-400 mx-auto mb-2" />
                      <h4 className="font-semibold text-sm">أجهزة الكمبيوتر</h4>
                      <p className="text-xs text-white/70">Windows & Mac</p>
                    </div>
                  </div>
                  <p className="text-white/70 text-center text-sm">
                    تطبيق ويب متطور يعمل على جميع المتصفحات الحديثة
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Usage Instructions */}
            <Card className="bg-black/20 backdrop-blur-xl border border-white/20 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Settings className="h-6 w-6 text-cyan-400" />
                  دليل الاستخدام المفصل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-blue-400">للمستخدمين المجانيين</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <ArrowRight className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <p className="text-white/80">اختبار واحد يومياً (20 سؤال في 20 دقيقة)</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <ArrowRight className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <p className="text-white/80">الوصول الكامل للمساعد الذكي</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <ArrowRight className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <p className="text-white/80">أدوات إدارة الوقت المتقدمة</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <ArrowRight className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <p className="text-white/80">تحليلات أساسية للنتائج</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-purple-400">للمشتركين المميزين</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Crown className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                        <p className="text-white/80">اختبارات غير محدودة يومياً</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <Crown className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                        <p className="text-white/80">اختبارات قياس كاملة (120 سؤال)</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <Crown className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                        <p className="text-white/80">تحليلات متقدمة ومفصلة</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <Crown className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                        <p className="text-white/80">تقارير PDF قابلة للتحميل</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {subscriptionPlans.map((plan, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-1">
                        الأكثر شعبية
                      </Badge>
                    </div>
                  )}
                  <Card className={`bg-black/20 backdrop-blur-xl border border-white/20 text-white h-full hover:scale-105 transition-all duration-300 ${plan.popular ? 'ring-2 ring-yellow-500/50' : ''}`}>
                    <CardHeader className="text-center">
                      <div className={`w-16 h-16 bg-gradient-to-r ${plan.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                        <Crown className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription className="text-white/70">{plan.description}</CardDescription>
                      <div className="text-4xl font-bold text-white">{plan.price}</div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        {plan.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                            <p className="text-white/80">{feature}</p>
                          </div>
                        ))}
                      </div>
                      <Button className={`w-full bg-gradient-to-r ${plan.color} text-white hover:opacity-90 transition-all duration-300`}>
                        {plan.name === "المجاني" ? "ابدأ مجاناً" : "اشترك الآن"}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Support Information */}
            <Card className="bg-black/20 backdrop-blur-xl border border-white/20 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl text-center">
                  <Headphones className="h-6 w-6 text-green-400" />
                  الدعم الفني والمساعدة
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-white/80 max-w-2xl mx-auto">
                  فريق الدعم الفني متاح على مدار الساعة لمساعدتك في حل أي مشكلة أو استفسار
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-500/20 rounded-lg">
                    <MessageSquare className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                    <h4 className="font-semibold">المساعد الذكي</h4>
                    <p className="text-sm text-white/70">متاح 24/7 للإجابة الفورية</p>
                  </div>
                  <div className="p-4 bg-purple-500/20 rounded-lg">
                    <Heart className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                    <h4 className="font-semibold">الدعم المباشر</h4>
                    <p className="text-sm text-white/70">للمشتركين المميزين</p>
                  </div>
                  <div className="p-4 bg-pink-500/20 rounded-lg">
                    <Shield className="h-8 w-8 text-pink-400 mx-auto mb-2" />
                    <h4 className="font-semibold">ضمان الجودة</h4>
                    <p className="text-sm text-white/70">استرداد كامل خلال 30 يوم</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}