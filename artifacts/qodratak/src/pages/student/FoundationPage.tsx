import React, { useState } from "react";
import { useFoundationContent } from "@/hooks/use-student";
import { Link } from "wouter";
import { PlayCircle, Clock, CheckCircle2, ChevronLeft, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FoundationPage() {
  const [activeTab, setActiveTab] = useState<'qudrat' | 'tahsili'>('qudrat');
  const { data: content, isLoading } = useFoundationContent(activeTab);

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
                  {item.durationMinutes} دقيقة
                </div>
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
                  <a href={item.videoUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button className="w-full rounded-xl font-bold bg-[#0D1B2A] text-white hover:bg-[#0D1B2A]/90 dark:bg-primary dark:text-primary-foreground">
                      <PlayCircle className="ml-2 h-4 w-4" /> شاهد الدرس
                    </Button>
                  </a>
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
    </div>
  );
}
