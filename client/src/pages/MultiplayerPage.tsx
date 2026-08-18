import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Gamepad2, Users, Plus, ArrowLeft, Zap, Trophy, Clock,
  Copy, Check, RefreshCw, Play, Star, Globe, Lock, Settings,
  ChevronRight, Sparkles, Rocket, Sliders
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PublicEvent {
  _id: string;
  code: string;
  title: string;
  hostUsername: string;
  questionCount: number;
  timePerQuestion: number;
  participants: any[];
  maxParticipants: number;
  status: string;
  createdAt: string;
}

export default function MultiplayerPage() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<'join' | 'create'>('join');
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [createForm, setCreateForm] = useState({
    title: '',
    questionCount: 10,
    timePerQuestion: 30,
    maxParticipants: 20,
    isPublicEvent: false,
    category: 'mixed',
    difficulty: 'all',
  });

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();
  const userId = user?.id || user?._id || '';
  const username = user?.username || user?.name || 'ضيف';

  const { data: events = [], refetch: refetchEvents } = useQuery<PublicEvent[]>({
    queryKey: ['/api/multiplayer/events'],
    queryFn: async () => {
      const res = await fetch('/api/multiplayer/events');
      return res.ok ? res.json() : [];
    },
    refetchInterval: 10000,
  });

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) { setError('الرمز يجب أن يكون 6 أحرف'); return; }
    setJoining(true);
    setError('');
    try {
      const res = await fetch(`/api/multiplayer/rooms/${code}`);
      if (!res.ok) { setError('الغرفة غير موجودة أو انتهت'); return; }
      const room = await res.json();
      if (room.status === 'finished') { setError('انتهى هذا الاختبار'); return; }
      navigate(`/multiplayer/room/${code}`);
    } catch {
      setError('فشل الاتصال. حاول مرة أخرى');
    } finally {
      setJoining(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.title.trim()) { setError('أدخل عنوان الاختبار'); return; }
    if (!userId) { setError('يجب تسجيل الدخول أولاً'); return; }
    setCreating(true);
    setError('');
    try {
      const typeParam = createForm.category !== 'mixed' ? createForm.category : 'mixed';
      const questionsRes = await fetch(`/api/questions/random?count=${createForm.questionCount}&type=${typeParam}`);
      let questions = [];
      if (questionsRes.ok) {
        const data = await questionsRes.json();
        questions = (data.questions || data || []).slice(0, createForm.questionCount).map((q: any) => ({
          id: q._id || q.id,
          text: q.question || q.text,
          options: q.options || q.choices || [],
          correctAnswer: q.correctOptionIndex ?? q.correctAnswer ?? q.answer ?? 0,
          type: q.type || 'multiple_choice'
        }));
      }

      if (questions.length < 2) {
        const dummy = Array.from({ length: createForm.questionCount }, (_, i) => ({
          id: `q${i}`, text: `سؤال ${i + 1}: ما هو ناتج ${i + 2} × ${i + 3}؟`,
          options: [`${(i + 2) * (i + 3)}`, `${(i + 2) * (i + 3) + 1}`, `${(i + 2) * (i + 3) - 1}`, `${(i + 2) * (i + 3) + 5}`],
          correctAnswer: 0, type: 'multiple_choice'
        }));
        questions = dummy;
      }

      const res = await fetch('/api/multiplayer/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostUserId: userId,
          hostUsername: username,
          title: createForm.title,
          questions,
          timePerQuestion: createForm.timePerQuestion,
          isPublicEvent: createForm.isPublicEvent,
          maxParticipants: createForm.maxParticipants,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'فشل إنشاء الغرفة'); return; }
      navigate(`/multiplayer/room/${data.room.code}`);
    } catch (e) {
      setError('فشل إنشاء الغرفة. حاول مرة أخرى');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 via-white to-blue-50 p-4 pb-24" dir="rtl">
      <div className="max-w-4xl mx-auto py-4 sm:py-8">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold mb-4 shadow-lg shadow-pink-500/30">
            <Gamepad2 className="w-5 h-5" />
            <span>الاختبار الجماعي المباشر</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-gray-900 mb-2">تنافس مع أصدقائك</h1>
          <p className="text-gray-500 text-sm sm:text-lg">أنشئ غرفة أو انضم بالرمز — كل سؤال = نقاط!</p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-2xl bg-white border border-gray-200 p-1.5 mb-8 shadow-sm">
          {[
            { key: 'join', label: 'انضم بالرمز', icon: ArrowLeft },
            { key: 'create', label: 'أنشئ غرفة', icon: Plus },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                data-testid={`tab-${t.key}`}
                onClick={() => { setTab(t.key as any); setError(''); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all",
                  tab === t.key
                    ? "bg-gradient-to-r from-green-500 to-blue-600 text-white shadow-md"
                    : "text-gray-500 hover:text-gray-800"
                )}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm text-center">
            {error}
          </div>
        )}

        {/* JOIN TAB */}
        {tab === 'join' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <ArrowLeft className="w-5 h-5 text-teal-700" />
                انضم باستخدام رمز الغرفة
              </h2>
              <div className="flex gap-3">
                <input
                  data-testid="input-room-code"
                  type="text"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  placeholder="أدخل الرمز (6 أحرف)"
                  className="flex-1 px-5 py-4 rounded-2xl bg-gray-50 border border-gray-200 text-center text-2xl font-black tracking-[0.5em] text-gray-900 focus:outline-none focus:border-teal-400 transition"
                  maxLength={6}
                />
                <button
                  data-testid="button-join-room"
                  onClick={handleJoin}
                  disabled={joining || joinCode.length < 6}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold disabled:opacity-50 hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                >
                  {joining ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                  <span>انضم</span>
                </button>
              </div>
            </div>

            {/* Public Events */}
            {events.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-emerald-500" />
                    أحداث المنصة المفتوحة
                  </h3>
                  <button onClick={() => refetchEvents()} className="text-sm text-teal-700 flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5" />تحديث
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {events.map(ev => (
                    <div key={ev._id} data-testid={`event-card-${ev._id}`}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 cursor-pointer"
                      onClick={() => navigate(`/multiplayer/room/${ev.code}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-sm">{ev.title}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">بواسطة {ev.hostUsername}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                          {ev.status === 'waiting' ? 'ينتظر' : 'جاري'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{ev.participants?.length || 0}/{ev.maxParticipants}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{ev.timePerQuestion}ث</span>
                        <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" />{ev.questionCount} سؤال</span>
                      </div>
                      <div className="mt-3 font-mono text-center text-xl font-black text-teal-700 tracking-widest">{ev.code}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CREATE TAB */}
        {tab === 'create' && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-teal-700" />
              إنشاء غرفة اختبار مخصصة
            </h2>
            {!userId && (
              <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                ⚠️ يجب <a href="/login" className="underline font-bold">تسجيل الدخول</a> لإنشاء غرفة اختبار
              </div>
            )}
            <div className="space-y-6">

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">عنوان الاختبار *</label>
                <input
                  data-testid="input-room-title"
                  type="text"
                  value={createForm.title}
                  onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="مثال: اختبار القدرات اللفظية - المجموعة أ"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:border-teal-400 transition"
                />
              </div>

              {/* Question Count */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">عدد الأسئلة</label>
                  <span className="text-teal-700 font-black text-lg">{createForm.questionCount} سؤال</span>
                </div>
                <input
                  data-testid="range-question-count"
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={createForm.questionCount}
                  onChange={e => setCreateForm(f => ({ ...f, questionCount: +e.target.value }))}
                  className="w-full accent-green-600 h-2 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>5</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>100</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {[5, 10, 15, 20, 30, 40, 50, 75, 100].map(n => (
                    <button
                      key={n}
                      data-testid={`btn-qcount-${n}`}
                      onClick={() => setCreateForm(f => ({ ...f, questionCount: n }))}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-semibold transition-all",
                        createForm.questionCount === n
                          ? "bg-teal-600 text-white shadow-md"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Participants Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">أقصى عدد للطلاب</label>
                  <span className="text-blue-600 font-black text-lg">{createForm.maxParticipants} طالب</span>
                </div>
                <input
                  data-testid="range-max-participants"
                  type="range"
                  min={2}
                  max={50}
                  step={1}
                  value={createForm.maxParticipants}
                  onChange={e => setCreateForm(f => ({ ...f, maxParticipants: +e.target.value }))}
                  className="w-full accent-blue-600 h-2 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>2</span>
                  <span>10</span>
                  <span>20</span>
                  <span>30</span>
                  <span>40</span>
                  <span>50</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {[2, 5, 10, 15, 20, 25, 30, 40, 50].map(n => (
                    <button
                      key={n}
                      data-testid={`btn-maxp-${n}`}
                      onClick={() => setCreateForm(f => ({ ...f, maxParticipants: n }))}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-semibold transition-all",
                        createForm.maxParticipants === n
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Per Question */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">وقت السؤال</label>
                  <span className="text-emerald-600 font-black text-lg">{createForm.timePerQuestion} ثانية</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[10, 15, 20, 30, 45, 60, 90, 120].map(n => (
                    <button
                      key={n}
                      data-testid={`btn-time-${n}`}
                      onClick={() => setCreateForm(f => ({ ...f, timePerQuestion: n }))}
                      className={cn(
                        "px-3 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1",
                        createForm.timePerQuestion === n
                          ? "bg-emerald-600 text-white shadow-md"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {n}ث
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">نوع الأسئلة</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { v: 'verbal', l: '🔤 لفظي' },
                    { v: 'quantitative', l: '🔢 كمي' },
                    { v: 'mixed', l: '🎯 مختلط' },
                  ].map(opt => (
                    <button
                      key={opt.v}
                      data-testid={`button-category-${opt.v}`}
                      onClick={() => setCreateForm(f => ({ ...f, category: opt.v }))}
                      className={cn(
                        "py-3 rounded-xl font-semibold text-sm transition-all",
                        createForm.category === opt.v
                          ? "bg-teal-600 text-white shadow-md"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                      )}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-gradient-to-r from-green-500 to-blue-50 rounded-2xl border border-teal-400 p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">ملخص الغرفة</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Star className="w-4 h-4 text-teal-700" />
                    <span>{createForm.questionCount} سؤال</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span>حتى {createForm.maxParticipants} طالب</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    <span>{createForm.timePerQuestion}ث / سؤال</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>
                      {createForm.category === 'verbal' ? 'لفظي' : createForm.category === 'quantitative' ? 'كمي' : 'مختلط'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Public Toggle */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 cursor-pointer"
                onClick={() => setCreateForm(f => ({ ...f, isPublicEvent: !f.isPublicEvent }))}>
                <div className={cn("w-12 h-6 rounded-full transition-all flex items-center", createForm.isPublicEvent ? "bg-blue-600" : "bg-gray-300")}>
                  <div className={cn("w-5 h-5 rounded-full bg-white shadow transition-all mx-0.5", createForm.isPublicEvent ? "translate-x-6" : "translate-x-0")} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-500" />
                    حدث عام للمنصة
                  </p>
                  <p className="text-xs text-gray-500">يظهر للجميع في قائمة الأحداث المفتوحة</p>
                </div>
              </div>

              <button
                data-testid="button-create-room"
                onClick={handleCreate}
                disabled={creating || !userId}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold text-lg disabled:opacity-50 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
              >
                {creating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
                <span>{creating ? 'جاري الإنشاء...' : 'أنشئ الغرفة وابدأ'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
