import { useState } from "react";
import { AlertTriangle, Check, Copy, KeyRound, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ROLE_LABEL, fmtDate, useStudentResults,
  type InviteDTO, type MemberPerformance, type RosterMember,
} from "@/lib/institutionApi";

export function PerformanceTag({ p, compact }: { p: MemberPerformance; compact?: boolean }) {
  const tone = p.confidence !== "observed"
    ? "border-[#24202D]/15 bg-[#F1EEE8] text-[#6B625B] dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
    : (p.percentage ?? 0) >= 85
      ? "border-[#2E8B70]/30 bg-[#E6F4EE] text-[#1F6B55] dark:bg-[#2E8B70]/15 dark:text-[#91D7C5]"
      : (p.percentage ?? 0) >= 60
        ? "border-[#C9952B]/30 bg-[#FBF1DC] text-[#8A6417] dark:bg-[#C9952B]/15 dark:text-[#F0C46A]"
        : "border-[#C4553F]/30 bg-[#FCEAE5] text-[#A3402E] dark:bg-[#C4553F]/15 dark:text-[#FF9C86]";
  return (
    <div className="min-w-0">
      <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-black", tone)}>
        {p.level}
        {p.percentage !== null && p.confidence === "observed" && <span className="font-mono">{p.percentage}%</span>}
      </span>
      {!compact && (
        <p className="mt-1 text-[10.5px] text-[#8B8278] dark:text-slate-500">
          {p.attempts} محاولة · {p.questions} سؤال مرصود
          {p.confidence !== "observed" && " · يلزم ٣ محاولات و٣٠ سؤالًا"}
        </p>
      )}
    </div>
  );
}

