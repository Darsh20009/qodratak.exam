import React, { useMemo, useState } from "react";
import { useFoundationContent } from "@/hooks/use-student";
import { Link } from "wouter";
import { PlayCircle, Clock, CheckCircle2, Loader2, BookOpen, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function getEmbedUrl(value: string) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return null;

    if (url.hostname === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      return id ? `https://www.youtube.com/embed/${id}?rel=0` : null;
    }

    if (url.hostname.endsWith("youtube.com")) {
      if (url.pathname.startsWith("/embed/")) return url.toString();
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}?rel=0` : url.toString();
    }

    if (url.hostname === "vimeo.com") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
    }

    if (url.hostname === "player.vimeo.com" && url.pathname.startsWith("/video/")) {
      return url.toString();
    }

    return url.toString();
  } catch {
    return null;
  }
}

export default function FoundationPage() {
  const [activeTab, setActiveTab] = useState<'qudrat' | 'tahsili'>('qudrat');
  const [selectedLesson, setSelectedLesson] = useState<NonNullable<ReturnType<typeof useFoundationContent>['data']>[number] | null>(null);
  const { data: content, isLoading } = useFoundationContent(activeTab);
  const selectedEmbedUrl = useMemo(
    () => (selectedLesson ? getEmbedUrl(selectedLesson.videoUrl) : null),
    [selectedLesson],
  );

  return (
    <div className="mx-auto max-w-5xl p-5 md:p-8 animate-fade-in">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-black text-[#0D1B2A] dark:text-white mb-2">التأسيس</h1>
        <p className="text-sm text-muted-foreground">فهم الأساسيات هو مفتاحك للدرجة العالية.</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white dark:bg-card border border-border rounded-xl w-fit mb-8 shadow-sm">
        <button
          onClick={() => setActiveTab('qudrat')}
          className={`px-6 py-2.5 rounded-lg text-sm font-black transition-colors ${
            activeTab === 'qudrat' 
              ? 'bg-[#0D1B2A] text-white dark:bg-primary dark:text-primary-foreground' 
              : 'text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          قدرات
        </button>
        <button
          onClick={() => setActiveTab('tahsili')}
          className={`px-6 py-2.5 rounded-lg text-sm font-black transition-colors ${
            activeTab === 'tahsili' 
              ? 'bg-[#0D1B2A] text-white dark:bg-primary dark:text-primary-foreground' 
              : 'text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          تحصيلي
        </button>
      </div>

      {/* Content List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : content && content.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-5">
          {content.map((item, idx) => (
            <div key={item._id} className="group rounded-2xl border border-border bg-white dark:bg-card overflow-hidden shadow-sm hover:shadow-md transition-all">
              {/* Thumbnail Area (Placeholder if none) */}
              <div className="h-40 bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center">
                  {item.thumbnailUrl ? (
                  <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                    <PlayCircle className="h-12 w-12 text-white opacity-50" />
                  </div>
                )}
                <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {item.durationMinutes ? `${item.durationMinutes} دقيقة` : 'درس مرئي'}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLesson(item)}
                  className="absolute inset-0 flex items-center justify-center bg-slate-950/0 transition-colors hover:bg-slate-950/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                  aria-label={`تشغيل ${item.title}`}
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-[#0D1B2A] shadow-xl transition-transform group-hover:scale-105">
                    <PlayCircle className="h-8 w-8" />
                  </span>
                </button>
              </div>

              {/* Details */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-black text-foreground">{item.title}</h3>
                  <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">الدرس {idx + 1}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5 line-clamp-2">
                  {item.description}
                </p>
                
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    onClick={() => setSelectedLesson(item)}
                    className="flex-1 rounded-xl bg-[#0D1B2A] font-bold text-white hover:bg-[#0D1B2A]/90 dark:bg-primary dark:text-primary-foreground"
                  >
                    <PlayCircle className="ml-2 h-4 w-4" /> شاهد الدرس
                  </Button>
                  {item.linkedQuizRoute && (
                    <Link href="/computerized" className="flex-1">
                      <Button variant="outline" className="w-full rounded-xl font-bold border-border text-foreground hover:bg-muted">
                        <CheckCircle2 className="ml-2 h-4 w-4" /> اختبر فهمك
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-card border border-border rounded-2xl">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-black text-foreground">لا يوجد محتوى حالياً</h3>
          <p className="text-sm text-muted-foreground mt-1">سيتم إضافة محتوى التأسيس قريباً.</p>
        </div>
      )}

      <Dialog open={!!selectedLesson} onOpenChange={open => !open && setSelectedLesson(null)}>
        <DialogContent className="max-h-[94vh] w-[calc(100%-1rem)] max-w-5xl overflow-y-auto border-slate-800 bg-[#07111f] p-3 text-white sm:p-5">
          <DialogHeader className="px-1 text-right sm:px-2">
            <DialogTitle className="text-xl font-black">{selectedLesson?.title}</DialogTitle>
            <p className="mt-1 text-sm leading-6 text-slate-300">{selectedLesson?.description}</p>
          </DialogHeader>
          <div className="overflow-hidden rounded-xl border border-slate-700 bg-black shadow-2xl">
            {selectedEmbedUrl ? (
              <div className="aspect-video w-full">
                <iframe
                  key={selectedEmbedUrl}
                  src={selectedEmbedUrl}
                  title={selectedLesson?.title || 'درس تأسيسي'}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            ) : (
              <div className="flex aspect-video items-center justify-center p-8 text-center text-sm text-slate-300">
                تعذر تشغيل رابط الفيديو داخل المنصة. اطلب من الإدارة استخدام رابط تضمين صحيح.
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 px-1 text-xs text-slate-400 sm:px-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            يشاهد الطالب الدرس داخل المنصة دون مغادرة صفحة التأسيس.
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
