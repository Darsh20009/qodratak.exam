import { useRef, useState, type FormEvent } from "react";
import { CheckCircle2Icon, Loader2Icon, SendIcon, AlertCircleIcon, RotateCcwIcon } from "lucide-react";
import { useSubmitSupportTicket } from "@/hooks/use-support-tickets";

type Fields = { userName: string; userPhone: string; userEmail: string; message: string };
type Errors = Partial<Record<keyof Fields, string>>;

const EMPTY: Fields = { userName: "", userPhone: "", userEmail: "", message: "" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^(?:(?:\+|00)966|0)?5\d{8}$|^(?:\+|00)[1-9]\d{7,14}$/;

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function validate(f: Fields): Errors {
  const e: Errors = {};
  const name = f.userName.trim();
  const phone = f.userPhone.trim()
    .replace(/[٠-٩۰-۹]/g, (char) => String(char.charCodeAt(0) >= 0x06f0 ? char.charCodeAt(0) - 0x06f0 : char.charCodeAt(0) - 0x0660))
    .replace(/[\s().-]/g, "");
  const email = f.userEmail.trim();
  const msg = f.message.trim();
  if (name.length < 2 || name.length > 100) e.userName = "الاسم يجب أن يكون بين 2 و100 حرف.";
  if (!phone || f.userPhone.trim().length > 30 || !PHONE_RE.test(phone))
    e.userPhone = "أدخل رقم جوال صحيح، مثل 05XXXXXXXX أو رقمًا دوليًا يبدأ بـ +.";
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) e.userEmail = "أدخل بريدًا إلكترونيًا صحيحًا.";
  if (msg.length < 10 || msg.length > 4000) e.message = "اكتب الشكوى بين 10 و4000 حرف.";
  return e;
}

const inputCls =
  "w-full rounded-xl border bg-white/80 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/25 dark:bg-gray-900/70 dark:text-white disabled:opacity-60";

