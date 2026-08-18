import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Loader2, CheckCircle2, XCircle, UserPlus, Gift, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const platformLogo = "/logo-512x512.png";

interface InviteInfo {
  valid: boolean;
  inviterName: string;
  email: string;
  subscriptionType: string;
  subscriptionEndDate?: string;
  isPermanent?: boolean;
}

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) { setError("رمز الدعوة غير صحيح"); setLoading(false); return; }
    fetch(`/api/invite/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setInviteInfo(data);
      })
      .catch(() => setError("تعذّر الاتصال بالخادم"))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async () => {
    if (!username.trim() || username.trim().length < 3) {
      return toast({ title: "خطأ", description: "اسم المستخدم يجب أن يكون 3 أحرف على الأقل", variant: "destructive" });
    }
    if (password.length < 6) {
      return toast({ title: "خطأ", description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, username: username.trim(), password, fullName: fullName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ');
      localStorage.setItem('user', JSON.stringify(data.user));
      window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: data.user }));
      setDone(true);
      toast({ title: "مرحباً بك في المنصة!", description: "تم إنشاء حسابك بنجاح" });
      setTimeout(() => navigate('/home'), 2000);
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const planLabel = (type: string) =>
    type === 'Pro Life Plus' ? 'Pro Life Plus 👑' :
    type === 'Pro Life' ? 'Pro Life 💎' :
    type === 'Pro' ? 'Pro ⭐' : type;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" dir="rtl"
      style={{ background: 'linear-gradient(160deg, #f8fafc 0%, #f1f5f9 60%, #e2e8f0 100%)' }}>

      {/* خلفية زخرفية خفيفة */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 w-[600px] h-[600px] rounded-full blur-[160px] opacity-30"
          style={{ background: 'radial-gradient(circle, #dbeafe, transparent)', transform: 'translate(-50%, -30%)' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-[120px] opacity-20"
          style={{ background: '#ede9fe' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">

        {/* الشعار */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-2xl shadow-sm border border-slate-200/80">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm">
              <img src={platformLogo} alt="قدراتك" className="w-full h-full object-cover" />
            </div>
            <div className="text-right">
              <h1 className="text-base font-black text-slate-800 leading-tight">منصة قدراتك</h1>
              <p className="text-[10px] text-slate-400 tracking-widest uppercase">Qodratak Platform</p>
            </div>
          </div>
        </div>

        {/* الكارد الرئيسية */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">

          {/* شريط علوي زخرفي */}
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)' }} />

          <div className="p-7">

            {/* حالة التحميل */}
            {loading && (
              <div className="flex flex-col items-center py-10 gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <Loader2 className="w-7 h-7 text-slate-400 animate-spin" />
                </div>
                <p className="text-slate-400 text-sm">جاري التحقق من الدعوة...</p>
              </div>
            )}

            {/* حالة الخطأ */}
            {!loading && error && (
              <div className="flex flex-col items-center py-10 gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 mb-1">الدعوة غير صالحة</h2>
                  <p className="text-sm text-slate-500">{error}</p>
                </div>
                <Button onClick={() => navigate('/')} variant="outline"
                  className="mt-1 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
                  العودة للرئيسية
                </Button>
              </div>
            )}

            {/* حالة النجاح */}
            {!loading && done && (
              <div className="flex flex-col items-center py-10 gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 mb-1">تم إنشاء حسابك بنجاح!</h2>
                  <p className="text-sm text-slate-400">سيتم توجيهك إلى المنصة...</p>
                </div>
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
              </div>
            )}

            {/* نموذج التسجيل */}
            {!loading && inviteInfo && !done && (
              <>
                {/* رسالة الترحيب */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-md"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                    <Gift className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 mb-2">دعوة خاصة 🎉</h2>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    قام <span className="font-bold text-slate-700">{inviteInfo.inviterName}</span> بدعوتك للانضمام إلى منصة قدراتك
                  </p>
                </div>

                {/* بادج الاشتراك */}
                <div className="rounded-2xl p-4 mb-5 text-center border border-teal-400"
                  style={{ background: 'linear-gradient(135deg, #eef2ff, #f5f3ff)' }}>
                  <p className="text-slate-400 text-xs mb-1.5 uppercase tracking-wide">ستحصل على اشتراك</p>
                  <p className="text-teal-700 text-xl font-black">{planLabel(inviteInfo.subscriptionType)}</p>
                  {inviteInfo.isPermanent ? (
                    <span className="inline-block mt-2 text-[11px] bg-teal-100 text-teal-700 px-2.5 py-0.5 rounded-full font-medium">مدى الحياة ♾️</span>
                  ) : inviteInfo.subscriptionEndDate ? (
                    <span className="inline-block mt-2 text-[11px] bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full font-medium">
                      حتى {new Date(inviteInfo.subscriptionEndDate).toLocaleDateString('ar-SA')}
                    </span>
                  ) : null}
                </div>

                {/* البريد الإلكتروني */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-slate-500 text-xs">@</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">البريد الإلكتروني</p>
                    <p className="text-slate-700 text-sm font-medium" dir="ltr">{inviteInfo.email}</p>
                  </div>
                </div>

                {/* فاصل */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-slate-100" />
                  <span className="text-xs text-slate-400">أنشئ حسابك</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                {/* الحقول */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-600 text-xs font-semibold mb-1.5 block">الاسم الكامل</Label>
                    <Input
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="اسمك الكامل"
                      className="h-11 rounded-xl border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-300 focus:border-teal-400 focus:ring-teal-500/50"
                      data-testid="input-invite-fullname"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-600 text-xs font-semibold mb-1.5 block">اسم المستخدم</Label>
                    <Input
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="username"
                      dir="ltr"
                      className="h-11 rounded-xl border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-300 focus:border-teal-400 focus:ring-teal-500/50"
                      data-testid="input-invite-username"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-600 text-xs font-semibold mb-1.5 block">كلمة المرور</Label>
                    <div className="relative">
                      <Input
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        placeholder="6 أحرف على الأقل"
                        className="h-11 rounded-xl border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-300 focus:border-teal-400 focus:ring-teal-500/50 pl-10"
                        data-testid="input-invite-password"
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* زر الإرسال */}
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full mt-6 h-12 rounded-xl font-bold text-base text-white shadow-md"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}
                  data-testid="button-invite-submit"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <span className="flex items-center gap-2 justify-center">
                      <UserPlus className="w-5 h-5" />
                      إنشاء الحساب والانضمام
                    </span>
                  )}
                </Button>

                <p className="text-center text-slate-300 text-xs mt-4">
                  بإنشاء حسابك، توافق على شروط الاستخدام
                </p>
              </>
            )}

          </div>
        </div>

        {/* رابط تسجيل الدخول */}
        <p className="text-center text-slate-400 text-sm mt-5">
          لديك حساب بالفعل؟{" "}
          <button onClick={() => navigate('/login')} className="text-teal-700 font-semibold hover:text-teal-700 transition-colors">
            تسجيل الدخول
          </button>
        </p>

      </div>
    </div>
  );
}
