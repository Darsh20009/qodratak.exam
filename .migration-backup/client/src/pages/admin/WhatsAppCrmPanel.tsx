import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCheck, Inbox, Loader2, MessageCircle, Plus, Search, Send, UserRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Conversation = {
  phone: string;
  senderName: string;
  lastMessage: string;
  lastTime: string;
  direction: "inbound" | "outbound";
};

type Message = {
  _id?: string;
  messageId: string;
  phone: string;
  senderName: string;
  content: string;
  direction: "inbound" | "outbound";
  createdAt: string;
};

const quickReplies = [
  "مرحباً بك في قدراتك، كيف يمكننا مساعدتك؟",
  "تم استلام طلبك، وسيتم الرد عليك في أقرب وقت.",
  "فضلاً أرسل رقم الجوال المسجل في المنصة.",
  "شكراً لتواصلك مع فريق دعم قدراتك.",
];

export default function WhatsAppCrmPanel({ connected }: { connected: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [search, setSearch] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [reply, setReply] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversationsQuery = useQuery<{ conversations: Conversation[] }>({
    queryKey: ["/api/admin/whatsapp/conversations"],
    queryFn: async () => {
      const response = await fetch("/api/admin/whatsapp/conversations", { credentials: "include", cache: "no-store" });
      if (!response.ok) throw new Error("تعذر تحميل المحادثات");
      return response.json();
    },
    refetchInterval: 5000,
  });

  const messagesQuery = useQuery<{ messages: Message[] }>({
    queryKey: ["/api/admin/whatsapp/messages", selected?.phone],
    enabled: Boolean(selected?.phone),
    queryFn: async () => {
      const response = await fetch(`/api/admin/whatsapp/messages/${selected?.phone}`, { credentials: "include", cache: "no-store" });
      if (!response.ok) throw new Error("تعذر تحميل الرسائل");
      return response.json();
    },
    refetchInterval: selected ? 3000 : false,
  });

  const sendReply = useMutation({
    mutationFn: async () => {
      if (!selected || !reply.trim()) return;
      const response = await fetch(`/api/admin/whatsapp/messages/${selected.phone}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reply.trim() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "تعذر إرسال الرسالة");
    },
    onSuccess: () => {
      setReply("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/whatsapp/messages", selected?.phone] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/whatsapp/conversations"] });
    },
    onError: (error: Error) => toast({ title: "تعذر الإرسال", description: error.message, variant: "destructive" }),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesQuery.data?.messages.length]);

  const conversations = useMemo(() => {
    const items = conversationsQuery.data?.conversations || [];
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      item.senderName.toLowerCase().includes(term) ||
      item.phone.includes(term) ||
      item.lastMessage.toLowerCase().includes(term),
    );
  }, [conversationsQuery.data, search]);

  const startConversation = () => {
    const phone = newPhone.replace(/\D/g, "");
    if (phone.length < 8 || phone.length > 15) {
      toast({ title: "رقم غير صالح", description: "أدخل الرقم بصيغته الدولية، مثال: 9665XXXXXXXX", variant: "destructive" });
      return;
    }
    setSelected({
      phone,
      senderName: `+${phone}`,
      lastMessage: "",
      lastTime: new Date().toISOString(),
      direction: "outbound",
    });
    setNewPhone("");
    setShowNewChat(false);
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-[#24202D]/10 bg-white shadow-sm" dir="rtl">
      <div className="flex items-center justify-between border-b border-[#24202D]/10 px-5 py-4">
        <div>
          <h3 className="flex items-center gap-2 font-bold text-[#24202D]"><Inbox className="h-4 w-4 text-[#2E8B70]" /> صندوق محادثات واتساب</h3>
          <p className="mt-1 text-xs text-[#625D69]">الرسائل الواردة والردود اليدوية من رقم الخدمة المرتبط.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${connected ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
          {connected ? "متصل" : "غير متصل"}
        </span>
      </div>

      <div className="grid min-h-[560px] md:grid-cols-[310px_1fr]">
        <aside className="border-l border-[#24202D]/10 bg-[#FCFAF6]">
          <div className="p-3">
            <button onClick={() => setShowNewChat((value) => !value)} className="mb-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#24202D] text-sm font-bold text-white">
              <Plus className="h-4 w-4" /> محادثة جديدة
            </button>
            {showNewChat && (
              <div className="mb-3 rounded-xl border border-[#24202D]/10 bg-white p-2">
                <input value={newPhone} onChange={(event) => setNewPhone(event.target.value)} onKeyDown={(event) => event.key === "Enter" && startConversation()} dir="ltr" placeholder="9665XXXXXXXX" className="h-9 w-full rounded-lg border border-[#24202D]/10 px-3 text-left text-sm outline-none focus:border-[#2E8B70]" />
                <button onClick={startConversation} className="mt-2 h-8 w-full rounded-lg bg-[#E8F4EF] text-xs font-bold text-[#236E59]">فتح المحادثة</button>
              </div>
            )}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#918A82]" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="بحث بالاسم أو الرقم" className="h-10 w-full rounded-xl border border-[#24202D]/10 bg-white pr-9 pl-3 text-sm outline-none focus:border-[#2E8B70]" />
            </div>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {conversationsQuery.isLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-[#2E8B70]" /></div>
            ) : conversations.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-[#918A82]"><MessageCircle className="mx-auto mb-3 h-8 w-8 opacity-50" />لا توجد محادثات بعد</div>
            ) : conversations.map((conversation) => (
              <button key={conversation.phone} onClick={() => setSelected(conversation)} className={`w-full border-t border-[#24202D]/5 p-3 text-right transition hover:bg-white ${selected?.phone === conversation.phone ? "bg-white shadow-[inset_-3px_0_0_#2E8B70]" : ""}`}>
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8F4EF] text-[#2E8B70]"><UserRound className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-bold text-[#24202D]">{conversation.senderName || conversation.phone}</p><span className="text-[10px] text-[#918A82]">{new Date(conversation.lastTime).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}</span></div>
                    <p className="mt-1 truncate text-xs text-[#625D69]">{conversation.direction === "outbound" ? "أنت: " : ""}{conversation.lastMessage}</p>
                    <p className="mt-1 text-[10px] text-[#AAA39A]" dir="ltr">+{conversation.phone}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          {!selected ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-[#918A82]"><div><MessageCircle className="mx-auto mb-3 h-10 w-10 text-[#CFC9C1]" /><p className="font-bold text-[#625D69]">اختر محادثة للبدء</p><p className="mt-1 text-xs">ستظهر الرسائل هنا ويمكن الرد عليها مباشرةً.</p></div></div>
          ) : (
            <>
              <div className="border-b border-[#24202D]/10 px-5 py-3"><p className="font-bold text-[#24202D]">{selected.senderName}</p><p className="text-xs text-[#918A82]" dir="ltr">+{selected.phone}</p></div>
              <div className="flex-1 space-y-3 overflow-y-auto bg-[#F7F4EE]/70 p-5">
                {messagesQuery.isLoading ? <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div> : (messagesQuery.data?.messages || []).map((message, index) => {
                  const outbound = message.direction === "outbound";
                  return <div key={message._id || message.messageId || index} className={`flex ${outbound ? "justify-start" : "justify-end"}`}><div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${outbound ? "rounded-tr-sm bg-[#2E8B70] text-white" : "rounded-tl-sm bg-white text-[#24202D] shadow-sm"}`}><p className="whitespace-pre-wrap">{message.content}</p><div className={`mt-1 flex items-center gap-1 text-[10px] ${outbound ? "text-white/70" : "text-[#918A82]"}`}>{new Date(message.createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}{outbound && <CheckCheck className="h-3 w-3" />}</div></div></div>;
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="border-t border-[#24202D]/10 bg-white p-3">
                <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
                  {quickReplies.map((item) => (
                    <button key={item} type="button" onClick={() => setReply(item)} className="shrink-0 rounded-full border border-[#2E8B70]/20 bg-[#E8F4EF]/60 px-3 py-1.5 text-[11px] font-bold text-[#236E59] hover:bg-[#E8F4EF]">
                      {item}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <textarea value={reply} onChange={(event) => setReply(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendReply.mutate(); } }} placeholder={connected ? "اكتب ردك..." : "اربط واتساب لإرسال الردود"} disabled={!connected || sendReply.isPending} rows={2} className="min-h-12 flex-1 resize-none rounded-xl border border-[#24202D]/10 px-3 py-2 text-sm outline-none focus:border-[#2E8B70] disabled:bg-slate-50" />
                  <button onClick={() => sendReply.mutate()} disabled={!connected || !reply.trim() || sendReply.isPending} className="flex w-12 items-center justify-center rounded-xl bg-[#2E8B70] text-white disabled:opacity-40">{sendReply.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 rotate-180" />}</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}