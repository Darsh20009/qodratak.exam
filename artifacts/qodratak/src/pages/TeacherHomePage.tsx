import { useState } from "react";
import { AlertTriangle, Building2, CalendarClock, Search, Users } from "lucide-react";
import TeacherSystemPage from "@/pages/TeacherSystemPage";
import { daysLeft, fmtDate, useInstitutionDashboard, useMembership, type RosterMember } from "@/lib/institutionApi";
import { PerformanceTag, SkeletonBoard, StudentResultsSheet } from "@/components/institution/InstitutionShared";

function InstitutionTeacherPortal() {
  const { data, isLoading, error, refetch } = useInstitutionDashboard();
  const [viewing, setViewing] = useState<RosterMember | null>(null);
  const [q, setQ] = useState("");
  if (isLoading) return <SkeletonBoard />;
  if (error || !data) {
    return (
      <div className="p-10 text-center" dir="rtl">
        <AlertTriangle className="mx-auto h-9 w-9 text-[#C4553F]" />
        <p className="mt-3 text-sm text-[#6B625B] dark:text-slate-400">{(error as Error)?.message || "تعذر التحميل"}</p>
        <button onClick={() => refetch()} className="mt-3 rounded-xl bg-[#171723] px-4 py-2 text-sm font-black text-white dark:bg-[#91D7C5] dark:text-[#171723]">إعادة المحاولة</button>
      </div>
    );
  }
  const students = data.members.filter((m) => m.role === "student" && (!q || `${m.fullName} ${m.username}`.includes(q.trim())));
  const left = daysLeft(data.membership.freeEndDate);
  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-8 sm:px-6" dir="rtl">
      <header className="rounded-3xl bg-[#171723] p-6 text-white">
        <p className="flex items-center gap-2 text-[11px] font-black tracking-[.16em] text-[#91D7C5]"><Building2 className="h-4 w-4" /> معلم في مؤسسة</p>
        <h1 data-testid="text-institution-name" className="mt-2 text-2xl font-black">{data.institution.name}</h1>
        <p className="mt-2 flex items-center gap-2 text-xs text-white/70"><CalendarClock className="h-4 w-4 text-[#FF8A70]" /> مدة الوصول حتى {fmtDate(data.membership.freeEndDate)}{left !== null && ` · ${left} يوم`}</p>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-black text-[#171723] dark:text-white">طلابي المسندون <span className="font-mono text-[#C4553F]">{data.members.length}</span></p>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B8278]" />
          <input data-testid="input-search-students" value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث" className="h-10 w-full rounded-lg border border-[#24202D]/15 bg-[#FFFCF7] pr-9 text-sm outline-none dark:border-white/10 dark:bg-white/5 dark:text-white" />
        </div>
      </div>
      {!students.length ? (
        <div className="rounded-2xl border border-dashed border-[#24202D]/20 p-12 text-center dark:border-white/15">
          <Users className="mx-auto h-10 w-10 text-[#C9C1B6]" />
          <p className="mt-3 font-black text-[#171723] dark:text-white">{q ? "لا نتائج مطابقة" : "لم يُسند إليك أي طالب بعد"}</p>
          {!q && <p className="mt-1 text-xs text-[#6B625B] dark:text-slate-400">يسند مدير المؤسسة الطلاب إلى المعلمين، وستظهر هنا نتائجهم المحفوظة فقط.</p>}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {students.map((s) => (
            <button key={s.id} data-testid={`card-student-${s.id}`} onClick={() => setViewing(s)}
              className="rounded-2xl border border-[#24202D]/10 bg-[#FFFCF7] p-4 text-right transition hover:-translate-y-0.5 hover:border-[#171723]/30 dark:border-white/10 dark:bg-[#151621]">
              <p className="font-black text-[#171723] dark:text-white">{s.fullName}</p>
              <p dir="ltr" className="text-right text-[11px] text-[#8B8278]">@{s.username}</p>
              <div className="mt-3"><PerformanceTag p={s.performance} /></div>
              <p className="mt-2 text-[11px] text-[#8B8278]">آخر محاولة: {fmtDate(s.performance.lastAttemptAt)}</p>
            </button>
          ))}
        </div>
      )}
      <p className="text-center text-[11px] text-[#8B8278]">المستويات وصفية مبنية على المحاولات المرصودة، وليست ضمانًا للإتقان.</p>
      <StudentResultsSheet member={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}

export default function TeacherHomePage() {
  const { data, isLoading, error, refetch } = useMembership();
  if (isLoading) return <SkeletonBoard />;
  // Fail closed: never fall back to legacy class tools when membership state is unknown.
  if (error) {
    return (
      <div className="p-10 text-center" dir="rtl">
        <AlertTriangle className="mx-auto h-9 w-9 text-[#C4553F]" />
        <p className="mt-3 text-sm text-[#6B625B] dark:text-slate-400">تعذر التحقق من عضويتك المؤسسية.</p>
        <button onClick={() => refetch()} className="mt-3 rounded-xl bg-[#171723] px-4 py-2 text-sm font-black text-white dark:bg-[#91D7C5] dark:text-[#171723]">إعادة المحاولة</button>
      </div>
    );
  }
  const m = data?.membership;
  // Any institutional teacher membership (even suspended) is scoped to director-assigned students only.
  if (m && m.role === "teacher" && m.status === "active") {
    return <div className="min-h-[100dvh] bg-[#F7F4EE] dark:bg-[#0E0F17]"><InstitutionTeacherPortal /></div>;
  }
  return <TeacherSystemPage />;
}
