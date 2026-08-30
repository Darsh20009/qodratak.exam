import { useState, useEffect, useRef, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import {
  Trophy, Users, Clock, CheckCircle, XCircle, Zap,
  Crown, Copy, Check, Share2, ArrowLeft, Star,
  Wifi, WifiOff, Play, RefreshCw, Medal, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Participant {
  userId: string;
  username: string;
  score: number;
  isReady: boolean;
  isOnline: boolean;
  answers: any[];
}

interface Question {
  text: string;
  options: string[];
}

type GamePhase = 'lobby' | 'starting' | 'question' | 'answer_feedback' | 'scores' | 'finished';

export default function MultiplayerRoom() {
  const [, params] = useRoute('/multiplayer/room/:code');
  const [, navigate] = useLocation();
  const code = params?.code?.toUpperCase() || '';

  const [connected, setConnected] = useState(false);
  const [phase, setPhase] = useState<GamePhase>('lobby');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [room, setRoom] = useState<any>(null);
  const [currentQ, setCurrentQ] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timeLimit, setTimeLimit] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [scores, setScores] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [countdown, setCountdown] = useState(3);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [myScore, setMyScore] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const answerStartRef = useRef<number>(Date.now());
  const wsRef = useRef<WebSocket | null>(null);
  const isMountedRef = useRef(true);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();
  const userId = user?.id || user?._id || `guest_${Math.random().toString(36).slice(2, 8)}`;
  const username = user?.username || user?.name || 'ضيف';

  const handleServerMessage = useCallback((msg: any) => {
    if (!isMountedRef.current) return;
    switch (msg.type) {
      case 'joined':
        setRoom(msg.room);
        setParticipants(msg.room?.participants || []);
        setPhase('lobby');
        break;
      case 'participant_joined':
        setParticipants(msg.participants || []);
        break;
      case 'participant_ready':
        setParticipants(msg.participants || []);
        break;
      case 'participant_disconnected':
        setParticipants(prev => prev.map(p => p.userId === msg.userId ? { ...p, isOnline: false } : p));
        break;
      case 'game_starting':
        setPhase('starting');
        setCountdown(msg.countdown || 3);
        const cdInterval = setInterval(() => {
          setCountdown(v => { if (v <= 1) { clearInterval(cdInterval); return 0; } return v - 1; });
        }, 1000);
        break;
      case 'question':
        setPhase('question');
        setCurrentQ(msg.question);
        setQuestionIndex(msg.questionIndex);
        setTotalQuestions(msg.total);
        setTimeLimit(msg.timeLimit);
        setTimeLeft(msg.timeLimit);
        setSelectedAnswer(null);
        setCorrectAnswer(null);
        setIsCorrect(null);
        answerStartRef.current = Date.now();
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setTimeLeft(v => {
            if (v <= 1) {
              clearInterval(timerRef.current!);
              return 0;
            }
            return v - 1;
          });
        }, 1000);
        break;
      case 'answer_result':
        if (timerRef.current) clearInterval(timerRef.current);
        setCorrectAnswer(msg.correctAnswer);
        setIsCorrect(msg.isCorrect);
        setEarnedPoints(msg.points);
        if (msg.isCorrect) setMyScore(s => s + msg.points);
        setPhase('answer_feedback');
        setTimeout(() => {
          if (isMountedRef.current) setPhase('scores');
        }, 2000);
        break;
      case 'scores_update':
        setScores(msg.scores || []);
        break;
      case 'game_over':
        if (timerRef.current) clearInterval(timerRef.current);
        setLeaderboard(msg.leaderboard || []);
        setPhase('finished');
        break;
      case 'error':
        setError(msg.message);
        break;
    }
  }, []);

  const connect = useCallback(() => {
    if (!isMountedRef.current) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/game`;
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      if (!isMountedRef.current) { socket.close(); return; }
      setConnected(true);
      setError('');
      socket.send(JSON.stringify({ type: 'join_room', code, userId, username }));
    };

    socket.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        handleServerMessage(msg);
      } catch {}
    };

    socket.onclose = () => {
      if (!isMountedRef.current) return;
      setConnected(false);
      reconnectTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) connect();
      }, 3000);
    };

    socket.onerror = () => {
      if (!isMountedRef.current) return;
      setConnected(false);
      setError('فشل الاتصال بالخادم. يعيد الاتصال...');
    };
  }, [code, userId, username, handleServerMessage]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();
    return () => {
      isMountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const sendReady = () => {
    wsRef.current?.send(JSON.stringify({ type: 'ready' }));
  };

  const startGame = () => {
    wsRef.current?.send(JSON.stringify({ type: 'start_game' }));
  };

  const submitAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    const timeMs = Date.now() - answerStartRef.current;
    wsRef.current?.send(JSON.stringify({ type: 'answer', questionIndex, selectedAnswer: index, timeMs }));
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const timerPercent = (timeLeft / timeLimit) * 100;
  const uniqueParticipants = participants.reduce((acc: Participant[], p) => {
    if (!acc.find(x => x.userId === p.userId)) acc.push(p);
    return acc;
  }, []);
  const myParticipant = uniqueParticipants.find(p => p.userId === userId);
  const isHost = room?.hostUserId === userId;

  // ── FINISHED PHASE ────────────────────────────────────────────────────────
  if (phase === 'finished') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-blue-900 flex flex-col items-center justify-center p-4" dir="rtl">
        <div className="max-w-xl w-full">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🏆</div>
            <h1 className="text-4xl font-black text-white mb-2">انتهى الاختبار!</h1>
            <p className="text-white/70">الترتيب النهائي</p>
          </div>
          <div className="space-y-3 mb-8">
            {leaderboard.map((p, i) => {
              const medals = ['🥇', '🥈', '🥉'];
              const isMe = p.userId === userId;
              return (
                <div key={i} className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl transition-all",
                  i === 0 ? "bg-yellow-500/20 border-2 border-yellow-400/50" :
                  i === 1 ? "bg-gray-400/10 border border-gray-500/30" :
                  i === 2 ? "bg-amber-700/10 border border-amber-700/30" :
                  "bg-white/5 border border-white/10",
                  isMe && "ring-2 ring-white/50"
                )}>
                  <span className="text-3xl">{medals[i] || `${i + 1}`}</span>
                  <div className="flex-1">
                    <p className="font-bold text-white">{p.username} {isMe && <span className="text-xs text-white/60">(أنت)</span>}</p>
                    <div className="w-full bg-white/10 rounded-full h-1.5 mt-1">
                      <div className="h-full bg-gradient-to-r from-green-400 to-blue-400 rounded-full" style={{ width: `${Math.min(100, (p.score / (leaderboard[0]?.score || 1)) * 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-xl font-black text-white">{p.score}</span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/multiplayer')} className="flex-1 py-3 rounded-2xl bg-white/10 text-white font-semibold hover:bg-white/20 transition flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />العودة
            </button>
            <button onClick={() => window.location.reload()} className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold hover:shadow-lg transition flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" />اختبار جديد
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── LOBBY PHASE ───────────────────────────────────────────────────────────
  if (phase === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-green-900 to-gray-950 p-4" dir="rtl">
        <div className="max-w-2xl mx-auto py-6 space-y-5">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/80 text-sm mb-4">
              {connected ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
              {connected ? 'متصل' : 'يتصل...'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">{room?.title || 'غرفة الاختبار'}</h1>
            <p className="text-white/60">في انتظار المشاركين...</p>
          </div>

          {/* Room Code */}
          <div className="bg-white/5 rounded-3xl border border-white/10 p-5 sm:p-6 text-center">
            <p className="text-white/60 text-sm mb-2">رمز الانضمام — شارك مع أصدقائك</p>
            <div className="flex items-center justify-center gap-4">
              <span className="text-4xl sm:text-5xl font-black tracking-[0.3em] text-white">{code}</span>
              <button onClick={copyCode} className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition">
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Participants */}
          <div className="bg-white/5 rounded-3xl border border-white/10 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                المشاركون ({uniqueParticipants.length}/{room?.maxParticipants || 50})
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {uniqueParticipants.map((p) => (
                <div key={p.userId} className={cn(
                  "flex items-center gap-2 p-2.5 sm:p-3 rounded-xl",
                  p.isReady ? "bg-emerald-500/20 border border-emerald-500/40" : "bg-white/5 border border-white/10"
                )}>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                    {p.username[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-xs font-medium truncate">{p.username}{p.userId === userId && ' (أنت)'}</p>
                    <p className={cn("text-[10px]", p.isReady ? "text-emerald-400" : "text-white/40")}>
                      {p.userId === room?.hostUserId ? '👑 مضيف' : p.isReady ? '✓ جاهز' : 'ينتظر...'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm text-center">{error}</div>}

          {/* Actions */}
          <div className="flex gap-3">
            {!isHost && (
              <button
                data-testid="button-ready"
                onClick={sendReady}
                disabled={myParticipant?.isReady}
                className={cn("flex-1 py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2",
                  myParticipant?.isReady
                    ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 cursor-default"
                    : "bg-white text-gray-900 hover:shadow-xl hover:scale-105"
                )}
              >
                {myParticipant?.isReady ? <><CheckCircle className="w-5 h-5" />جاهز!</> : 'أنا جاهز'}
              </button>
            )}
            {isHost && (
              <button
                data-testid="button-start-game"
                onClick={startGame}
                disabled={uniqueParticipants.length < 1}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold text-base disabled:opacity-50 hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                ابدأ الاختبار ({uniqueParticipants.length} مشارك)
              </button>
            )}
          </div>

          {/* Room info */}
          <div className="flex items-center justify-center gap-6 text-white/50 text-sm">
            <span className="flex items-center gap-1.5"><Star className="w-4 h-4" />{room?.questionCount || 0} سؤال</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{room?.timePerQuestion || 30}ث / سؤال</span>
          </div>
        </div>
      </div>
    );
  }

  // ── STARTING COUNTDOWN ────────────────────────────────────────────────────
  if (phase === 'starting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 to-blue-900 flex flex-col items-center justify-center" dir="rtl">
        <p className="text-white/70 text-xl mb-4">الاختبار يبدأ بعد</p>
        <div className="text-[120px] font-black text-white leading-none animate-bounce">{countdown}</div>
        <p className="text-white/50 mt-4">استعد!</p>
      </div>
    );
  }

  // ── QUESTION PHASE ────────────────────────────────────────────────────────
  if (phase === 'question' || phase === 'answer_feedback') {
    const timePercent = (timeLeft / timeLimit) * 100;
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-green-900 to-gray-950 flex flex-col p-3 sm:p-4" dir="rtl">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-3">
            <div className="text-white/60 text-sm">س {questionIndex + 1}/{totalQuestions}</div>
            <div className="h-1.5 w-24 sm:w-32 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all"
                style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="font-black text-white text-lg">{myScore}</span>
          </div>
        </div>

        {/* Timer */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <Clock className="w-4 h-4 text-white/60" />
            <span className={cn("text-2xl font-black", timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-white")}>{timeLeft}</span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-1000", timeLeft <= 5 ? "bg-red-500" : timeLeft <= 10 ? "bg-amber-500" : "bg-gradient-to-r from-green-500 to-blue-500")}
              style={{ width: `${timePercent}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-white/5 rounded-2xl sm:rounded-3xl border border-white/10 p-4 sm:p-6 mb-4 sm:mb-6 flex-1 flex flex-col justify-center min-h-[120px]">
          <p className="text-white text-base sm:text-xl font-semibold leading-relaxed text-center">{currentQ?.text}</p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
          {(currentQ?.options || []).map((opt, i) => {
            let state = 'idle';
            if (phase === 'answer_feedback') {
              if (i === correctAnswer) state = 'correct';
              else if (i === selectedAnswer && selectedAnswer !== correctAnswer) state = 'wrong';
            } else if (selectedAnswer === i) state = 'selected';

            return (
              <button
                key={i}
                data-testid={`option-${i}`}
                onClick={() => submitAnswer(i)}
                disabled={selectedAnswer !== null}
                className={cn(
                  "p-3 sm:p-4 rounded-xl sm:rounded-2xl font-semibold text-right transition-all text-sm leading-snug",
                  state === 'idle' && selectedAnswer === null && "bg-white/10 text-white hover:bg-white/20 hover:scale-[1.02] border border-white/10 active:scale-95",
                  state === 'idle' && selectedAnswer !== null && "bg-white/5 text-white/40 border border-white/5",
                  state === 'selected' && "bg-blue-500/30 border-2 border-blue-400 text-white",
                  state === 'correct' && "bg-emerald-500/30 border-2 border-emerald-400 text-emerald-300",
                  state === 'wrong' && "bg-red-500/30 border-2 border-red-400 text-red-300"
                )}
              >
                <span className="text-white/40 text-xs ml-2">{String.fromCharCode(65 + i)}.</span>
                {opt}
              </button>
            );
          })}
        </div>

        {/* Answer Feedback */}
        {phase === 'answer_feedback' && (
          <div className={cn("p-3 sm:p-4 rounded-xl sm:rounded-2xl text-center font-bold text-base sm:text-lg", isCorrect ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300")}>
            {isCorrect ? <><CheckCircle className="inline w-5 h-5 mr-2" />صحيح! +{earnedPoints} نقطة</> : <><XCircle className="inline w-5 h-5 mr-2" />خطأ</>}
          </div>
        )}

        {/* Live Scores */}
        {(phase as string) === 'scores' && scores.length > 0 && (
          <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
            <p className="text-white/60 text-xs mb-2 text-center">الترتيب الحالي</p>
            <div className="space-y-1.5">
              {scores.slice(0, 5).map((s, i) => (
                <div key={s.userId} className={cn("flex items-center gap-2", s.userId === userId && "text-green-400")}>
                  <span className="text-white/40 text-xs w-4">{i + 1}</span>
                  <span className="text-white text-xs flex-1 truncate">{s.username}</span>
                  <span className="font-bold text-white text-sm">{s.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center" dir="rtl">
      <div className="text-center text-white">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-400" />
        <p>جاري الاتصال بالغرفة...</p>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>
    </div>
  );
}
