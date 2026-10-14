import { summarizeReportScores } from '@/lib/reportScores';
import type { ExamReportRecord } from '@workspace/api-client-react';

export default function ReportScoreSummary({ questions }: Pick<ExamReportRecord, 'questions'>) {
  const scores = summarizeReportScores(questions);
  return <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3" data-testid="report-score-percentages">
    {([['overall', 'نسبتك الإجمالية'], ['quantitative', 'نسبة الكمي'], ['verbal', 'نسبة اللفظي']] as const).map(([key, title]) => {
      const score = scores[key];
      return <div key={key} className={`rounded-xl border p-4 ${key === 'overall' ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30'}`}>
        <dt className="text-sm font-bold text-muted-foreground">{title}</dt>
        <dd className="mt-2 text-2xl font-black text-foreground" data-testid={`report-score-${key}`}>
          {score.percentage !== null ? `${score.percentage}%` : score.total ? 'جارٍ إكمال التصحيح' : 'لا توجد أسئلة'}
        </dd>
        {score.total > 0 && <p className="mt-2 text-xs text-muted-foreground">{score.correct} صحيحة من {score.total} سؤالًا{score.skipped > 0 ? ` · ${score.skipped} متروكة` : ''}</p>}
      </div>;
    })}
  </dl>;
}
