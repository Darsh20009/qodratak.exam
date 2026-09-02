import React, { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import {
  LogOut,
  RefreshCcw,
  User,
  Phone,
  Target,
  BarChart3,
  Award,
  Calendar,
  Activity,
  CheckCircle2,
  UsersRound,
  AlertCircle,
  FileText,
  KeyRound,
  Loader2,
  UserPlus,
  X,
} from "lucide-react";

type TestResult = {
  id: string;
  testType: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  completedAt: string;
};

type ChildStats = {
  totalTests: number;
  averageScore: number;
  bestScore: number;
  totalPoints: number;
};

type Child = {
  id: string;
  fullName: string;
  phone: string;
  stats: ChildStats;
  recentResults: TestResult[];
};

type Parent = {
  fullName: string;
  phone: string;
};

type DashboardData = {
  parent: Parent;
  children: Child[];
};

export default function ParentDashboardPage() {
  const [, setLocation] = useLocation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [addChildOpen, setAddChildOpen] = useState(false);
  const [addChildPhone, setAddChildPhone] = useState("");
  const [addChildOtp, setAddChildOtp] = useState("");
  const [addChildOtpSent, setAddChildOtpSent] = useState(false);
  const [addChildLoading, setAddChildLoading] = useState(false);
  const [addChildNotice, setAddChildNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/parent/dashboard", { credentials: "include" });
      if (res.status === 401 || res.status === 403) {
        setLocation("/login");
        return;
      }
      if (!res.ok) {
        throw new Error("حدث خطأ أثناء تحميل بيانات لوحة المتابعة.");
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      localStorage.removeItem("user");
      localStorage.removeItem("isLoggedIn");
      window.dispatchEvent(new Event("userLoggedOut"));
      setLocation("/");
    } catch {
      // Ignore errors on logout
    } finally {
      setLoggingOut(false);
    }
  };

  const resetAddChild = () => {
    setAddChildPhone("");
    setAddChildOtp("");
    setAddChildOtpSent(false);
    setAddChildNotice(null);
  };

  const requestAddChildOtp = async () => {
    const digits = addChildPhone.replace(/\D/g, "");
    if (digits.length < 9) {
      setAddChildNotice({ type: "error", text: "أدخل رقم جوال الطالب المكوّن من 9 أرقام." });
      return;
    }

    setAddChildLoading(true);
    setAddChildNotice(null);
    try {
      const phone = `+966${digits.replace(/^0+/, "")}`;
      const response = await fetch("/api/parent/phone-otp/request", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, kind: "child" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "تعذر إرسال رمز التحقق للطالب");
      setAddChildOtpSent(true);
      setAddChildNotice({ type: "success", text: "تم إرسال رمز التحقق إلى جوال الطالب." });
    } catch (err) {
      setAddChildNotice({ type: "error", text: err instanceof Error ? err.message : "تعذر إرسال رمز التحقق." });
    } finally {
      setAddChildLoading(false);
    }
  };

  const verifyAndAddChild = async () => {
    if (addChildOtp.length < 6) {
      setAddChildNotice({ type: "error", text: "أدخل رمز التحقق المكوّن من 6 أرقام." });
      return;
    }

    setAddChildLoading(true);
    setAddChildNotice(null);
    try {
      const phone = `+966${addChildPhone.replace(/\D/g, "").replace(/^0+/, "")}`;
      const verifyResponse = await fetch("/api/parent/phone-otp/verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: addChildOtp, kind: "child" }),
      });
      const verification = await verifyResponse.json();
      if (!verifyResponse.ok) throw new Error(verification.error || "رمز التحقق غير صحيح");

      const addResponse = await fetch("/api/parent/children", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, verificationToken: verification.verificationToken }),
      });
      const result = await addResponse.json();
      if (!addResponse.ok) throw new Error(result.error || "تعذر إضافة الطالب");

      setAddChildNotice({ type: "success", text: `تمت إضافة ${result.child?.fullName || "الطالب"} إلى حسابك.` });
      resetAddChild();
      setAddChildOpen(false);
      await fetchDashboard();
    } catch (err) {
      setAddChildNotice({ type: "error", text: err instanceof Error ? err.message : "تعذر إضافة الطالب." });
    } finally {
      setAddChildLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EE] text-slate-900 font-sans" dir="rtl">
      {/* Header */}
      <header className="border-b border-[#24202D]/[.09] bg-white sticky top-0 z-30 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[#FF8A70] rounded-lg">
            <img
              src="/qodratak-logo-transparent.png"
              alt="شعار منصة قدراتك"
              width="40"
              height="40"
              className="h-10 w-10 object-contain"
            />
            <span className="text-lg font-black text-[#0D1B2A]">قدراتك</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-red-200"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">تسجيل الخروج</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        {loading ? (
          <DashboardSkeleton />
        ) : error ? (
          <div className="bg-white rounded-3xl border border-red-100 p-10 md:p-16 text-center shadow-sm animate-fade-in-up">
            <div className="h-20 w-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-black text-[#0D1B2A] mb-3">عذراً، لم نتمكن من جلب البيانات</h3>
            <p className="text-slate-500 text-base mb-8 max-w-md mx-auto leading-relaxed">{error}</p>
            <button 
              onClick={fetchDashboard}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#0D1B2A] text-white text-sm font-black hover:bg-[#1E2938] transition-all hover:-translate-y-0.5 active:translate-y-0 outline-none focus-visible:ring-2 focus-visible:ring-[#0D1B2A] focus-visible:ring-offset-2"
            >
              <RefreshCcw className="h-4 w-4" />
              إعادة المحاولة
            </button>
          </div>
        ) : data ? (
          <div className="animate-fade-in-up space-y-8">
            {/* Parent Info Banner */}
            <div className="bg-[#0D1B2A] rounded-3xl p-8 md:p-10 text-white relative overflow-hidden shadow-lg">
              <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-[#91D7C5]/20 blur-3xl" />
              <div className="pointer-events-none absolute right-10 bottom-0 h-40 w-40 rounded-full bg-[#FF8A70]/10 blur-3xl" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <p className="text-[#91D7C5] text-sm font-black mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#91D7C5] animate-pulse-slow"></span>
                    لوحة المتابعة
                  </p>
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight">{data.parent.fullName}</h1>
                  <div className="flex items-center gap-2 mt-4 text-slate-300 text-sm font-medium">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span dir="ltr">{data.parent.phone}</span>
                  </div>
                </div>
                
                <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm border border-white/10">
                  <div className="text-3xl font-black text-white mb-1">{data.children.length}</div>
                  <div className="text-sm text-[#91D7C5] font-bold flex items-center gap-2">
                    <UsersRound className="h-4 w-4" />
                    عدد الأبناء المتابعين
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#0D1B2A]">الأبناء</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">تابع نتائج كل أبنائك من حساب واحد.</p>
              </div>
              <button
                type="button"
                onClick={() => { setAddChildOpen((open) => !open); setAddChildNotice(null); }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0D1B2A] px-4 py-3 text-sm font-black text-white transition hover:bg-[#1E2938] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8A70] focus-visible:ring-offset-2"
                data-testid="button-parent-add-child"
              >
                {addChildOpen ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {addChildOpen ? "إغلاق" : "إضافة ابن"}
              </button>
            </div>

            {addChildOpen && (
              <div className="rounded-3xl border border-[#B9E2D6] bg-[#EAF8F3] p-6 shadow-sm sm:p-7">
                <div className="max-w-2xl">
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#0D1B2A] text-[#91D7C5]">
                      <UserPlus className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-[#0D1B2A]">إضافة ابن جديد</h3>
                      <p className="mt-1 text-sm leading-6 text-[#5E7180]">
                        أدخل رقم الطالب، وسنرسل رمز التحقق إلى جواله للتأكد من موافقته على الربط.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
                    <label className="flex-1">
                      <span className="mb-1.5 block text-xs font-black text-[#4F4A58]">رقم جوال الطالب</span>
                      <div className="flex h-12 overflow-hidden rounded-xl border border-[#24202D]/15 bg-white focus-within:border-[#171723] focus-within:ring-4 focus-within:ring-[#171723]/10" dir="ltr">
                        <span className="flex items-center border-r border-[#24202D]/10 bg-[#F3F0EA] px-3 text-sm font-black text-[#4F4A58]">+966</span>
                        <input
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel-national"
                          value={addChildPhone}
                          onChange={(event) => setAddChildPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
                          disabled={addChildOtpSent || addChildLoading}
                          placeholder="5XXXXXXXX"
                          className="min-w-0 flex-1 bg-transparent px-3 text-left text-sm text-[#171723] outline-none"
                          data-testid="input-parent-child-phone"
                        />
                      </div>
                    </label>

                    {!addChildOtpSent ? (
                      <button
                        type="button"
                        onClick={requestAddChildOtp}
                        disabled={addChildLoading}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0D1B2A] px-5 text-sm font-black text-white disabled:opacity-50"
                        data-testid="button-parent-send-child-otp"
                      >
                        {addChildLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
                        إرسال الرمز
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={verifyAndAddChild}
                        disabled={addChildLoading}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#287966] px-5 text-sm font-black text-white disabled:opacity-50"
                        data-testid="button-parent-confirm-child"
                      >
                        {addChildLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        تأكيد وإضافة
                      </button>
                    )}
                  </div>

                  {addChildOtpSent && (
                    <div className="mt-3 flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-[#287966]" />
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={addChildOtp}
                        onChange={(event) => setAddChildOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="رمز التحقق من واتساب"
                        dir="ltr"
                        className="h-11 min-w-0 flex-1 rounded-xl border border-[#24202D]/15 bg-white px-3 text-center text-sm tracking-[.2em] outline-none focus:border-[#171723]"
                        data-testid="input-parent-child-otp"
                      />
                      <button
                        type="button"
                        onClick={resetAddChild}
                        className="h-11 rounded-xl px-3 text-xs font-bold text-[#5E7180] hover:bg-white/70"
                      >
                        تعديل
                      </button>
                    </div>
                  )}

                  {addChildNotice && (
                    <p className={`mt-3 text-sm font-bold ${addChildNotice.type === "success" ? "text-[#287966]" : "text-red-600"}`} role="status">
                      {addChildNotice.text}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Children List */}
            {data.children.length > 0 ? (
              <div className="space-y-6">
                {data.children.map((child, index) => (
                  <ChildCard key={child.id} child={child} delayMs={index * 100} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 md:p-16 text-center shadow-sm">
                <div className="h-20 w-20 bg-[#EAF8F3] text-[#287966] rounded-full flex items-center justify-center mx-auto mb-6">
                  <UsersRound className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-black text-[#0D1B2A] mb-3">لا يوجد أبناء مرتبطين بحسابك</h3>
                <p className="text-slate-500 text-base max-w-md mx-auto leading-relaxed">
                  لم يتم ربط أي حسابات طلاب برقم هاتفك حتى الآن. يرجى من الطالب إضافة رقمك في ملفه الشخصي لتبدأ بمتابعة تقدمه هنا.
                </p>
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}

function ChildCard({ child, delayMs }: { child: Child; delayMs: number }) {
  return (
    <div 
      className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm transition-all hover:shadow-md"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      {/* Header */}
      <div className="flex items-center gap-5 mb-8 pb-6 border-b border-slate-100">
        <div className="h-14 w-14 rounded-2xl bg-[#FFF8F2] text-[#FF8A70] flex items-center justify-center shrink-0">
          <User className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-[#0D1B2A]">{child.fullName}</h2>
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500 mt-2">
            <Phone className="h-4 w-4" />
            <span dir="ltr">{child.phone}</span>
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FileText} label="إجمالي الاختبارات" value={child.stats.totalTests} />
        <StatCard icon={Activity} label="متوسط الدرجات" value={`${child.stats.averageScore}%`} />
        <StatCard icon={Award} label="أفضل نتيجة" value={`${child.stats.bestScore}%`} highlight />
        <StatCard icon={BarChart3} label="النقاط المكتسبة" value={child.stats.totalPoints} />
      </div>

      {/* Recent Results */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <Target className="h-5 w-5 text-[#398B79]" />
          <h3 className="text-base font-black text-[#0D1B2A]">أحدث نتائج التدريب</h3>
        </div>
        
        {child.recentResults.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {child.recentResults.map(result => (
              <ResultRow key={result.id} result={result} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
            <div className="text-slate-400 mb-2">
              <Activity className="h-8 w-8" />
            </div>
            <div className="text-slate-500 font-bold text-sm">
              لم يكمل الطالب أي اختبارات حتى الآن.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, highlight }: { icon: any, label: string, value: string | number, highlight?: boolean }) {
  return (
    <div className={`p-5 rounded-2xl border ${highlight ? 'border-[#FF8A70]/30 bg-[#FFF8F2]' : 'border-slate-100 bg-slate-50'}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-4 w-4 ${highlight ? 'text-[#FF8A70]' : 'text-slate-400'}`} />
        <span className="text-xs font-black text-slate-500">{label}</span>
      </div>
      <div className={`text-2xl md:text-3xl font-black ${highlight ? 'text-[#0D1B2A]' : 'text-[#0D1B2A]'}`}>
        {value}
      </div>
    </div>
  );
}

function ResultRow({ result }: { result: TestResult }) {
  const isExcellent = result.percentage >= 85;
  const isGood = result.percentage >= 70 && result.percentage < 85;
  
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white hover:border-[#91D7C5]/50 transition-colors group">
      <div className="flex items-center gap-4">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
          isExcellent ? 'bg-[#EAF8F3] text-[#287966]' : 
          isGood ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
        }`}>
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div>
          <h4 className="font-black text-[#0D1B2A] text-sm mb-1">{result.testType}</h4>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Calendar className="h-3.5 w-3.5" />
            <span>{new Date(result.completedAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>
      <div className="text-left pl-1">
        <div className={`text-xl font-black ${
          isExcellent ? 'text-[#287966]' : 
          isGood ? 'text-blue-600' : 'text-slate-700'
        }`}>
          {Math.round(result.percentage)}%
        </div>
        <div className="text-[11px] font-bold text-slate-400 mt-0.5">
          {result.score} / {result.totalQuestions}
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="bg-slate-200 h-40 rounded-3xl w-full"></div>
      <div className="bg-white p-8 rounded-3xl border border-slate-100">
        <div className="flex items-center gap-5 mb-8">
          <div className="h-14 w-14 rounded-2xl bg-slate-200 shrink-0"></div>
          <div className="space-y-3 flex-1">
            <div className="h-5 w-48 bg-slate-200 rounded-md"></div>
            <div className="h-4 w-32 bg-slate-200 rounded-md"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-6 w-32 bg-slate-200 rounded-md mb-5"></div>
        <div className="grid gap-3 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-2xl border border-slate-50"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
