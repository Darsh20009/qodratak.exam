import { useState } from "react";
import { useLocation } from "wouter";
import { Building2, CalendarClock, Loader2, Ticket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { getDeviceId } from "@/lib/device";
import { ROLE_LABEL, INVITE_CODE_RE, requestJoinOtp, verifyJoinOtp, daysLeft, fmtDate, previewInvite, roleHome, useJoinInstitution, useMembership, type InvitePreview } from "@/lib/institutionApi";

/** Student-facing: own institution banner, or a join-by-code form for existing accounts. */
export default function InstitutionMembershipCard() {
  const { data, isLoading } = useMembership();
  const join = useJoinInstitution();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [checking, setChecking] = useState(false);
  const [consent, setConsent] = useState(false);
  const { user } = useUser();
  const accountPhone: string = (user as any)?.phone || "";
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [phoneToken, setPhoneToken] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const needsOtp = !!preview && (preview.requiresBoundPhone || preview.role !== "student");
  const resetOtp = () => { setOtpSent(false); setOtp(""); setPhoneToken(""); };
  const sendOtp = async () => {
    if (!accountPhone) { toast({ title: "لا يوجد رقم جوال مسجل في حسابك", variant: "destructive" }); return; }
    setOtpBusy(true);
    try { await requestJoinOtp(accountPhone, getDeviceId()); setOtpSent(true); toast({ title: "تم إرسال الرمز إلى جوال حسابك" }); }
    catch (e) { toast({ title: "تعذر إرسال الرمز", description: (e as Error).message, variant: "destructive" }); }
    finally { setOtpBusy(false); }
  };
  const confirmOtp = async () => {
    setOtpBusy(true);
    try { setPhoneToken(await verifyJoinOtp(accountPhone, otp.trim(), getDeviceId())); toast({ title: "تم تأكيد رقم الجوال" }); }
    catch (e) { toast({ title: "رمز غير صحيح", description: (e as Error).message, variant: "destructive" }); }
    finally { setOtpBusy(false); }
  };

  if (isLoading) return null;
  const m = data?.membership;
  if (m && m.status === "active") {
    const left = daysLeft(m.freeEndDate);
    return (
      <div data-testid="card-institution-membership" className="flex flex-wrap items-center gap-4 rounded-2xl bg-[#171723] p-5 text-white" dir="rtl">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#91D7C5] text-[#171723]"><Building2 className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black tracking-[.14em] text-[#91D7C5]">{ROLE_LABEL[m.role]} في مؤسسة</p>
          <p className="truncate text-lg font-black">{m.institutionName}</p>
          {m.institutionReferenceCode && (
            <p className="mt-1 text-[11px] font-semibold text-white/70">
              الرقم المرجعي للمؤسسة: <b dir="ltr" className="font-mono tracking-wider text-white">{m.institutionReferenceCode}</b>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-white/75">
          <CalendarClock className="h-4 w-4 text-[#FF8A70]" />
          {m.freeActive ? <>المدة المجانية حتى {fmtDate(m.freeEndDate)}{left !== null && ` · ${left} يوم`}</> : <>انتهت المدة المجانية في {fmtDate(m.freeEndDate)}</>}
          {!m.institutionActive && <span className="rounded bg-[#FF8A70]/20 px-2 py-0.5 font-bold text-[#FFB4A4]">المؤسسة موقوفة</span>}
        </div>
      </div>
    );
  }

  const check = async () => {
    setPreview(null); resetOtp();
    if (!INVITE_CODE_RE.test(code.trim())) { toast({ title: "صيغة الكود غير صحيحة", variant: "destructive" }); return; }
    setChecking(true);
    try { setPreview(await previewInvite(code)); }
    catch (e) { toast({ title: "الكود غير صالح", description: (e as Error).message, variant: "destructive" }); }
    finally { setChecking(false); }
  };

  return (
    <div className="rounded-2xl border border-dashed border-[#24202D]/20 bg-[#FFFCF7] p-5 dark:border-white/15 dark:bg-[#151621]" dir="rtl">
      {!open ? (
        <button data-testid="button-open-join" onClick={() => setOpen(true)} className="flex w-full items-center gap-3 text-right">
          <Ticket className="h-5 w-5 text-[#C4553F]" />
          <span className="flex-1"><strong className="block text-sm text-[#171723] dark:text-white">لديك كود من مدرستك أو جامعتك؟</strong><span className="text-xs text-[#6B625B] dark:text-slate-400">انضم إلى مؤسستك واحصل على مدتها المجانية.</span></span>
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-black text-[#171723] dark:text-white">الانضمام إلى مؤسسة</p>
          <div className="flex gap-2">
            <input data-testid="input-join-code" dir="ltr" value={code} onChange={(e) => { setCode(e.target.value.replace(/\s/g, "")); setPreview(null); resetOtp(); }} placeholder="كود الانضمام" className="h-11 flex-1 rounded-xl border border-[#24202D]/15 bg-[#F7F4EE] px-3 font-mono text-sm outline-none dark:border-white/10 dark:bg-white/5 dark:text-white" />
            <button data-testid="button-check-code" onClick={check} disabled={checking || !code} className="rounded-xl border border-[#24202D]/15 px-4 text-xs font-black text-[#171723] disabled:opacity-40 dark:border-white/15 dark:text-white">{checking ? <Loader2 className="h-4 w-4 animate-spin" /> : "تحقق"}</button>
          </div>
          {preview && (
            <div className="space-y-3 rounded-xl bg-[#EFF8F4] p-3 text-xs leading-6 text-[#1F6B55] dark:bg-[#2E8B70]/15 dark:text-[#91D7C5]">
              <p><b>{preview.institutionName}</b> · بصفة {ROLE_LABEL[preview.role]} · {preview.freeMonths} أشهر مجانية {preview.individualStart ? "تبدأ من تاريخ انضمامك" : "ضمن مدة المؤسسة"}.{preview.requiresBoundPhone && " هذا الكود مرتبط برقم جوال محدد."}</p>
              <label className="flex items-start gap-2 text-[#171723] dark:text-white">
                <input data-testid="checkbox-join-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-[#171723]" />
                أوافق على الانضمام ومشاركة بيانات تعلّمي ونتائجي المحفوظة مع إدارة المؤسسة ومعلميّ المسندين.
              </label>
              {needsOtp && (
                <div className="space-y-2 rounded-lg border border-[#1F6B55]/20 bg-white/60 p-2.5 text-[#171723] dark:bg-white/5 dark:text-white">
                  <p className="font-bold">انضمام بصفة {ROLE_LABEL[preview!.role]} يتطلب تأكيد جوال حسابك <span dir="ltr" className="font-mono">{accountPhone || "—"}</span> برمز تحقق.</p>
                  {phoneToken ? <p data-testid="text-join-phone-verified" className="font-black text-[#1F6B55] dark:text-[#91D7C5]">تم تأكيد رقم الجوال</p> : !otpSent ? (
                    <button data-testid="button-join-send-otp" type="button" disabled={otpBusy || !accountPhone} onClick={sendOtp} className="rounded-lg bg-[#171723] px-3 py-1.5 text-xs font-black text-white disabled:opacity-40 dark:bg-[#91D7C5] dark:text-[#171723]">{otpBusy ? "..." : "إرسال رمز التحقق"}</button>
                  ) : (
                    <div className="flex gap-2">
                      <input data-testid="input-join-otp" dir="ltr" inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="الرمز" className="h-9 min-w-0 flex-1 rounded-lg border border-[#24202D]/15 bg-[#F7F4EE] px-3 font-mono text-sm outline-none dark:border-white/10 dark:bg-white/5" />
                      <button data-testid="button-join-verify-otp" type="button" disabled={otpBusy || otp.length < 4} onClick={confirmOtp} className="rounded-lg bg-[#171723] px-3 text-xs font-black text-white disabled:opacity-40 dark:bg-[#91D7C5] dark:text-[#171723]">تأكيد</button>
                      <button type="button" disabled={otpBusy} onClick={sendOtp} className="text-[11px] font-bold underline">إعادة</button>
                    </div>
                  )}
                </div>
              )}
              <button data-testid="button-join" disabled={!consent || join.isPending || (needsOtp && !phoneToken)}
                onClick={() => join.mutate({ code, phoneVerificationToken: needsOtp ? phoneToken : undefined }, {
                  onSuccess: (r) => { toast({ title: `انضممت إلى ${r.membership.institutionName}` }); setLocation(roleHome(r.user?.role || r.membership.role)); },
                  onError: (e) => toast({ title: "تعذر الانضمام", description: (e as Error).message, variant: "destructive" }),
                })}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#171723] py-2.5 text-sm font-black text-white disabled:opacity-40 dark:bg-[#91D7C5] dark:text-[#171723]">
                {join.isPending && <Loader2 className="h-4 w-4 animate-spin" />} تأكيد الانضمام
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
