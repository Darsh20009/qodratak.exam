import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import QiyasExamPage from "./QiyasExamPage";
import type { CustomExamConfiguration } from "./QiyasExamPage";

export default function CustomExamPage() {
  const [verbalCount, setVerbalCount] = useState("10");
  const [quantitativeCount, setQuantitativeCount] = useState("10");
  const [timeLimit, setTimeLimit] = useState("20");
  const [configuration, setConfiguration] = useState<CustomExamConfiguration | null>(null);
  const [error, setError] = useState("");

  if (configuration) return <QiyasExamPage customConfiguration={configuration} />;

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6" dir="rtl">
      <Card>
        <CardHeader><CardTitle>اختبار مخصص ومختلط</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">اختر توزيع الأسئلة ووقت التدريب. سيُفتح الاختبار في مشغل المحاكاة، مع حفظ نتيجته في «نتائجي».</p>
          <form className="space-y-5" onSubmit={(event) => {
            event.preventDefault();
            const verbal = Number(verbalCount);
            const quantitative = Number(quantitativeCount);
            const minutes = Number(timeLimit);
            if (![verbal, quantitative, minutes].every(Number.isSafeInteger) ||
                verbal < 0 || quantitative < 0 || verbal + quantitative < 5 ||
                verbal + quantitative > 120 || minutes < 5 || minutes > 180) {
              setError("اختر من 5 إلى 120 سؤالًا إجمالًا، ووقتًا من 5 إلى 180 دقيقة. استخدم أعدادًا صحيحة.");
              return;
            }
            setError("");
            setConfiguration({ verbalCount: verbal, quantitativeCount: quantitative, timeLimit: minutes });
          }}>
            <div className="space-y-2"><Label htmlFor="custom-verbal">عدد أسئلة اللفظي</Label><Input id="custom-verbal" type="number" min={0} max={120} required value={verbalCount} onChange={e => setVerbalCount(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="custom-quantitative">عدد أسئلة الكمي</Label><Input id="custom-quantitative" type="number" min={0} max={120} required value={quantitativeCount} onChange={e => setQuantitativeCount(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="custom-time">مدة الاختبار بالدقائق</Label><Input id="custom-time" type="number" min={5} max={180} required value={timeLimit} onChange={e => setTimeLimit(e.target.value)} /></div>
            {error && <p role="alert" className="text-destructive">{error}</p>}
            <Button type="submit" className="w-full">متابعة إلى تعليمات الاختبار</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
