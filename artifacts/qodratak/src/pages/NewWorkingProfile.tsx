import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  User, Trophy, Star, Crown, Zap, Rocket, LogOut, UserPlus,
  Settings, RefreshCw, Clock, AlertTriangle, Shield, MessageCircle,
  Gift, Calendar, Fingerprint, KeyRound, CheckCircle2, Lock, Brain,
  CreditCard, CheckCircle, XCircle, Hourglass, FileText, Mail, Bell,
  TrendingUp, ExternalLink, ChevronLeft, Camera, Edit2, Save, X,
  BellOff, Download, ArrowLeft
} from "lucide-react";
import CreativeSubscriptionCountdown from "@/components/CreativeSubscriptionCountdown";
import { FreeTrialCountdown } from "@/components/FreeTrialCountdown";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import SubscriptionRenewalDialog from "@/components/SubscriptionRenewalDialog";

const GREEN = "#1a7c3e";
const GREEN_LIGHT = "#e8f5ee";

function PushSettingsCard() {
  const { permission, isSubscribed, isSupported, isLoading, subscribe, unsubscribe, sendTest } = usePushNotifications();
  const { toast } = useToast();
  const [testing, setTesting] = React.useState(false);
  const [toggling, setToggling] = React.useState(false);

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  const iosNeedsPWA = isIOS && !isStandalone;

  if (!isSupported) {
    return (
      <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
        <Bell className="w-4 h-4 shrink-0" />
        <span>{isIOS ? 'أضف الموقع لـ Home Screen أولاً لتفعيل الإشعارات' : 'المتصفح لا يدعم الإشعارات الفورية'}</span>
      </div>
    );
  }

  const handleToggle = async () => {
    setToggling(true);
    try {
      if (isSubscribed) {
        const ok = await unsubscribe();
        if (ok) toast({ title: 'تم إيقاف الإشعارات' });
        else toast({ title: 'فشل الإيقاف', variant: 'destructive' });
      } else {
        if (permission === 'denied') {
          toast({ title: 'الإشعارات محجوبة', description: 'ارفع الحجب من إعدادات المتصفح', variant: 'destructive' });
          return;
        }
        const ok = await subscribe();
        if (ok) toast({ title: '✅ تم تفعيل الإشعارات' });
        else toast({ title: 'لم تمنح إذن الإشعارات', variant: 'destructive' });
      }
    } finally {
      setToggling(false);
    }
  };

  const handleTest = async () => {
    if (!isSubscribed) return;
    setTesting(true);
    try {
      const ok = await sendTest('general');
      if (ok) toast({ title: '🔔 تم إرسال إشعار تجريبي' });
      else toast({ title: 'فشل إرسال الإشعار', variant: 'destructive' });
    } finally {
      setTesting(false);
    }
  };

  if (iosNeedsPWA) {
    return (
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800 leading-relaxed">
        <strong>📱 iPhone:</strong> افتح Safari ← اضغط Share ← اختر «Add to Home Screen» ثم افتح التطبيق من الشاشة الرئيسية لتفعيل الإشعارات.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-800">
            {isSubscribed ? '✅ الإشعارات مفعّلة' : permission === 'denied' ? '🚫 محجوبة' : '🔕 غير مفعّلة'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {isSubscribed ? 'تصلك تذكيرات الدراسة حتى وإن أُغلق التطبيق' : 'فعّل للحصول على تذكيرات الاختبارات'}
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleToggle}
          disabled={toggling || isLoading || permission === 'denied'}
          className={isSubscribed ? "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200" : "text-white"}
          style={!isSubscribed ? { background: GREEN } : undefined}
          data-testid="button-toggle-push"
        >
          {toggling || isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : isSubscribed ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
          <span className="mr-1 text-xs">{isSubscribed ? 'إيقاف' : 'تفعيل'}</span>
        </Button>
      </div>
      {isSubscribed && (
        <Button size="sm" variant="outline" onClick={handleTest} disabled={testing} className="w-full text-xs border-gray-200" data-testid="button-test-push">
          {testing ? <RefreshCw className="w-3 h-3 ml-1 animate-spin" /> : <Bell className="w-3 h-3 ml-1" />}
          إرسال إشعار تجريبي
        </Button>
      )}
    </div>
  );
}

export default function NewWorkingProfile() {
  const { toast } = useToast();
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const { data: serverUser, isLoading, refetch } = useQuery<any>({ queryKey: ['/api/user'], retry: false, staleTime: 0 });
  const { data: mySubscriptions = [] } = useQuery<any[]>({ queryKey: ['/api/user/my-subscriptions'], retry: false, staleTime: 60000, enabled: true });
  const { data: securityStatus, refetch: refetchSecurity } = useQuery<any>({ queryKey: ['/api/auth/security-status'], retry: false, staleTime: 0 });

  const downloadInvoice = (sub: any) => {
    const planLabel = sub.type === 'Pro' ? 'عضوية برو (شهر)' : sub.type === 'Pro Life' ? 'برو (3 أشهر)' : sub.type === 'Pro Life Plus' ? 'برو بلس (6 أشهر)' : sub.type;
    const statusLabel = sub.status === 'active' ? 'نشط' : sub.status === 'pending' ? 'قيد المراجعة' : 'ملغى';
    const payLabel = sub.paymentMethod === 'bank' ? 'تحويل بنكي' : sub.paymentMethod === 'wallet' ? 'محفظة قدراتك' : sub.paymentMethod === 'card' ? 'بطاقة قدراتك باي' : sub.paymentMethod || '—';
    const startDate = sub.startDate ? new Date(sub.startDate).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
    const endDate = sub.endDate ? new Date(sub.endDate).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
    const createdDate = sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
    const invoiceNo = `QDR-${String(sub._id || Date.now()).slice(-8).toUpperCase()}`;
    const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>فاتورة ${invoiceNo}</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Arial,sans-serif;background:#f0f4f8;padding:40px;direction:rtl;}.invoice{background:#fff;max-width:700px;margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10);}.header{background:#1a7c3e;color:#fff;padding:32px 40px;display:flex;justify-content:space-between;align-items:center;}.header h1{font-size:28px;font-weight:900;}.header p{font-size:13px;opacity:.85;margin-top:4px;}.invoice-no{text-align:left;}.invoice-no span{font-size:20px;font-weight:700;background:rgba(255,255,255,.2);padding:6px 16px;border-radius:8px;}.section{padding:32px 40px;border-bottom:1px solid #e5e7eb;}.section-title{font-size:13px;text-transform:uppercase;color:#6b7280;font-weight:700;margin-bottom:16px;letter-spacing:1px;}.row{display:flex;justify-content:space-between;margin-bottom:12px;}.label{color:#6b7280;font-size:14px;}.value{color:#111827;font-weight:600;font-size:14px;}.plan-row{background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px 24px;display:flex;justify-content:space-between;align-items:center;}.plan-name{font-size:18px;font-weight:800;color:#1a7c3e;}.plan-price{font-size:28px;font-weight:900;color:#111827;}.plan-price span{font-size:14px;font-weight:500;color:#6b7280;}.status-badge{display:inline-block;padding:4px 14px;border-radius:99px;font-size:12px;font-weight:700;}.status-active{background:#dcfce7;color:#16a34a;}.status-pending{background:#fef3c7;color:#d97706;}.status-other{background:#f3f4f6;color:#6b7280;}.footer{padding:24px 40px;background:#f9fafb;text-align:center;}.footer p{color:#9ca3af;font-size:12px;}@media print{body{background:#fff;padding:0;}.invoice{box-shadow:none;}}</style></head><body><div class="invoice"><div class="header"><div><h1>🧠 منصة قدراتك</h1><p>Qodratak Platform · qodratak.sa</p></div><div class="invoice-no"><div style="font-size:12px;opacity:.8;margin-bottom:4px">رقم الفاتورة</div><span>${invoiceNo}</span></div></div><div class="section"><div class="section-title">بيانات الطالب</div><div class="row"><span class="label">الاسم</span><span class="value">${serverUser?.name || '—'}</span></div><div class="row"><span class="label">البريد الإلكتروني</span><span class="value">${serverUser?.email || '—'}</span></div><div class="row"><span class="label">تاريخ الفاتورة</span><span class="value">${createdDate}</span></div></div><div class="section"><div class="section-title">تفاصيل الاشتراك</div><div class="plan-row"><div><div class="plan-name">⭐ ${planLabel}</div></div><div class="plan-price">${sub.price || 0} <span>ر.س</span></div></div><div style="margin-top:16px"><div class="row"><span class="label">تاريخ البداية</span><span class="value">${startDate}</span></div><div class="row"><span class="label">تاريخ الانتهاء</span><span class="value">${endDate}</span></div><div class="row"><span class="label">طريقة الدفع</span><span class="value">${payLabel}</span></div><div class="row"><span class="label">الحالة</span><span class="value"><span class="status-badge ${sub.status === 'active' ? 'status-active' : sub.status === 'pending' ? 'status-pending' : 'status-other'}">${statusLabel}</span></span></div></div></div><div class="footer"><p>شكراً لثقتك بمنصة قدراتك · هذه الفاتورة صادرة إلكترونياً ولا تحتاج إلى ختم</p><p style="margin-top:4px">للاستفسار: support@qodratak.sa</p></div></div><script>window.onload=()=>{window.print();}</script></body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `فاتورة-${invoiceNo}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: '✅ جاري تحميل الفاتورة', description: 'افتح الملف في المتصفح ثم اضغط طباعة لحفظها PDF' });
  };

  const [pinValue, setPinValue] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinSet, setPinSet] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<{ email: string; status: 'pending' | 'accepted' } | null>(null);
  const [biometricRegistered, setBiometricRegistered] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  // ── sync security status from server ──
  useEffect(() => {
    if (securityStatus) {
      setPinSet(!!securityStatus.hasPIN);
      if (securityStatus.hasBiometric) {
        setBiometricRegistered(true);
        localStorage.setItem('biometricRegistered', 'true');
      }
    }
  }, [securityStatus]);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchInviteStatus = async () => {
      try {
        const res = await fetch('/api/invite/status/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.guestInvite) setInviteStatus({ email: data.guestInvite.email, status: data.guestInvite.status });
        }
      } catch {}
    };
    fetchInviteStatus();
  }, []);

  const handleSendInvite = async () => {
    if (!inviteEmail.includes('@')) { toast({ title: 'خطأ', description: 'أدخل بريد إلكتروني صحيح', variant: 'destructive' }); return; }
    setInviteSending(true);
    try {
      const res = await fetch('/api/invite/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email: inviteEmail }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطأ');
      setInviteStatus({ email: inviteEmail, status: 'pending' });
      setInviteEmail('');
      toast({ title: 'تم الإرسال!', description: 'تم إرسال الدعوة إلى ' + inviteEmail });
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    } finally { setInviteSending(false); }
  };

  useEffect(() => {
    const checkBiometric = async () => {
      if (window.PublicKeyCredential) {
        try { const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(); setBiometricAvailable(available); } catch { setBiometricAvailable(false); }
      }
      setBiometricRegistered(localStorage.getItem('biometricRegistered') === 'true');
    };
    checkBiometric();
  }, []);

  const handleSetPin = async () => {
    if (!pinValue || pinValue.length !== 6 || !/^\d{6}$/.test(pinValue)) { toast({ title: 'خطأ', description: 'الرمز يجب أن يكون 6 أرقام', variant: 'destructive' }); return; }
    if (pinValue !== pinConfirm) { toast({ title: 'خطأ', description: 'الرمزان غير متطابقان', variant: 'destructive' }); return; }
    setPinLoading(true);
    try {
      const res = await fetch('/api/auth/set-pin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ pin: pinValue }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `خطأ ${res.status}`);
      if (data.success) {
        setPinSet(true);
        setPinValue('');
        setPinConfirm('');
        toast({ title: '✅ تم تعيين الرمز السري بنجاح' });
        refetchSecurity();
      } else throw new Error(data.error);
    } catch (e: any) { toast({ title: 'خطأ', description: e.message || 'فشل في تعيين الرمز', variant: 'destructive' }); }
    finally { setPinLoading(false); }
  };

  const handleRegisterBiometric = async () => {
    if (!currentUser) { toast({ title: 'خطأ', description: 'يجب تسجيل الدخول أولاً', variant: 'destructive' }); return; }
    if (window.top !== window.self) { window.open(window.location.href, '_blank'); return; }
    if (!window.isSecureContext) { toast({ title: 'اتصال غير آمن', description: 'البصمة تتطلب اتصال HTTPS', variant: 'destructive' }); return; }
    setBiometricLoading(true);
    try {
      const userId = String(currentUser.id || currentUser._id);
      const username = currentUser.username || currentUser.email;
      const optRes = await fetch('/api/auth/webauthn/register-options', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ userId, username }) });
      if (!optRes.ok) { const err = await optRes.json(); throw new Error(err.error || 'فشل الحصول على خيارات التسجيل'); }
      const options = await optRes.json();
      const { startRegistration } = await import('@simplewebauthn/browser');
      const credential = await startRegistration({ optionsJSON: options });
      const verRes = await fetch('/api/auth/webauthn/register-verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ userId, response: credential }) });
      const verData = await verRes.json();
      if (verData.success || verData.verified) {
        setBiometricRegistered(true);
        localStorage.setItem('biometricRegistered', 'true');
        toast({ title: '✅ تم تسجيل البصمة بنجاح' });
        refetchSecurity();
      } else throw new Error(verData.error || 'فشل التحقق من البصمة');
    } catch (e: any) {
      if (e.name === 'NotAllowedError' || e.name === 'AbortError') {
        const msg = (e.message || '').toLowerCase();
        if (msg.includes('top-level') || msg.includes('frame')) toast({ title: 'افتح في نافذة مستقلة', description: 'افتح رابط التطبيق مباشرةً في المتصفح', variant: 'destructive' });
        else if (msg.includes('dismiss') || msg.includes('cancel')) toast({ title: 'تم الإلغاء' });
        else toast({ title: 'تعذّر تسجيل البصمة', description: 'فعّل البصمة في إعدادات جهازك', variant: 'destructive' });
      } else { toast({ title: 'خطأ', description: e.message || 'فشل في تسجيل البصمة', variant: 'destructive' }); }
    } finally { setBiometricLoading(false); }
  };

  useEffect(() => {
    if (serverUser) window.dispatchEvent(new CustomEvent('serverUserUpdated', { detail: serverUser }));
  }, [serverUser]);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      if (response.ok) {
        localStorage.clear(); sessionStorage.clear();
        document.cookie.split(";").forEach(c => { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); });
        window.dispatchEvent(new CustomEvent('userLoggedOut'));
        window.location.href = "/profile";
      }
    } catch {}
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch('/api/user/upload-avatar', { method: 'POST', credentials: 'include', body: formData });
      const data = await res.json();
      if (data.success) { setLocalAvatarUrl(data.avatarUrl); toast({ title: 'تم رفع الصورة' }); refetch(); }
      else toast({ title: 'فشل رفع الصورة', description: data.error, variant: 'destructive' });
    } catch { toast({ title: 'خطأ في رفع الصورة', variant: 'destructive' }); }
    finally { setAvatarUploading(false); }
  };

  const isLoggedIn = !!serverUser;
  const currentUser = serverUser;
  const subscriptionType = currentUser?.subscription?.type || 'free';
  const premiumTypes = ['Pro', 'Pro Life', 'Pro Life Plus', 'Pro Live', 'free_trial'];
  const isPremium = premiumTypes.includes(subscriptionType);
  const displayAvatarUrl = localAvatarUrl || currentUser?.avatarUrl;

  const subLabel = subscriptionType === 'free_trial' ? 'تجربة مجانية' : subscriptionType === 'Pro' ? 'عضوية برو' : subscriptionType === 'Pro Life Plus' ? 'برو بلس' : subscriptionType === 'Pro Life' ? 'برو (3 أشهر)' : subscriptionType === 'Pro Live' ? 'برو لايف' : 'مجاني';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin mx-auto" style={{ borderTopColor: GREEN }} />
          <p className="text-sm text-gray-500">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-sm border border-gray-100">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: GREEN_LIGHT }}>
            <User className="w-8 h-8" style={{ color: GREEN }} />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">مرحباً بك في قدراتك</h2>
          <p className="text-sm text-gray-500 mb-6">سجّل دخولك أو أنشئ حساباً للبدء</p>
          <Link href="/login">
            <Button className="w-full mb-3 text-white font-bold h-12 rounded-2xl" style={{ background: GREEN }} data-testid="button-login">تسجيل الدخول</Button>
          </Link>
          <Link href="/signup">
            <Button variant="outline" className="w-full h-12 rounded-2xl font-bold border-gray-200" data-testid="button-signup">إنشاء حساب جديد</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* ── بطاقة الملف الشخصي ─────────────────────────────── */}
        <div className="rounded-3xl overflow-hidden shadow-sm" style={{ background: GREEN }}>
          <div className="p-5">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <label htmlFor="avatar-upload" className="cursor-pointer block">
                  <div className="w-18 h-18 w-[72px] h-[72px] rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center overflow-hidden">
                    {displayAvatarUrl ? (
                      <img src={displayAvatarUrl} alt="صورتك" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-black text-white">
                        {(currentUser.name || currentUser.username || 'U')[0].toUpperCase()}
                      </span>
                    )}
                    <div className="absolute inset-0 rounded-2xl bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      {avatarUploading ? <RefreshCw className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                    </div>
                  </div>
                </label>
                <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={avatarUploading} />
                {isPremium && (
                  <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-amber-400 rounded-lg flex items-center justify-center border-2 border-white">
                    <Crown className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-black text-white truncate">{currentUser.name || currentUser.username}</h1>
                <p className="text-white/70 text-xs flex items-center gap-1 mt-0.5 truncate">
                  <Mail className="w-3 h-3 shrink-0" />
                  {currentUser.email}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                    {isPremium ? `⭐ ${subLabel}` : '🆓 مجاني'}
                  </span>
                  {mySubscriptions.some((s: any) => s.status === 'pending') && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-400 text-amber-900">⏳ طلب قيد المراجعة</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 border-t border-white/20">
            {[
              { icon: <Trophy className="w-4 h-4" />, val: currentUser.points || 0, label: 'نقطة' },
              { icon: <Zap className="w-4 h-4" />, val: `${currentUser.averageScore || 0}%`, label: 'متوسط' },
              { icon: <Rocket className="w-4 h-4" />, val: currentUser.testsTaken || 0, label: 'اختبار' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center py-3 border-r border-white/20 last:border-r-0">
                <div className="text-white/60 mb-0.5">{item.icon}</div>
                <div className="text-base font-black text-white">{item.val}</div>
                <div className="text-[11px] text-white/60">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── تنبيه التجربة أو الاشتراك ─────────────────────── */}
        {currentUser.freeTrialData?.isActive && (
          <FreeTrialCountdown user={currentUser} onUpgrade={() => setSubscriptionDialogOpen(true)} />
        )}
        {isPremium && subscriptionType !== 'free_trial' && <CreativeSubscriptionCountdown onRenew={() => setSubscriptionDialogOpen(true)} />}

        {/* ── إدارة الحساب ────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-50">
            <h2 className="text-sm font-black text-gray-700 flex items-center gap-2">
              <Settings className="w-4 h-4" style={{ color: GREEN }} />
              إدارة الحساب
            </h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between py-2 px-3 rounded-2xl" style={{ background: GREEN_LIGHT }}>
              <div>
                <p className="text-xs text-gray-500">نوع الاشتراك</p>
                <p className="text-sm font-bold text-gray-800">{subLabel}</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ background: isPremium ? GREEN : '#6b7280' }}>
                {isPremium ? 'مميز ⭐' : 'مجاني'}
              </span>
            </div>

              <Button onClick={() => setSubscriptionDialogOpen(true)} className="w-full h-11 rounded-2xl font-bold text-white text-sm" style={{ background: isPremium ? '#f59e0b' : GREEN }} data-testid="button-upgrade">
                <Crown className="w-4 h-4 ml-2" />
                {isPremium ? 'تجديد الاشتراك' : 'ترقية حسابك الآن'}
              </Button>

            <button
              onClick={handleLogout}
              className="w-full h-11 rounded-2xl font-bold text-sm border-2 border-red-100 text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </button>
          </div>
        </div>

        {/* ── دعوة طالب (للمشتركين) ───────────────────────────── */}
        {isPremium && subscriptionType !== 'free_trial' && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50">
              <h2 className="text-sm font-black text-gray-700 flex items-center gap-2">
                <Gift className="w-4 h-4" style={{ color: GREEN }} />
                دعوة طالب مجاناً
              </h2>
            </div>
            <div className="p-4">
              {inviteStatus?.status === 'accepted' ? (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-green-50 border border-green-200">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-sm font-bold text-gray-800">تم قبول دعوتك!</p>
                    <p className="text-xs text-gray-500" dir="ltr">{inviteStatus.email}</p>
                  </div>
                </div>
              ) : inviteStatus?.status === 'pending' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-50 border border-amber-200">
                    <Mail className="w-4 h-4 text-amber-500" />
                    <div>
                      <p className="text-sm font-bold text-gray-700">الدعوة في الانتظار</p>
                      <p className="text-xs text-gray-400" dir="ltr">{inviteStatus.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="بريد إلكتروني جديد" dir="ltr" className="h-10 rounded-xl text-sm" data-testid="input-invite-email" />
                    <Button onClick={handleSendInvite} disabled={inviteSending} size="sm" className="h-10 px-4 rounded-xl text-white text-xs shrink-0" style={{ background: GREEN }} data-testid="button-send-invite">
                      {inviteSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'إرسال'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 leading-relaxed">كمشترك مميز، يمكنك دعوة <strong>طالب واحد</strong> للاستفادة من نفس اشتراكك مجاناً</p>
                  <div className="flex gap-2">
                    <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendInvite()} placeholder="أدخل بريد الطالب المدعو" dir="ltr" className="h-11 rounded-xl text-sm" data-testid="input-invite-email" />
                    <Button onClick={handleSendInvite} disabled={inviteSending} className="h-11 px-5 rounded-xl text-white font-bold text-sm shrink-0" style={{ background: GREEN }} data-testid="button-send-invite">
                      {inviteSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4" />&nbsp;دعوة</>}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── سجل الاشتراكات ─────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-50">
            <h2 className="text-sm font-black text-gray-700 flex items-center gap-2">
              <CreditCard className="w-4 h-4" style={{ color: GREEN }} />
              سجل الاشتراكات
            </h2>
          </div>
          <div className="p-4">
            {mySubscriptions.length === 0 ? (
              <div className="text-center py-6">
                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-400 mb-3">لا توجد طلبات اشتراك بعد</p>
                  <Button size="sm" onClick={() => setSubscriptionDialogOpen(true)} className="rounded-xl text-white text-xs" style={{ background: GREEN }}>
                    <Crown className="w-3 h-3 ml-1" /> اشترك الآن
                  </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {mySubscriptions.map((sub: any, idx: number) => {
                  const isPending = sub.status === 'pending';
                  const isActive = sub.status === 'active';
                  const isCancelled = sub.status === 'cancelled' || sub.status === 'expired';
                  const createdDate = sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
                  const startDate = sub.startDate ? new Date(sub.startDate).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
                  const endDate = sub.endDate ? new Date(sub.endDate).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
                  const planName = sub.type === 'Pro' ? 'عضوية برو' : sub.type === 'Pro Life' ? 'برو (3 أشهر)' : sub.type === 'Pro Life Plus' ? 'برو بلس' : sub.type;

                  return (
                    <div key={sub._id || idx} className={`rounded-2xl p-3 border ${isActive ? 'bg-green-50 border-green-200' : isPending ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isActive ? 'bg-green-500' : isPending ? 'bg-amber-500' : 'bg-gray-400'}`}>
                            {isActive ? <CheckCircle className="w-4 h-4 text-white" /> : isPending ? <Hourglass className="w-4 h-4 text-white" /> : <XCircle className="w-4 h-4 text-white" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800">{planName}</p>
                            <p className="text-xs text-gray-400">{createdDate}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-green-100 text-green-700' : isPending ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-500'}`}>
                          {isActive ? '✅ نشط' : isPending ? '⏳ قيد المراجعة' : '❌ ملغى'}
                        </span>
                      </div>
                      {isActive && (
                        <div className="grid grid-cols-2 gap-x-4 text-xs text-gray-500 mt-1">
                          <span>البداية: {startDate}</span>
                          <span>النهاية: {endDate}</span>
                        </div>
                      )}
                      {isCancelled && sub.rejectionReason && (
                        <p className="text-xs text-red-500 mt-1 bg-red-50 rounded-lg px-2 py-1">سبب الرفض: {sub.rejectionReason}</p>
                      )}
                      {(isActive || isCancelled) && (
                        <button onClick={() => downloadInvoice(sub)} className="flex items-center gap-1 text-xs mt-2 pt-2 border-t border-gray-200/60 font-semibold" style={{ color: GREEN }} data-testid={`button-download-invoice-${sub._id || idx}`}>
                          <Download className="w-3 h-3" /> تحميل الفاتورة
                        </button>
                      )}
                    </div>
                  );
                })}
                <Button size="sm" variant="outline" onClick={() => setSubscriptionDialogOpen(true)} className="w-full border-dashed text-xs mt-1 rounded-xl" style={{ borderColor: GREEN, color: GREEN }}>
                    <Crown className="w-3 h-3 ml-1" /> تجديد أو رفع مستوى الاشتراك
                  </Button>
              </div>
            )}
          </div>
        </div>

        {/* ── الأمان والدخول السريع ───────────────────────────── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-50">
            <h2 className="text-sm font-black text-gray-700 flex items-center gap-2">
              <Shield className="w-4 h-4" style={{ color: GREEN }} />
              الأمان والدخول السريع
            </h2>
          </div>
          <div className="p-4 space-y-4">
            {/* Biometric */}
            <div className="rounded-2xl border p-3 space-y-3" style={{ borderColor: biometricRegistered ? '#bbf7d0' : '#e5e7eb', background: biometricRegistered ? '#f0fdf4' : '#f9fafb' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: biometricRegistered ? GREEN : '#e5e7eb' }}>
                    <Fingerprint className="w-5 h-5" style={{ color: biometricRegistered ? 'white' : '#9ca3af' }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">الدخول بالبصمة</p>
                    <p className="text-xs text-gray-500">{biometricAvailable ? 'يدعم Face ID والبصمة' : 'الجهاز لا يدعم البصمة'}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${biometricRegistered ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {biometricRegistered ? '✓ مُفعَّل' : 'غير مُفعَّل'}
                </span>
              </div>
              {biometricAvailable ? (
                window.top !== window.self ? (
                  <button onClick={handleRegisterBiometric} className="w-full py-2 rounded-xl text-xs font-bold border border-amber-200 bg-amber-50 text-amber-700 flex items-center justify-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5" /> افتح في نافذة مستقلة
                  </button>
                ) : (
                  <button onClick={handleRegisterBiometric} disabled={biometricLoading} className="w-full py-2 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: GREEN }}>
                    {biometricLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
                    {biometricLoading ? 'جارٍ التسجيل...' : biometricRegistered ? 'تحديث البصمة' : 'تسجيل البصمة'}
                  </button>
                )
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>جهازك لا يدعم البصمة — استخدم الرمز السري</span>
                </div>
              )}
            </div>

            {/* PIN */}
            <div className="rounded-2xl border p-3 space-y-3" style={{ borderColor: pinSet ? '#bbf7d0' : '#e5e7eb', background: pinSet ? '#f0fdf4' : '#f9fafb' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: pinSet ? GREEN : '#e5e7eb' }}>
                    <KeyRound className="w-5 h-5" style={{ color: pinSet ? 'white' : '#9ca3af' }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">الرمز السري (PIN)</p>
                    <p className="text-xs text-gray-500">6 أرقام للدخول السريع</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pinSet ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {pinSet ? '✓ مُعيَّن' : 'لم يُعيَّن'}
                </span>
              </div>
              <div className="space-y-2">
                <input type="password" inputMode="numeric" maxLength={6} placeholder="رمز من 6 أرقام" value={pinValue} onChange={e => setPinValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full h-10 px-4 rounded-xl border border-gray-200 bg-white text-center tracking-widest text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': GREEN } as any} dir="ltr" data-testid="input-pin" />
                <input type="password" inputMode="numeric" maxLength={6} placeholder="أعد إدخال الرمز للتأكيد" value={pinConfirm} onChange={e => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full h-10 px-4 rounded-xl border border-gray-200 bg-white text-center tracking-widest text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': GREEN } as any} dir="ltr" data-testid="input-pin-confirm" />
                {pinValue.length === 6 && pinConfirm.length === 6 && pinValue !== pinConfirm && (
                  <p className="text-xs text-red-500 text-center">الرمزان غير متطابقان</p>
                )}
                <button onClick={handleSetPin} disabled={pinLoading || pinValue.length < 6 || pinConfirm.length < 6 || pinValue !== pinConfirm}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: GREEN }}>
                  {pinLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  {pinLoading ? 'جارٍ الحفظ...' : pinSet ? 'تحديث الرمز السري' : 'تعيين الرمز السري'}
                </button>
              </div>
            </div>

            {/* Advanced security link */}
            <Link href="/security-settings">
              <div className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" data-testid="link-security-settings">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: GREEN }}>
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-700">إعدادات الأمان المتقدمة</p>
                    <p className="text-xs text-gray-400">TOTP · Push Approval · عبارة الاسترداد</p>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-gray-400" />
              </div>
            </Link>
          </div>
        </div>

        {/* ── إشعارات الجهاز ─────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-50">
            <h2 className="text-sm font-black text-gray-700 flex items-center gap-2">
              <Bell className="w-4 h-4" style={{ color: GREEN }} />
              إشعارات الجهاز
            </h2>
          </div>
          <div className="p-4">
            <PushSettingsCard />
          </div>
        </div>

        {/* ── زر مغادرة ────────────────────────────────────────── */}
        <div className="h-6" />
      </div>
      <SubscriptionRenewalDialog
        open={subscriptionDialogOpen}
        onOpenChange={setSubscriptionDialogOpen}
        user={currentUser}
      />
    </div>
  );
}
