import React from "react";
import { Link } from "wouter";
import { 
  BrainCircuitIcon, 
  BookOpenIcon, 
  GraduationCapIcon, 
  ArrowRightIcon, 
  HelpCircleIcon 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "اختبارات قياس",
    description: "تحضر لاختبار هيئة تقويم التعليم والتدريب بنفس تركيبة الاختبار الرسمي، 7 أقسام و 120 سؤال في 120 دقيقة.",
    icon: GraduationCapIcon,
    href: "/qiyas",
    color: "bg-blue-500"
  },
  {
    title: "اختبر قدراتك",
    description: "اختبر مهاراتك اللفظية والكمية بشكل تفاعلي مع مستويات مختلفة للتحدي واحصل على نقاط للترقية.",
    icon: BrainCircuitIcon,
    href: "/abilities",
    color: "bg-green-500"
  },
  {
    title: "اسأل سؤال",
    description: "احصل على إجابات دقيقة لأسئلتك، باستخدام قاعدة بيانات تضم أكثر من 10,000 سؤال وإجابة.",
    icon: HelpCircleIcon,
    href: "/ask",
    color: "bg-purple-500"
  },
  {
    title: "المكتبة",
    description: "استعرض مجموعة منظمة من الأسئلة والإجابات المصنفة حسب النوع والصعوبة واللهجة.",
    icon: BookOpenIcon,
    href: "/library",
    color: "bg-orange-500"
  }
];

const statisticsData = [
  { value: "10,000+", label: "سؤال" },
  { value: "4", label: "لهجات مدعومة" },
  { value: "7", label: "أقسام في اختبار قياس" },
  { value: "3", label: "مستويات صعوبة" }
];

const Home: React.FC = () => {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-primary/5 dark:from-primary/20 dark:to-gray-900 py-12 text-center">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-primary dark:text-primary-foreground">
              قدراتي
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-600 dark:text-gray-400 md:text-xl">
              المنصة الشاملة للتحضير لاختبارات قياس وتطوير قدراتك اللفظية والكمية
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button asChild size="lg">
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
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {statisticsData.map((stat, index) => (
              <div key={index} className="flex flex-col items-center justify-center text-center">
                <h3 className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</h3>
                <p className="text-gray-600 dark:text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-gray-100">
            ما يميزنا
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`p-2 w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center text-white mb-4`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </CardDescription>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="ghost" className="w-full justify-between">
                    <Link href={feature.href}>
                      استكشف
                      <ArrowRightIcon className="h-4 w-4 mr-1" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">ابدأ رحلتك الآن</h2>
          <p className="mb-8 max-w-[600px] mx-auto">
            سجل حساب مجاني واستمتع بجميع الميزات التي تقدمها منصة قدراتي لمساعدتك في تحقيق أهدافك
          </p>
          <Button asChild size="lg" variant="secondary">
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
