import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, CheckCircle2, Link2, Loader2, MessageCircle, Power, RefreshCw, Send, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type Status = {
  state: "disconnected" | "connecting" | "waiting_for_qr" | "connected";
  phone: string | null;
  qrDataUrl: string | null;
  updatedAt: string;
  message: string;
  hasSavedSession: boolean;
};

async function request(path: string, body?: unknown) {
  const response = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "تعذر تنفيذ الطلب");
  return result;
}

export default function WhatsAppAdminTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [testPhone, setTestPhone] = useState("");
  const [campaignForm, setCampaignForm] = useState({
    preset: "custom",
    title: "",
    body: "",
    target: "all" as "all" | "subscribed" | "free",
  });
  const { data: status, isLoading } = useQuery<Status>({
    queryKey: ["/api/admin/whatsapp/status"],
    queryFn: async () => {
      const response = await fetch("/api/admin/whatsapp/status", { credentials: "include", cache: "no-store" });
      if (!response.ok) throw new Error("تعذر قراءة حالة واتساب");
      return response.json();
    },
    refetchInterval: (query) => {
      const state = (query.state.data as Status | undefined)?.state;
      return state === "connected" ? 10_000 : 2_000;
    },
  });

  const action = useMutation({
    mutationFn: ({ path, body }: { path: string; body?: unknown }) => request(path, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/whatsapp/status"] }),
    onError: (error: Error) => toast({ title: "تعذر تنفيذ العملية", description: error.message, variant: "destructive" }),
  });

  const sendTest = useMutation({
    mutationFn: () => request("/api/admin/whatsapp/test-message", { phone: testPhone.trim() }),
    onSuccess: () => toast({ title: "تم الإرسال", description: "وصلت رسالة الاختبار إلى الرقم المحدد." }),
    onError: (error: Error) => toast({ title: "تعذر إرسال الرسالة", description: error.message, variant: "destructive" }),
  });

  const sendFinancialReport = useMutation({
    mutationFn: (period: "daily" | "weekly" | "monthly") =>
      request("/api/admin/whatsapp/financial-report", { period }),
    onSuccess: () => toast({ title: "تم إرسال التقرير", description: "وصل التقرير المالي إلى رقم الإدارة." }),
    onError: (error: Error) => toast({ title: "تعذر إرسال التقرير", description: error.message, variant: "destructive" }),
  });

  const sendNotificationTest = useMutation({
    mutationFn: () => request("/api/admin/whatsapp/notification-test"),
    onSuccess: () => toast({ title: "تم إرسال التنبيهات", description: "تم إرسال تنبيهي التسجيل والاشتراك إلى رقم الإدارة." }),
    onError: (error: Error) => toast({ title: "تعذر إرسال التنبيهات", description: error.message, variant: "destructive" }),
  });

  const sendCampaign = useMutation({
    mutationFn: () => request("/api/admin/whatsapp/campaign", {
      title: campaignForm.title.trim(),
      body: campaignForm.body.trim(),
      target: campaignForm.target,
    }),
    onSuccess: (result) => toast({
      title: "تم تنفيذ حملة واتساب",
      description: `تم الإرسال إلى ${result.sent || 0} مستخدم، وتعذر ${result.failed || 0}.`,
    }),
    onError: (error: Error) => toast({ title: "تعذر تنفيذ الحملة", description: error.message, variant: "destructive" }),
  });

  const campaignPresets: Record<string, { title: string; body: string }> = {
    nationalDay: {
      title: "عرض اليوم الوطني 🇸🇦",
      body: "احتفالاً باليوم الوطني، نرافقك في رحلتك التعليمية بعرض خاص لفترة محدودة. افتح قدراتك الآن واستفد من العرض.",
    },
    offer: {
      title: "عرض خاص من قدراتك 🎁",
      body: "لا تفوّت عرضنا الحالي على الاشتراك. ابدأ خطتك التعليمية اليوم وخلّ تقدمك يتكلم عنك.",
    },
    custom: { title: "", body: "" },
  };

  const connected = status?.state === "connected";
  return (
    <div className="space-y-5" dir="rtl">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-[#24202D]">
          <MessageCircle className="h-5 w-5 text-[#2E8B70]" />
          ربط النظام بواتساب
        </h2>
        <p className="mt-1 text-sm text-[#625D69]">اربط رقم خدمة قدراتك كجهاز مرتبط، ثم استخدمه لرموز التحقق والإشعارات.</p>
      </div>

      <div className="rounded-2xl border border-[#24202D]/10 bg-[#FFFCF7] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${connected ? "bg-emerald-100 text-emerald-700" : "bg-[#F7F4EE] text-[#625D69]"}`}>
              {isLoading || status?.state === "connecting" ? <Loader2 className="h-5 w-5 animate-spin" /> : connected ? <CheckCircle2 className="h-5 w-5" /> : <Power className="h-5 w-5" />}
            </div>
            <div>
              <p className="font-bold text-[#24202D]">{status?.message || "جاري قراءة الحالة"}</p>
              <p className="mt-0.5 text-xs text-[#625D69]" dir="ltr">{status?.phone || "لا يوجد رقم مرتبط"}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!connected && (
              <button
                type="button"
                onClick={() => action.mutate({ path: "/api/admin/whatsapp/connect" })}
                disabled={action.isPending || status?.state === "connecting"}
                className="flex items-center gap-2 rounded-xl bg-[#24202D] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                <Link2 className="h-4 w-4" /> اتصال وإظهار QR
              </button>
            )}
            <button
              type="button"
              onClick={() => action.mutate({ path: "/api/admin/whatsapp/disconnect", body: { clearSession: connected || status?.hasSavedSession } })}
              disabled={action.isPending}
              className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-700 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" /> فك الربط وتوليد جديد
            </button>
          </div>
        </div>

        {status?.state === "waiting_for_qr" && status.qrDataUrl && (
          <div className="mt-6 grid gap-5 border-t border-[#24202D]/10 pt-5 md:grid-cols-[360px_1fr]">
            <div className="rounded-2xl border border-[#24202D]/10 bg-white p-3">
              <img src={status.qrDataUrl} alt="باركود ربط واتساب" className="mx-auto aspect-square w-full max-w-[340px]" />
            </div>
            <div className="space-y-3 text-sm leading-7 text-[#625D69]">
              <p className="font-bold text-[#24202D]">من جوال رقم الخدمة:</p>
              <ol className="list-decimal space-y-1 pr-5">
                <li>افتح واتساب ثم الإعدادات.</li>
                <li>اختر الأجهزة المرتبطة ثم ربط جهاز.</li>
                <li>امسح الباركود الظاهر هنا.</li>
              </ol>
              <div className="flex gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                لا ترسل صورة الباركود لأي شخص؛ مسحه يمنح وصولاً إلى رقم واتساب المرتبط.
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[#24202D]/10 bg-[#FFFCF7] p-5">
        <h3 className="font-bold text-[#24202D]">اختبار الإرسال</h3>
        <p className="mt-1 text-xs text-[#625D69]">أرسل رسالة قصيرة للتأكد من أن الرقم المرتبط يعمل.</p>
        <div className="mt-4 flex max-w-lg gap-2" dir="ltr">
          <Input value={testPhone} onChange={(event) => setTestPhone(event.target.value)} placeholder="+9665XXXXXXXX" className="h-11" />
          <button
            type="button"
            onClick={() => sendTest.mutate()}
            disabled={!connected || !testPhone.trim() || sendTest.isPending}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-[#2E8B70] px-4 text-sm font-bold text-white disabled:opacity-40"
          >
            {sendTest.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            إرسال
          </button>
        </div>
        <button
          type="button"
          onClick={() => sendNotificationTest.mutate()}
          disabled={!connected || sendNotificationTest.isPending}
          className="mt-3 flex items-center gap-2 rounded-xl border border-[#24202D]/15 px-4 py-2.5 text-sm font-bold text-[#24202D] disabled:opacity-40"
        >
          {sendNotificationTest.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          اختبار تنبيهات التسجيل والاشتراك
        </button>
      </div>

      <div className="rounded-2xl border border-[#2E8B70]/20 bg-[#F2FBF7] p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2E8B70]/10 text-[#2E8B70]">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-[#24202D]">حملات واتساب للطلاب</h3>
            <p className="mt-1 text-xs leading-5 text-[#625D69]">
              أرسل رسالة مناسبة للمناسبة أو عرضًا إلى الطلاب الذين يسمحون بإشعارات واتساب. الإرسال يتم من رقم الخدمة المرتبط.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm font-bold text-[#24202D]">
            القالب
            <select
              value={campaignForm.preset}
              onChange={(event) => {
                const preset = campaignPresets[event.target.value];
                setCampaignForm((current) => ({ ...current, preset: event.target.value, title: preset.title, body: preset.body }));
              }}
              className="mt-1 h-11 w-full rounded-xl border border-[#24202D]/10 bg-white px-3 text-sm font-normal"
            >
              <option value="custom">رسالة مخصصة</option>
              <option value="nationalDay">اليوم الوطني</option>
              <option value="offer">عرض اشتراك</option>
            </select>
          </label>
          <label className="text-sm font-bold text-[#24202D]">
            المستهدفون
            <select
              value={campaignForm.target}
              onChange={(event) => setCampaignForm((current) => ({ ...current, target: event.target.value as "all" | "subscribed" | "free" }))}
              className="mt-1 h-11 w-full rounded-xl border border-[#24202D]/10 bg-white px-3 text-sm font-normal"
            >
              <option value="all">كل الطلاب وأولياء الأمور</option>
              <option value="subscribed">المشتركون النشطون</option>
              <option value="free">الحسابات المجانية</option>
            </select>
          </label>
          <label className="text-sm font-bold text-[#24202D] md:col-span-2">
            عنوان الرسالة
            <Input
              value={campaignForm.title}
              onChange={(event) => setCampaignForm((current) => ({ ...current, preset: "custom", title: event.target.value }))}
              placeholder="مثال: عرض اليوم الوطني"
              className="mt-1 h-11 bg-white"
            />
          </label>
          <label className="text-sm font-bold text-[#24202D] md:col-span-2">
            نص الرسالة
            <Textarea
              value={campaignForm.body}
              onChange={(event) => setCampaignForm((current) => ({ ...current, preset: "custom", body: event.target.value }))}
              placeholder="اكتب الرسالة التي ستصل عبر واتساب..."
              className="mt-1 min-h-28 resize-y bg-white"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={() => sendCampaign.mutate()}
          disabled={!connected || !campaignForm.title.trim() || !campaignForm.body.trim() || sendCampaign.isPending}
          className="mt-4 flex items-center gap-2 rounded-xl bg-[#2E8B70] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
        >
          {sendCampaign.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          إرسال الحملة الآن
        </button>
      </div>

      <div className="rounded-2xl border border-[#24202D]/10 bg-[#FFFCF7] p-5">
        <h3 className="flex items-center gap-2 font-bold text-[#24202D]">
          <BarChart3 className="h-5 w-5 text-[#2E8B70]" />
          التقارير المالية عبر واتساب
        </h3>
        <p className="mt-1 text-xs text-[#625D69]">
          أرسل تقريرًا فوريًا إلى رقم الإدارة. تشمل التقارير الطلاب والاختبارات والاشتراكات والإيرادات والمصروفات والصافي.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { period: "daily" as const, label: "التقرير اليومي" },
            { period: "weekly" as const, label: "التقرير الأسبوعي" },
            { period: "monthly" as const, label: "التقرير الشهري" },
          ].map(({ period, label }) => (
            <button
              key={period}
              type="button"
              onClick={() => sendFinancialReport.mutate(period)}
              disabled={!connected || sendFinancialReport.isPending}
              className="flex items-center gap-2 rounded-xl border border-[#2E8B70]/25 bg-[#2E8B70]/5 px-4 py-2.5 text-sm font-bold text-[#216953] disabled:opacity-40"
            >
              {sendFinancialReport.isPending && sendFinancialReport.variables === period
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4" />}
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}