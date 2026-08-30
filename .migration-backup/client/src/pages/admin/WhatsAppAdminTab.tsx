import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Link2, Loader2, MessageCircle, Power, RefreshCw, Send, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import WhatsAppCrmPanel from "./WhatsAppCrmPanel";

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
    mutationFn: () => request("/api/admin/whatsapp/test-message", { phone: testPhone }),
    onSuccess: () => toast({ title: "تم الإرسال", description: "وصلت رسالة الاختبار إلى الرقم المحدد." }),
    onError: (error: Error) => toast({ title: "تعذر إرسال الرسالة", description: error.message, variant: "destructive" }),
  });

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
                onClick={() => action.mutate({ path: "/api/admin/whatsapp/connect" })}
                disabled={action.isPending || status?.state === "connecting"}
                className="flex items-center gap-2 rounded-xl bg-[#24202D] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                <Link2 className="h-4 w-4" /> اتصال وإظهار QR
              </button>
            )}
            <button
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
            onClick={() => sendTest.mutate()}
            disabled={!connected || !testPhone.trim() || sendTest.isPending}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-[#2E8B70] px-4 text-sm font-bold text-white disabled:opacity-40"
          >
            {sendTest.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            إرسال
          </button>
        </div>
      </div>

      <WhatsAppCrmPanel connected={connected} />
    </div>
  );
}