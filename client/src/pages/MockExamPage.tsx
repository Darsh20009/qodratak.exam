import { useState } from "react";
import { useLocation } from "wouter";
import { TestType, MockExamConfig } from "@shared/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const mockExams: MockExamConfig[] = [
  {
    id: 1,
    name: "اختبار لفظي محاكي",
    description: "اختبار قدرات لفظي محاكي - 65 سؤال في 65 دقيقة",
    type: "verbal",
    totalSections: 1,
    totalQuestions: 65,
    totalTime: 65,
    isMockExam: true,
    requiresSubscription: true,
    sections: [
      {
        sectionNumber: 1,
        name: "القسم اللفظي",
        category: "verbal",
        questionCount: 65,
        timeLimit: 65
      }
    ]
  },
  {
    id: 2,
    name: "اختبار كمي محاكي",
    description: "اختبار قدرات كمي محاكي - 55 سؤال في 55 دقيقة",
    type: "quantitative",
    totalSections: 1,
    totalQuestions: 55,
    totalTime: 55,
    isMockExam: true,
    requiresSubscription: true,
    sections: [
      {
        sectionNumber: 1,
        name: "القسم الكمي",
        category: "quantitative",
        questionCount: 55,
        timeLimit: 55
      }
    ]
  },
  {
    id: 3,
    name: "اختبار قدراتك الشامل المحاكي",
    description: "اختبار قياس محاكي شامل - 120 سؤال في 120 دقيقة",
    type: "comprehensive",
    totalSections: 7,
    totalQuestions: 120,
    totalTime: 120,
    isMockExam: true,
    requiresSubscription: true,
    isQiyas: true,
    sections: [
      {
        sectionNumber: 1,
        name: "القسم الأول",
        category: "mixed",
        questionCount: 24,
        timeLimit: 24
      },
      {
        sectionNumber: 2,
        name: "القسم الثاني",
        category: "mixed",
        questionCount: 24,
        timeLimit: 24
      },
      {
        sectionNumber: 3,
        name: "القسم الثالث",
        category: "mixed",
        questionCount: 24,
        timeLimit: 24
      },
      {
        sectionNumber: 4,
        name: "القسم الرابع",
        category: "quantitative",
        questionCount: 11,
        timeLimit: 11
      },
      {
        sectionNumber: 5,
        name: "القسم الخامس",
        category: "verbal",
        questionCount: 13,
        timeLimit: 13
      },
      {
        sectionNumber: 6,
        name: "القسم السادس",
        category: "quantitative",
        questionCount: 11,
        timeLimit: 11
      },
      {
        sectionNumber: 7,
        name: "القسم السابع",
        category: "verbal",
        questionCount: 13,
        timeLimit: 13
      }
    ]
  }
];

const MockExamPage = () => {
  const [, setLocation] = useLocation();

  const startExam = (exam: MockExamConfig) => {
    if (exam.type === "comprehensive") {
      setLocation("/qiyas-exam");
    } else {
      setLocation(`/abilities-test/${exam.type}`);
    }
  };

  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">الاختبارات المحاكية</h1>
      <p className="text-muted-foreground mb-8">
        اختبارات محاكية للقدرات متاحة للمشتركين فقط
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockExams.map(exam => (
          <Card key={exam.id} className="relative overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">{exam.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{exam.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>عدد الأسئلة:</span>
                  <span className="font-medium">{exam.totalQuestions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>الوقت:</span>
                  <span className="font-medium">{exam.totalTime} دقيقة</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>الأقسام:</span>
                  <span className="font-medium">{exam.totalSections}</span>
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={() => startExam(exam)}
              >
                ابدأ الاختبار
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MockExamPage;