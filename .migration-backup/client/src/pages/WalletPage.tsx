import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wallet, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, TrendingUp, Clock, Mail, Send, RefreshCw, ShieldCheck, KeyRound, ChevronRight, CreditCard, Lock, Zap, Eye, EyeOff, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("ar-SA", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

function typeLabel(type: string) {
  switch (type) {
    case "credit":       return { label: "إيداع",          color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: <ArrowDownLeft className="w-4 h-4" />, sign: "+", signColor: "text-emerald-600 dark:text-emerald-400" };
    case "debit":        return { label: "خصم",            color: "bg-red-500/10 text-red-600 dark:text-red-400",             icon: <ArrowUpRight className="w-4 h-4" />, sign: "-",  signColor: "text-red-600 dark:text-red-400" };
    case "transfer_in":  return { label: "استقبال تحويل",  color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",          icon: <ArrowDownLeft className="w-4 h-4" />, sign: "+", signColor: "text-emerald-600 dark:text-emerald-400" };
    case "transfer_out": return { label: "إرسال تحويل",   color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",    icon: <ArrowUpRight className="w-4 h-4" />, sign: "-",  signColor: "text-red-600 dark:text-red-400" };
    default:             return { label: type,              color: "bg-muted text-muted-foreground",                           icon: null,                                  sign: "",   signColor: "text-foreground" };
  }
}

// ─── QODRATAK PAY CARD SECTION ───────────────────────────────
function QodratakPayCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNumber, setShowNumber] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [changePinOpen, setChangePinOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");

  const { data: card, isLoading: cardLoading } = useQuery<any>({
    queryKey: ["/api/card/my-card"],
  });

  const activateMutation = useMutation({
    mutationFn: (body: any) => apiRequest("POST", "/api/card/activate", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/card/my-card"] });
      toast({ title: "✅ تم تفعيل البطاقة", description: "بطاقة قدراتك باي جاهزة للاستخدام" });
      setActivateOpen(false); setPin("");
    },
    onError: (err: any) => toast({ title: "خطأ", description: err.message || "فشل التفعيل", variant: "destructive" }),
  });

  const changePinMutation = useMutation({
    mutationFn: (body: any) => apiRequest("POST", "/api/card/change-pin", body),
    onSuccess: () => {
      toast({ title: "✅ تم تغيير الرمز", description: "تم تحديث الرمز السري بنجاح" });
      setChangePinOpen(false); setOldPin(""); setNewPin("");
    },
    onError: (err: any) => toast({ title: "خطأ", description: err.message || "فشل تغيير الرمز", variant: "destructive" }),
  });

  const maskedNumber = (n: string) => {
    if (!n) return "";
    const parts = n.split(" ");
    if (showNumber) return n;
    return parts.map((p, i) => (i === 3 ? p : "••••")).join(" ");
  };

  if (cardLoading) {
    return (
      <Card className="rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-5 flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-teal-700" />
          <p className="text-sm text-muted-foreground">جاري تحميل البطاقة...</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      {/* Card Visual */}
      <div className="relative">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-green-600 to-amber-600 p-6 shadow-2xl select-none">
          {/* Background circles */}
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute top-4 left-4 w-20 h-20 rounded-full bg-amber-100/20 blur-xl pointer-events-none" />

          {/* Top row */}
          <div className="flex items-start justify-between mb-8 relative z-10">
            <div>
              <p className="text-white/60 text-xs mb-0.5">قدراتك باي</p>
              <p className="text-white font-black text-lg tracking-wide">QODRATAK PAY</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className={cn(
                "px-2.5 py-1 rounded-full text-xs font-bold",
                card?.isActivated
                  ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
                  : "bg-yellow-400/20 text-yellow-300 border border-yellow-400/30"
              )}>
                {card?.isActivated ? "✓ مفعّلة" : "غير مفعّلة"}
              </div>
              <Zap className="w-6 h-6 text-yellow-300 opacity-80" />
            </div>
          </div>

          {/* Card Number */}
          <div className="mb-5 relative z-10">
            <div className="flex items-center gap-3">
              <span className="text-white font-mono text-xl tracking-[0.3em] font-bold" dir="ltr">
                {maskedNumber(card?.cardNumber || "")}
              </span>
              <button
                data-testid="button-toggle-card-number"
                onClick={() => setShowNumber(v => !v)}
                className="text-white/60 hover:text-white transition-colors"
              >
                {showNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Bottom row */}
          <div className="flex items-end justify-between relative z-10">
            <div>
              <p className="text-white/50 text-[10px] uppercase mb-0.5">حامل البطاقة</p>
              <p className="text-white font-bold text-sm">{card?.cardholderName || "—"}</p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-[10px] uppercase mb-0.5">منذ</p>
              <p className="text-white/80 text-xs">
                {card?.createdAt ? new Date(card.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short" }) : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {!card?.isActivated ? (
          <Button
            data-testid="button-activate-card"
            onClick={() => setActivateOpen(true)}
            className="flex-1 bg-gradient-to-l from-teal-600 to-emerald-600 hover:from-teal-600 hover:to-emerald-600 text-white rounded-xl font-bold gap-2"
          >
            <Lock className="w-4 h-4" />
            تفعيل البطاقة برمز PIN
          </Button>
        ) : (
          <Button
            data-testid="button-change-pin"
            variant="outline"
            onClick={() => setChangePinOpen(true)}
            className="flex-1 rounded-xl gap-2 font-medium"
          >
            <Settings className="w-4 h-4" />
            تغيير الرمز السري
          </Button>
        )}
      </div>

      {!card?.isActivated && (
        <p className="text-xs text-muted-foreground text-center px-2">
          فعّل بطاقتك بضبط رمز PIN رباعي لاستخدامها في الدفع والاستقبال
        </p>
      )}

      {/* Activate Dialog */}
      <Dialog open={activateOpen} onOpenChange={v => { if (!v) { setActivateOpen(false); setPin(""); } }}>
        <DialogContent className="rounded-2xl border shadow-xl w-[calc(100vw-2rem)] max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-right">
              <div className="w-8 h-8 rounded-lg bg-teal-100/10 flex items-center justify-center">
                <Lock className="w-4 h-4 text-teal-700" />
              </div>
              تفعيل بطاقة قدراتك باي
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="bg-teal-100 dark:bg-teal-100/30 border border-teal-400 dark:border-teal-400/50 rounded-xl p-3">
              <p className="text-xs text-teal-700 dark:text-teal-700">
                اختر رمزاً سرياً مكوناً من 4 أرقام. سيُطلب منك هذا الرمز عند استخدام البطاقة للدفع.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-teal-700" />
                الرمز السري (4 أرقام)
              </label>
              <Input
                data-testid="input-card-pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="• • • •"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="rounded-xl text-center text-2xl font-mono tracking-widest h-12"
                dir="ltr"
                autoFocus
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                data-testid="button-confirm-activate"
                onClick={() => activateMutation.mutate({ pin })}
                disabled={pin.length !== 4 || activateMutation.isPending}
                className="flex-1 rounded-xl bg-gradient-to-l from-teal-600 to-emerald-600 hover:from-teal-600 hover:to-emerald-600 font-bold gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                {activateMutation.isPending ? "جاري التفعيل..." : "تفعيل البطاقة"}
              </Button>
              <Button variant="outline" onClick={() => { setActivateOpen(false); setPin(""); }} className="rounded-xl">إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change PIN Dialog */}
      <Dialog open={changePinOpen} onOpenChange={v => { if (!v) { setChangePinOpen(false); setOldPin(""); setNewPin(""); } }}>
        <DialogContent className="rounded-2xl border shadow-xl w-[calc(100vw-2rem)] max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-right">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Settings className="w-4 h-4 text-orange-600" />
              </div>
              تغيير الرمز السري
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">الرمز السري الحالي</label>
              <Input
                data-testid="input-old-pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="• • • •"
                value={oldPin}
                onChange={e => setOldPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="rounded-xl text-center text-2xl font-mono tracking-widest h-12"
                dir="ltr"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">الرمز السري الجديد</label>
              <Input
                data-testid="input-new-pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="• • • •"
                value={newPin}
                onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="rounded-xl text-center text-2xl font-mono tracking-widest h-12"
                dir="ltr"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                data-testid="button-confirm-change-pin"
                onClick={() => changePinMutation.mutate({ oldPin, newPin })}
                disabled={oldPin.length !== 4 || newPin.length !== 4 || changePinMutation.isPending}
                className="flex-1 rounded-xl bg-gradient-to-l from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-bold gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                {changePinMutation.isPending ? "جاري الحفظ..." : "حفظ الرمز الجديد"}
              </Button>
              <Button variant="outline" onClick={() => { setChangePinOpen(false); setOldPin(""); setNewPin(""); }} className="rounded-xl">إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── CARD PAYMENT DIALOG ─────────────────────────────────────
export function QodratakPayDialog({ open, onOpenChange, amount, description, onSuccess }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  amount?: number;
  description?: string;
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState<"enter" | "otp">("enter");
  const [cardNumber, setCardNumber] = useState("");
  const [pin, setPin] = useState("");
  const [payAmount, setPayAmount] = useState(amount ? String(amount) : "");
  const [otp, setOtp] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");

  const close = () => {
    onOpenChange(false);
    setStep("enter"); setCardNumber(""); setPin(""); setOtp(""); setMaskedEmail("");
  };

  const formatCardInput = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const initiateMutation = useMutation({
    mutationFn: (body: any) => apiRequest("POST", "/api/card/pay/initiate", body),
    onSuccess: (data: any) => {
      setMaskedEmail(data.maskedEmail || "");
      setStep("otp");
      toast({ title: "📧 تم إرسال الرمز", description: `أُرسل رمز التأكيد إلى صاحب البطاقة ${data.maskedEmail || ""}` });
    },
    onError: (err: any) => toast({ title: "خطأ", description: err.message || "فشل بدء عملية الدفع", variant: "destructive" }),
  });

  const confirmMutation = useMutation({
    mutationFn: (body: any) => apiRequest("POST", "/api/card/pay/confirm", body),
    onSuccess: (data: any) => {
      toast({ title: "✅ تم الدفع بنجاح", description: `تم خصم ${payAmount} ر.س من البطاقة` });
      close();
      onSuccess?.();
    },
    onError: (err: any) => toast({ title: "خطأ", description: err.message || "فشل تأكيد الدفع", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) close(); }}>
      <DialogContent className="rounded-2xl border shadow-xl w-[calc(100vw-2rem)] max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", step === "otp" ? "bg-green-500/10" : "bg-teal-100/10")}>
              {step === "otp" ? <ShieldCheck className="w-4 h-4 text-green-600" /> : <CreditCard className="w-4 h-4 text-teal-700" />}
            </div>
            {step === "otp" ? "تأكيد الدفع بالرمز" : "الدفع عبر قدراتك باي"}
          </DialogTitle>
        </DialogHeader>

        {/* Steps */}
        <div className="flex items-center gap-2 px-1">
          <div className={cn("flex items-center gap-1.5 text-xs font-medium", step === "enter" ? "text-teal-700" : "text-gray-400")}>
            <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold", step === "enter" ? "bg-teal-100 text-white" : "bg-gray-200 text-gray-500")}>١</span>
            بيانات البطاقة
          </div>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <div className={cn("flex items-center gap-1.5 text-xs font-medium", step === "otp" ? "text-green-600" : "text-gray-400")}>
            <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold", step === "otp" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500")}>٢</span>
            تأكيد الرمز
          </div>
        </div>

        {step === "enter" ? (
          <div className="space-y-4 pt-1">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">رقم البطاقة</label>
              <Input
                data-testid="input-pay-card-number"
                type="text"
                inputMode="numeric"
                placeholder="XXXX XXXX XXXX XXXX"
                value={cardNumber}
                onChange={e => setCardNumber(formatCardInput(e.target.value))}
                className="rounded-xl font-mono text-center tracking-widest"
                dir="ltr"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">الرمز السري (PIN)</label>
              <Input
                data-testid="input-pay-card-pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="• • • •"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="rounded-xl text-center text-xl font-mono tracking-widest h-11"
                dir="ltr"
              />
            </div>
            {!amount && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">المبلغ (ر.س)</label>
                <Input
                  data-testid="input-pay-amount"
                  type="number"
                  placeholder="0.00"
                  min="1"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            )}
            {amount && (
              <div className="bg-teal-100 dark:bg-teal-100/30 border border-teal-400 dark:border-teal-400/50 rounded-xl p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">المبلغ المطلوب</span>
                  <span className="font-bold text-teal-700 dark:text-teal-700">{amount} ر.س</span>
                </div>
                {description && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-muted-foreground">الوصف</span>
                    <span className="font-medium text-foreground text-xs">{description}</span>
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button
                data-testid="button-initiate-card-pay"
                onClick={() => initiateMutation.mutate({ cardNumber, pin, amount: amount || parseFloat(payAmount), description: description || 'دفع عبر قدراتك باي' })}
                disabled={cardNumber.replace(/\s/g, '').length !== 16 || pin.length !== 4 || (!amount && (!payAmount || parseFloat(payAmount) <= 0)) || initiateMutation.isPending}
                className="flex-1 rounded-xl bg-gradient-to-l from-teal-600 to-emerald-600 hover:from-teal-600 hover:to-emerald-600 font-bold gap-2"
              >
                <CreditCard className="w-4 h-4" />
                {initiateMutation.isPending ? "جاري التحقق..." : "إرسال رمز التأكيد"}
              </Button>
              <Button variant="outline" onClick={close} className="rounded-xl">إلغاء</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900/50 rounded-xl p-3 space-y-1.5">
              <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                أُرسل رمز التأكيد إلى بريد صاحب البطاقة
              </p>
              {maskedEmail && (
                <p className="text-xs text-muted-foreground" dir="ltr">{maskedEmail}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-green-600" />
                رمز التأكيد (6 أرقام)
              </label>
              <Input
                data-testid="input-pay-otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="• • • • • •"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="rounded-xl text-center text-2xl font-mono tracking-widest h-12"
                dir="ltr"
                autoFocus
              />
              <button
                onClick={() => initiateMutation.mutate({ cardNumber, pin, amount: amount || parseFloat(payAmount), description: description || 'دفع عبر قدراتك باي' })}
                disabled={initiateMutation.isPending}
                className="text-xs text-teal-700 hover:text-teal-700 mt-1.5 block underline underline-offset-2"
              >
                {initiateMutation.isPending ? "جاري إعادة الإرسال..." : "إعادة إرسال الرمز"}
              </button>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                data-testid="button-confirm-pay"
                onClick={() => confirmMutation.mutate({ cardNumber, otp })}
                disabled={otp.length !== 6 || confirmMutation.isPending}
                className="flex-1 rounded-xl bg-gradient-to-l from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 font-bold gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                {confirmMutation.isPending ? "جاري الدفع..." : "تأكيد الدفع"}
              </Button>
              <Button variant="outline" onClick={() => setStep("enter")} className="rounded-xl">رجوع</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── MAIN WALLET PAGE ─────────────────────────────────────────
export default function WalletPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [transferOpen, setTransferOpen] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [toEmail, setToEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [otp, setOtp] = useState("");

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/wallet"],
  });

  const closeTransfer = () => {
    setTransferOpen(false);
    setOtpStep(false);
    setToEmail(""); setAmount(""); setNote(""); setOtp(""); setMaskedEmail("");
  };

  const sendOtpMutation = useMutation({
    mutationFn: (body: any) => apiRequest("POST", "/api/wallet/transfer/send-otp", body),
    onSuccess: (data: any) => {
      setMaskedEmail(data.maskedEmail || "");
      setOtpStep(true);
      toast({ title: "📧 تم إرسال الرمز", description: `تحقق من بريدك الإلكتروني ${data.maskedEmail || ""}` });
    },
    onError: (err: any) => {
      toast({ title: "خطأ", description: err.message || "فشل إرسال رمز التحقق", variant: "destructive" });
    }
  });

  const transferMutation = useMutation({
    mutationFn: (body: any) => apiRequest("POST", "/api/wallet/transfer", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      toast({ title: "✅ تم التحويل بنجاح", description: `تم تحويل ${amount} ريال إلى ${toEmail}` });
      closeTransfer();
    },
    onError: (err: any) => {
      toast({ title: "خطأ", description: err.message || "فشل التحويل", variant: "destructive" });
    }
  });

  const wallet = data?.wallet;
  const transactions: any[] = data?.transactions || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <RefreshCw className="w-8 h-8 animate-spin text-green-700" />
          <p>جاري تحميل المحفظة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-8 space-y-5" dir="rtl">

      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-600 to-teal-500 flex items-center justify-center shadow-md flex-shrink-0">
          <Wallet className="w-6 h-6 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground leading-tight">محفظتي</h1>
          <p className="text-muted-foreground text-sm">رصيدك وسجل المعاملات</p>
        </div>
      </div>

      {/* Balance Card */}
      <Card className="relative overflow-hidden border-0 shadow-xl rounded-3xl bg-gradient-to-br from-green-600 via-teal-600 to-emerald-600">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
        </div>
        <CardContent className="relative p-6">
          <p className="text-white/70 text-sm mb-1">الرصيد الحالي</p>
          <div className="flex items-end gap-2 mb-5">
            <span className="text-4xl md:text-5xl font-black text-white">
              {(wallet?.balance ?? 0).toFixed(2)}
            </span>
            <span className="text-white/70 text-lg mb-1">ر.س</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5 flex-1 min-w-0">
              <TrendingUp className="w-4 h-4 text-emerald-300 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-white/60 text-xs">إجمالي المكاسب</p>
                <p className="text-white font-bold">{(wallet?.totalEarned ?? 0).toFixed(2)} ر.س</p>
              </div>
            </div>
            <Button
              data-testid="button-open-transfer"
              onClick={() => setTransferOpen(true)}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl font-bold gap-2 backdrop-blur-sm"
            >
              <Send className="w-4 h-4" />
              تحويل لصديق
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── QODRATAK PAY SECTION ─── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-white" />
          </div>
          <h2 className="font-bold text-foreground text-base">قدراتك باي</h2>
          <Badge className="bg-gradient-to-r from-teal-600/10 to-emerald-600/10 text-teal-700 dark:text-teal-700 border border-teal-400 dark:border-teal-400 text-[10px]">
            بطاقة رقمية
          </Badge>
        </div>
        <QodratakPayCard />
      </div>

      {/* Transactions List */}
      <Card className="rounded-2xl border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-bold text-foreground text-sm">سجل المعاملات</h2>
          </div>
          <Badge variant="secondary" className="text-xs">
            {transactions.length} معاملة
          </Badge>
        </div>

        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-muted-foreground gap-3">
            <Wallet className="w-10 h-10 opacity-20" />
            <p className="text-sm">لا توجد معاملات بعد</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {transactions.map((tx: any) => {
              const info = typeLabel(tx.type);
              return (
                <div key={tx._id} className="flex items-center gap-3 p-4 hover:bg-muted/20 transition-colors">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", info.color)}>
                    {info.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">
                      {tx.description || info.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={cn("font-bold text-sm", info.signColor)}>
                      {info.sign}{tx.amount} ر.س
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{info.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={v => { if (!v) closeTransfer(); }}>
        <DialogContent className="rounded-2xl border shadow-xl w-[calc(100vw-2rem)] max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-right">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", otpStep ? "bg-green-500/10" : "bg-green-100/10")}>
                {otpStep ? <ShieldCheck className="w-4 h-4 text-green-600" /> : <ArrowLeftRight className="w-4 h-4 text-green-700" />}
              </div>
              {otpStep ? "التحقق من التحويل" : "تحويل رصيد لصديق"}
            </DialogTitle>
          </DialogHeader>

          {/* Step indicators */}
          <div className="flex items-center gap-2 px-1">
            <div className={cn("flex items-center gap-1.5 text-xs font-medium", !otpStep ? "text-green-700" : "text-gray-400")}>
              <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold", !otpStep ? "bg-green-100 text-white" : "bg-gray-200 text-gray-500")}>١</span>
              تفاصيل التحويل
            </div>
            <ChevronRight className="w-3 h-3 text-gray-300" />
            <div className={cn("flex items-center gap-1.5 text-xs font-medium", otpStep ? "text-green-600" : "text-gray-400")}>
              <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold", otpStep ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500")}>٢</span>
              التحقق بالرمز
            </div>
          </div>

          {!otpStep ? (
            <div className="space-y-4 pt-1">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">البريد الإلكتروني للمستلم</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    data-testid="input-transfer-email"
                    type="email"
                    placeholder="example@email.com"
                    value={toEmail}
                    onChange={e => setToEmail(e.target.value)}
                    className="pr-9 rounded-xl"
                    dir="ltr"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">المبلغ (ر.س)</label>
                <Input
                  data-testid="input-transfer-amount"
                  type="number"
                  placeholder="0.00"
                  min="1"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="rounded-xl"
                />
                <p className="text-xs text-muted-foreground mt-1">رصيدك: {(wallet?.balance ?? 0).toFixed(2)} ر.س</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">ملاحظة (اختياري)</label>
                <Input
                  data-testid="input-transfer-note"
                  placeholder="سبب التحويل..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  data-testid="button-send-otp"
                  onClick={() => sendOtpMutation.mutate({ toEmail, amount: parseFloat(amount), note })}
                  disabled={!toEmail || !toEmail.includes('@') || !amount || parseFloat(amount) <= 0 || sendOtpMutation.isPending}
                  className="flex-1 rounded-xl bg-gradient-to-l from-green-600 to-teal-500 hover:from-green-600 hover:to-teal-500 font-bold gap-2"
                >
                  <Send className="w-4 h-4" />
                  {sendOtpMutation.isPending ? "جاري الإرسال..." : "إرسال رمز التحقق"}
                </Button>
                <Button variant="outline" onClick={closeTransfer} className="rounded-xl">إلغاء</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {/* Summary */}
              <div className="bg-green-100 dark:bg-green-100/30 border border-green-400 dark:border-green-400/50 rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">المستلم</span>
                  <span className="font-medium text-foreground" dir="ltr">{toEmail}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">المبلغ</span>
                  <span className="font-bold text-green-700 dark:text-green-700">{parseFloat(amount).toFixed(2)} ر.س</span>
                </div>
                {note && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ملاحظة</span>
                    <span className="font-medium">{note}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-green-600" />
                  رمز التحقق (6 أرقام)
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  أُرسل رمز إلى بريدك الإلكتروني <span className="font-medium text-foreground" dir="ltr">{maskedEmail}</span>
                </p>
                <Input
                  data-testid="input-transfer-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="rounded-xl text-center text-2xl font-mono tracking-widest h-12"
                  dir="ltr"
                  autoFocus
                />
                <button
                  onClick={() => sendOtpMutation.mutate({ toEmail, amount: parseFloat(amount), note })}
                  disabled={sendOtpMutation.isPending}
                  className="text-xs text-green-700 hover:text-green-700 mt-1.5 block underline underline-offset-2"
                >
                  {sendOtpMutation.isPending ? "جاري إعادة الإرسال..." : "إعادة إرسال الرمز"}
                </button>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  data-testid="button-confirm-transfer"
                  onClick={() => transferMutation.mutate({ otp })}
                  disabled={otp.length !== 6 || transferMutation.isPending}
                  className="flex-1 rounded-xl bg-gradient-to-l from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 font-bold gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {transferMutation.isPending ? "جاري التحويل..." : "تأكيد التحويل"}
                </Button>
                <Button variant="outline" onClick={() => setOtpStep(false)} className="rounded-xl">رجوع</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
