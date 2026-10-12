import { useMemo, useState } from "react";
import { Redirect } from "wouter";
import {
  AlertTriangle, Building2, CalendarClock, ClipboardList, GraduationCap, Loader2, Search,
  Ticket, UserMinus, UserPlus, Users,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
import {
  ROLE_LABEL, TYPE_LABEL, daysLeft, fmtDate, roleHome, useAssignTeachers, useInstitutionDashboard,
  useInstitutionInvites, useIssueInstitutionInvite, useRevokeInstitutionInvite, useRevokeMember,
  type InstitutionRole, type RosterMember,
} from "@/lib/institutionApi";
import { CodeRevealDialog, InviteRow, PerformanceTag, SkeletonBoard, StudentResultsSheet } from "@/components/institution/InstitutionShared";

const card = "rounded-2xl border border-[#24202D]/10 bg-[#FFFCF7] dark:border-white/10 dark:bg-[#151621]";
const input = "h-10 w-full rounded-lg border border-[#24202D]/15 bg-[#F7F4EE] px-3 text-sm text-[#171723] outline-none focus:border-[#171723] dark:border-white/10 dark:bg-white/5 dark:text-white";

function AssignDialog({ student, teachers, onClose }: { student: RosterMember | null; teachers: RosterMember[]; onClose: () => void }) {
  const { toast } = useToast();
  const assign = useAssignTeachers();
  const [picked, setPicked] = useState<string[] | null>(null);
  const current = picked ?? student?.teacherIds ?? [];
  const toggle = (id: string) => setPicked(current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  const close = () => { setPicked(null); onClose(); };
  return (
    <Dialog open={!!student} onOpenChange={(o) => !o && close()}>
      <DialogContent dir="rtl" className="max-w-md border-[#24202D]/15 bg-[#FFFCF7] dark:border-white/10 dark:bg-[#12131C]">
        <DialogHeader className="text-right">
          <DialogTitle className="text-[#171723] dark:text-white">المعلمون المسندون إلى {student?.fullName}</DialogTitle>
          <DialogDescription className="text-right">كل معلم مُسند يرى هذا الطالب ونتائجه المحفوظة فقط.</DialogDescription>
        </DialogHeader>
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {!teachers.length && <p className="rounded-xl border border-dashed border-[#24202D]/20 p-6 text-center text-xs text-[#6B625B]">لا يوجد معلمون نشطون. أصدر كود معلم أولًا.</p>}
          {teachers.map((t) => (
            <label key={t.userId} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[#F1EEE8] dark:hover:bg-white/5">
              <input data-testid={`checkbox-teacher-${t.userId}`} type="checkbox" checked={current.includes(t.userId)} onChange={() => toggle(t.userId)} className="h-4 w-4 accent-[#171723]" />
              <span className="text-sm font-bold text-[#171723] dark:text-white">{t.fullName}</span>
              <span dir="ltr" className="ms-auto text-[11px] text-[#8B8278]">@{t.username}</span>
            </label>
          ))}
        </div>
        <button data-testid="button-save-assignment" disabled={assign.isPending || !student}
          onClick={() => student && assign.mutate({ memberId: student.id, teacherIds: current }, {
            onSuccess: () => { toast({ title: "حُفظ الإسناد" }); close(); },
            onError: (e) => toast({ title: "لم يُحفظ الإسناد", description: (e as Error).message, variant: "destructive" }),
          })}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#171723] py-3 text-sm font-black text-white disabled:opacity-40 dark:bg-[#91D7C5] dark:text-[#171723]">
          {assign.isPending && <Loader2 className="h-4 w-4 animate-spin" />} حفظ ({current.length})
        </button>
      </DialogContent>
    </Dialog>
  );
}

function RevokeDialog({ member, onClose }: { member: RosterMember | null; onClose: () => void }) {
  const { toast } = useToast();
  const revoke = useRevokeMember();
  const [typed, setTyped] = useState("");
  const close = () => { setTyped(""); onClose(); };
  return (
    <Dialog open={!!member} onOpenChange={(o) => !o && close()}>
      <DialogContent dir="rtl" className="max-w-md border-[#24202D]/15 bg-[#FFFCF7] dark:border-white/10 dark:bg-[#12131C]">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-[#A3402E]"><AlertTriangle className="h-5 w-5" /> إلغاء عضوية {member ? ROLE_LABEL[member.role] : ""}</DialogTitle>
          <DialogDescription className="text-right leading-7">
            سيُفصل <b>{member?.fullName}</b> عن المؤسسة ويعود حسابه حساب طالب فردي، وتتوقف صلاحية المؤسسة على بياناته. لا تُحذف سجلات تعلّمه، ولا يمكن إعادة بدء فترته المجانية.
          </DialogDescription>
        </DialogHeader>
        <label className="text-xs font-bold text-[#4F4A58] dark:text-slate-300">اكتب «إلغاء» للتأكيد</label>
        <input data-testid="input-confirm-revoke" value={typed} onChange={(e) => setTyped(e.target.value)} className={input} />
        <div className="flex gap-2">
          <button onClick={close} className="flex-1 rounded-xl border border-[#24202D]/15 py-2.5 text-sm font-bold dark:border-white/15 dark:text-white">تراجع</button>
          <button data-testid="button-confirm-revoke" disabled={typed.trim() !== "إلغاء" || revoke.isPending}
            onClick={() => member && revoke.mutate(member.id, {
              onSuccess: () => { toast({ title: "أُلغيت العضوية" }); close(); },
              onError: (e) => toast({ title: "تعذر الإلغاء", description: (e as Error).message, variant: "destructive" }),
            })}
            className="flex-1 rounded-xl bg-[#C4553F] py-2.5 text-sm font-black text-white disabled:opacity-40">إلغاء العضوية</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InvitesSection({ maxStudents }: { maxStudents: number }) {
  const { toast } = useToast();
  const invites = useInstitutionInvites();
  const issue = useIssueInstitutionInvite();
  const revoke = useRevokeInstitutionInvite();
  const [role, setRole] = useState<Exclude<InstitutionRole, "institution_admin">>("student");
  const [phone, setPhone] = useState("");
  const [uses, setUses] = useState(String(Math.min(maxStudents, 50)));
  const [days, setDays] = useState("30");
  const [labelText, setLabelText] = useState("");
  const [reveal, setReveal] = useState<any>(null);
  return (
    <section className={cn(card, "overflow-hidden")}>
      <div className="border-b border-[#24202D]/10 p-5 dark:border-white/10">
        <h2 className="flex items-center gap-2 text-lg font-black text-[#171723] dark:text-white"><Ticket className="h-5 w-5 text-[#C4553F]" /> أكواد الانضمام</h2>
        <p className="mt-1 text-xs text-[#6B625B] dark:text-slate-400">كود الطالب متعدد الاستخدام، وكود المعلم لمرة واحدة ومرتبط بجواله. كود مدير المؤسسة يصدر من إدارة قدراتك فقط.</p>
      </div>
      <form onSubmit={(e) => {
        e.preventDefault();
        issue.mutate({ role, validDays: Number(days), label: labelText.trim() || undefined, ...(role === "teacher" ? { boundPhone: phone.trim() } : { maxUses: Number(uses) }) }, {
          onSuccess: (r) => { setReveal(r); setPhone(""); setLabelText(""); },
          onError: (err) => toast({ title: "لم يصدر الكود", description: (err as Error).message, variant: "destructive" }),
        });
      }} className="grid gap-3 p-5 sm:grid-cols-12">
        <div className="flex rounded-lg bg-[#F1EEE8] p-1 dark:bg-white/5 sm:col-span-3">
          {(["student", "teacher"] as const).map((r) => (
            <button type="button" key={r} data-testid={`button-invite-role-${r}`} onClick={() => setRole(r)} className={cn("flex-1 rounded-md py-1.5 text-xs font-black", role === r ? "bg-[#171723] text-white dark:bg-[#91D7C5] dark:text-[#171723]" : "text-[#6B625B] dark:text-slate-400")}>{ROLE_LABEL[r]}</button>
          ))}
        </div>
        {role === "teacher"
          ? <input data-testid="input-teacher-phone" required dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="جوال المعلم 05XXXXXXXX" className={cn(input, "sm:col-span-3")} />
          : <input data-testid="input-student-uses" type="number" min={1} max={maxStudents} value={uses} onChange={(e) => setUses(e.target.value)} title="عدد الاستخدامات" className={cn(input, "sm:col-span-3")} />}
        <input data-testid="input-invite-days" type="number" min={1} max={90} value={days} onChange={(e) => setDays(e.target.value)} title="أيام الصلاحية" className={cn(input, "sm:col-span-2")} />
        <input data-testid="input-invite-label" value={labelText} onChange={(e) => setLabelText(e.target.value)} placeholder="وصف (مثل: الصف الثالث)" maxLength={100} className={cn(input, "sm:col-span-2")} />
        <button data-testid="button-issue-code" disabled={issue.isPending} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#171723] text-xs font-black text-white disabled:opacity-40 dark:bg-[#91D7C5] dark:text-[#171723] sm:col-span-2 h-10">
          {issue.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} إصدار
        </button>
        <p className="text-[11px] text-[#8B8278] sm:col-span-12">{role === "student" ? "عدد الاستخدامات · مدة الصلاحية بالأيام (حتى ٩٠) · وصف اختياري" : "رقم الجوال الذي سيُسجَّل به المعلم · مدة الصلاحية · وصف"}</p>
      </form>
      <div className="border-t border-[#24202D]/10 dark:border-white/10">
        {invites.isLoading ? <p className="p-5 text-xs text-[#8B8278]">جارٍ التحميل…</p>
          : invites.error ? <p className="p-5 text-xs text-[#A3402E]">{(invites.error as Error).message} <button onClick={() => invites.refetch()} className="underline">إعادة</button></p>
            : !invites.data?.invites.length ? <p className="p-6 text-center text-xs text-[#8B8278]">لم تصدر أكواد بعد.</p>
              : invites.data.invites.map((i) => <InviteRow key={i.id} invite={i} revoking={revoke.isPending}
                onRevoke={() => revoke.mutate(i.id, { onSuccess: () => toast({ title: "أُلغي الكود" }), onError: (e) => toast({ title: "تعذر الإلغاء", description: (e as Error).message, variant: "destructive" }) })} />)}
      </div>
      <CodeRevealDialog result={reveal} onClose={() => setReveal(null)} />
    </section>
  );
}

function Director() {
  const { data, isLoading, error, refetch } = useInstitutionDashboard();
  const [tab, setTab] = useState<"students" | "teachers" | "invites">("students");
  const [q, setQ] = useState("");
  const [assigning, setAssigning] = useState<RosterMember | null>(null);
  const [revoking, setRevoking] = useState<RosterMember | null>(null);
  const [viewing, setViewing] = useState<RosterMember | null>(null);

  const members = data?.members || [];
  const students = useMemo(() => members.filter((m) => m.role === "student"), [members]);
  const teachers = useMemo(() => members.filter((m) => m.role === "teacher"), [members]);
  const activeTeachers = teachers.filter((t) => t.status === "active");
  const teacherName = useMemo(() => new Map(teachers.map((t) => [t.userId, t.fullName])), [teachers]);
  const filtered = (tab === "teachers" ? teachers : students).filter((m) => !q || `${m.fullName} ${m.username} ${m.phone || ""}`.includes(q.trim()));

  if (isLoading) return <SkeletonBoard />;
  if (error || !data) {
    return (
      <div className="grid min-h-[60dvh] place-items-center p-6 text-center" dir="rtl">
        <div className={cn(card, "max-w-md p-8")}>
          <AlertTriangle className="mx-auto h-10 w-10 text-[#C4553F]" />
          <h1 className="mt-3 text-lg font-black text-[#171723] dark:text-white">تعذر فتح لوحة المؤسسة</h1>
          <p className="mt-2 text-sm leading-7 text-[#6B625B] dark:text-slate-400">{(error as Error)?.message || "حاول مجددًا"}. قد تكون المؤسسة موقوفة أو لم يُعتمد عقدها.</p>
          <button data-testid="button-retry" onClick={() => refetch()} className="mt-4 rounded-xl bg-[#171723] px-5 py-2.5 text-sm font-black text-white dark:bg-[#91D7C5] dark:text-[#171723]">إعادة المحاولة</button>
        </div>
      </div>
    );
  }
  const inst = data.institution;
  const activeStudents = students.filter((s) => s.status === "active");
  const observed = activeStudents.filter((s) => s.performance.confidence === "observed");
  const unassigned = activeStudents.filter((s) => !s.teacherIds.length).length;
  const left = daysLeft(inst.freeEndDate);

  return (
    <div className="min-h-full bg-[#F7F4EE] dark:bg-[#0E0F17]" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <header className="relative overflow-hidden rounded-3xl bg-[#171723] p-6 text-white sm:p-8">
          <div aria-hidden className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full border-[28px] border-[#91D7C5]/10" />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#91D7C5] text-[#171723]"><Building2 className="h-7 w-7" /></div>
              <div>
                <p className="text-[11px] font-black tracking-[.16em] text-[#91D7C5]">لوحة مدير المؤسسة · {TYPE_LABEL[inst.type]}</p>
                <h1 data-testid="text-institution-name" className="mt-1 text-2xl font-black sm:text-3xl">{inst.name}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] px-4 py-3">
              <CalendarClock className="h-5 w-5 text-[#FF8A70]" />
              <div className="text-xs leading-5">
                <p className="text-white/60">مدة المؤسسة من التفعيل {fmtDate(inst.activatedAt)}</p>
                <p className="font-black">تنتهي {fmtDate(inst.freeEndDate)}{left !== null && <span className="font-mono text-[#FF8A70]"> · {left} يوم</span>}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { l: "الطلاب النشطون", v: `${activeStudents.length}`, m: `/ ${inst.maxStudents}`, I: Users },
            { l: "المعلمون النشطون", v: `${activeTeachers.length}`, m: `/ ${inst.maxTeachers}`, I: GraduationCap },
            { l: "بلا معلم مُسند", v: `${unassigned}`, m: "طالب", I: UserPlus },
            { l: "ببيانات أداء كافية", v: `${observed.length}`, m: `من ${activeStudents.length}`, I: ClipboardList },
          ].map(({ l, v, m, I }) => (
            <div key={l} className={cn(card, "p-4")}>
              <I className="h-4 w-4 text-[#C4553F]" />
              <p className="mt-3 font-mono text-2xl font-bold text-[#171723] dark:text-white">{v}<span className="text-xs text-[#8B8278]"> {m}</span></p>
              <p className="text-[11px] font-bold text-[#6B625B] dark:text-slate-400">{l}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl border border-[#24202D]/10 bg-[#FFFCF7] p-1 dark:border-white/10 dark:bg-[#151621]">
            {([["students", `الطلاب (${students.length})`], ["teachers", `المعلمون (${teachers.length})`], ["invites", "الأكواد"]] as const).map(([k, l]) => (
              <button key={k} data-testid={`tab-${k}`} onClick={() => setTab(k)} className={cn("rounded-lg px-4 py-2 text-xs font-black transition", tab === k ? "bg-[#171723] text-white dark:bg-[#91D7C5] dark:text-[#171723]" : "text-[#6B625B] dark:text-slate-400")}>{l}</button>
            ))}
          </div>
          {tab !== "invites" && (
            <div className="relative ms-auto w-full sm:w-72">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B8278]" />
              <input data-testid="input-search-members" value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالاسم أو المستخدم أو الجوال" className={cn(input, "pr-9")} />
            </div>
          )}
        </div>

        {tab === "invites" ? <InvitesSection maxStudents={inst.maxStudents} /> : (
          <section className={cn(card, "overflow-hidden")}>
            {!filtered.length ? (
              <div className="p-12 text-center">
                <Users className="mx-auto h-10 w-10 text-[#C9C1B6]" />
                <p className="mt-3 font-black text-[#171723] dark:text-white">{q ? "لا نتائج مطابقة" : tab === "students" ? "لم ينضم طلاب بعد" : "لم ينضم معلمون بعد"}</p>
                {!q && <button onClick={() => setTab("invites")} className="mt-3 text-sm font-black text-[#C4553F] underline">أصدر كود انضمام</button>}
              </div>
            ) : (
              <div className="divide-y divide-[#24202D]/10 dark:divide-white/10">
                {filtered.map((m) => {
                  const active = m.status === "active";
                  const assignedCount = tab === "teachers" ? students.filter((s) => s.status === "active" && s.teacherIds.includes(m.userId)).length : 0;
                  return (
                    <div key={m.id} data-testid={`row-member-${m.id}`} className={cn("grid gap-3 p-4 md:grid-cols-[1.4fr_1fr_1.2fr_auto] md:items-center", !active && "opacity-55")}>
                      <div className="min-w-0">
                        <p className="truncate font-black text-[#171723] dark:text-white">{m.fullName}{!active && <span className="mr-2 rounded bg-[#F1EEE8] px-1.5 text-[10px] text-[#6B625B] dark:bg-white/5">ملغاة</span>}</p>
                        <p dir="ltr" className="truncate text-right text-[11px] text-[#8B8278]">@{m.username}{m.phone ? ` · ${m.phone}` : ""}</p>
                      </div>
                      <div className="text-[11px] leading-5 text-[#6B625B] dark:text-slate-400">
                        <p>انضم {fmtDate(m.joinedAt)}</p>
                        <p className={m.freeActive ? "font-bold text-[#1F6B55] dark:text-[#91D7C5]" : ""}>المجانية حتى {fmtDate(m.freeEndDate)}</p>
                        {m.subscription?.type && <p>الاشتراك: {m.subscription.type === "free_trial" ? "فترة المؤسسة" : m.subscription.type}</p>}
                      </div>
                      {tab === "students" ? (
                        <div className="min-w-0 space-y-1.5">
                          <PerformanceTag p={m.performance} />
                          <p className="truncate text-[11px] text-[#6B625B] dark:text-slate-400">
                            {m.teacherIds.length ? `المعلمون: ${m.teacherIds.map((id) => teacherName.get(id) || "معلم غير نشط").join("، ")}` : "لا يوجد معلم مُسند"}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs font-bold text-[#4F4A58] dark:text-slate-300">{assignedCount} طالب مُسند</p>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {tab === "students" && active && <>
                          <button data-testid={`button-results-${m.id}`} onClick={() => setViewing(m)} className="rounded-lg border border-[#24202D]/15 px-2.5 py-1.5 text-[11px] font-black text-[#171723] hover:bg-[#F1EEE8] dark:border-white/15 dark:text-white dark:hover:bg-white/5">النتائج</button>
                          <button data-testid={`button-assign-${m.id}`} onClick={() => setAssigning(m)} className="rounded-lg bg-[#171723] px-2.5 py-1.5 text-[11px] font-black text-white dark:bg-[#91D7C5] dark:text-[#171723]">إسناد معلمين</button>
                        </>}
                        {active && <button data-testid={`button-revoke-${m.id}`} onClick={() => setRevoking(m)} title="إلغاء العضوية" className="rounded-lg p-1.5 text-[#C4553F] hover:bg-[#C4553F]/10"><UserMinus className="h-4 w-4" /></button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
        <p className="text-center text-[11px] leading-6 text-[#8B8278]">مؤشرات الأداء مبنية على المحاولات والأسئلة المرصودة فقط (عدا التحصيلي)، ولا تعني إتقانًا مضمونًا. يلزم ٣ محاولات و٣٠ سؤالًا على الأقل قبل عرض مستوى.</p>
      </div>
      <AssignDialog student={assigning} teachers={activeTeachers} onClose={() => setAssigning(null)} />
      <RevokeDialog member={revoking} onClose={() => setRevoking(null)} />
      <StudentResultsSheet member={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}

export default function InstitutionPortalPage() {
  const { user, isLoading } = useUser();
  if (isLoading) return <SkeletonBoard />;
  if (!user) return <Redirect to="/login?return=%2Finstitution" />;
  if ((user as any).role !== "institution_admin") return <Redirect to={roleHome((user as any).role)} />;
  return <Director />;
}
