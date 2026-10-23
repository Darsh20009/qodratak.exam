import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, BookOpen, ClipboardCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TAHSILI_OPENING_LESSONS, type TahsiliLessonContent } from "@/pages/tahsiliOpeningLessons";

interface TahsiliStudySource {
  id: string;
  title: string;
  subject: string;
}

interface StudyUnit {
  title: string;
  printedPage: number;
  pdfPage: number;
  lessonKey?: string;
}

interface SubjectCurriculum {
  key: string;
  label: string;
  testSubject: string;
  sourceId: string;
  units: StudyUnit[];
}

const CURRICULUM: SubjectCurriculum[] = [
  {
    key: "رياضيات",
    label: "الرياضيات",
    testSubject: "math",
    sourceId: "ghasham-math-2023",
    units: [
      { title: "التبرير والبرهان والتوازي والتعامد", printedPage: 212, pdfPage: 6, lessonKey: "math" },
      { title: "العلاقات في المثلثات", printedPage: 219, pdfPage: 13 },
      { title: "الأشكال الرباعية", printedPage: 225, pdfPage: 19 },
      { title: "التشابه والنسبة والتغير", printedPage: 230, pdfPage: 24 },
      { title: "التحويلات الهندسية والتماثل", printedPage: 234, pdfPage: 28 },
      { title: "الدائرة", printedPage: 237, pdfPage: 31 },
      { title: "الدوال والمتباينات", printedPage: 239, pdfPage: 33 },
      { title: "المصفوفات", printedPage: 242, pdfPage: 36 },
      { title: "المتتابعات والمتسلسلات وذات الحدين", printedPage: 248, pdfPage: 42 },
      { title: "حساب المثلثات", printedPage: 254, pdfPage: 48 },
      { title: "الاحتمال والإحصاء", printedPage: 263, pdfPage: 57 },
      { title: "القطوع", printedPage: 270, pdfPage: 64 },
      { title: "كثيرات الحدود والأعداد المركبة", printedPage: 275, pdfPage: 69 },
      { title: "الدوال النسبية والدوال العكسية", printedPage: 279, pdfPage: 73 },
      { title: "تحليل الدوال والدوال الأم", printedPage: 286, pdfPage: 80 },
      { title: "الدوال الأسية والدوال اللوغاريتمية", printedPage: 296, pdfPage: 90 },
      { title: "المتجهات والإحداثيات القطبية", printedPage: 303, pdfPage: 97 },
      { title: "النهايات والاشتقاق", printedPage: 309, pdfPage: 103 },
      { title: "التكامل والمساحة", printedPage: 314, pdfPage: 108 },
    ],
  },
  {
    key: "فيزياء",
    label: "الفيزياء",
    testSubject: "physics",
    sourceId: "ghasham-physics-2023",
    units: [
      { title: "مدخل إلى علم الفيزياء", printedPage: 22, pdfPage: 18, lessonKey: "physics" },
      { title: "الميكانيكا", printedPage: 31, pdfPage: 27 },
      { title: "الطاقة", printedPage: 48, pdfPage: 44 },
      { title: "الموائع الساكنة والمتحركة", printedPage: 57, pdfPage: 53 },
      { title: "الموجات والبصريات", printedPage: 67, pdfPage: 63 },
      { title: "الفيزياء الكهربائية", printedPage: 82, pdfPage: 78 },
      { title: "الفيزياء المغناطيسية والكهرومغناطيسية", printedPage: 98, pdfPage: 94 },
      { title: "الفيزياء الحديثة", printedPage: 106, pdfPage: 102 },
      { title: "الفيزياء النووية", printedPage: 117, pdfPage: 113 },
    ],
  },
  {
    key: "كيمياء",
    label: "الكيمياء",
    testSubject: "chemistry",
    sourceId: "ghasham-chemistry-2023",
    units: [
      { title: "مقدمة في الكيمياء", printedPage: 129, pdfPage: 8, lessonKey: "chemistry" },
      { title: "التركيب الذري", printedPage: 138, pdfPage: 17 },
      { title: "التوزيع الإلكتروني والجدول الدوري", printedPage: 147, pdfPage: 26 },
      { title: "الروابط الكيميائية", printedPage: 154, pdfPage: 33 },
      { title: "التفاعلات والحسابات الكيميائية", printedPage: 161, pdfPage: 40 },
      { title: "قوانين الغازات", printedPage: 166, pdfPage: 45 },
      { title: "المحاليل", printedPage: 169, pdfPage: 48 },
      { title: "الأحماض والقواعد", printedPage: 173, pdfPage: 52 },
      { title: "الكيمياء الحرارية", printedPage: 177, pdfPage: 56 },
      { title: "سرعة التفاعلات الكيميائية", printedPage: 180, pdfPage: 59 },
      { title: "الاتزان الكيميائي", printedPage: 183, pdfPage: 62 },
      { title: "الكيمياء الكهربائية", printedPage: 187, pdfPage: 66 },
      { title: "الكيمياء العضوية", printedPage: 194, pdfPage: 73 },
      { title: "الكيمياء الحيوية", printedPage: 204, pdfPage: 83 },
    ],
  },
  {
    key: "أحياء",
    label: "الأحياء",
    testSubject: "biology",
    sourceId: "ghasham-biology-2023",
    units: [
      { title: "علم الأحياء والتصنيف الحديث", printedPage: 323, pdfPage: 7, lessonKey: "biology" },
      { title: "بدائيات النوى والفيروسات", printedPage: 328, pdfPage: 12 },
      { title: "الطلائعيات والفطريات", printedPage: 337, pdfPage: 21 },
      { title: "المملكة الحيوانية: اللافقاريات", printedPage: 354, pdfPage: 38 },
      { title: "المملكة الحيوانية: الفقاريات", printedPage: 365, pdfPage: 49 },
      { title: "الأجهزة في جسم الإنسان", printedPage: 384, pdfPage: 68 },
      { title: "المملكة النباتية", printedPage: 413, pdfPage: 97 },
      { title: "الخلية", printedPage: 425, pdfPage: 109 },
      { title: "الوراثة المندلية", printedPage: 435, pdfPage: 119 },
      { title: "الأحماض النووية وتصنيع البروتين", printedPage: 445, pdfPage: 129 },
      { title: "علم البيئة", printedPage: 451, pdfPage: 135 },
      { title: "التنوع الحيوي", printedPage: 460, pdfPage: 144 },
      { title: "سلوك الحيوان", printedPage: 464, pdfPage: 148 },
    ],
  },
];

