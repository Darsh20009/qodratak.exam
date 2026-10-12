import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, Building2, CheckCircle2, Download, FileSignature, FileUp, Loader2, Plus,
  Power, RefreshCw, ShieldCheck, Ticket, Users, XCircle,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  CONTRACT_STATUS_LABEL, ROLE_LABEL, TYPE_LABEL, downloadSignedContract, fmtDate, fmtDateTime,
  useAdminInstitution, useAdminInstitutions, useAdminInvites, useAdminIssueInvite, useAdminRevokeInvite,
  useApproveContract, useCreateInstitution, useRejectContract, useSetAvailability, useUploadSigned,
  type InstitutionDTO, type InstitutionRole, type InstitutionType,
} from "@/lib/institutionApi";
import { generateContractPdf, serializePublishedPolicies } from "@/lib/institutionContract";
import { CodeRevealDialog, InviteRow, PerformanceTag } from "@/components/institution/InstitutionShared";

export interface InstitutionPrefill { name?: string; email?: string; phone?: string; city?: string; address?: string }

const field = "h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#b8f36b]/60";
const label = "mb-1.5 block text-[11px] font-black tracking-wide text-slate-400";

function StatusPill({ inst }: { inst: InstitutionDTO }) {
  const s = inst.contract?.status;
  const cls = inst.isActive ? "bg-[#b8f36b]/15 text-[#b8f36b] border-[#b8f36b]/30"
    : inst.suspended ? "bg-orange-500/15 text-orange-300 border-orange-500/30"
      : s === "submitted" ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
        : s === "rejected" ? "bg-red-500/15 text-red-300 border-red-500/30"
          : "bg-white/[0.06] text-slate-300 border-white/10";
  const text = inst.isActive ? "مفعّلة" : inst.suspended ? "موقوفة" : s ? CONTRACT_STATUS_LABEL[s] : "بلا عقد";
  return <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-black", cls)}>{text}</span>;
}

const STEPS = [
  { key: "issued", label: "إصدار العقد" },
  { key: "submitted", label: "رفع الموقّع" },
  { key: "approved", label: "المراجعة والاعتماد" },
  { key: "active", label: "التفعيل" },
];

function Stepper({ inst }: { inst: InstitutionDTO }) {
  const s = inst.contract?.status;
  const reached = inst.isActive ? 4 : s === "approved" ? 3 : s === "submitted" ? 2 : 1;
  return (
    <ol className="grid grid-cols-4 gap-1">
      {STEPS.map((step, i) => (
        <li key={step.key} className="min-w-0">
          <div className={cn("h-1 rounded-full", i < reached ? "bg-[#b8f36b]" : s === "rejected" && i === 1 ? "bg-red-400" : "bg-white/10")} />
          <p className={cn("mt-1.5 truncate text-[10.5px] font-bold", i < reached ? "text-white" : "text-slate-500")}>{step.label}</p>
        </li>
      ))}
    </ol>
  );
}

