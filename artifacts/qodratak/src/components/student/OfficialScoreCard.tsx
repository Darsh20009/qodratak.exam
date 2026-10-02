import { useEffect, useState } from "react";
import { Target, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpdateOfficialScores, type StudentDashboard } from "@/hooks/use-student";

interface Props {
  scores?: StudentDashboard["officialScores"];
}

export default function OfficialScoreCard({ scores }: Props) {
  const updateScores = useUpdateOfficialScores();
  const hasQudratScores = scores?.program !== "tahsili";
  const [verbal, setVerbal] = useState(hasQudratScores && scores?.verbal !== undefined ? String(scores.verbal) : "");
  const [quantitative, setQuantitative] = useState(hasQudratScores && scores?.quantitative !== undefined ? String(scores.quantitative) : "");

  useEffect(() => {
    setVerbal(scores?.program === "tahsili" || scores?.verbal === undefined ? "" : String(scores.verbal));
    setQuantitative(scores?.program === "tahsili" || scores?.quantitative === undefined ? "" : String(scores.quantitative));
  }, [scores]);

  const save = () => {
    const payload: { verbal?: number; quantitative?: number; program: "qudrat" } = { program: "qudrat" };
    if (verbal.trim() !== "") payload.verbal = Number(verbal);
    if (quantitative.trim() !== "") payload.quantitative = Number(quantitative);
    updateScores.mutate(payload);
  };

  return (
    <section className="rounded-3xl border border-primary/20 bg-primary/5 p-5" dir="rtl">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Target className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-black text-foreground">نتيجة اختبار القدرات الفعلية</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            أدخل درجتي اللفظي والكمي من اختبار خارجي. نستخدمهما لتوجيه خطة القدرات، ولا نخلطهما مع نتائج التدريب.
          </p>
        </div>
      </div>

      {scores?.program === "tahsili" && (
        <p className="mt-4 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
          الدرجات المحفوظة سابقًا كتحصيلي لم تعد تُستخدم هنا؛ هذه الخانات مخصصة لتقسيم القدرات إلى لفظي وكمي.
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-bold text-foreground">
          اللفظي
          <input
            type="number"
            min="0"
            max="100"
            value={verbal}
            onChange={(event) => setVerbal(event.target.value)}
            placeholder="مثال: 78"
            className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
        </label>
        <label className="text-sm font-bold text-foreground">
          الكمي
          <input
            type="number"
            min="0"
            max="100"
            value={quantitative}
            onChange={(event) => setQuantitative(event.target.value)}
            placeholder="مثال: 72"
            className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
        </label>
      </div>

      {updateScores.isError && (
        <p className="mt-3 text-sm font-bold text-destructive">
          {updateScores.error instanceof Error ? updateScores.error.message : "تعذر حفظ النتيجة"}
        </p>
      )}
      <Button type="button" onClick={save} disabled={updateScores.isPending || (verbal.trim() === "" && quantitative.trim() === "")} className="mt-4 rounded-xl font-black">
        {updateScores.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
        حفظ النتيجة وبناء الخطة
      </Button>
    </section>
  );
}