export function SupportTicketForm() {
  const submit = useSubmitSupportTicket();
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ reference: string } | null>(null);
  const requestIdRef = useRef<string | null>(null);
  const pendingRef = useRef(false);

  const pending = submit.isPending || pendingRef.current;

  const setField = (k: keyof Fields, v: string) => {
    setFields((p) => ({ ...p, [k]: v }));
    requestIdRef.current = null; // payload changed -> new request id
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
    setServerError(null);
  };

  const onSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (pendingRef.current || submit.isPending) return;
    const e = validate(fields);
    setErrors(e);
    if (Object.keys(e).length) {
      const first = Object.keys(e)[0];
      document.getElementById(`st-${first}`)?.focus();
      return;
    }
    if (!requestIdRef.current) requestIdRef.current = newId();
    pendingRef.current = true;
    setServerError(null);
    submit.mutate(
      {
        userName: fields.userName.trim(),
        userPhone: fields.userPhone.trim(),
        userEmail: fields.userEmail.trim(),
        message: fields.message.trim(),
        requestId: requestIdRef.current,
        ...(website ? { website } : {}),
      },
      {
        onSuccess: (res) => {
          pendingRef.current = false;
          setSuccess({ reference: res.reference || res.ticketId });
        },
        onError: (err: unknown) => {
          pendingRef.current = false;
          const m = err instanceof Error && err.message ? err.message : "";
          setServerError(m || "تعذر إرسال الشكوى. بياناتك محفوظة في النموذج، حاول مرة أخرى.");
        },
      },
    );
  };

  const reset = () => {
    setFields(EMPTY);
    setWebsite("");
    setErrors({});
    setServerError(null);
    setSuccess(null);
    requestIdRef.current = null;
    submit.reset();
  };

  if (success) {
    return (
      <div
        data-testid="support-ticket-success"
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-emerald-300 bg-emerald-50 p-8 text-center dark:border-emerald-700 dark:bg-emerald-950/40"
      >
        <CheckCircle2Icon className="mx-auto h-12 w-12 text-emerald-600" aria-hidden />
        <h3 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">تم استلام شكواك</h3>
        <p className="mt-2 text-gray-700 dark:text-gray-300">تم حفظ الشكوى لدى الإدارة وسيتواصل معك فريق الدعم.</p>
        <div className="mx-auto mt-6 inline-flex flex-col items-center rounded-xl border border-dashed border-emerald-500 bg-white px-6 py-3 dark:bg-gray-900">
          <span className="text-xs text-gray-500 dark:text-gray-400">الرقم المرجعي</span>
          <span dir="ltr" className="font-mono text-xl font-bold tracking-wider text-emerald-700 dark:text-emerald-400">
            {success.reference}
          </span>
        </div>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">احتفظ بهذا الرقم لمتابعة طلبك.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-emerald-600 px-5 py-2.5 font-medium text-emerald-700 transition hover:bg-emerald-600 hover:text-white dark:text-emerald-400"
        >
          <RotateCcwIcon className="h-4 w-4" aria-hidden />
          إرسال شكوى جديدة
        </button>
      </div>
    );
  }

  const fieldBorder = (k: keyof Fields) =>
    errors[k] ? "border-red-500 dark:border-red-500" : "border-gray-300 dark:border-gray-700";

  const ErrorText = ({ k }: { k: keyof Fields }) =>
    errors[k] ? (
      <p id={`st-${k}-err`} className="mt-1.5 text-sm text-red-600 dark:text-red-400">
        {errors[k]}
      </p>
    ) : null;

  const aria = (k: keyof Fields) => ({
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `st-${k}-err` : undefined,
  });

  return (
    <form onSubmit={onSubmit} noValidate={false} aria-busy={pending} className="space-y-5 text-right">
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="st-userName" className="mb-1.5 block font-medium text-gray-800 dark:text-gray-200">
            الاسم <span className="text-red-600" aria-hidden>*</span>
          </label>
          <input id="st-userName" data-testid="support-ticket-name" name="userName" required minLength={2} maxLength={100}
            autoComplete="name" value={fields.userName} disabled={pending}
            onChange={(e) => setField("userName", e.target.value)} className={`${inputCls} ${fieldBorder("userName")}`} {...aria("userName")} />
          <ErrorText k="userName" />
        </div>
        <div>
          <label htmlFor="st-userPhone" className="mb-1.5 block font-medium text-gray-800 dark:text-gray-200">
            رقم الجوال <span className="text-red-600" aria-hidden>*</span>
          </label>
          <input id="st-userPhone" data-testid="support-ticket-phone" name="userPhone" type="tel" dir="ltr" required maxLength={30}
            inputMode="tel" autoComplete="tel" value={fields.userPhone} disabled={pending}
            onChange={(e) => setField("userPhone", e.target.value)} className={`${inputCls} ${fieldBorder("userPhone")} text-left`} {...aria("userPhone")} />
          <ErrorText k="userPhone" />
        </div>
      </div>
      <div>
        <label htmlFor="st-userEmail" className="mb-1.5 block font-medium text-gray-800 dark:text-gray-200">
          البريد الإلكتروني <span className="text-red-600" aria-hidden>*</span>
        </label>
        <input id="st-userEmail" data-testid="support-ticket-email" name="userEmail" type="email" dir="ltr" required maxLength={254}
          autoComplete="email" value={fields.userEmail} disabled={pending}
          onChange={(e) => setField("userEmail", e.target.value)} className={`${inputCls} ${fieldBorder("userEmail")} text-left`} {...aria("userEmail")} />
        <ErrorText k="userEmail" />
      </div>
      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <label htmlFor="st-message" className="block font-medium text-gray-800 dark:text-gray-200">
            الشكوى <span className="text-red-600" aria-hidden>*</span>
          </label>
          <span className="text-xs text-gray-500 dark:text-gray-400" aria-live="off">{fields.message.trim().length} / 4000</span>
        </div>
        <textarea id="st-message" data-testid="support-ticket-message" name="message" required minLength={10} maxLength={4000} rows={6}
          value={fields.message} disabled={pending}
          onChange={(e) => setField("message", e.target.value)} className={`${inputCls} ${fieldBorder("message")} resize-y leading-7`} {...aria("message")} />
        <ErrorText k="message" />
      </div>

      <div aria-hidden="true" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}>
        <label htmlFor="st-website">الموقع</label>
        <input id="st-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={website}
          onChange={(e) => setWebsite(e.target.value)} />
      </div>

      {serverError && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{serverError}</span>
        </div>
      )}

      <button type="submit" data-testid="support-ticket-submit" disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 px-6 py-3.5 text-lg font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70 md:w-auto">
        {pending ? <Loader2Icon className="h-5 w-5 animate-spin" aria-hidden /> : <SendIcon className="h-5 w-5 -scale-x-100" aria-hidden />}
        {pending ? "جارٍ الإرسال..." : serverError ? "إعادة المحاولة" : "إرسال الشكوى"}
      </button>
    </form>
  );
}

export default SupportTicketForm;
