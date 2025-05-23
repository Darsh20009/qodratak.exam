
import React from "react";
import { Link } from "wouter";
import { 
  BrainCircuitIcon, 
  BookOpenIcon, 
  GraduationCapIcon, 
  ArrowRightIcon, 
  HelpCircleIcon,
  Sparkles,
  Trophy,
  Target,
  Stars,
  Rocket,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "اختبارات قياس",
    description: "محاكاة دقيقة لاختبار هيئة تقويم التعليم - 120 سؤال في 120 دقيقة مع تقييم فوري ونصائح للتحسين",
    icon: GraduationCapIcon,
    href: "/qiyas",
    color: "bg-blue-500/10 dark:bg-blue-500/20",
    gradient: "from-blue-500 to-blue-600"
  },
  {
    title: "اختبر قدراتك",
    description: "تحديات تفاعلية متدرجة الصعوبة لتطوير مهاراتك اللفظية والكمية، مع نظام مكافآت ومستويات تحفيزية",
    icon: BrainCircuitIcon,
    href: "/abilities",
    color: "bg-green-500/10 dark:bg-green-500/20",
    gradient: "from-green-500 to-green-600"
  },
  {
    title: "اسأل سؤال",
    description: "احصل على إجابات دقيقة وشرح مفصل من قاعدة بيانات تضم أكثر من 10,000 سؤال وإجابة",
    icon: HelpCircleIcon,
    href: "/ask",
    color: "bg-purple-500/10 dark:bg-purple-500/20",
    gradient: "from-purple-500 to-purple-600"
  },
  {
    title: "المكتبة",
    description: "مكتبة شاملة من الأسئلة والشروحات مصنفة حسب المستوى والموضوع، مع أمثلة وتدريبات إضافية",
    icon: BookOpenIcon,
    href: "/library",
    color: "bg-orange-500/10 dark:bg-orange-500/20",
    gradient: "from-orange-500 to-orange-600"
  }
];

const statisticsData = [
  { value: "+10,000", label: "سؤال وإجابة", icon: Target },
  { value: "4", label: "لهجات مدعومة", icon: Sparkles },
  { value: "7", label: "أقسام اختبارية", icon: BrainCircuitIcon },
  { value: "∞", label: "فرص للتعلم", icon: Trophy }
];

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Hero Section with Enhanced Animation */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        {/* خلفية متحركة مع تأثيرات */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/10 animate-gradient-shift"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-100px,var(--primary-foreground),transparent)] animate-pulse"></div>
          <div className="absolute inset-0 bg-grid-white/5 bg-[size:40px_40px]"></div>
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute h-2 w-2 bg-primary/30 rounded-full animate-float-random"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${7 + Math.random() * 5}s`,
              }}
            />
          ))}
        </div>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/10 animate-gradient-shift" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-100px,var(--primary-foreground),transparent)] animate-pulse-slow" />
          <div className="absolute inset-0 animate-glow">
            <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,var(--primary)/20_0%,transparent_60%)] animate-spin-slow" />
            <div className="absolute inset-0 bg-[conic-gradient(from_90deg_at_50%_50%,var(--primary)/10_0%,transparent_60%)] animate-spin-reverse" />
          </div>
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute h-1 w-1 bg-primary/40 rounded-full animate-float-particle backdrop-blur-sm"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 7}s`,
                animationDuration: `${5 + Math.random() * 5}s`,
                filter: `blur(${Math.random() * 2}px)`,
                transform: `scale(${1 + Math.random()})`,
                opacity: 0.3 + Math.random() * 0.7
              }}
            />
          ))}
        </div>

        <div className="container relative px-4 md:px-6">
          <div className="flex flex-col items-center space-y-8 text-center">
            <div className="space-y-4 animate-fade-in-down">
              <div className="inline-flex items-center gap-4 justify-center">
                <Rocket className="h-8 w-8 text-primary animate-bounce" />
                <h1 className="text-5xl font-bold tracking-tighter sm:text-6xl md:text-7xl bg-gradient-to-r from-primary via-primary-foreground to-primary bg-clip-text text-transparent">
                  طور قدراتك
                </h1>
                <Stars className="h-8 w-8 text-primary animate-spin-slow" />
              </div>
              <p className="mx-auto max-w-[700px] text-gray-500 dark:text-gray-400 md:text-xl leading-relaxed">
                منصتك الشاملة للتحضير لاختبارات قياس وتطوير مهاراتك اللفظية والكمية
                <br />
                بأسلوب تفاعلي ومتطور
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in">
              <Button asChild size="lg" className="group bg-gradient-to-r from-primary to-primary/80 hover:scale-105 transition-transform">
                <Link href="/qiyas">
                  <GraduationCapIcon className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                  ابدأ اختبار قياس
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="group hover:scale-105 transition-transform">
                <Link href="/abilities">
                  <BrainCircuitIcon className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                  اختبر قدراتك
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Statistics Section */}
      <section className="py-16 bg-primary/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5 bg-[size:20px_20px]" />
        <div className="container px-4 md:px-6 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 animate-fade-in">
            {statisticsData.map((stat, index) => (
              <div key={index} 
                className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-card/90 to-card rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                style={{animationDelay: `${index * 0.2}s`}}
              >
                <stat.icon className="h-8 w-8 mb-3 text-primary group-hover:scale-110 transition-transform" />
                <h3 className="text-3xl font-bold text-primary mb-1 group-hover:scale-110 transition-transform">{stat.value}</h3>
                <p className="text-muted-foreground text-sm group-hover:text-primary transition-colors">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-background/80 to-background/90 relative overflow-hidden backdrop-blur-sm hover:-translate-y-1"
                style={{
                  animation: `floating-3d ${3 + index * 0.5}s ease-in-out infinite`,
                  animationDelay: `${index * 0.2}s`,
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                <CardHeader>
                  <div className={`p-3 w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-6 w-6 text-foreground" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-muted-foreground group-hover:text-muted-foreground/80 transition-colors">
                    {feature.description}
                  </CardDescription>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="ghost" className="w-full justify-between group/btn hover:bg-primary/10">
                    <Link href={feature.href}>
                      استكشف
                      <ArrowRightIcon className="h-4 w-4 mr-1 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary/90 to-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-100px,var(--primary-foreground),transparent)] opacity-20" />
        <div className="container px-4 md:px-6 text-center relative">
          <Zap className="h-12 w-12 mx-auto mb-6 animate-pulse text-primary-foreground/90" />
          <h2 className="text-3xl font-bold mb-4">ابدأ رحلتك نحو التميز</h2>
          <p className="mb-8 max-w-[600px] mx-auto opacity-90">
            سجل حساب مجاني الآن واحصل على تجربة تعليمية متكاملة مع متابعة تقدمك وتحسين مستواك
          </p>
          <Button asChild size="lg" variant="secondary" className="min-w-[200px] hover:scale-105 transition-transform">
            <Link href="/profile">
              سجل الآن
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Home;
