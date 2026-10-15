import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  CreditCard,
  Crown,
  Loader2,
  MessageCircle,
  WalletCards,
  X,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import GeideaCardCheckout from "@/components/GeideaCardCheckout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SUPPORT_WHATSAPP_URL = `https://wa.me/966510510140?text=${encodeURIComponent("أحتاج اشتراك لعذر مادي")}`;

type PaymentMethod = "wallet" | "card";
type SubscriptionPlan = {
  key: string;
  type: string;
  name: string;
  durationDays: number;
  priceSar: number;
  description?: string;
  features?: string[];
};

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
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [checkoutActive, setCheckoutActive] = useState(false);
  const [selectedPlanKey, setSelectedPlanKey] = useState("pro");

  const { data: planData, isLoading: planLoading } = useQuery<{ plan?: SubscriptionPlan; plans?: SubscriptionPlan[] }>({
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

  const plans = (planData?.plans || (planData?.plan ? [planData.plan] : [])) as SubscriptionPlan[];
  const paidPlans = plans.filter((item) => item.key !== "free");
  const selectedPlan = paidPlans.find((item) => item.key === selectedPlanKey) || paidPlans[0];

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
  const durationDays = Number(selectedPlan?.durationDays) || 90;
  const price = Number(selectedPlan?.priceSar) || 39;
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
        planKey: selectedPlan?.key || "pro",
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم تمديد الاشتراك",
        description: "تم تحديث تاريخ انتهاء اشتراكك.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/my-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/current-subscription"] });
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

  const close = (nextOpen: boolean) => {
    if (!nextOpen) setMethod("card");
    onOpenChange(nextOpen);
  };

  const isLoading = planLoading || subscriptionsLoading || walletLoading;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        dir="rtl"
        className="max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:left-0 max-sm:top-auto max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-t-[1.75rem] max-sm:rounded-b-none max-sm:border-b-0 max-sm:max-h-[94dvh] w-[calc(100vw-1.5rem)] max-w-lg overflow-hidden rounded-[1.75rem] border border-border bg-background p-0 text-foreground shadow-2xl"
      >
        <DialogHeader className="relative overflow-hidden bg-[#0D1B2A] px-5 pb-5 pt-6 text-right text-white">
          <div className="absolute -left-10 -top-12 h-32 w-32 rounded-full bg-[#FF8A70]/20 blur-2xl" />
          <button
            type="button"
            onClick={() => close(false)}
            className="absolute left-4 top-4 rounded-full p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF8A70] text-[#0D1B2A]">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-white">اشتراكي</DialogTitle>
              <DialogDescription className="mt-1 text-xs font-medium text-white/65">
                اشتراكك الحالي وباقة واحدة واضحة
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-[#FF8A70]" />
          </div>
        ) : (
          <div className="max-h-[calc(94dvh-6rem)] space-y-4 overflow-y-auto overscroll-contain p-4 sm:max-h-[calc(82vh-7rem)] sm:p-5">
            <div className="rounded-2xl border border-border bg-card p-4 text-card-foreground">
              <p className="text-xs font-bold text-muted-foreground">اشتراكك الحالي</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="font-black">
                  {currentEndDate ? (activeSubscription?.type || user?.subscription?.type || "خطة قدراتك") : "الحساب المجاني"}
                </p>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${currentEndDate ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                  {currentEndDate ? "نشط" : "غير مشترك"}
                </span>
              </div>
              <p className="mt-2 text-xs font-bold text-muted-foreground">
                {currentEndDate ? `ينتهي في ${formatDate(currentEndDate)}` : "يمكنك استخدام الحساب المجاني باختبار واحد يوميًا"}
              </p>
            </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-300">عندك عذر مادي؟ تواصل معنا وابشر بالخير</p>
              <a
                href={SUPPORT_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 text-xs font-black text-foreground underline underline-offset-4"
              >
                أحتاج اشتراك لعذر مادي <MessageCircle className="h-4 w-4" />
              </a>
            </div>

             <div className="space-y-2">
                    <p className="text-sm font-black">اختر الباقة</p>
               <div className="grid gap-2 sm:grid-cols-2">
                 {paidPlans.map((item) => (
                   <button
                     key={item.key}
                     type="button"
                     onClick={() => setSelectedPlanKey(item.key)}
                     disabled={checkoutActive}
                     className={`rounded-2xl border-2 p-4 text-right transition ${
                       selectedPlan?.key === item.key
                          ? "border-[#FF8A70] bg-card shadow-sm"
                          : "border-border bg-card/70 hover:border-[#FF8A70]/60"
                     }`}
                   >
                     <div className="flex items-center justify-between gap-3">
                       <div>
                          <p className="text-xs font-bold text-emerald-500">{item.name}</p>
                          <p className="mt-1 text-xs font-bold text-muted-foreground">وصول كامل لمدة {item.durationDays / 30} أشهر</p>
                       </div>
                       <div className="text-left">
                         <p className="text-2xl font-black">{item.priceSar}</p>
                          <p className="text-[11px] font-bold text-muted-foreground">ريال</p>
                       </div>
                     </div>
                   </button>
                 ))}
               </div>
              {currentEndDate && (
                  <p className="mt-3 rounded-xl border border-[#FF8A70]/30 bg-[#FF8A70]/10 p-3 text-xs font-bold">
                  تاريخ الانتهاء المتوقع بعد الشراء: {formatDate(nextEndDate)} (يُعتمد التاريخ النهائي بعد تأكيد الخادم)
                </p>
              )}
            </div>

            {hasPending && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-700 dark:text-amber-200">
                لديك طلب اشتراك قيد المراجعة. يمكنك الدفع من جديد إذا لم يكتمل طلبك السابق.
              </div>
            )}

            <div>
              <p className="mb-2 text-sm font-black">اختر طريقة الدفع</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { id: "card", label: "بطاقة", icon: CreditCard },
                  { id: "wallet", label: "المحفظة", icon: WalletCards },
                ] as const).map((item) => {
                  const Icon = item.icon;
                  const selected = method === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMethod(item.id)}
                      disabled={checkoutActive}
                      className={`rounded-2xl border p-3 text-center transition ${
                        selected
                          ? "border-[#FF8A70] bg-[#FF8A70] text-[#17202C] shadow-md"
                          : "border-border bg-card text-foreground hover:border-[#FF8A70]/60"
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
              <div className="rounded-2xl border border-border bg-card p-4 text-card-foreground">
                <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-muted-foreground">رصيد المحفظة</span>
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
                  className="mt-4 h-11 w-full rounded-xl bg-[#FF8A70] font-black text-[#17202C] hover:bg-[#ff9b83]"
                >
                  {walletMutation.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Check className="ml-2 h-4 w-4" />}
                  تأكيد الدفع بالمحفظة
                </Button>
              </div>
            ) : (
              <GeideaCardCheckout
                planKey={selectedPlan?.key || ""}
                planLabel={selectedPlan?.name || "الباقة"}
                price={price}
                onActiveChange={setCheckoutActive}
                onDone={() => close(false)}
              />
            )}

            <p className="text-center text-[11px] font-medium leading-5 text-muted-foreground">
              التمديد يضيف {durationDays} يومًا إلى نهاية اشتراكك الحالي، أو يبدأ من اليوم إذا كان منتهيًا.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}