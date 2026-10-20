import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Download, ExternalLink, FileText, Loader2, RefreshCw, Search } from "lucide-react";

type SourceKind = "primary_book" | "foundation_book" | "question_collection" | "practice" | "exam_collection";

interface TahsiliSource {
  id: string;
  ordinal: number;
  title: string;
  subject: string;
  kind: SourceKind;
  pages: number;
  bytes: number;
  primary: boolean;
  fileUrl: string;
}

interface SourceResponse {
  sources: TahsiliSource[];
  totalSources: number;
  playlists?: Array<{ subject: string; url: string }>;
}

const KIND_LABELS: Record<SourceKind, string> = {
  primary_book: "المصدر الأساسي",
  foundation_book: "تأسيس",
  question_collection: "تجميع أسئلة",
  practice: "تدريبات",
  exam_collection: "اختبارات مجمعة",
};

const SUBJECT_FILTERS = ["الكل", "رياضيات", "فيزياء", "كيمياء", "أحياء", "علم الأرض", "مختلط"];
const SUBJECT_QUERY_ALIASES: Record<string, string> = {
  math: "رياضيات",
  physics: "فيزياء",
  chemistry: "كيمياء",
  biology: "أحياء",
  environment: "علم الأرض",
};

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "الحجم غير متاح";
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(bytes >= 100 * 1024 * 1024 ? 0 : 1)} م.ب`
    : `${Math.ceil(bytes / 1024)} ك.ب`;
}

async function loadSources(): Promise<SourceResponse> {
  const response = await apiRequest("GET", "/api/tahsili/sources");
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "تعذر تحميل مصادر التحصيلي.");
  return body as SourceResponse;
}

export default function TahsiliSourceLibrary() {
  const search = useSearch();
  const subjectParam = new URLSearchParams(search).get("subject") || "الكل";
  const requestedSubject = SUBJECT_QUERY_ALIASES[subjectParam] || subjectParam;
  const initialSubject = SUBJECT_FILTERS.includes(requestedSubject) ? requestedSubject : "الكل";
  const [subjectFilter, setSubjectFilter] = useState(initialSubject);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const sourceQuery = useQuery({
    queryKey: ["/api/tahsili/sources"],
    queryFn: loadSources,
  });

  const sources = useMemo(() => {
    const all = sourceQuery.data?.sources || [];
    return all.filter((source) => subjectFilter === "الكل" || source.subject === subjectFilter);
  }, [sourceQuery.data?.sources, subjectFilter]);

  const selectedSource = sourceQuery.data?.sources.find((source) => source.id === selectedSourceId) || null;

  useEffect(() => {
    setSubjectFilter(initialSubject);
  }, [initialSubject]);

  return (
    <main className="qodratak-tahsili-surface min-h-[100dvh] px-4 py-6 pb-24 sm:px-6 sm:py-8" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-primary">التحصيلي</p>
              <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">مكتبة المصادر الدراسية</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
                افتح ملفات التأسيس والتدريب والاختبارات المرفوعة، واقرأها داخل المنصة. كتاب ناصر عبدالكريم هو المصدر الأساسي.
              </p>
            </div>
            <Badge variant="secondary" className="shrink-0">
              {sourceQuery.data?.totalSources ?? "—"} مصدرًا
            </Badge>
          </div>
        </header>

        {sourceQuery.isLoading && (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-border bg-card p-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            جارٍ تحميل المصادر…
          </div>
        )}

        {sourceQuery.isError && (
          <Card role="alert" className="border-destructive/40">
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm font-bold text-destructive">
                {sourceQuery.error instanceof Error ? sourceQuery.error.message : "تعذر تحميل مصادر التحصيلي."}
              </p>
              <Button type="button" variant="outline" onClick={() => void sourceQuery.refetch()}>
                <RefreshCw className="ml-2 h-4 w-4" />
                إعادة المحاولة
              </Button>
            </CardContent>
          </Card>
        )}

        {sourceQuery.data && (
          <>
          {sourceQuery.data.playlists?.length ? (
            <section aria-labelledby="tahsili-playlists-heading" className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-4">
                <h2 id="tahsili-playlists-heading" className="text-lg font-black text-foreground">فيديوهات التأسيس على YouTube</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  هذه روابط قوائم الفيديو الأصلية. تفتح على YouTube؛ ولا توجد منها نسخة فيديو مرفوعة أو مقصوصة داخل المنصة حتى الآن.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {sourceQuery.data.playlists
                  .filter((playlist) => subjectFilter === "الكل" || playlist.subject === subjectFilter)
                  .map((playlist) => (
                    <a
                      key={playlist.subject}
                      href={playlist.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground transition hover:border-primary/50 hover:bg-primary/[0.03]"
                    >
                      <span>تأسيس {playlist.subject}</span>
                      <ExternalLink className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    </a>
                  ))}
              </div>
            </section>
          ) : null}

          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <section className="space-y-4" aria-label="مصادر التحصيلي">
              <div className="flex flex-wrap gap-2">
                {SUBJECT_FILTERS.map((subject) => (
                  <Button
                    key={subject}
                    type="button"
                    size="sm"
                    variant={subjectFilter === subject ? "default" : "outline"}
                    onClick={() => setSubjectFilter(subject)}
                    data-testid={`filter-tahsili-source-${subject}`}
                  >
                    {subject}
                  </Button>
                ))}
              </div>

              {sources.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    لا توجد ملفات في هذا التصنيف.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {sources.map((source) => (
                    <Card
                      key={source.id}
                      className={selectedSourceId === source.id ? "border-primary/50 shadow-sm" : "border-border"}
                    >
                      <CardContent className="flex items-start gap-3 p-4">
                        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          {source.primary ? <BookOpen className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-sm font-black leading-6 text-foreground">{source.title}</h2>
                            {source.primary && <Badge>أساسي</Badge>}
                          </div>
                          <CardDescription className="mt-1">
                            {source.subject} · {KIND_LABELS[source.kind]} · {source.pages} صفحة · {formatFileSize(source.bytes)}
                          </CardDescription>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => setSelectedSourceId(source.id)}
                              data-testid={`button-preview-tahsili-source-${source.id}`}
                            >
                              <BookOpen className="ml-2 h-4 w-4" />
                              معاينة
                            </Button>
                            <a
                              href={source.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex min-h-9 items-center rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground hover:bg-accent"
                              data-testid={`link-open-tahsili-source-${source.id}`}
                            >
                              <Download className="ml-2 h-4 w-4" />
                              فتح الملف
                            </a>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            <section className="min-w-0" aria-label="معاينة ملف المصدر">
              {selectedSource ? (
                <Card className="overflow-hidden">
                  <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-border">
                    <div className="min-w-0">
                      <CardTitle className="text-base">{selectedSource.title}</CardTitle>
                      <CardDescription className="mt-1">{selectedSource.pages} صفحة · {selectedSource.subject}</CardDescription>
                    </div>
                    <a
                      href={selectedSource.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-input px-3 py-2 text-xs font-bold text-foreground hover:bg-accent"
                    >
                      <Download className="h-4 w-4" />
                      فتح مستقل
                    </a>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-3">
                    <iframe
                      key={selectedSource.id}
                      title={`معاينة ${selectedSource.title}`}
                      src={selectedSource.fileUrl}
                      className="h-[72vh] min-h-[480px] w-full rounded-xl border border-border bg-muted"
                      loading="lazy"
                      data-testid="iframe-tahsili-source-preview"
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card className="flex min-h-[320px] items-center justify-center border-dashed bg-muted/20">
                  <CardContent className="max-w-sm py-10 text-center">
                    <Search className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-3 font-bold text-foreground">اختر مصدرًا للمعاينة</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">سيظهر ملف PDF هنا، ويمكنك تكبيره أو فتحه في نافذة مستقلة.</p>
                  </CardContent>
                </Card>
              )}
            </section>
          </div>
          </>
        )}
      </div>
    </main>
  );
}