export function CodeRevealDialog({ result, onClose }: { result: { code: string; invite: InviteDTO } | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [ack, setAck] = useState(false);
  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <Dialog open={!!result} onOpenChange={(o) => { if (!o && ack) { setAck(false); onClose(); } }}>
      <DialogContent dir="rtl" className="max-w-lg border-[#24202D]/15 bg-[#FFFCF7] dark:border-white/10 dark:bg-[#12131C]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-[#171723] dark:text-white"><KeyRound className="h-5 w-5 text-[#C4553F]" /> كود الانضمام — يظهر مرة واحدة</DialogTitle>
          <DialogDescription className="text-right leading-7">
            كود {result ? ROLE_LABEL[result.invite.role] : ""}{result?.invite.boundPhone ? ` مرتبط بالجوال ${result.invite.boundPhone}` : ""}، صالح حتى {fmtDate(result?.invite.expiresAt)}، لعدد {result?.invite.maxUses} استخدام.
          </DialogDescription>
        </DialogHeader>
        {result && (
          <>
            <div className="rounded-xl border-2 border-dashed border-[#171723]/30 bg-[#F7F4EE] p-4 dark:border-white/20 dark:bg-white/5">
              <p data-testid="text-invite-code" dir="ltr" className="select-all break-all text-center font-mono text-lg font-bold tracking-wider text-[#171723] dark:text-white">{result.code}</p>
            </div>
            <button data-testid="button-copy-code" onClick={copy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#171723] py-3 text-sm font-black text-white transition hover:bg-[#2A2636] dark:bg-[#91D7C5] dark:text-[#171723]">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "تم النسخ" : "نسخ الكود"}
            </button>
            <div className="flex gap-2 rounded-xl border border-[#C4553F]/30 bg-[#FCEAE5] p-3 text-xs leading-6 text-[#8A3526] dark:bg-[#C4553F]/10 dark:text-[#FFB4A4]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>لا يُخزَّن الكود الكامل لدينا؛ القوائم تعرض تلميحًا فقط ({result.invite.hint}). إذا أُغلقت النافذة دون حفظه فلا يمكن استرجاعه، ويجب إلغاؤه وإصدار كود جديد.</span>
            </div>
            <label className="flex items-center gap-2 text-sm font-bold text-[#171723] dark:text-white">
              <input data-testid="checkbox-code-saved" type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="h-4 w-4 accent-[#171723]" />
              حفظت الكود في مكان آمن
            </label>
            <button data-testid="button-close-code" disabled={!ack} onClick={() => { setAck(false); onClose(); }} className="rounded-xl border border-[#24202D]/15 py-2.5 text-sm font-black text-[#171723] disabled:opacity-40 dark:border-white/15 dark:text-white">إغلاق</button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function InviteRow({ invite, onRevoke, revoking, dark }: { invite: InviteDTO; onRevoke: () => void; revoking?: boolean; dark?: boolean }) {
  const expired = new Date(invite.expiresAt).getTime() < Date.now();
  const exhausted = invite.uses >= invite.maxUses;
  const state = invite.revokedAt ? "ملغى" : expired ? "منتهي" : exhausted ? "مستخدم بالكامل" : "فعّال";
  const live = state === "فعّال";
  return (
    <div data-testid={`row-invite-${invite.id}`} className={cn("flex flex-wrap items-center gap-3 border-b px-4 py-3 text-sm last:border-0",
      dark ? "border-white/[0.06]" : "border-[#24202D]/10 dark:border-white/10")}>
      <span dir="ltr" className={cn("font-mono text-xs", dark ? "text-slate-300" : "text-[#171723] dark:text-slate-200")}>{invite.hint}</span>
      <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-black", dark ? "bg-white/[0.06] text-slate-300" : "bg-[#F1EEE8] text-[#4F4A58] dark:bg-white/5 dark:text-slate-300")}>{ROLE_LABEL[invite.role]}</span>
      {invite.label && <span className={cn("text-xs", dark ? "text-slate-400" : "text-[#6B625B] dark:text-slate-400")}>{invite.label}</span>}
      {invite.boundPhone && <span dir="ltr" className="font-mono text-[11px] text-slate-500">{invite.boundPhone}</span>}
      <span className="font-mono text-[11px] text-slate-500">{invite.uses}/{invite.maxUses}</span>
      <span className="text-[11px] text-slate-500">حتى {fmtDate(invite.expiresAt)}</span>
      <span className={cn("ms-auto text-[11px] font-black", live ? "text-[#2E8B70] dark:text-[#91D7C5]" : "text-slate-500")}>{state}</span>
      {live && (
        <button data-testid={`button-revoke-invite-${invite.id}`} disabled={revoking} onClick={onRevoke} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-black text-[#C4553F] hover:bg-[#C4553F]/10 disabled:opacity-40">
          <X className="h-3.5 w-3.5" /> إلغاء
        </button>
      )}
    </div>
  );
}

export function StudentResultsSheet({ member, onClose }: { member: RosterMember | null; onClose: () => void }) {
  const { data, isLoading, error, refetch } = useStudentResults(member?.userId || null);
  return (
    <Sheet open={!!member} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="left" dir="rtl" className="w-full overflow-y-auto border-[#24202D]/10 bg-[#FFFCF7] sm:max-w-xl dark:border-white/10 dark:bg-[#12131C]">
        <SheetHeader className="text-right">
          <SheetTitle className="text-[#171723] dark:text-white">{member?.fullName}</SheetTitle>
          <SheetDescription className="text-right">النتائج المحفوظة لهذا الطالب (آخر ١٠٠ محاولة). الصلاحية يتحقق منها الخادم.</SheetDescription>
        </SheetHeader>
        {member && <div className="mt-4 rounded-xl border border-[#24202D]/10 p-3 dark:border-white/10"><PerformanceTag p={member.performance} /></div>}
        <div className="mt-5 space-y-2">
          {isLoading && [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          {error && (
            <div className="rounded-xl border border-[#C4553F]/30 bg-[#FCEAE5] p-4 text-sm text-[#8A3526] dark:bg-[#C4553F]/10 dark:text-[#FFB4A4]">
              {(error as Error).message}
              <button onClick={() => refetch()} className="mr-3 font-black underline">إعادة المحاولة</button>
            </div>
          )}
          {data && data.results.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#24202D]/20 p-8 text-center text-sm text-[#6B625B] dark:border-white/15 dark:text-slate-400">
              لم يُكمل هذا الطالب أي اختبار محفوظ بعد. لا توجد بيانات لاستنتاج مستوى.
            </div>
          )}
          {data?.results.map((r) => (
            <div key={r._id} className="rounded-xl border border-[#24202D]/10 bg-white/60 p-3 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[#171723] dark:text-white">{r.testName || r.testType || "اختبار"}</p>
                  <p className="mt-0.5 text-[11px] text-[#8B8278]">{fmtDate(r.completedAt)}{r.program ? ` · ${r.program}` : ""}</p>
                </div>
                <span className="font-mono text-lg font-bold text-[#171723] dark:text-white">{r.percentage ?? "—"}<span className="text-xs">%</span></span>
              </div>
              <p className="mt-2 font-mono text-[11px] text-[#6B625B] dark:text-slate-400">
                صحيح {r.correctAnswers ?? 0} · خطأ {r.wrongAnswers ?? 0} · متروك {r.skippedQuestions ?? 0} · من {r.totalQuestions ?? 0}
                {typeof r.timeTaken === "number" && Number.isFinite(r.timeTaken) && r.timeTaken >= 0
                  ? ` · المدة ${Math.floor(r.timeTaken / 60)} د ${Math.round(r.timeTaken % 60)} ث` : ""}
              </p>
              {(r.weakAreas?.length || r.strongAreas?.length) ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {r.strongAreas?.slice(0, 3).map((a) => <span key={`s${a}`} className="rounded bg-[#E6F4EE] px-1.5 py-0.5 text-[10px] font-bold text-[#1F6B55] dark:bg-[#2E8B70]/15 dark:text-[#91D7C5]">{a}</span>)}
                  {r.weakAreas?.slice(0, 3).map((a) => <span key={`w${a}`} className="rounded bg-[#FCEAE5] px-1.5 py-0.5 text-[10px] font-bold text-[#A3402E] dark:bg-[#C4553F]/15 dark:text-[#FF9C86]">{a}</span>)}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function SkeletonBoard() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6" dir="rtl">
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="grid gap-3 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      <Skeleton className="h-80 w-full rounded-2xl" />
    </div>
  );
}
