import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, ChevronDown, Eye, EyeOff, KeyRound, Loader2, Lock, Mail, MessageCircle, Phone, User, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getDeviceId } from "@/lib/device";
import { setAdminAccessToken } from "@/lib/adminSession";

type AuthMode = "login" | "signup";
type LoginMethod = "phone" | "email";

const countries = [
  ["السعودية", "966", "🇸🇦"], ["الإمارات", "971", "🇦🇪"], ["الكويت", "965", "🇰🇼"], ["البحرين", "973", "🇧🇭"],
  ["قطر", "974", "🇶🇦"], ["عُمان", "968", "🇴🇲"], ["اليمن", "967", "🇾🇪"], ["العراق", "964", "🇮🇶"],
  ["الأردن", "962", "🇯🇴"], ["لبنان", "961", "🇱🇧"], ["سوريا", "963", "🇸🇾"], ["فلسطين", "970", "🇵🇸"],
  ["مصر", "20", "🇪🇬"], ["السودان", "249", "🇸🇩"], ["ليبيا", "218", "🇱🇾"], ["تونس", "216", "🇹🇳"],
  ["الجزائر", "213", "🇩🇿"], ["المغرب", "212", "🇲🇦"], ["موريتانيا", "222", "🇲🇷"], ["الصومال", "252", "🇸🇴"],
  ["تركيا", "90", "🇹🇷"], ["إيران", "98", "🇮🇷"], ["أفغانستان", "93", "🇦🇫"], ["باكستان", "92", "🇵🇰"],
  ["الهند", "91", "🇮🇳"], ["بنغلاديش", "880", "🇧🇩"], ["سريلانكا", "94", "🇱🇰"], ["نيبال", "977", "🇳🇵"],
  ["الصين", "86", "🇨🇳"], ["اليابان", "81", "🇯🇵"], ["كوريا الجنوبية", "82", "🇰🇷"], ["إندونيسيا", "62", "🇮🇩"],
  ["ماليزيا", "60", "🇲🇾"], ["سنغافورة", "65", "🇸🇬"], ["تايلاند", "66", "🇹🇭"], ["الفلبين", "63", "🇵🇭"],
  ["الولايات المتحدة", "1", "🇺🇸"], ["كندا", "1", "🇨🇦"], ["المكسيك", "52", "🇲🇽"], ["البرازيل", "55", "🇧🇷"],
  ["الأرجنتين", "54", "🇦🇷"], ["تشيلي", "56", "🇨🇱"], ["كولومبيا", "57", "🇨🇴"], ["بيرو", "51", "🇵🇪"],
  ["المملكة المتحدة", "44", "🇬🇧"], ["فرنسا", "33", "🇫🇷"], ["ألمانيا", "49", "🇩🇪"], ["إيطاليا", "39", "🇮🇹"],
  ["إسبانيا", "34", "🇪🇸"], ["البرتغال", "351", "🇵🇹"], ["هولندا", "31", "🇳🇱"], ["بلجيكا", "32", "🇧🇪"],
  ["سويسرا", "41", "🇨🇭"], ["النمسا", "43", "🇦🇹"], ["أيرلندا", "353", "🇮🇪"], ["السويد", "46", "🇸🇪"],
  ["النرويج", "47", "🇳🇴"], ["الدنمارك", "45", "🇩🇰"], ["فنلندا", "358", "🇫🇮"], ["بولندا", "48", "🇵🇱"],
  ["اليونان", "30", "🇬🇷"], ["رومانيا", "40", "🇷🇴"], ["أوكرانيا", "380", "🇺🇦"], ["روسيا", "7", "🇷🇺"],
  ["كازاخستان", "7", "🇰🇿"], ["أوزبكستان", "998", "🇺🇿"], ["أذربيجان", "994", "🇦🇿"], ["جورجيا", "995", "🇬🇪"],
  ["أستراليا", "61", "🇦🇺"], ["نيوزيلندا", "64", "🇳🇿"], ["جنوب أفريقيا", "27", "🇿🇦"], ["نيجيريا", "234", "🇳🇬"],
  ["غانا", "233", "🇬🇭"], ["كينيا", "254", "🇰🇪"], ["تنزانيا", "255", "🇹🇿"], ["أوغندا", "256", "🇺🇬"],
  ["إثيوبيا", "251", "🇪🇹"], ["السنغال", "221", "🇸🇳"], ["الكاميرون", "237", "🇨🇲"], ["ساحل العاج", "225", "🇨🇮"],
] as const;

