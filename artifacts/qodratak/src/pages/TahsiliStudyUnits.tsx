import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, BookOpen, ClipboardCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TahsiliStudySource {
  id: string;
  title: string;
  subject: string;
}

interface StudyUnit {
  title: string;
  printedPage: number;
  pdfPage: number;
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
      { title: "التبرير والبرهان والتوازي والتعامد", printedPage: 212, pdfPage: 6 },
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
      { title: "مدخل إلى علم الفيزياء", printedPage: 22, pdfPage: 18 },
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
      { title: "مقدمة في الكيمياء", printedPage: 129, pdfPage: 8 },
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
      { title: "علم الأحياء والتصنيف الحديث", printedPage: 323, pdfPage: 7 },
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
            onClick={() => setSelectedSubjectKey(subject.key)}
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
                <button
                  type="button"
                  onClick={() => openUnit(unit)}
                  disabled={!selectedSource}
                  className="group flex min-h-[76px] w-full items-center gap-3 rounded-xl border border-border bg-background p-3 text-right transition hover:border-primary/50 hover:bg-primary/[0.03] disabled:cursor-not-allowed disabled:opacity-50"
                  data-testid={`button-open-tahsili-unit-${selectedSubject.testSubject}-${index + 1}`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">
                    {(index + 1).toLocaleString("ar-SA")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold leading-6 text-foreground">{unit.title}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      صفحة الكتاب {unit.printedPage.toLocaleString("ar-SA")}
                    </span>
                  </span>
                  <ArrowLeft className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:-translate-x-1" />
                </button>
              </li>
            ))}
          </ol>
          <p className="mt-4 rounded-xl bg-muted/50 px-3 py-2 text-xs leading-5 text-muted-foreground">
            يفتح كل درس ملف المصدر عند صفحة بدايته. زر الاختبار يقود إلى اختبار المادة، وليس إلى اختبار خاص بالدرس.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