function CreateDialog({ open, onClose, prefill, onCreated }: { open: boolean; onClose: () => void; prefill?: InstitutionPrefill | null; onCreated: (i: InstitutionDTO) => void }) {
  const { toast } = useToast();
  const create = useCreateInstitution();
  const [form, setForm] = useState({ name: "", type: "school" as InstitutionType, email: "", phone: "", city: "", address: "", maxStudents: "100", maxTeachers: "10", issuerName: "" });
  const [policies, setPolicies] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [showPolicies, setShowPolicies] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm((f) => ({ ...f, name: prefill?.name || "", email: prefill?.email || "", phone: prefill?.phone || "", city: prefill?.city || "", address: prefill?.address || "" }));
    setPolicies(serializePublishedPolicies());
    setAuthorized(false);
  }, [open, prefill]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorized) { toast({ title: "أكد صلاحية اعتماد العقد أولًا", variant: "destructive" }); return; }
    create.mutate({
      name: form.name.trim(), type: form.type, email: form.email.trim(),
      phone: form.phone.trim() || undefined, city: form.city.trim() || undefined, address: form.address.trim() || undefined,
      maxStudents: Number(form.maxStudents), maxTeachers: Number(form.maxTeachers),
      issuerName: form.issuerName.trim(), issuerAuthorized: true, policies,
    }, {
      onSuccess: async ({ institution }) => {
        toast({ title: "حُفظت المؤسسة غير مفعّلة", description: "جارٍ تنزيل العقد الصادر بصيغة PDF." });
        onCreated(institution);
        onClose();
        try { await generateContractPdf(institution); }
        catch (err) { toast({ title: "حُفظت المؤسسة لكن تعذر توليد PDF", description: (err as Error).message + " — يمكنك تنزيله من صفحة المؤسسة.", variant: "destructive" }); }
      },
      onError: (err) => toast({ title: "لم تُحفظ المؤسسة", description: (err as Error).message, variant: "destructive" }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !create.isPending && onClose()}>
      <DialogContent dir="rtl" className="max-h-[92dvh] max-w-3xl overflow-y-auto border-white/10 bg-[#0B1626] text-white">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2"><FileSignature className="h-5 w-5 text-[#b8f36b]" /> إصدار عقد مؤسسة جديدة</DialogTitle>
          <DialogDescription className="text-right text-slate-400">تُحفظ المؤسسة غير مفعّلة، ويُنزَّل العقد تلقائيًا. التفعيل يتطلب رفع النسخة الموقعة ثم اعتمادها بشكل منفصل.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><label className={label}>اسم المؤسسة *</label><input data-testid="input-inst-name" required minLength={3} value={form.name} onChange={set("name")} className={field} /></div>
            <div><label className={label}>النوع *</label>
              <select data-testid="select-inst-type" value={form.type} onChange={set("type")} className={field}>
                {(Object.keys(TYPE_LABEL) as InstitutionType[]).map((t) => <option key={t} value={t} className="bg-[#0B1626]">{TYPE_LABEL[t]}</option>)}
              </select></div>
            <div><label className={label}>البريد الرسمي *</label><input data-testid="input-inst-email" required type="email" dir="ltr" value={form.email} onChange={set("email")} className={field} /></div>
            <div><label className={label}>الجوال</label><input data-testid="input-inst-phone" dir="ltr" value={form.phone} onChange={set("phone")} className={field} /></div>
            <div><label className={label}>المدينة</label><input data-testid="input-inst-city" value={form.city} onChange={set("city")} className={field} /></div>
            <div className="sm:col-span-2"><label className={label}>العنوان</label><input data-testid="input-inst-address" value={form.address} onChange={set("address")} className={field} /></div>
            <div><label className={label}>حد الطلاب *</label><input data-testid="input-inst-max-students" required type="number" min={1} max={10000} value={form.maxStudents} onChange={set("maxStudents")} className={field} /></div>
            <div><label className={label}>حد المعلمين *</label><input data-testid="input-inst-max-teachers" required type="number" min={1} max={10000} value={form.maxTeachers} onChange={set("maxTeachers")} className={field} /></div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black">السياسات المدمجة في العقد</p>
                <p className="mt-0.5 text-[11px] text-slate-400">الشروط والخصوصية والاسترجاع والهوية النظامية المنشورة حاليًا — {policies.length.toLocaleString("ar")} حرف</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setPolicies(serializePublishedPolicies())} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-bold text-slate-300 hover:bg-white/5"><RefreshCw className="inline h-3 w-3" /> استعادة المنشور</button>
                <button data-testid="button-toggle-policies" type="button" onClick={() => setShowPolicies((v) => !v)} className="rounded-lg bg-white/[0.06] px-2.5 py-1.5 text-[11px] font-bold">{showPolicies ? "إخفاء" : "مراجعة النص"}</button>
              </div>
            </div>
            {showPolicies && <textarea data-testid="textarea-policies" value={policies} onChange={(e) => setPolicies(e.target.value)} rows={14} className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-xs leading-6 text-slate-200 outline-none focus:border-[#b8f36b]/50" />}
            {policies.trim().length < 100 && <p className="mt-2 text-[11px] font-bold text-red-300">يجب إدراج السياسات الكاملة (١٠٠ حرف على الأقل).</p>}
          </div>

          <div className="rounded-2xl border border-[#b8f36b]/20 bg-[#b8f36b]/[0.04] p-4">
            <label className={label}>اسم المفوّض بالاعتماد الإلكتروني الداخلي *</label>
            <input data-testid="input-issuer-name" required minLength={4} value={form.issuerName} onChange={set("issuerName")} className={field} placeholder="الاسم الكامل كما يظهر في العقد" />
            <label className="mt-3 flex items-start gap-2 text-xs leading-6 text-slate-300">
              <input data-testid="checkbox-issuer-authorized" type="checkbox" checked={authorized} onChange={(e) => setAuthorized(e.target.checked)} className="mt-1 h-4 w-4 accent-[#b8f36b]" />
              أقر بأن المفوّض المذكور مخوّل باعتماد هذا العقد نيابة عن مؤسسة قدراتك العالية، وأن الاعتماد إلكتروني داخلي مسجّل باسمه وليس توقيعًا رقميًا معتمدًا.
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={create.isPending} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-slate-300">إلغاء</button>
            <button data-testid="button-create-institution" type="submit" disabled={create.isPending || !authorized || policies.trim().length < 100} className="inline-flex items-center gap-2 rounded-xl bg-[#b8f36b] px-5 py-2.5 text-sm font-black text-[#07111F] disabled:opacity-40">
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />} حفظ وتنزيل العقد
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ContractPanel({ inst, storageReady }: { inst: InstitutionDTO; storageReady: boolean }) {
  const { toast } = useToast();
  const c = inst.contract!;
  const upload = useUploadSigned(inst.id);
  const approve = useApproveContract(inst.id);
  const reject = useRejectContract(inst.id);
  const availability = useSetAvailability(inst.id);
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [reason, setReason] = useState("");
  const [busyPdf, setBusyPdf] = useState(false);
  const [confirmSuspend, setConfirmSuspend] = useState(false);

  useEffect(() => { setFile(null); setReviewed(false); setReason(""); }, [inst.id, c.status]);

  const err = (title: string) => (e: unknown) => toast({ title, description: (e as Error).message, variant: "destructive" });

  const pickFile = (f: File | null) => {
    if (!f) return setFile(null);
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) { toast({ title: "الملف يجب أن يكون PDF", variant: "destructive" }); return; }
    if (f.size > 12 * 1024 * 1024) { toast({ title: "الحد الأقصى ١٢ ميجابايت", variant: "destructive" }); return; }
    setFile(f);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black text-slate-500">العقد الصادر (مجمّد)</p>
            <p dir="ltr" className="mt-1 break-all text-right font-mono text-xs text-white">{c.reference}</p>
          </div>
          <button data-testid="button-download-contract" disabled={busyPdf} onClick={async () => { setBusyPdf(true); try { await generateContractPdf(inst); } catch (e) { err("تعذر توليد PDF")(e); } finally { setBusyPdf(false); } }}
            className="inline-flex items-center gap-2 rounded-xl bg-white/[0.07] px-3 py-2 text-xs font-black text-white hover:bg-white/[0.12] disabled:opacity-40">
            {busyPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} تنزيل العقد PDF
          </button>
        </div>
        <dl className="mt-3 grid gap-x-4 gap-y-2 text-xs sm:grid-cols-2">
          <div><dt className="text-slate-500">المفوّض</dt><dd className="font-bold text-slate-200">{c.issuerName}</dd></div>
          <div><dt className="text-slate-500">صدر في</dt><dd className="font-bold text-slate-200">{fmtDateTime(c.issuedAt)}</dd></div>
          <div className="sm:col-span-2"><dt className="text-slate-500">بصمة المحتوى</dt><dd dir="ltr" className="break-all text-right font-mono text-[10.5px] text-slate-300">{c.digest}</dd></div>
        </dl>
      </div>

      {c.status === "rejected" && c.rejectionReason && (
        <div className="flex gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs leading-6 text-red-200"><XCircle className="h-4 w-4 shrink-0" /> سبب رفض النسخة السابقة: {c.rejectionReason}</div>
      )}

      {(c.status === "issued" || c.status === "rejected") && (
        <div className="rounded-2xl border border-white/10 p-4">
          <p className="flex items-center gap-2 text-sm font-black text-white"><FileUp className="h-4 w-4 text-[#b8f36b]" /> رفع النسخة الموقعة من المؤسسة</p>
          {!storageReady && (
            <div className="mt-3 flex gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 p-3 text-xs leading-6 text-orange-200">
              <AlertTriangle className="h-4 w-4 shrink-0" /> التخزين الدائم المشفّر للعقود غير مهيأ على الخادم، لذلك سيرفض الرفع حتى تهيئته. لم يتم تفعيل أي شيء.
            </div>
          )}
          <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => pickFile(e.target.files?.[0] || null)} />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button data-testid="button-pick-signed" onClick={() => fileRef.current?.click()} className="rounded-xl border border-dashed border-white/20 px-4 py-2.5 text-xs font-bold text-slate-300 hover:border-[#b8f36b]/50">{file ? file.name : "اختر ملف PDF (حتى ١٢ ميجابايت)"}</button>
            {file && <span className="font-mono text-[11px] text-slate-500">{(file.size / 1048576).toFixed(2)} MB</span>}
            <button data-testid="button-upload-signed" disabled={!file || upload.isPending}
              onClick={() => file && upload.mutate({ file, reference: c.reference }, { onSuccess: () => toast({ title: "رُفعت النسخة الموقعة", description: "بانتظار المراجعة والاعتماد المنفصل." }), onError: err("لم تُرفع النسخة") })}
              className="ms-auto inline-flex items-center gap-2 rounded-xl bg-[#b8f36b] px-4 py-2.5 text-xs font-black text-[#07111F] disabled:opacity-40">
              {upload.isPending && <Loader2 className="h-4 w-4 animate-spin" />} رفع للمراجعة
            </button>
          </div>
        </div>
      )}

      {c.signedSha256 && (
        <div className="rounded-2xl border border-white/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-black text-white">النسخة الموقعة المخزنة</p>
            <button data-testid="button-download-signed" onClick={() => downloadSignedContract(inst.id, c.reference).catch(err("تعذر التنزيل"))} className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.07] px-3 py-1.5 text-[11px] font-black text-white"><Download className="h-3.5 w-3.5" /> تنزيل للمراجعة</button>
          </div>
          <dl className="mt-2 space-y-1 text-xs">
            <div className="flex gap-2"><dt className="text-slate-500">رُفعت</dt><dd className="text-slate-300">{fmtDateTime(c.signedUploadedAt)} · {c.signedBytes ? `${(c.signedBytes / 1048576).toFixed(2)} MB` : ""}</dd></div>
            <div><dt className="text-slate-500">SHA-256</dt><dd dir="ltr" className="break-all text-right font-mono text-[10.5px] text-slate-300">{c.signedSha256}</dd></div>
          </dl>
        </div>
      )}

      {c.status === "submitted" && (
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#b8f36b]/25 bg-[#b8f36b]/[0.05] p-4">
            <p className="flex items-center gap-2 text-sm font-black text-white"><ShieldCheck className="h-4 w-4 text-[#b8f36b]" /> اعتماد النسخة الموقعة</p>
            <label className="mt-3 flex items-start gap-2 text-xs leading-6 text-slate-300">
              <input data-testid="checkbox-reviewed-signed" type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} className="mt-1 h-4 w-4 accent-[#b8f36b]" />
              راجعت النسخة الموقعة ذات البصمة المعروضة، وتطابق العقد الصادر بالرقم المرجعي نفسه.
            </label>
            <button data-testid="button-approve-contract" disabled={!reviewed || approve.isPending}
              onClick={() => approve.mutate(c.signedSha256!, { onSuccess: () => toast({ title: "اعتُمد العقد وفُعّلت المؤسسة", description: "بدأت مدة المؤسسة ثلاثة أشهر من الآن." }), onError: err("لم يُعتمد العقد") })}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#b8f36b] py-2.5 text-xs font-black text-[#07111F] disabled:opacity-40">
              {approve.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} اعتماد وتفعيل
            </button>
          </div>
          <div className="rounded-2xl border border-red-500/25 bg-red-500/[0.05] p-4">
            <p className="flex items-center gap-2 text-sm font-black text-white"><XCircle className="h-4 w-4 text-red-300" /> رفض النسخة</p>
            <textarea data-testid="textarea-reject-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={1000} placeholder="سبب واضح يُبلَّغ للمؤسسة (٥ أحرف على الأقل)" className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 p-2.5 text-xs text-white outline-none" />
            <button data-testid="button-reject-contract" disabled={reason.trim().length < 5 || reject.isPending}
              onClick={() => reject.mutate(reason.trim(), { onSuccess: () => toast({ title: "رُفضت النسخة الموقعة" }), onError: err("تعذر الرفض") })}
              className="mt-2 w-full rounded-xl border border-red-400/40 py-2.5 text-xs font-black text-red-200 disabled:opacity-40">رفض النسخة</button>
          </div>
        </div>
      )}

      {c.status === "approved" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 p-4">
          <div className="text-xs leading-6 text-slate-300">
            <p className="font-black text-white">{inst.isActive ? "المؤسسة متاحة" : "المؤسسة موقوفة"}</p>
            اعتُمد في {fmtDate(c.approvedAt)} · فُعّلت {fmtDate(inst.activatedAt)} · تنتهي مدة المؤسسة {fmtDate(inst.freeEndDate)}
          </div>
          {inst.isActive && !confirmSuspend ? (
            <button data-testid="button-suspend" onClick={() => setConfirmSuspend(true)} className="inline-flex items-center gap-2 rounded-xl border border-orange-400/40 px-4 py-2 text-xs font-black text-orange-200"><Power className="h-4 w-4" /> إيقاف</button>
          ) : inst.isActive ? (
            <div className="flex gap-2">
              <button onClick={() => setConfirmSuspend(false)} className="rounded-xl px-3 py-2 text-xs text-slate-400">تراجع</button>
              <button data-testid="button-confirm-suspend" disabled={availability.isPending} onClick={() => availability.mutate(false, { onSuccess: () => { setConfirmSuspend(false); toast({ title: "أُوقفت المؤسسة", description: "تتوقف صلاحيات أعضائها حتى إعادة الإتاحة." }); }, onError: err("تعذر الإيقاف") })} className="rounded-xl bg-orange-400 px-4 py-2 text-xs font-black text-[#07111F]">تأكيد الإيقاف</button>
            </div>
          ) : (
            <button data-testid="button-resume" disabled={availability.isPending} onClick={() => availability.mutate(true, { onSuccess: () => toast({ title: "أُعيدت إتاحة المؤسسة" }), onError: err("تعذر الإتاحة") })} className="inline-flex items-center gap-2 rounded-xl bg-[#b8f36b] px-4 py-2 text-xs font-black text-[#07111F]"><Power className="h-4 w-4" /> إعادة الإتاحة</button>
          )}
        </div>
      )}
    </div>
  );
}

