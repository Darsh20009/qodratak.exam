import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Apple,
  Check,
  ChevronLeft,
  CreditCard,
  Crown,
  Loader2,
  WalletCards,
  X,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CHECKOUT_URL = "https://www.paypal.com/ncp/payment/XZWPA8WLMNDGS";

type PaymentMethod = "wallet" | "card" | "applepay";

interface SubscriptionRenewalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: any;
}

function formatDate(value?: string | Date | null) {
  if (!value) return "لا يوجد اشتراك فعال";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "لا يوجد اشتراك فعال";
  return date.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function dateFrom(value?: string | Date | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function SubscriptionRenewalDialog({
  open,
  onOpenChange,
  user,
}: SubscriptionRenewalDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [method, setMethod] = useState<PaymentMethod>("wallet");
  const [checkoutStarted, setCheckoutStarted] = useState(false);

  const { data: plan, isLoading: planLoading } = useQuery<any>({
    queryKey: ["/api/subscription/plan"],
    enabled: open,
    staleTime: 60_000,
  });
  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useQuery<any[]>({
    queryKey: ["/api/user/my-subscriptions"],
    enabled: open,
    staleTime: 30_000,
  });
  const { data: walletData, isLoading: walletLoading } = useQuery<any>({
    queryKey: ["/api/wallet"],
    enabled: open,
    staleTime: 30_000,
  });

  const activeSubscription = useMemo(() => {
    const active = subscriptions
      .filter((item) => item?.status === "active")
      .sort((a, b) => {
        const aDate = dateFrom(a?.endDate)?.getTime() || 0;
        const bDate = dateFrom(b?.endDate)?.getTime() || 0;
        return bDate - aDate;
      })[0];
    return active || null;
  }, [subscriptions]);

  const currentEndDate = dateFrom(
    activeSubscription?.endDate ||
      user?.subscription?.endDate ||
      user?.subscriptionExpiry,
  );
  const durationDays = Number(plan?.durationDays) || 90;
  const price = Number(plan?.priceSar) || 39;
  const nextEndDate = useMemo(() => {
    const base = currentEndDate && currentEndDate.getTime() > Date.now()
      ? new Date(currentEndDate)
      : new Date();
    base.setDate(base.getDate() + durationDays);
    return base;
  }, [currentEndDate, durationDays]);
  const walletBalance = Number(walletData?.wallet?.balance ?? walletData?.balance ?? 0);
  const hasPending = subscriptions.some((item) => item?.status === "pending");

  const walletMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/subscription/pay-with-wallet", {
        planKey: "pro",
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم تمديد الاشتراك",
        description: `اشتراكك فعال حتى ${formatDate(nextEndDate)}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/my-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "تعذر إتمام الدفع بالمحفظة",
        description: error.message.replace(/^\d+:\s*/, ""),
        variant: "destructive",
      });
    },
  });

  const requestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/subscription/subscribe-request", {
        planKey: "pro",
        paymentMethod: method,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم تسجيل طلب الاشتراك",
        description: "سيظهر التفعيل بعد تأكيد عملية الدفع ومراجعة الطلب.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/my-subscriptions"] });
      setCheckoutStarted(false);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "تعذر تسجيل طلب الاشتراك",
        description: error.message.replace(/^\d+:\s*/, ""),
        variant: "destructive",
      });
    },
  });

  const close = (nextOpen: boolean) => {
    if (!nextOpen) {
      setMethod("wallet");
      setCheckoutStarted(false);
    }
    onOpenChange(nextOpen);
  };

  const startExternalCheckout = () => {
    setCheckoutStarted(true);
    window.open(CHECKOUT_URL, "_blank", "noopener,noreferrer");
  };

  const isLoading = planLoading || subscriptionsLoading || walletLoading;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        dir="rtl"
        className="w-[calc(100vw-1.5rem)] max-w-md overflow-hidden rounded-[1.75rem] border-[#E5E7EB] bg-[#F7F4EE] p-0 text-[#0D1B2A] shadow-2xl"
      >
        <DialogHeader className="relative overflow-hidden bg-[#0D1B2A] px-5 pb-5 pt-6 text-right text-white">
          <div className="absolute -left-10 -top-12 h-32 w-32 rounded-full bg-[#F7F775]/15 blur-2xl" />
          <button
            type="button"
            onClick={() => close(false)}
            className="absolute left-4 top-4 rounded-full p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F7F775] text-[#0D1B2A]">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-white">تمديد اشتراكك</DialogTitle>
              <DialogDescription className="mt-1 text-xs font-medium text-white/65">
                خطة واحدة واضحة، ودفع سريع من مكانك
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-[#0D1B2A]" />
          </div>
        ) : (
          <div className="max-h-[72vh] space-y-4 overflow-y-auto p-5">
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-[#94A3B8]">الخطة الحالية</p>
                  <h3 className="mt-1 text-lg font-black">{plan?.name || "خطة قدراتك"}</h3>
                </div>
                <div className="text-left">
                  <p className="text-2xl font-black">{price} <span className="text-xs font-bold">ر.س</span></p>
                  <p className="text-[11px] font-bold text-[#94A3B8]">{durationDays} يومًا</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-[#F7F4EE] p-3">
                  <p className="font-bold text-[#94A3B8]">ينتهي اشتراكك الحالي</p>
                  <p className="mt-1 font-black">{formatDate(currentEndDate)}</p>
                </div>
                <div className="rounded-xl bg-[#F7F775]/35 p-3">
                  <p className="font-bold text-[#64748B]">بعد التمديد</p>
                  <p className="mt-1 font-black">{formatDate(nextEndDate)}</p>
                </div>
              </div>
            </div>

            {hasPending && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                لديك طلب اشتراك قيد المراجعة. يمكنك الدفع من جديد إذا لم يكتمل طلبك السابق.
              </div>
            )}

            <div>
              <p className="mb-2 text-sm font-black">اختر طريقة الدفع</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: "wallet", label: "المحفظة", icon: WalletCards },
                  { id: "card", label: "بطاقة", icon: CreditCard },
                  { id: "applepay", label: "Apple Pay", icon: Apple },
                ] as const).map((item) => {
                  const Icon = item.icon;
                  const selected = method === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMethod(item.id)}
                      className={`rounded-2xl border p-3 text-center transition ${
                        selected
                          ? "border-[#0D1B2A] bg-[#0D1B2A] text-white shadow-md"
                          : "border-[#E5E7EB] bg-white hover:border-[#0D1B2A]/40"
                      }`}
                    >
                      <Icon className="mx-auto mb-1 h-5 w-5" />
                      <span className="text-[11px] font-black">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {method === "wallet" ? (
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-[#64748B]">رصيد المحفظة</span>
                  <span className="font-black">{walletBalance.toLocaleString("ar-SA")} ر.س</span>
                </div>
                {walletBalance < price && (
                  <p className="mt-2 text-xs font-bold text-red-500">
                    الرصيد غير كافٍ. أضف رصيدًا للمحفظة أو اختر البطاقة.
                  </p>
                )}
                <Button
                  type="button"
                  onClick={() => walletMutation.mutate()}
                  disabled={walletBalance < price || walletMutation.isPending}
                  className="mt-4 h-11 w-full rounded-xl bg-[#0D1B2A] font-black text-white hover:bg-[#1E2938]"
                >
                  {walletMutation.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Check className="ml-2 h-4 w-4" />}
                  تأكيد الدفع بالمحفظة
                </Button>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
                <p className="text-sm font-bold leading-6">
                  {method === "applepay"
                    ? "سيتم فتح صفحة الدفع الآمنة. إذا كان جهازك يدعم Apple Pay سيظهر الخيار تلقائيًا."
                    : "ادفع بالبطاقة البنكية من صفحة الدفع الآمنة دون إدخال بيانات البطاقة داخل قدراتك."}
                </p>
                <Button
                  type="button"
                  onClick={startExternalCheckout}
                  className="mt-4 h-11 w-full rounded-xl bg-[#0D1B2A] font-black text-white hover:bg-[#1E2938]"
                >
                  {method === "applepay" ? <Apple className="ml-2 h-4 w-4" /> : <CreditCard className="ml-2 h-4 w-4" />}
                  {checkoutStarted ? "فتح صفحة الدفع مرة أخرى" : `الدفع عبر ${method === "applepay" ? "Apple Pay" : "البطاقة"}`}
                  <ChevronLeft className="mr-auto h-4 w-4" />
                </Button>
                {checkoutStarted && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => requestMutation.mutate()}
                    disabled={requestMutation.isPending}
                    className="mt-2 h-10 w-full rounded-xl border-[#0D1B2A] font-black"
                  >
                    {requestMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    أكملت الدفع — تأكيد الاشتراك
                  </Button>
                )}
                <p className="mt-3 text-center text-[11px] font-medium text-[#94A3B8]">
                  لا يتم تفعيل الاشتراك قبل تأكيد الدفع ومراجعة العملية.
                </p>
              </div>
            )}

            <p className="text-center text-[11px] font-medium leading-5 text-[#94A3B8]">
              التمديد يضيف {durationDays} يومًا إلى نهاية اشتراكك الحالي، أو يبدأ من اليوم إذا كان منتهيًا.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}