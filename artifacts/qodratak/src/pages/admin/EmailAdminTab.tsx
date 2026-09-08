import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Archive,
  ChevronLeft,
  Mail,
  MailOpen,
  PenLine,
  RefreshCw,
  Reply,
  Send,
  Trash2,
} from "lucide-react";

interface InboxMessage {
  uid: number;
  messageId: string;
  subject: string;
  from: string;
  to: string;
  date: string | null;
  seen: boolean;
  flagged: boolean;
  hasAttachments: boolean;
  preview: string;
  text?: string;
  html?: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; contentType: string; size: number }>;
}

interface InboxResponse {
  configured: boolean;
  email: string;
  messages: InboxMessage[];
}

async function emailRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: "include", ...init });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "تعذر تنفيذ العملية");
  return data;
}

function dateLabel(value: string | null) {
  if (!value) return "بدون تاريخ";
  return new Date(value).toLocaleString("ar-SA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function EmailAdminTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUid, setSelectedUid] = useState<number | null>(null);
  const [folder, setFolder] = useState<"inbox" | "sent">("inbox");
  const [composeOpen, setComposeOpen] = useState(false);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const inbox = useQuery<InboxResponse>({
    queryKey: ["/api/admin/email/messages", folder],
    queryFn: () => emailRequest<InboxResponse>(`/api/admin/email/messages?folder=${folder}`),
    refetchInterval: 60_000,
  });

  const selected = useQuery<InboxMessage>({
    queryKey: ["/api/admin/email/messages", folder, selectedUid],
    queryFn: () => emailRequest<InboxMessage>(`/api/admin/email/messages/${selectedUid}?folder=${folder}`),
    enabled: selectedUid !== null,
  });

  const sendEmail = useMutation({
    mutationFn: () =>
      emailRequest<{ success: boolean }>("/api/admin/email/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, text: body }),
      }),
    onSuccess: () => {
      toast({ title: "تم إرسال البريد من info@qodratak.sa" });
      setComposeOpen(false);
      setTo("");
      setSubject("");
      setBody("");
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  const deleteEmail = useMutation({
    mutationFn: (uid: number) =>
      emailRequest(`/api/admin/email/messages/${uid}?folder=${folder}`, { method: "DELETE" }),
    onSuccess: () => {
      setSelectedUid(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email/messages", folder] });
      toast({ title: "تم حذف الرسالة" });
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  const openMessage = (message: InboxMessage) => {
    setSelectedUid(message.uid);
  };

  const startReply = () => {
    if (!selected.data) return;
    setTo(selected.data.replyTo || selected.data.from);
    setSubject(selected.data.subject.startsWith("Re:") ? selected.data.subject : `Re: ${selected.data.subject}`);
    setBody("");
    setComposeOpen(true);
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-foreground">صندوق البريد</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            إرسال واستقبال البريد من <strong>{inbox.data?.email || "info@qodratak.sa"}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => inbox.refetch()} disabled={inbox.isFetching}>
            <RefreshCw className={`ml-2 h-4 w-4 ${inbox.isFetching ? "animate-spin" : ""}`} />
            تحديث
          </Button>
          <Button onClick={() => { setComposeOpen(true); setSelectedUid(null); }} className="bg-[#24202D] text-white hover:bg-[#393343]">
            <PenLine className="ml-2 h-4 w-4" />
            رسالة جديدة
          </Button>
        </div>
      </div>

      {!inbox.data?.configured && !inbox.isLoading && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
          لم يتم ربط كلمة مرور صندوق البريد بعد. تحقق من سر <code>QODRATAK_MAIL_PASSWORD</code> ثم أعد تشغيل خدمة API.
        </div>
      )}

      {inbox.error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
          تعذر الاتصال بصندوق البريد. تحقق من إعدادات IMAP ثم اضغط تحديث.
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Archive className="h-4 w-4 text-[#B65D36]" />
              <button type="button" onClick={() => { setFolder("inbox"); setSelectedUid(null); }} className={folder === "inbox" ? "text-foreground" : "text-muted-foreground"}>الوارد</button>
              <span className="text-muted-foreground">/</span>
              <button type="button" onClick={() => { setFolder("sent"); setSelectedUid(null); }} className={folder === "sent" ? "text-foreground" : "text-muted-foreground"}>الصادر</button>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {inbox.data?.messages?.length || 0}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">آخر 100 رسالة</span>
          </div>
          <div className="max-h-[620px] overflow-y-auto">
            {inbox.isLoading && <div className="p-8 text-center text-sm text-muted-foreground">جارٍ تحميل البريد...</div>}
            {!inbox.isLoading && !inbox.data?.messages?.length && (
              <div className="p-10 text-center text-sm text-muted-foreground">لا توجد رسائل في الوارد.</div>
            )}
            {inbox.data?.messages?.map((message) => (
              <button
                type="button"
                key={message.uid}
                onClick={() => openMessage(message)}
                className={`flex w-full gap-3 border-b border-border p-4 text-right transition hover:bg-muted/60 ${selectedUid === message.uid ? "bg-muted" : ""}`}
              >
                <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${message.seen ? "bg-muted text-muted-foreground" : "bg-[#F4AA85]/20 text-[#B65D36]"}`}>
                  {message.seen ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`truncate text-sm ${message.seen ? "font-medium text-foreground" : "font-black text-foreground"}`}>{message.subject}</p>
                    {!message.seen && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#B65D36]" />}
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{message.from}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{message.preview || "لا توجد معاينة"}</p>
                  <p className="mt-2 text-[10px] text-muted-foreground">{dateLabel(message.date)}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="min-h-[480px] rounded-2xl border border-border bg-card">
          {selected.data ? (
            <div className="flex h-full flex-col">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-5">
                <div className="min-w-0">
                  <h3 className="text-lg font-black text-foreground">{selected.data.subject}</h3>
                  <p className="mt-2 break-words text-sm text-muted-foreground">{selected.data.from}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{dateLabel(selected.data.date)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={startReply}><Reply className="ml-1 h-4 w-4" />رد</Button>
                  <Button variant="outline" size="sm" onClick={() => deleteEmail.mutate(selected.data!.uid)} disabled={deleteEmail.isPending}>
                    <Trash2 className="ml-1 h-4 w-4 text-red-500" />حذف
                  </Button>
                </div>
              </div>
              <div className="flex-1 whitespace-pre-wrap overflow-y-auto p-5 text-sm leading-8 text-foreground">
                {selected.data.text || "لا يوجد نص نصي في هذه الرسالة."}
                {selected.data.attachments?.length ? (
                  <div className="mt-8 border-t border-border pt-4">
                    <p className="mb-2 font-bold">المرفقات</p>
                    {selected.data.attachments.map((attachment) => <p key={`${attachment.filename}-${attachment.size}`} className="text-xs text-muted-foreground">{attachment.filename} · {Math.round(attachment.size / 1024)} KB</p>)}
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[480px] flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <Mail className="mb-4 h-12 w-12 opacity-30" />
              <p className="font-bold">اختر رسالة لقراءتها</p>
              <p className="mt-2 text-sm">يمكنك الرد أو حذف الرسالة من شاشة القراءة.</p>
            </div>
          )}
        </section>
      </div>

      {composeOpen && (
        <div className="rounded-2xl border border-[#B65D36]/30 bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-black text-foreground"><Send className="h-4 w-4 text-[#B65D36]" />رسالة من info@qodratak.sa</h3>
            <Button variant="ghost" size="sm" onClick={() => setComposeOpen(false)}>إلغاء</Button>
          </div>
          <div className="grid gap-3">
            <Input value={to} onChange={(event) => setTo(event.target.value)} placeholder="إلى: name@example.com" dir="ltr" />
            <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="الموضوع" />
            <Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="اكتب محتوى الرسالة..." rows={8} />
            <div className="flex justify-end">
              <Button onClick={() => sendEmail.mutate()} disabled={!to.trim() || !subject.trim() || !body.trim() || sendEmail.isPending} className="bg-[#24202D] text-white hover:bg-[#393343]">
                {sendEmail.isPending ? <RefreshCw className="ml-2 h-4 w-4 animate-spin" /> : <Send className="ml-2 h-4 w-4" />}
                إرسال
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}