function InvitesPanel({ inst }: { inst: InstitutionDTO }) {
  const { toast } = useToast();
  const invites = useAdminInvites(inst.id);
  const issue = useAdminIssueInvite(inst.id);
  const revoke = useAdminRevokeInvite(inst.id);
  const [role, setRole] = useState<InstitutionRole>("institution_admin");
  const [boundPhone, setBoundPhone] = useState("");
  const [maxUses, setMaxUses] = useState(String(inst.maxStudents));
  const [validDays, setValidDays] = useState("30");
  const [labelText, setLabelText] = useState("");
  const [reveal, setReveal] = useState<{ code: string; invite: any } | null>(null);
  const staff = role !== "student";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    issue.mutate({ role, validDays: Number(validDays), label: labelText.trim() || undefined, ...(staff ? { boundPhone: boundPhone.trim() } : { maxUses: Number(maxUses) }) }, {
      onSuccess: (r) => { setReveal(r); setBoundPhone(""); setLabelText(""); },
      onError: (e) => toast({ title: "لم يصدر الكود", description: (e as Error).message, variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-3">
      {!inst.isActive ? (
        <p className="rounded-2xl border border-dashed border-white/15 p-5 text-center text-xs text-slate-400">لا تصدر أكواد قبل اعتماد العقد وإتاحة المؤسسة.</p>
      ) : (
        <form onSubmit={submit} className="grid gap-2 rounded-2xl border border-white/10 p-4 sm:grid-cols-6">
          <div className="sm:col-span-2"><label className={label}>الدور</label>
            <select data-testid="select-invite-role" value={role} onChange={(e) => setRole(e.target.value as InstitutionRole)} className={field}>
              {(["institution_admin", "teacher", "student"] as InstitutionRole[]).map((r) => <option key={r} value={r} className="bg-[#0B1626]">{ROLE_LABEL[r]}</option>)}
            </select></div>
          {staff ? (
            <div className="sm:col-span-2"><label className={label}>الجوال المرتبط *</label><input data-testid="input-invite-phone" required dir="ltr" value={boundPhone} onChange={(e) => setBoundPhone(e.target.value)} placeholder="05XXXXXXXX" className={field} /></div>
          ) : (
            <div className="sm:col-span-2"><label className={label}>عدد الاستخدامات</label><input data-testid="input-invite-uses" type="number" min={1} max={inst.maxStudents} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className={field} /></div>
          )}
          <div><label className={label}>الصلاحية (يوم)</label><input data-testid="input-invite-days" type="number" min={1} max={90} value={validDays} onChange={(e) => setValidDays(e.target.value)} className={field} /></div>
          <div><label className={label}>وصف</label><input data-testid="input-invite-label" value={labelText} onChange={(e) => setLabelText(e.target.value)} maxLength={100} className={field} /></div>
          <p className="text-[11px] text-slate-500 sm:col-span-4">{staff ? "كود لمرة واحدة ومرتبط برقم الجوال." : "كود طلاب متعدد الاستخدام ضمن حد الطلاب."}</p>
          <button data-testid="button-issue-invite" disabled={issue.isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#b8f36b] px-4 py-2.5 text-xs font-black text-[#07111F] disabled:opacity-40 sm:col-span-2">
            {issue.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ticket className="h-4 w-4" />} إصدار كود
          </button>
        </form>
      )}
      <div className="overflow-hidden rounded-2xl border border-white/10">
        {invites.isLoading ? <div className="space-y-2 p-3">{[0, 1].map((i) => <Skeleton key={i} className="h-8 bg-white/5" />)}</div>
          : invites.error ? <p className="p-4 text-xs text-red-300">{(invites.error as Error).message} <button onClick={() => invites.refetch()} className="underline">إعادة</button></p>
            : !invites.data?.invites.length ? <p className="p-5 text-center text-xs text-slate-500">لم تصدر أكواد بعد.</p>
              : invites.data.invites.map((i) => <InviteRow dark key={i.id} invite={i} revoking={revoke.isPending}
                onRevoke={() => revoke.mutate(i.id, { onSuccess: () => toast({ title: "أُلغي الكود" }), onError: (e) => toast({ title: "تعذر الإلغاء", description: (e as Error).message, variant: "destructive" }) })} />)}
      </div>
      <CodeRevealDialog result={reveal} onClose={() => setReveal(null)} />
    </div>
  );
}

function DetailPane({ id, storageReady }: { id: string; storageReady: boolean }) {
  const { data, isLoading, error, refetch } = useAdminInstitution(id);
  const [tab, setTab] = useState<"contract" | "invites" | "members">("contract");
  if (isLoading) return <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl bg-white/5" />)}</div>;
  if (error || !data) return <div className="p-8 text-center text-sm text-red-300">{(error as Error)?.message || "تعذر التحميل"} <button onClick={() => refetch()} className="mr-2 underline">إعادة المحاولة</button></div>;
  const inst = data.institution;
  const counts = { student: 0, teacher: 0, institution_admin: 0 } as Record<string, number>;
  data.members.forEach((m) => { if (m.status === "active") counts[m.role] = (counts[m.role] || 0) + 1; });
  return (
    <div className="space-y-5 p-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 data-testid="text-institution-name" className="text-xl font-black text-white">{inst.name}</h3>
          <StatusPill inst={inst} />
        </div>
        <p className="mt-1 text-xs text-slate-400">{TYPE_LABEL[inst.type]} · {inst.city || "—"} · <span dir="ltr">{inst.email}</span>{inst.phone ? <> · <span dir="ltr">{inst.phone}</span></> : null}</p>
        <div className="mt-4"><Stepper inst={inst} /></div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[["طلاب", counts.student, inst.maxStudents], ["معلمون", counts.teacher, inst.maxTeachers], ["مدير", counts.institution_admin, 1]].map(([l, v, m]) => (
            <div key={l as string} className="rounded-xl border border-white/10 bg-white/[0.02] py-2.5">
              <p className="font-mono text-lg font-bold text-white">{v as number}<span className="text-xs text-slate-500">/{m as number}</span></p>
              <p className="text-[10.5px] text-slate-500">{l as string}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-1 rounded-xl bg-white/[0.04] p-1">
        {([["contract", "العقد والاعتماد"], ["invites", "الأكواد"], ["members", "الأعضاء"]] as const).map(([k, l]) => (
          <button key={k} data-testid={`tab-inst-${k}`} onClick={() => setTab(k)} className={cn("flex-1 rounded-lg py-2 text-xs font-black transition", tab === k ? "bg-[#b8f36b] text-[#07111F]" : "text-slate-400 hover:text-white")}>{l}</button>
        ))}
      </div>
      {tab === "contract" && (inst.contract ? <ContractPanel inst={inst} storageReady={storageReady} /> : <p className="text-sm text-slate-400">لا يوجد عقد مرتبط بهذه المؤسسة.</p>)}
      {tab === "invites" && <InvitesPanel inst={inst} />}
      {tab === "members" && (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          {!data.members.length ? <p className="p-6 text-center text-xs text-slate-500">لم ينضم أي عضو بعد.</p> : data.members.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-4 py-3 last:border-0">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{m.fullName}</p>
                <p className="text-[11px] text-slate-500">{ROLE_LABEL[m.role]} · انضم {fmtDate(m.joinedAt)} · حتى {fmtDate(m.freeEndDate)}{m.status !== "active" ? " · ملغاة" : ""}</p>
              </div>
              {m.role === "student" && <PerformanceTag p={m.performance} compact />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminInstitutionsTab({ prefill, onPrefillConsumed }: { prefill?: InstitutionPrefill | null; onPrefillConsumed?: () => void }) {
  const { data, isLoading, error, refetch } = useAdminInstitutions();
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "active">("all");

  useEffect(() => { if (prefill) setCreating(true); }, [prefill]);

  const list = useMemo(() => (data?.institutions || []).filter((i) =>
    filter === "all" ? true : filter === "active" ? i.isActive : !i.isActive), [data, filter]);

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-white"><Building2 className="h-5 w-5 text-[#b8f36b]" /> المؤسسات والعقود</h2>
          <p className="mt-1 text-sm text-slate-400">إصدار العقد، رفع النسخة الموقعة، الاعتماد المنفصل، ثم إصدار كود المدير.</p>
        </div>
        <button data-testid="button-new-institution" onClick={() => setCreating(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#b8f36b] px-4 py-2.5 text-sm font-black text-[#07111F]"><Plus className="h-4 w-4" /> مؤسسة جديدة</button>
      </div>

      {data && !data.storageReady && (
        <div data-testid="status-storage" className="flex gap-2 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-3 text-xs leading-6 text-orange-200">
          <AlertTriangle className="h-4 w-4 shrink-0" /> التخزين الدائم المشفّر للعقود الموقعة غير مهيأ؛ يمكن إصدار العقود، لكن لا يمكن رفع النسخ الموقعة أو تفعيل أي مؤسسة حتى تهيئته.
        </div>
      )}

      <div className="grid min-h-[480px] overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0B1626]/60 lg:grid-cols-[340px_1fr]">
        <div className="border-b border-white/10 lg:border-b-0 lg:border-l">
          <div className="flex gap-1 border-b border-white/10 p-2">
            {([["all", "الكل"], ["pending", "غير مفعّلة"], ["active", "مفعّلة"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)} className={cn("flex-1 rounded-lg py-1.5 text-[11px] font-black", filter === k ? "bg-white/10 text-white" : "text-slate-500")}>{l}</button>
            ))}
          </div>
          <div className="max-h-[640px] overflow-y-auto">
            {isLoading ? <div className="space-y-2 p-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl bg-white/5" />)}</div>
              : error ? <div className="p-6 text-center text-xs text-red-300">{(error as Error).message}<button onClick={() => refetch()} className="mt-2 block w-full underline">إعادة المحاولة</button></div>
                : !list.length ? (
                  <div className="p-8 text-center">
                    <Users className="mx-auto h-8 w-8 text-slate-600" />
                    <p className="mt-3 text-sm font-bold text-slate-300">لا توجد مؤسسات هنا</p>
                    <p className="mt-1 text-xs text-slate-500">ابدأ بإصدار عقد لمؤسسة جديدة.</p>
                  </div>
                ) : list.map((i) => (
                  <button key={i.id} data-testid={`card-institution-${i.id}`} onClick={() => setSelected(i.id)}
                    className={cn("block w-full border-b border-white/[0.05] px-4 py-3 text-right transition", selected === i.id ? "bg-[#b8f36b]/[0.08]" : "hover:bg-white/[0.03]")}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-bold text-white">{i.name}</span>
                      <StatusPill inst={i} />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">{TYPE_LABEL[i.type]} · {i.maxStudents} طالب · {i.maxTeachers} معلم · {fmtDate(i.contract?.issuedAt)}</p>
                  </button>
                ))}
          </div>
        </div>
        <div className="min-w-0">
          {selected ? <DetailPane id={selected} storageReady={!!data?.storageReady} /> : (
            <div className="grid h-full place-items-center p-10 text-center">
              <div><FileSignature className="mx-auto h-10 w-10 text-slate-700" /><p className="mt-3 text-sm text-slate-400">اختر مؤسسة لعرض العقد والأكواد والأعضاء.</p></div>
            </div>
          )}
        </div>
      </div>

      <CreateDialog open={creating} prefill={prefill} onClose={() => { setCreating(false); onPrefillConsumed?.(); }} onCreated={(i) => setSelected(i.id)} />
    </div>
  );
}
