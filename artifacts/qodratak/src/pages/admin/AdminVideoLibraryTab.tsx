import { type FormEvent, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileVideo,
  Loader2,
  Play,
  RefreshCw,
  Search,
  Upload,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { AdminVideoAsset, AdminVideoPage } from "@workspace/api-client-react";

const PAGE_SIZE = 25;
const MAX_FILE_BYTES = 1024 * 1024 * 1024;
const ACCEPTED_VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".m4v", ".webm", ".mkv"]);

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} كيلوبايت`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} ميجابايت`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} جيجابايت`;
}

function uploadAdminVideo(formData: FormData, onProgress: (percent: number) => void) {
  return new Promise<AdminVideoAsset>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/admin/media/videos");
    request.withCredentials = true;
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    });
    request.addEventListener("load", () => {
      let payload: Record<string, unknown> = {};
      try {
        payload = JSON.parse(request.responseText || "{}") as Record<string, unknown>;
      } catch {
        payload = {};
      }
      if (request.status >= 200 && request.status < 300) {
        onProgress(100);
        resolve(payload as unknown as AdminVideoAsset);
        return;
      }
      reject(new Error(typeof payload.error === "string" ? payload.error : "تعذر رفع الفيديو."));
    });
    request.addEventListener("error", () => reject(new Error("انقطع الاتصال أثناء رفع الفيديو. حاول مرة أخرى.")));
    request.addEventListener("abort", () => reject(new Error("تم إلغاء رفع الفيديو.")));
    request.send(formData);
  });
}

export default function AdminVideoLibraryTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [previewNumber, setPreviewNumber] = useState<number | null>(null);

  const videosQuery = useQuery<AdminVideoPage>({
    queryKey: ["/api/admin/media/videos", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (search) params.set("q", search);
      const response = await fetch(`/api/admin/media/videos?${params}`, { credentials: "include" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "تعذر تحميل مكتبة الفيديوهات.");
      return payload as AdminVideoPage;
    },
    staleTime: 15_000,
  });

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!files.length) {
      toast({ title: "اختر ملف فيديو واحدًا على الأقل", variant: "destructive" });
      return;
    }
    const invalidFile = files.find((candidate) => {
      const extension = `.${candidate.name.split(".").pop()?.toLowerCase() || ""}`;
      return !ACCEPTED_VIDEO_EXTENSIONS.has(extension) || candidate.size > MAX_FILE_BYTES;
    });
    if (invalidFile) {
      const tooLarge = invalidFile.size > MAX_FILE_BYTES;
      toast({
        title: tooLarge ? "حجم أحد الفيديوهات كبير" : "صيغة أحد الفيديوهات غير مدعومة",
        description: tooLarge
          ? `${invalidFile.name}: الحد الأقصى لكل فيديو 1 جيجابايت.`
          : `${invalidFile.name}: استخدم MP4 أو MOV أو M4V أو WebM أو MKV.`,
        variant: "destructive",
      });
      return;
    }

    const cleanTitle = title.trim();
    const queue = [...files];
    setIsUploading(true);
    setUploadProgress(0);
    const uploaded: AdminVideoAsset[] = [];
    const failed: Array<{ file: File; message: string }> = [];
    try {
      for (let index = 0; index < queue.length; index += 1) {
        const currentFile = queue[index];
        const filenameTitle = currentFile.name.replace(/\.[^.]+$/, "").trim() || currentFile.name;
        const videoTitle = (queue.length === 1
          ? cleanTitle || filenameTitle
          : cleanTitle ? `${cleanTitle} · ${filenameTitle}` : filenameTitle
        ).slice(0, 160);
        const formData = new FormData();
        formData.append("title", videoTitle);
        formData.append("video", currentFile, currentFile.name);
        try {
          const saved = await uploadAdminVideo(formData, (percent) => {
            setUploadProgress(Math.round(((index + percent / 100) / queue.length) * 100));
          });
          uploaded.push(saved);
        } catch (error) {
          failed.push({
            file: currentFile,
            message: error instanceof Error ? error.message : "تعذر رفع الملف.",
          });
        }
      }

      if (uploaded.length) {
        setPage(1);
        await queryClient.invalidateQueries({ queryKey: ["/api/admin/media/videos"] });
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
      setFiles(failed.map(({ file: failedFile }) => failedFile));
      if (!failed.length) setTitle("");
      if (uploaded.length && failed.length) {
        toast({
          title: `حُفظ ${uploaded.length} من ${queue.length} فيديوهات`,
          description: `أرقامها: ${uploaded.map((video) => `#${video.videoNumber}`).join("، ")}. بقي ${failed.length} لإعادة المحاولة.`,
          variant: "destructive",
        });
      } else if (uploaded.length) {
        toast({
          title: `تم حفظ ${uploaded.length} فيديوهات`,
          description: `الأرقام المرجعية: ${uploaded.map((video) => `#${video.videoNumber}`).join("، ")}.`,
        });
      } else {
        toast({
          title: "لم يكتمل رفع الفيديوهات",
          description: failed[0]?.message || "تحقق من الاتصال وحاول مرة أخرى.",
          variant: "destructive",
        });
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }

  async function copyVideoNumber(videoNumber: number) {
    try {
      await navigator.clipboard.writeText(String(videoNumber));
      toast({ title: "تم نسخ الرقم المرجعي", description: `#${videoNumber}` });
    } catch {
      toast({ title: "تعذر نسخ الرقم", description: `الرقم المرجعي هو #${videoNumber}.`, variant: "destructive" });
    }
  }

  const videos = videosQuery.data?.items ?? [];
  const total = videosQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black text-white">
            <Video className="h-5 w-5 text-[#B8F36B]" aria-hidden="true" />
            مكتبة الفيديوهات
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
            ارفع الفيديو هنا بدل إرساله في المحادثة. سيُحفظ في التخزين الدائم ويحصل على رقم ثابت تستخدمه لاحقًا عند ربطه بالمحتوى.
          </p>
        </div>
        <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-300">
          {total.toLocaleString("ar-SA")} فيديو
        </span>
      </header>

      <form onSubmit={handleUpload} className="space-y-4 rounded-2xl border border-slate-800 bg-[#0D1B2A] p-4 sm:p-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
          <label className="block space-y-2">
            <span className="text-sm font-bold text-slate-200">عنوان اختياري أو بادئة للأسماء</span>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={160}
              disabled={isUploading}
              placeholder="مثال: اختبار 71 — يُضاف قبل اسم كل ملف"
              className="border-slate-700 bg-slate-950 text-white placeholder:text-slate-500"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-bold text-slate-200">ملفات الفيديو (حتى 1 جيجابايت لكل ملف)</span>
            <Input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".mp4,.mov,.m4v,.webm,.mkv,video/mp4,video/quicktime,video/webm,video/x-m4v,video/x-matroska"
              disabled={isUploading}
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
              className="border-slate-700 bg-slate-950 text-slate-300 file:ml-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-1 file:text-xs file:font-bold file:text-white"
            />
          </label>
          <Button type="submit" disabled={isUploading} className="min-h-10 gap-2 bg-[#B8F36B] font-black text-[#0A1726] hover:bg-[#a8e55a]">
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {isUploading ? `جارٍ الرفع ${uploadProgress}%` : files.length ? `رفع ${files.length} فيديوهات` : "رفع الفيديوهات"}
          </Button>
        </div>
        {files.length > 0 && (
          <ul className="max-h-32 space-y-1 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-400">
            {files.map((selectedFile) => (
              <li key={`${selectedFile.name}-${selectedFile.size}-${selectedFile.lastModified}`} className="flex flex-wrap items-center gap-2">
                <FileVideo className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="break-all font-bold text-slate-200">{selectedFile.name}</span>
                <span>· {formatBytes(selectedFile.size)}</span>
              </li>
            ))}
          </ul>
        )}
        {isUploading && (
          <div
            role="progressbar"
            aria-label="تقدم رفع الفيديو"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={uploadProgress}
            className="h-2 overflow-hidden rounded-full bg-slate-800"
          >
            <div className="h-full rounded-full bg-[#B8F36B] transition-[width]" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}
        <p className="text-xs leading-5 text-slate-500">
          الصيغ المدعومة: MP4 وMOV وM4V وWebM وMKV. تُرفع الملفات بالتتابع، ويحصل كل فيديو على رقم مستقل. لا يُضاف أي فيديو تلقائيًا إلى درس أو سؤال؛ احتفظ بأرقامه لربطها لاحقًا.
        </p>
      </form>

      <section className="space-y-4">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setSearch(searchDraft.trim());
          }}
          className="flex flex-wrap gap-2"
        >
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <Input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="ابحث بالعنوان أو اسم الملف أو الرقم"
              className="border-slate-800 bg-[#0D1B2A] pr-10 text-white placeholder:text-slate-500"
            />
          </div>
          <Button type="submit" variant="outline" className="gap-2 border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800">
            <Search className="h-4 w-4" /> بحث
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void videosQuery.refetch()}
            className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
            aria-label="تحديث قائمة الفيديوهات"
          >
            <RefreshCw className={`h-4 w-4 ${videosQuery.isFetching ? "animate-spin" : ""}`} />
          </Button>
        </form>

        {videosQuery.isLoading ? (
          <div className="rounded-2xl border border-slate-800 bg-[#0D1B2A] py-14 text-center text-sm text-slate-400">
            جارٍ تحميل مكتبة الفيديوهات...
          </div>
        ) : videosQuery.isError ? (
          <div className="rounded-2xl border border-rose-900/60 bg-rose-950/30 p-5 text-sm text-rose-200">
            <p>{videosQuery.error instanceof Error ? videosQuery.error.message : "تعذر تحميل مكتبة الفيديوهات."}</p>
            <Button type="button" onClick={() => void videosQuery.refetch()} variant="outline" className="mt-3 border-rose-800 text-rose-100">
              إعادة المحاولة
            </Button>
          </div>
        ) : videos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-[#0D1B2A] px-5 py-14 text-center">
            <FileVideo className="mx-auto h-10 w-10 text-slate-600" aria-hidden="true" />
            <p className="mt-3 font-bold text-slate-200">{search ? "لا توجد فيديوهات تطابق البحث." : "لم تُرفع فيديوهات بعد."}</p>
            <p className="mt-1 text-sm text-slate-500">بعد الرفع سيظهر لكل ملف رقم مرجعي ثابت.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {videos.map((video) => (
              <article key={video.videoNumber} className="rounded-2xl border border-slate-800 bg-[#0D1B2A] p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg border border-[#B8F36B]/30 bg-[#B8F36B]/10 px-2.5 py-1 font-mono text-sm font-black text-[#B8F36B]" dir="ltr">
                        #{video.videoNumber}
                      </span>
                      <h3 className="min-w-0 break-words font-black text-white">{video.title}</h3>
                    </div>
                    <p className="mt-2 break-all text-xs text-slate-400">{video.originalFilename}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatBytes(video.sizeBytes)} · {new Date(video.createdAt).toLocaleDateString("ar-SA")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void copyVideoNumber(video.videoNumber)}
                      className="gap-2 border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                    >
                      <Copy className="h-4 w-4" /> نسخ الرقم
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setPreviewNumber((current) => current === video.videoNumber ? null : video.videoNumber)}
                      className="gap-2 bg-slate-800 text-white hover:bg-slate-700"
                    >
                      {previewNumber === video.videoNumber ? <Check className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {previewNumber === video.videoNumber ? "إخفاء المعاينة" : "معاينة"}
                    </Button>
                  </div>
                </div>
                {previewNumber === video.videoNumber && (
                  <video
                    key={video.videoNumber}
                    controls
                    preload="metadata"
                    playsInline
                    src={video.streamUrl}
                    className="mt-4 max-h-[520px] w-full rounded-xl border border-slate-800 bg-black"
                  >
                    متصفحك لا يدعم تشغيل الفيديو.
                  </video>
                )}
              </article>
            ))}
          </div>
        )}

        {!videosQuery.isError && totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#0D1B2A] px-4 py-3">
            <Button
              type="button"
              variant="outline"
              disabled={page <= 1 || videosQuery.isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="gap-1 border-slate-700 bg-slate-900 text-slate-200"
            >
              <ChevronRight className="h-4 w-4" /> السابق
            </Button>
            <span className="text-xs font-bold text-slate-400">صفحة {page} من {totalPages}</span>
            <Button
              type="button"
              variant="outline"
              disabled={page >= totalPages || videosQuery.isFetching}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="gap-1 border-slate-700 bg-slate-900 text-slate-200"
            >
              التالي <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
