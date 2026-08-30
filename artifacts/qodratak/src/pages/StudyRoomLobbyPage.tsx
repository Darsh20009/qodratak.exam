import { useState, useEffect, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import {
  Users, Copy, Check, ArrowRight, CalendarClock,
  BookOpen, Clock, Zap, Hash, Share2, ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

function getUser() {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
}

const CATEGORY_LABELS: Record<string, string> = {
  mixed: "مختلط", verbal: "لفظي", quantitative: "كمي",
};

interface Room {
  _id: string;
  code: string;
  hostUserId: string;
  hostUsername: string;
  title: string;
  questionCount: number;
  timePerQuestion: number;
  maxParticipants: number;
  participants: Array<{ userId: string; username: string; avatar: string; isReady: boolean }>;
  scheduledAt: string;
  category: string;
  status: string;
}

function CountdownDisplay({ scheduledAt }: { scheduledAt: string }) {
  const [diff, setDiff] = useState(new Date(scheduledAt).getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setDiff(new Date(scheduledAt).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [scheduledAt]);

  if (diff <= 0) {
    return (
      <div className="text-center py-6">
        <div className="text-5xl font-black text-green-600 animate-bounce mb-2">🚀</div>
        <div className="text-2xl font-bold text-green-600">انطلقت الجلسة!</div>
        <div className="text-sm text-gray-500 mt-1">يمكنك الانضمام للمباراة الآن</div>
      </div>
    );
  }

  const totalSec = Math.floor(diff / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const urgent = totalSec < 60;

  return (
    <div className="text-center py-4">
      <div className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">تبدأ بعد</div>
      <div className="flex items-center justify-center gap-3">
        {h > 0 && (
          <>
            <div className={cn("bg-white rounded-2xl shadow-sm border border-gray-100 p-3 min-w-[64px]", urgent && "border-red-200")}>
              <div className={cn("text-4xl font-black tabular-nums", urgent ? "text-red-600" : "text-green-700")}>{h.toString().padStart(2, "0")}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">ساعة</div>
            </div>
            <div className="text-3xl font-black text-gray-300">:</div>
          </>
        )}
        <div className={cn("bg-white rounded-2xl shadow-sm border border-gray-100 p-3 min-w-[64px]", urgent && "border-red-200")}>
          <div className={cn("text-4xl font-black tabular-nums", urgent ? "text-red-600" : "text-green-700")}>{m.toString().padStart(2, "0")}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">دقيقة</div>
        </div>
        <div className="text-3xl font-black text-gray-300">:</div>
        <div className={cn("bg-white rounded-2xl shadow-sm border border-gray-100 p-3 min-w-[64px]", urgent && "border-red-200 animate-pulse")}>
          <div className={cn("text-4xl font-black tabular-nums", urgent ? "text-red-600" : "text-green-700")}>{s.toString().padStart(2, "0")}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">ثانية</div>
        </div>
      </div>
    </div>
  );
}

export default function StudyRoomLobbyPage() {
  const { code } = useParams<{ code: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const user = getUser();
  const userId = user?.id || user?._id || "";
  const username = user?.username || user?.name || "مشارك";

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [registering, setRegistering] = useState(false);
  const [copied, setCopied] = useState(false);
  const [launched, setLaunched] = useState(false);

  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/multiplayer/rooms/${code?.toUpperCase()}`);
      if (!res.ok) { setError("الغرفة غير موجودة"); setLoading(false); return; }
      const data = await res.json();
      setRoom(data);
      setLoading(false);

      if ((data.status === "starting" || data.status === "playing") && !launched) {
        setLaunched(true);
        navigate(`/multiplayer/room/${code?.toUpperCase()}`);
      }
    } catch {
      setError("تعذر تحميل الغرفة");
      setLoading(false);
    }
  }, [code, launched, navigate]);

  useEffect(() => {
    fetchRoom();
    const id = setInterval(fetchRoom, 3000);
    return () => clearInterval(id);
  }, [fetchRoom]);

  const isRegistered = room?.participants.some(p => p.userId === userId) ?? false;
  const isHost = room?.hostUserId === userId;
  const scheduledPassed = room ? new Date(room.scheduledAt).getTime() <= Date.now() : false;

  const handleRegister = async () => {
    if (!userId) { toast({ description: "يجب تسجيل الدخول أولاً", variant: "destructive" }); return; }
    setRegistering(true);
    try {
      const res = await fetch(`/api/multiplayer/scheduled/${code?.toUpperCase()}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل التسجيل");
      setRoom(data.room);
      toast({ description: "✅ تم تسجيلك بنجاح!" });
    } catch (err: any) {
      toast({ description: err.message, variant: "destructive" });
    } finally {
      setRegistering(false);
    }
  };

  const handleUnregister = async () => {
    if (isHost) return;
    try {
      await fetch(`/api/multiplayer/scheduled/${code?.toUpperCase()}/register`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      fetchRoom();
      toast({ description: "تم إلغاء تسجيلك" });
    } catch {
      toast({ description: "فشل إلغاء التسجيل", variant: "destructive" });
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code?.toUpperCase() || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ description: "📋 تم نسخ الرمز!" });
  };

  const shareRoom = () => {
    const url = `${window.location.origin}/study-rooms/${code?.toUpperCase()}`;
    if (navigator.share) {
      navigator.share({ title: room?.title || "غرفة دراسة", url });
    } else {
      navigator.clipboard.writeText(url);
      toast({ description: "📋 تم نسخ الرابط!" });
    }
  };

  const goToGame = () => navigate(`/multiplayer/room/${code?.toUpperCase()}`);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">جاري تحميل الغرفة...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="text-5xl mb-3">😕</div>
          <p className="text-gray-700 font-semibold text-lg mb-2">{error || "الغرفة غير موجودة"}</p>
          <button onClick={() => navigate("/study-rooms")} className="text-green-600 font-medium hover:underline">
            العودة للغرف
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Back */}
        <button
          onClick={() => navigate("/study-rooms")}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm mb-5 transition-colors"
          data-testid="btn-back"
        >
          <ChevronLeft className="w-4 h-4 rotate-180" />
          الغرف الجماعية
        </button>

        {/* Room header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
          <div className="h-2 bg-gradient-to-l from-green-500 to-emerald-400" />
          <div className="p-5">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-900 leading-tight">{room.title}</h1>
                <p className="text-sm text-gray-500 mt-0.5">بواسطة {room.hostUsername}</p>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                {CATEGORY_LABELS[room.category] || "مختلط"}
              </span>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-3">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-green-500" />
                {room.questionCount} سؤال
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-green-500" />
                {room.timePerQuestion} ثانية لكل سؤال
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-green-500" />
                {room.participants.length} / {room.maxParticipants} مشارك
              </span>
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <CountdownDisplay scheduledAt={room.scheduledAt} />

          {/* Scheduled date */}
          <div className="text-center mt-3">
            <span className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
              <CalendarClock className="w-3.5 h-3.5" />
              {new Date(room.scheduledAt).toLocaleString("ar-SA", {
                weekday: "long", day: "numeric", month: "long",
                hour: "2-digit", minute: "2-digit", hour12: true
              })}
            </span>
          </div>
        </div>

        {/* Room code + share */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">رمز الغرفة</span>
            <div className="flex gap-2">
              <button
                onClick={shareRoom}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
                data-testid="btn-share"
              >
                <Share2 className="w-3.5 h-3.5" /> مشاركة
              </button>
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
                data-testid="btn-copy-code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "تم!" : "نسخ"}
              </button>
            </div>
          </div>
          <div className="font-mono text-3xl font-black tracking-[0.3em] text-center text-green-700 bg-green-50 rounded-xl py-3">
            {room.code}
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">شارك هذا الرمز مع أصدقائك للانضمام</p>
        </div>

        {/* Participants */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <h2 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-green-600" />
            المنضمون ({room.participants.length})
          </h2>
          {room.participants.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">لم ينضم أحد بعد · أرسل الرمز لأصدقائك</p>
          ) : (
            <div className="flex flex-col gap-2">
              {room.participants.map((p, i) => (
                <div key={p.userId || i} className="flex items-center gap-3" data-testid={`participant-${p.userId}`}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {p.username?.[0] || "؟"}
                  </div>
                  <span className="text-sm text-gray-800 font-medium flex-1">{p.username}</span>
                  {p.userId === room.hostUserId && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">مضيف</span>
                  )}
                  {p.userId === userId && p.userId !== room.hostUserId && (
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">أنت</span>
                  )}
                  <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" title="متصل" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="fixed right-0 left-0 p-4 bg-white/95 backdrop-blur border-t border-gray-100 flex flex-col gap-2 max-w-lg mx-auto bottom-16 md:bottom-0">
          {scheduledPassed || room.status === "playing" || room.status === "starting" ? (
            <button
              onClick={goToGame}
              className="w-full py-3.5 bg-green-600 text-white rounded-xl font-bold text-base hover:bg-green-700 transition-colors shadow-sm flex items-center justify-center gap-2"
              data-testid="btn-go-to-game"
            >
              <Zap className="w-5 h-5" />
              ابدأ المباراة الآن!
            </button>
          ) : isRegistered ? (
            <div className="flex gap-2">
              <div className="flex-1 py-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-semibold text-center">
                ✅ أنت مسجل في هذه الجلسة
              </div>
              {!isHost && (
                <button
                  onClick={handleUnregister}
                  className="px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                  data-testid="btn-unregister"
                >
                  إلغاء
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handleRegister}
              disabled={registering || room.participants.length >= room.maxParticipants}
              className="w-full py-3.5 bg-green-600 text-white rounded-xl font-bold text-base hover:bg-green-700 transition-colors disabled:opacity-60 shadow-sm"
              data-testid="btn-register"
            >
              {registering ? "جاري التسجيل..." : room.participants.length >= room.maxParticipants ? "الغرفة ممتلئة" : "سجّل مكانك في الجلسة"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
