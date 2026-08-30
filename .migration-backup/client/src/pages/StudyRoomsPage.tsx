import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users, Plus, Clock, Copy, Check, ArrowRight,
  CalendarClock, BookOpen, Zap, Hash, ChevronRight,
  Search, Globe, Lock, Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const CATEGORY_LABELS: Record<string, string> = {
  mixed: "مختلط",
  verbal: "لفظي",
  quantitative: "كمي",
};
const CATEGORY_COLORS: Record<string, string> = {
  mixed: "bg-green-100 text-green-700",
  verbal: "bg-blue-100 text-blue-700",
  quantitative: "bg-orange-100 text-orange-700",
};

function getUser() {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
}

function useCountdown(scheduledAt: string | undefined) {
  const [diff, setDiff] = useState<number>(0);
  useEffect(() => {
    if (!scheduledAt) return;
    const tick = () => {
      const d = new Date(scheduledAt).getTime() - Date.now();
      setDiff(d);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [scheduledAt]);
  return diff;
}

function CountdownBadge({ scheduledAt }: { scheduledAt: string }) {
  const diff = useCountdown(scheduledAt);
  if (diff <= 0) return <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">🚀 بدأ الآن</span>;
  const totalSec = Math.floor(diff / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{h}س {m}د</span>;
  if (m > 0) return <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{m}د {s.toString().padStart(2,"0")}ث</span>;
  return <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full animate-pulse">{s}ث</span>;
}

function formatArabicDate(iso: string) {
  const d = new Date(iso);
  const days = ["الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
  const day = days[d.getDay()];
  const time = d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", hour12: true });
  const date = d.toLocaleDateString("ar-SA", { day: "numeric", month: "long" });
  return `${day} ${date} - ${time}`;
}

interface Room {
  _id: string;
  code: string;
  hostUserId: string;
  hostUsername: string;
  title: string;
  questionCount: number;
  timePerQuestion: number;
  maxParticipants: number;
  participants: Array<{ userId: string; username: string }>;
  scheduledAt: string;
  category: string;
  status: string;
}

function RoomCard({ room, userId, onJoin, onEnter }: { room: Room; userId: string; onJoin: (code: string) => void; onEnter: (code: string) => void }) {
  const isRegistered = room.participants.some(p => p.userId === userId);
  const isFull = room.participants.length >= room.maxParticipants;
  const diff = new Date(room.scheduledAt).getTime() - Date.now();
  const started = diff <= 0;

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer group"
      onClick={() => onEnter(room.code)}
      data-testid={`study-room-card-${room.code}`}
    >
      <div className="h-2 bg-gradient-to-l from-green-500 to-emerald-400" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-base leading-tight mb-1 truncate">{room.title}</h3>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="font-medium text-gray-700">{room.hostUsername}</span>
              <span>·</span>
              <span className={cn("px-2 py-0.5 rounded-full font-medium", CATEGORY_COLORS[room.category] || CATEGORY_COLORS.mixed)}>
                {CATEGORY_LABELS[room.category] || "مختلط"}
              </span>
            </div>
          </div>
          <CountdownBadge scheduledAt={room.scheduledAt} />
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {room.questionCount} سؤال
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {room.timePerQuestion}ث / سؤال
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {room.participants.length}/{room.maxParticipants}
          </span>
        </div>

        <div className="text-xs text-gray-400 mb-4 flex items-center gap-1">
          <CalendarClock className="w-3.5 h-3.5" />
          {formatArabicDate(room.scheduledAt)}
        </div>

        {room.participants.length > 0 && (
          <div className="flex -space-x-1.5 rtl:space-x-reverse mb-4">
            {room.participants.slice(0, 5).map((p, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 border-2 border-white flex items-center justify-center text-white text-[9px] font-bold"
                title={p.username}
              >
                {p.username?.[0] || "؟"}
              </div>
            ))}
            {room.participants.length > 5 && (
              <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-gray-600 text-[9px] font-bold">
                +{room.participants.length - 5}
              </div>
            )}
          </div>
        )}

        <button
          className={cn(
            "w-full py-2 rounded-xl text-sm font-semibold transition-all",
            started
              ? "bg-green-600 text-white hover:bg-green-700 shadow-sm"
              : isRegistered
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
              : isFull
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700 shadow-sm"
          )}
          onClick={e => {
            e.stopPropagation();
            if (started || isRegistered) { onEnter(room.code); }
            else if (!isFull) { onJoin(room.code); }
          }}
          disabled={isFull && !isRegistered && !started}
          data-testid={`btn-join-${room.code}`}
        >
          {started ? "🚀 انضم للمباراة" : isRegistered ? "✅ منضم · دخول الغرفة" : isFull ? "الغرفة ممتلئة" : "انضم للغرفة"}
        </button>
      </div>
    </div>
  );
}

export default function StudyRoomsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = getUser();
  const userId = user?.id || user?._id || "";
  const username = user?.username || user?.name || "مشارك";

  const [tab, setTab] = useState<"all" | "mine">("all");
  const [searchCode, setSearchCode] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [filterCat, setFilterCat] = useState("all");
  const [form, setForm] = useState({
    title: "",
    scheduledAt: "",
    category: "mixed",
    questionCount: 10,
    timePerQuestion: 30,
    maxParticipants: 20,
  });

  const { data: rooms = [], isLoading } = useQuery<Room[]>({
    queryKey: ["/api/multiplayer/scheduled"],
    queryFn: async () => {
      const res = await fetch("/api/multiplayer/scheduled");
      return res.ok ? res.json() : [];
    },
    refetchInterval: 10000,
  });

  const registerMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await fetch(`/api/multiplayer/scheduled/${code}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل التسجيل");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/multiplayer/scheduled"] });
      toast({ description: "✅ تم تسجيلك في الغرفة!" });
    },
    onError: (err: any) => toast({ description: err.message, variant: "destructive" }),
  });

  const handleCreate = async () => {
    if (!form.title.trim()) { toast({ description: "أدخل عنواناً للغرفة", variant: "destructive" }); return; }
    if (!form.scheduledAt) { toast({ description: "حدد وقت بدء الجلسة", variant: "destructive" }); return; }
    const schedDate = new Date(form.scheduledAt);
    if (schedDate <= new Date()) { toast({ description: "يجب أن يكون الوقت في المستقبل", variant: "destructive" }); return; }
    setCreating(true);
    try {
      const typeMap: Record<string, string> = { mixed: "all", verbal: "verbal", quantitative: "quantitative" };
      const qRes = await fetch(`/api/questions/random?count=${form.questionCount}&type=${typeMap[form.category] || "all"}`);
      let questions = [];
      if (qRes.ok) {
        const qData = await qRes.json();
        questions = (qData.questions || qData || []).slice(0, form.questionCount).map((q: any) => ({
          id: q._id, text: q.text, options: q.options, correctAnswer: q.correctAnswer, type: q.type || "multiple_choice",
        }));
      }
      const res = await fetch("/api/multiplayer/scheduled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostUserId: userId, hostUsername: username,
          title: form.title, questions,
          timePerQuestion: form.timePerQuestion,
          maxParticipants: form.maxParticipants,
          scheduledAt: form.scheduledAt,
          category: form.category,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل إنشاء الغرفة");
      await fetch(`/api/multiplayer/scheduled/${data.room.code}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, username }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/multiplayer/scheduled"] });
      toast({ description: `✅ تم إنشاء الغرفة! الرمز: ${data.room.code}` });
      setShowCreate(false);
      navigate(`/study-rooms/${data.room.code}`);
    } catch (err: any) {
      toast({ description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleJoinByCode = async () => {
    const code = searchCode.trim().toUpperCase();
    if (code.length !== 6) { toast({ description: "الرمز يجب أن يكون 6 أحرف", variant: "destructive" }); return; }
    navigate(`/study-rooms/${code}`);
  };

  const filteredRooms = rooms.filter(r => {
    if (tab === "mine" && !r.participants.some(p => p.userId === userId)) return false;
    if (filterCat !== "all" && r.category !== filterCat) return false;
    return true;
  });

  const minDateTime = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <div className="min-h-screen bg-gray-50 pb-20" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CalendarClock className="w-7 h-7 text-green-600" />
              غرف الدراسة الجماعية
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">احجز وقتاً مع أصدقائك وتنافسوا معاً</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm"
            data-testid="btn-create-room"
          >
            <Plus className="w-4 h-4" />
            غرفة جديدة
          </button>
        </div>

        {/* Join by code */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex gap-2">
          <input
            type="text"
            value={searchCode}
            onChange={e => setSearchCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && handleJoinByCode()}
            placeholder="أدخل رمز الغرفة (6 أحرف)"
            maxLength={6}
            className="flex-1 text-center font-mono text-lg tracking-widest border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-green-400 bg-gray-50"
            data-testid="input-room-code"
          />
          <button
            onClick={handleJoinByCode}
            className="bg-green-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center gap-1 text-sm"
            data-testid="btn-join-code"
          >
            <ChevronRight className="w-4 h-4" />
            انضم
          </button>
        </div>

        {/* Tabs + Filter */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {[{ key: "all", label: "الكل" }, { key: "mine", label: "غرفي" }].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as any)}
                className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-all", tab === t.key ? "bg-white shadow text-green-700" : "text-gray-500")}
                data-testid={`tab-${t.key}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {[{ key: "all", label: "الكل" }, { key: "verbal", label: "لفظي" }, { key: "quantitative", label: "كمي" }].map(f => (
              <button
                key={f.key}
                onClick={() => setFilterCat(f.key)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all border", filterCat === f.key ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-500 border-gray-200")}
                data-testid={`filter-${f.key}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rooms grid */}
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-white rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-16">
            <CalendarClock className="w-14 h-14 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">
              {tab === "mine" ? "لم تنضم إلى أي غرفة بعد" : "لا توجد غرف قادمة حالياً"}
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 text-green-600 text-sm font-semibold hover:underline"
            >
              أنشئ غرفتك الأولى →
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredRooms.map(room => (
              <RoomCard
                key={room._id}
                room={room}
                userId={userId}
                onJoin={code => registerMutation.mutate(code)}
                onEnter={code => navigate(`/study-rooms/${code}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div
            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
            dir="rtl"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-green-600" />
              إنشاء غرفة دراسة مجدولة
            </h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">عنوان الجلسة</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="مثال: مراجعة التناظر اللفظي"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400"
                  data-testid="input-room-title"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">وقت البدء</label>
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  min={minDateTime}
                  onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400"
                  data-testid="input-scheduled-at"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">نوع الأسئلة</label>
                <div className="flex gap-2">
                  {[{ v: "mixed", l: "مختلط" }, { v: "verbal", l: "لفظي" }, { v: "quantitative", l: "كمي" }].map(opt => (
                    <button
                      key={opt.v}
                      onClick={() => setForm(f => ({ ...f, category: opt.v }))}
                      className={cn("flex-1 py-2 rounded-xl text-sm font-medium border transition-all", form.category === opt.v ? "bg-green-600 text-white border-green-600" : "bg-gray-50 text-gray-600 border-gray-200")}
                      data-testid={`select-category-${opt.v}`}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">عدد الأسئلة</label>
                  <select
                    value={form.questionCount}
                    onChange={e => setForm(f => ({ ...f, questionCount: +e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:border-green-400 bg-white"
                    data-testid="select-question-count"
                  >
                    {[5, 10, 15, 20, 30].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">وقت / سؤال</label>
                  <select
                    value={form.timePerQuestion}
                    onChange={e => setForm(f => ({ ...f, timePerQuestion: +e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:border-green-400 bg-white"
                    data-testid="select-time-per-question"
                  >
                    {[20, 30, 45, 60, 90].map(n => <option key={n} value={n}>{n}ث</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">الحد الأقصى</label>
                  <select
                    value={form.maxParticipants}
                    onChange={e => setForm(f => ({ ...f, maxParticipants: +e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:border-green-400 bg-white"
                    data-testid="select-max-participants"
                  >
                    {[5, 10, 20, 30, 50].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                data-testid="btn-cancel-create"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-2 flex-grow py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-60"
                data-testid="btn-confirm-create"
              >
                {creating ? "جاري الإنشاء..." : "🚀 إنشاء الغرفة"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