const emailDomains = ["gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com"];

function fullPhone(code: string, value: string) {
  return `+${code}${value.replace(/\D/g, "").replace(/^0+/, "")}`;
}

function PhoneField({ code, number, onCode, onNumber, disabled }: { code: string; number: string; onCode: (value: string) => void; onNumber: (value: string) => void; disabled?: boolean }) {
  return (
    <div className="flex h-12 overflow-hidden rounded-xl border border-[#24202D]/15 bg-[#F8F6F1] focus-within:border-[#171723] focus-within:ring-4 focus-within:ring-[#171723]/10" dir="ltr">
      <div className="relative flex shrink-0 items-center border-r border-[#24202D]/10 bg-[#EEEAE2]">
        <select aria-label="رمز الدولة" value={code} onChange={(event) => onCode(event.target.value)} disabled={disabled} className="h-full appearance-none bg-transparent py-0 pl-7 pr-2 text-xs font-black text-[#4F4A58] outline-none">
          {countries.map(([name, callingCode, flag]) => <option key={`${name}-${callingCode}`} value={callingCode}>{flag} {name} +{callingCode}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-[#8B8278]" />
      </div>
      <div className="flex items-center px-2 text-sm font-bold text-[#6B625B]">+{code}</div>
      <input type="tel" inputMode="tel" autoComplete="tel-national" required disabled={disabled} value={number} onChange={(event) => onNumber(event.target.value.replace(/\D/g, "").slice(0, 14))} placeholder="5XXXXXXXX" className="min-w-0 flex-1 bg-transparent px-2 text-left text-sm text-[#171723] outline-none" />
    </div>
  );
}

function EmailField({ value, onChange, required = true }: { value: string; onChange: (value: string) => void; required?: boolean }) {
  const suggestions = useMemo(() => {
    const local = value.split("@")[0]?.trim();
    if (!local || value.includes("@") && value.split("@")[1]?.includes(".")) return [];
    return emailDomains.map((domain) => `${local}@${domain}`);
  }, [value]);
  return (
    <div>
      <div className="relative">
        <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B8278]" />
        <input type="text" autoComplete="email" required={required} value={value} onChange={(event) => onChange(event.target.value.trim())} placeholder={required ? "name@email.com" : "البريد الإلكتروني (اختياري)"} dir="ltr" className="h-12 w-full rounded-xl border border-[#24202D]/15 bg-[#F8F6F1] px-4 pl-11 text-left text-sm outline-none focus:border-[#171723] focus:bg-white focus:ring-4 focus:ring-[#171723]/10" />
      </div>
      {suggestions.length > 0 && (
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1" dir="ltr">
          {suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => onChange(suggestion)} className="shrink-0 rounded-full border border-[#24202D]/10 bg-white px-2.5 py-1 text-[10px] font-bold text-[#6B625B]">{suggestion.split("@")[1]}</button>)}
        </div>
      )}
    </div>
  );
}

