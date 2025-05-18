
import React from "react";
import { TestDifficulty, TestType } from "@shared/types";
import { formatDifficulty } from "@/lib/formatters";
import { BookOpen, Calculator, GraduationCap, Star, Timer, Trophy, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";

interface TestSelectionProps {
  currentDifficulty: TestDifficulty;
  onSelectLevel: (level: TestDifficulty) => void;
  onStartTest: (type: TestType) => void;
}

const TestSelection: React.FC<TestSelectionProps> = ({
  currentDifficulty,
  onSelectLevel,
  onStartTest,
}) => {
  const examTypes = [
    {
      title: "الاختبار التأهيلي الشامل",
      description: "اختبار تأهيلي يتكون من 7 أقسام للتحضير الشامل",
      type: "qualification" as const,
      icon: GraduationCap,
      requiresSubscription: true,
      stats: {
        questions: 70,
        time: 180,
        users: "5k+",
      },
      gradient: "from-violet-500 to-purple-500",
    },
    {
      title: "اختبار قدرات لفظي",
      description: "تحدي مهاراتك اللغوية والفهم القرائي",
      type: "verbal" as const,
      icon: BookOpen,
      stats: {
        questions: 30,
        time: 60,
        users: "10k+",
      },
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "اختبار قدرات كمي",
      description: "اختبر قدراتك في الرياضيات والمنطق",
      type: "quantitative" as const,
      icon: Calculator,
      stats: {
        questions: 30,
        time: 60,
        users: "8k+",
      },
      gradient: "from-emerald-500 to-teal-500",
    },
  ];

  return (
    <div className="p-6 overflow-y-auto custom-scrollbar h-full">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            اختبر قدراتك
          </h2>
          <p className="text-muted-foreground mt-2">
            اختر المستوى المناسب لك وابدأ رحلة التفوق
          </p>
        </div>

        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">اختر مستواك</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(["beginner", "intermediate", "advanced"] as TestDifficulty[]).map(
              (level) => (
                <button
                  key={level}
                  onClick={() => onSelectLevel(level)}
                  className={`group relative overflow-hidden rounded-lg transition-all duration-300 ${
                    currentDifficulty === level
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "bg-card hover:bg-accent"
                  }`}
                >
                  <div className="relative z-10 p-4">
                    <div className="font-semibold text-lg mb-1">
                      {formatDifficulty(level)}
                    </div>
                    <div className="text-sm opacity-80">
                      {level === "beginner"
                        ? "مناسب للمبتدئين"
                        : level === "intermediate"
                        ? "تحدي متوسط المستوى"
                        : "للمتقدمين فقط"}
                    </div>
                  </div>
                  {currentDifficulty === level && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 animate-pulse" />
                  )}
                </button>
              )
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {examTypes.map((exam) => (
            <Card
              key={exam.type}
              className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg border-2 hover:border-primary/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity duration-300"
                style={{background: `linear-gradient(to bottom right, ${exam.gradient})`}} />
              
              <div className="relative p-6">
                <div className="mb-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${exam.gradient} flex items-center justify-center text-white mb-4 transform group-hover:scale-110 transition-transform duration-300`}>
                    <exam.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{exam.title}</h3>
                  <p className="text-muted-foreground text-sm">{exam.description}</p>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">{exam.stats.questions}</div>
                    <div className="text-xs text-muted-foreground">سؤال</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">{exam.stats.time}</div>
                    <div className="text-xs text-muted-foreground">دقيقة</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">{exam.stats.users}</div>
                    <div className="text-xs text-muted-foreground">متدرب</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
                    onClick={() => onStartTest(exam.type)}
                  >
                    ابدأ الاختبار
                  </Button>
                  {exam.requiresSubscription && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      مميز
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestSelection;