interface TahsiliStudyUnitsProps {
  sources: TahsiliStudySource[];
}

export default function TahsiliStudyUnits({ sources }: TahsiliStudyUnitsProps) {
  const [, setLocation] = useLocation();
  const availableSubjects = CURRICULUM.filter((subject) =>
    sources.some((source) => source.id === subject.sourceId),
  );
  const [selectedSubjectKey, setSelectedSubjectKey] = useState(availableSubjects[0]?.key ?? "");
  const selectedSubject = availableSubjects.find((subject) => subject.key === selectedSubjectKey) ?? availableSubjects[0];
  const [expandedLessonKey, setExpandedLessonKey] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [submittedAnswer, setSubmittedAnswer] = useState<number | null>(null);

  if (!selectedSubject) return null;

  const selectedSource = sources.find((source) => source.id === selectedSubject.sourceId);
  const openUnit = (unit: StudyUnit) => {
    if (!selectedSource) return;
    const subjectQuery = selectedSubject.testSubject;
    const params = new URLSearchParams({
      subject: subjectQuery,
      source: selectedSource.id,
      page: String(unit.pdfPage),
    });
    setLocation(`/tahsili/sources?${params.toString()}`);
  };
  const selectSubject = (subjectKey: string) => {
    setSelectedSubjectKey(subjectKey);
    setExpandedLessonKey(null);
    setSelectedAnswer(null);
    setSubmittedAnswer(null);
  };
  const toggleLesson = (lessonKey: string) => {
    setExpandedLessonKey((current) => current === lessonKey ? null : lessonKey);
    setSelectedAnswer(null);
    setSubmittedAnswer(null);
  };
  const selectLessonAnswer = (index: number) => {
    setSelectedAnswer(index);
    setSubmittedAnswer(null);
  };

  return (
    <section aria-labelledby="tahsili-study-units-heading" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-primary">التأسيس حسب المادة</p>
          <h2 id="tahsili-study-units-heading" className="mt-1 text-xl font-black text-foreground">
            دروس مرتبة من فهارس الكتب المنشورة
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            اختر المادة ثم افتح أي وحدة عند صفحة بدايتها في كتاب التأسيس. ترتيب الوحدات وأرقامها مستخرجة من فهرس المصدر.
          </p>
        </div>
        <Badge variant="secondary">
          {availableSubjects.reduce((sum, subject) => sum + subject.units.length, 0).toLocaleString("ar-SA")} وحدة
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="اختيار مادة دروس التحصيلي">
        {availableSubjects.map((subject) => (
          <Button
            key={subject.key}
            type="button"
            aria-pressed={selectedSubject.key === subject.key}
            variant={selectedSubject.key === subject.key ? "default" : "outline"}
            onClick={() => selectSubject(subject.key)}
            data-testid={`tab-tahsili-units-${subject.testSubject}`}
          >
            {subject.label}
            <span className="mr-2 rounded-full bg-background/20 px-2 py-0.5 text-xs">
              {subject.units.length}
            </span>
          </Button>
        ))}
      </div>

      <Card
        id="tahsili-units-panel"
        aria-label={`دروس ${selectedSubject.label}`}
      >
        <CardHeader className="border-b border-border">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                تأسيس {selectedSubject.label}
              </CardTitle>
              <CardDescription className="mt-1">
                {selectedSource?.title ?? "كتاب التأسيس"}
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation(`/tahsilik/tests?subject=${selectedSubject.testSubject}`)}
              data-testid={`button-tahsili-curriculum-test-${selectedSubject.testSubject}`}
            >
              اختبر المادة <ClipboardCheck className="mr-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-5">
          <ol className="grid gap-2 sm:grid-cols-2">
            {selectedSubject.units.map((unit, index) => (
              <li key={`${selectedSubject.key}-${unit.pdfPage}`}>
                <Card className="h-full border-border bg-background">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">
                        {(index + 1).toLocaleString("ar-SA")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold leading-6 text-foreground">{unit.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          صفحة الكتاب {unit.printedPage.toLocaleString("ar-SA")}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {unit.lessonKey && (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              aria-expanded={expandedLessonKey === unit.lessonKey}
                              aria-controls={`tahsili-lesson-${unit.lessonKey}`}
                              onClick={() => toggleLesson(unit.lessonKey!)}
                              data-testid={`button-expand-tahsili-lesson-${unit.lessonKey}`}
                            >
                              {expandedLessonKey === unit.lessonKey ? "إخفاء الشرح" : "شرح الدرس"}
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openUnit(unit)}
                            disabled={!selectedSource}
                            data-testid={`button-open-tahsili-unit-${selectedSubject.testSubject}-${index + 1}`}
                          >
                            الكتاب <ArrowLeft className="mr-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    {unit.lessonKey && expandedLessonKey === unit.lessonKey && (
                      <div id={`tahsili-lesson-${unit.lessonKey}`}>
                        <OpeningLesson
                          lesson={TAHSILI_OPENING_LESSONS[unit.lessonKey]}
                          selectedAnswer={selectedAnswer}
                          submittedAnswer={submittedAnswer}
                          onSelectAnswer={selectLessonAnswer}
                          onCheckAnswer={() => setSubmittedAnswer(selectedAnswer)}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
          <p className="mt-4 rounded-xl bg-muted/50 px-3 py-2 text-xs leading-5 text-muted-foreground">
            يفتح زر «الكتاب» صفحة الوحدة في المصدر، وتظهر الشروحات الداخلية للوحدات المعلّمة بها. زر الاختبار يقود إلى اختبار المادة، وليس إلى اختبار خاص بالدرس.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

interface OpeningLessonProps {
  lesson: TahsiliLessonContent;
  selectedAnswer: number | null;
  submittedAnswer: number | null;
  onSelectAnswer: (index: number) => void;
  onCheckAnswer: () => void;
}

function OpeningLesson({
  lesson,
  selectedAnswer,
  submittedAnswer,
  onSelectAnswer,
  onCheckAnswer,
}: OpeningLessonProps) {
  return (
    <article className="mt-4 space-y-5 border-t border-border pt-4" aria-label={`شرح ${lesson.title}`}>
      <div>
        <p className="text-sm font-black leading-7 text-foreground">{lesson.title}</p>
        <p className="mt-1 text-sm leading-7 text-muted-foreground">{lesson.introduction}</p>
      </div>

      <section aria-label="أهداف الدرس">
        <h3 className="text-sm font-black text-foreground">بعد الدرس ستستطيع</h3>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-6 text-muted-foreground">
          {lesson.objectives.map((objective) => <li key={objective}>{objective}</li>)}
        </ul>
      </section>

      <section className="grid gap-3 sm:grid-cols-2" aria-label="شرح مفاهيم الدرس">
        {lesson.concepts.map((concept) => (
          <div key={concept.title} className="rounded-xl border border-border bg-card p-3">
            <h3 className="text-sm font-black text-foreground">{concept.title}</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{concept.explanation}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl bg-primary/[0.05] p-4" aria-label={lesson.workedExample.title}>
        <h3 className="text-sm font-black text-foreground">{lesson.workedExample.title}</h3>
        <p className="mt-2 text-sm font-bold leading-6 text-foreground">{lesson.workedExample.prompt}</p>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm leading-6 text-muted-foreground">
          {lesson.workedExample.steps.map((step) => <li key={step}>{step}</li>)}
        </ol>
        <p className="mt-2 text-sm font-bold leading-6 text-primary">{lesson.workedExample.answer}</p>
      </section>

      <section className="rounded-xl border border-border p-4" aria-label="تحقق من الفهم">
        <h3 className="text-sm font-black text-foreground">تحقق من فهمك</h3>
        <p className="mt-2 text-sm font-bold leading-6 text-foreground">{lesson.check.question}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {lesson.check.options.map((option, index) => {
            const isCorrect = submittedAnswer !== null && index === lesson.check.correctIndex;
            const isIncorrectChoice = submittedAnswer === index && !isCorrect;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selectedAnswer === index}
                onClick={() => onSelectAnswer(index)}
                className={`min-h-11 rounded-lg border px-3 py-2 text-right text-sm font-medium transition ${
                  isCorrect
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                    : isIncorrectChoice
                      ? "border-destructive bg-destructive/10 text-destructive"
                      : selectedAnswer === index
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-background text-foreground hover:border-primary/50"
                }`}
                data-testid={`button-tahsili-check-option-${index + 1}`}
              >
                {option}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            size="sm"
            onClick={onCheckAnswer}
            disabled={selectedAnswer === null}
            data-testid="button-submit-tahsili-lesson-check"
          >
            تحقق من الإجابة
          </Button>
          {submittedAnswer !== null && (
            <p role="status" className={`text-sm font-bold ${submittedAnswer === lesson.check.correctIndex ? "text-emerald-700 dark:text-emerald-300" : "text-destructive"}`}>
              {submittedAnswer === lesson.check.correctIndex ? "إجابة صحيحة." : "ليست صحيحة؛ راجع الإجابة الموضحة ثم حاول مرة أخرى."}
              <span className="mt-1 block font-medium text-muted-foreground">{lesson.check.explanation}</span>
            </p>
          )}
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          هذا تدريب قصير داخل الدرس؛ لا يُحفظ ضمن درجات الاختبارات أو تقاريرك الرسمية.
        </p>
      </section>
    </article>
  );
}