export function AuthModal({ open, mode, onClose, onModeChange }: { open: boolean; mode: AuthMode; onClose: () => void; onModeChange: (mode: AuthMode) => void }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [method, setMethod] = useState<LoginMethod>("phone");
  const [countryCode, setCountryCode] = useState("966");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneToken, setPhoneToken] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const resetFlow = (nextMode?: AuthMode) => {
    setOtp(""); setOtpSent(false); setPhoneToken(""); setFullName(""); setUsername(""); setEmail(""); setPassword(""); setConfirmPassword(""); setLoading(false);
    if (nextMode) onModeChange(nextMode);
  };

  const finishLogin = async (user: any) => {
    if (user.isAdmin) {
      setAdminAccessToken(user.adminAccessToken);
      window.location.replace("/admin/dashboard");
      return;
    }
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("isLoggedIn", "true");
    window.dispatchEvent(new CustomEvent("userLoggedIn", { detail: user }));
    onClose();
    setLocation(user.role === "institution_admin" ? "/institution" : "/");
  };

  const requestOrVerifyPhone = async () => {
    const number = fullPhone(countryCode, phone);
    if (phone.replace(/\D/g, "").length < 6) throw new Error("أدخل رقم جوال صحيحاً");
    const purpose = mode === "login" ? "login" : "signup";
    const response = await fetch(otpSent ? "/api/auth/phone-otp/verify" : "/api/auth/phone-otp/request", {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: number, otp, purpose, deviceId: getDeviceId() }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || result.message || "تعذر التحقق من رقم الجوال");
    if (!otpSent) {
      setOtpSent(true);
      toast({ title: "تم إرسال الرمز", description: "أدخل الرمز الذي وصلك عبر واتساب." });
      return;
    }
    if (mode === "login") {
      await finishLogin(result);
    } else {
      setPhoneToken(result.verificationToken);
      toast({ title: "تم تأكيد الرقم", description: "أكمل البيانات ثم أنشئ حسابك." });
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === "login" && method === "phone") {
        await requestOrVerifyPhone();
        return;
      }
      if (mode === "login") {
        const response = await fetch("/api/auth/login", {
          method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: email, password, deviceId: getDeviceId() }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "بيانات الدخول غير صحيحة");
        if (result.require2FA) { onClose(); setLocation("/login"); return; }
        await finishLogin(result);
        return;
      }
      if (!phoneToken) {
        await requestOrVerifyPhone();
        return;
      }
      if (fullName.trim().split(/\s+/).length < 2) throw new Error("أدخل الاسم الثنائي");
      if (username.trim().length < 3) throw new Error("أدخل اسم مستخدم من 3 أحرف على الأقل");
      if (email && !email.includes("@")) throw new Error("أدخل بريداً إلكترونياً صحيحاً أو اتركه فارغاً");
      if (password.length < 6) throw new Error("كلمة المرور 6 أحرف على الأقل");
      if (password !== confirmPassword) throw new Error("كلمتا المرور غير متطابقتين");
      const number = fullPhone(countryCode, phone);
      const response = await fetch("/api/auth/register-multi", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim(), username: username.trim(), email: email ? email.toLowerCase() : undefined, phone: number, whatsapp: number, password, role: "student", phoneVerificationToken: phoneToken }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "تعذر إنشاء الحساب");
      await finishLogin(result);
    } catch (error: any) {
      toast({ title: mode === "login" ? "تعذر تسجيل الدخول" : "تعذر إنشاء الحساب", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[calc(100vh-20px)] overflow-hidden border-0 bg-[#FFFCF7] p-0 shadow-[0_25px_90px_rgba(23,23,35,.22)]" style={{ maxWidth: 460, borderRadius: 24, direction: "rtl" }}>
        <div className="flex max-h-[calc(100vh-20px)] flex-col">
          <div className="flex items-center justify-between border-b border-[#24202D]/10 px-6 py-4">
            <div className="flex items-center gap-2.5"><img src="/qodratak-logo-transparent.png" alt="قدراتك" className="h-10 w-10 object-contain" /><div><p className="text-sm font-black text-[#171723]">قدراتك</p><p className="text-[11px] text-[#8B8278]">{mode === "login" ? "دخول سريع وآمن" : "حسابك في دقائق"}</p></div></div>
            <button onClick={onClose} aria-label="إغلاق" className="rounded-lg p-2 text-[#8B8278] hover:bg-[#24202D]/5"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-2 border-b border-[#24202D]/10 bg-[#F7F4EE] p-1.5">
            <button onClick={() => resetFlow("login")} className={`rounded-xl py-2.5 text-sm font-black ${mode === "login" ? "bg-white text-[#171723] shadow-sm" : "text-[#8B8278]"}`}>تسجيل الدخول</button>
            <button onClick={() => resetFlow("signup")} className={`rounded-xl py-2.5 text-sm font-black ${mode === "signup" ? "bg-white text-[#171723] shadow-sm" : "text-[#8B8278]"}`}>إنشاء حساب</button>
          </div>
          <form onSubmit={submit} className="min-h-0 overflow-y-auto px-6 py-5 sm:px-8">
            <h2 className="text-xl font-black text-[#171723]">{mode === "login" ? "أهلًا بعودتك" : "ابدأ رحلتك الآن"}</h2>
            <p className="mt-1 text-xs leading-5 text-[#6B625B]">{mode === "login" ? "الجوال هو الطريقة الأسرع، ويمكنك استخدام البريد أيضاً." : "أدخل بيانات بسيطة، ثم أكّد رقمك عبر واتساب."}</p>

            {mode === "login" && method === "email" ? (
              <div className="mt-5 space-y-3">
                <EmailField value={email} onChange={setEmail} />
                <div className="relative">
                  <Lock className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B8278]" />
                  <input type={showPassword ? "text" : "password"} required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="كلمة المرور" className="h-12 w-full rounded-xl border border-[#24202D]/15 bg-[#F8F6F1] px-11 text-sm outline-none focus:border-[#171723]" />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B8278]">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {mode === "signup" && !otpSent && !phoneToken && <label className="block"><span className="mb-1.5 flex items-center gap-1.5 text-xs font-black text-[#4F4A58]"><Phone className="h-3.5 w-3.5" /> رقم الجوال</span><PhoneField code={countryCode} number={phone} onCode={setCountryCode} onNumber={setPhone} /></label>}
                {mode === "signup" && otpSent && !phoneToken && <div className="relative"><KeyRound className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B8278]" /><input required inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="رمز واتساب المكون من 6 أرقام" dir="ltr" className="h-12 w-full rounded-xl border border-[#24202D]/15 bg-[#F8F6F1] px-11 text-center text-sm tracking-[.2em] outline-none focus:border-[#171723]" /></div>}
                {mode === "signup" && phoneToken && <>
                  <div className="flex items-center gap-2 rounded-xl bg-[#EFF8F4] px-3 py-2 text-xs font-bold text-[#398B79]"><CheckCircle2 className="h-4 w-4" /> تم تأكيد رقم الجوال، أكمل بياناتك</div>
                  <div className="relative"><User className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B8278]" /><input required value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="الاسم الثنائي" autoComplete="name" className="h-12 w-full rounded-xl border border-[#24202D]/15 bg-[#F8F6F1] px-11 text-sm outline-none focus:border-[#171723]" /></div>
                  <div className="relative"><User className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B8278]" /><input required value={username} onChange={(event) => setUsername(event.target.value.replace(/\s/g, "").slice(0, 30))} placeholder="اسم المستخدم" autoComplete="username" dir="ltr" className="h-12 w-full rounded-xl border border-[#24202D]/15 bg-[#F8F6F1] px-11 text-left text-sm outline-none focus:border-[#171723]" /></div>
                </>}
                {mode === "login" && <label className="block"><span className="mb-1.5 flex items-center gap-1.5 text-xs font-black text-[#4F4A58]"><Phone className="h-3.5 w-3.5" /> رقم الجوال</span><PhoneField code={countryCode} number={phone} onCode={setCountryCode} onNumber={setPhone} /></label>}
                {mode === "login" && otpSent && <div className="relative"><KeyRound className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B8278]" /><input required inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="رمز التحقق المكون من 6 أرقام" dir="ltr" className="h-12 w-full rounded-xl border border-[#24202D]/15 bg-[#F8F6F1] px-11 text-center text-sm tracking-[.2em] outline-none focus:border-[#171723]" /></div>}
                {mode === "signup" && phoneToken && <>
                  <EmailField value={email} onChange={setEmail} required={false} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input type={showPassword ? "text" : "password"} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="كلمة المرور" autoComplete="new-password" className="h-11 rounded-xl border border-[#24202D]/15 bg-[#F8F6F1] px-3 text-sm outline-none focus:border-[#171723]" />
                    <input type={showPassword ? "text" : "password"} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="تأكيد كلمة المرور" autoComplete="new-password" className="h-11 rounded-xl border border-[#24202D]/15 bg-[#F8F6F1] px-3 text-sm outline-none focus:border-[#171723]" />
                  </div>
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-right text-[11px] font-bold text-[#6B625B]">{showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}</button>
                </>}
              </div>
            )}

            <button type="submit" disabled={loading} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#171723] text-sm font-black text-white disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "login" && method === "email" ? <Mail className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
              {mode === "login" ? method === "email" ? "الدخول بالبريد" : otpSent ? "تأكيد الرمز والدخول" : "إرسال رمز واتساب" : !phoneToken ? otpSent ? "تأكيد رمز واتساب" : "إرسال رمز واتساب" : "إنشاء الحساب"}
            </button>

            {mode === "login" && (
              <button type="button" onClick={() => { setMethod(method === "phone" ? "email" : "phone"); resetFlow(); }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#24202D]/12 py-3 text-xs font-black text-[#4F4A58]">
                {method === "phone" ? <><Mail className="h-4 w-4" /> أو الدخول بالبريد وكلمة المرور</> : <><Phone className="h-4 w-4" /> العودة للدخول برقم الجوال</>}
              </button>
            )}
            <p className="mt-4 text-center text-[11px] leading-5 text-[#8B8278]">بتسجيل الدخول أو إنشاء الحساب أنت توافق على شروط الاستخدام وسياسة الخصوصية.</p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}