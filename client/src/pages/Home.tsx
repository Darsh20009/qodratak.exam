
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
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "اختبارات قياس",
    description: "محاكاة دقيقة لاختبار هيئة تقويم التعليم - 120 سؤال في 120 دقيقة مع تقييم فوري ونصائح للتحسين",
    icon: GraduationCapIcon,
    href: "/qiyas",
    color: "bg-blue-500/10 dark:bg-blue-500/20"
  },
  {
    title: "اختبر قدراتك",
    description: "تحديات تفاعلية متدرجة الصعوبة لتطوير مهاراتك اللفظية والكمية، مع نظام مكافآت ومستويات تحفيزية",
    icon: BrainCircuitIcon,
    href: "/abilities",
    color: "bg-green-500/10 dark:bg-green-500/20"
  },
  {
    title: "اسأل سؤال",
    description: "احصل على إجابات دقيقة وشرح مفصل من قاعدة بيانات تضم أكثر من 10,000 سؤال وإجابة",
    icon: HelpCircleIcon,
    href: "/ask",
    color: "bg-purple-500/10 dark:bg-purple-500/20"
  },
  {
    title: "المكتبة",
    description: "مكتبة شاملة من الأسئلة والشروحات مصنفة حسب المستوى والموضوع، مع أمثلة وتدريبات إضافية",
    icon: BookOpenIcon,
    href: "/library",
    color: "bg-orange-500/10 dark:bg-orange-500/20"
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
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32 bg-gradient-to-b from-primary/5 to-primary/0">
        <div className="absolute inset-0 bg-grid-white/10 bg-[size:40px_40px] [mask-image:linear-gradient(0deg,transparent,white)]" />
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-8 text-center">
            <div className="animate-fade-in-down space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
                طور قدراتك مع قدراتي
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 dark:text-gray-400 md:text-xl">
                منصتك الشاملة للتحضير لاختبارات قياس وتطوير مهاراتك اللفظية والكمية بأسلوب تفاعلي ومتطور
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-primary/80">
                <Link href="/qiyas">
                  <GraduationCapIcon className="ml-2 h-5 w-5" />
                  ابدأ اختبار قياس
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/abilities">
                  <BrainCircuitIcon className="ml-2 h-5 w-5" />
                  اختبر قدراتك
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16 bg-primary/5">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 animate-fade-in">
            {statisticsData.map((stat, index) => (
              <div key={index} className="flex flex-col items-center justify-center p-6 bg-card rounded-xl shadow-sm">
                <stat.icon className="h-8 w-8 mb-3 text-primary" />
                <h3 className="text-3xl font-bold text-primary mb-1">{stat.value}</h3>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className={`p-3 w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="h-6 w-6 text-foreground" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="ghost" className="w-full justify-between group">
                    <Link href={feature.href}>
                      استكشف
                      <ArrowRightIcon className="h-4 w-4 mr-1 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">ابدأ رحلتك نحو التميز</h2>
          <p className="mb-8 max-w-[600px] mx-auto opacity-90">
            سجل حساب مجاني الآن واحصل على تجربة تعليمية متكاملة مع متابعة تقدمك وتحسين مستواك
          </p>
          <Button asChild size="lg" variant="secondary" className="min-w-[200px]">
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
