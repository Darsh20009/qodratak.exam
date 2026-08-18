import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Bot, X, Send, Sparkles, Maximize2, EyeOff, Eye } from "lucide-react";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const HIDDEN_ROUTES = ['/ai-tutor', '/scheduled-exam', '/login', '/signup'];

const BADGE_STATES = [
  { icon: 'logo',    line1: 'قدراتك',        line2: 'المنصة الشاملة للقياس' },
  { icon: 'bot',     line1: 'المساعد الذكي', line2: 'اسألني أي سؤال' },
];

export default function AiFloatingButton() {
  const [location, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [badgeIdx, setBadgeIdx] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('ai_badge_hidden') === '1');
  const [showReopenHint, setShowReopenHint] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'أهلاً! كيف يمكنني مساعدتك في القياس؟ 🎯' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isHidden = HIDDEN_ROUTES.some(r => location.startsWith(r));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Alternate badge text every 3.5s
  useEffect(() => {
    if (isOpen || dismissed) return;
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setBadgeIdx(i => (i + 1) % BADGE_STATES.length);
        setFadeIn(true);
      }, 280);
    }, 3500);
    return () => clearInterval(interval);
  }, [isOpen, dismissed]);

  const chatMutation = useMutation({
    mutationFn: async (msgs: Message[]) => {
      const res = await apiRequest('POST', '/api/ai/chat', { messages: msgs });
      return res.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'عذراً، حدث خطأ.' }]);
    },
    onError: () => {
      setMessages(prev => [...prev, { role: 'assistant', content: 'عذراً، حدث خطأ. حاول مرة أخرى.' }]);
    }
  });

  const send = () => {
    if (!input.trim() || chatMutation.isPending) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    chatMutation.mutate(updated);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('ai_badge_hidden', '1');
    setDismissed(true);
    setIsOpen(false);
    setShowReopenHint(false);
    window.dispatchEvent(new CustomEvent('aiButtonDismissed'));
  };

  const handleReopen = () => {
    sessionStorage.removeItem('ai_badge_hidden');
    setDismissed(false);
    setShowReopenHint(false);
    window.dispatchEvent(new CustomEvent('aiButtonShown'));
  };

  // Listen for reopen from header
  useEffect(() => {
    const onReopen = () => handleReopen();
    window.addEventListener('aiButtonReopenFromHeader', onReopen);
    return () => window.removeEventListener('aiButtonReopenFromHeader', onReopen);
  }, []);

  if (isHidden) return null;

  const state = BADGE_STATES[badgeIdx];

  return (
    <div className="fixed bottom-20 left-3 z-50 md:bottom-8 md:left-6 flex flex-col items-start gap-2" dir="rtl">

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="mb-2 w-80 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
          style={{ height: '380px' }}
        >
          <div className="bg-gradient-to-r from-green-500 to-teal-500 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-bold">مساعد قدراتك</span>
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setIsOpen(false); navigate('/ai-tutor'); }}
                className="text-white/70 hover:text-white transition-colors p-1"
                title="فتح الصفحة الكاملة"
                data-testid="btn-open-full-ai"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white transition-colors p-1"
                data-testid="btn-close-ai-panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  msg.role === 'assistant'
                    ? 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm shadow-sm'
                    : 'bg-gradient-to-br from-teal-600 to-emerald-500 text-white rounded-tr-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-white border border-slate-100 rounded-xl px-3 py-2 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-teal-100 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-teal-100 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-teal-100 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-2 bg-white border-t border-slate-100 flex-shrink-0">
            <div className="flex gap-2 items-center bg-slate-50 rounded-xl border border-slate-200 px-3 py-1.5 focus-within:border-teal-400 focus-within:ring-1 focus-within:ring-green-500 transition-all">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="اكتب سؤالك..."
                className="flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
                disabled={chatMutation.isPending}
                data-testid="input-ai-float"
              />
              <button
                onClick={send}
                disabled={!input.trim() || chatMutation.isPending}
                className="w-6 h-6 bg-gradient-to-br from-green-500 to-teal-500 hover:from-green-500 hover:to-teal-500 disabled:from-slate-300 disabled:to-slate-400 rounded-lg flex items-center justify-center transition-all"
                data-testid="btn-send-ai-float"
              >
                <Send className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main pill badge — hidden when dismissed */}
      {!dismissed && (
        <div className="relative flex items-stretch">
          {/* Pill button */}
          <button
            onClick={() => setIsOpen(v => !v)}
            data-testid="btn-toggle-ai-float"
            aria-label="مساعد قدراتك"
            className={`
              flex items-center gap-3 px-4 py-2.5 rounded-r-2xl rounded-l-none
              shadow-xl border border-white/20
              transition-all duration-300 active:scale-95
              ${isOpen
                ? 'bg-slate-700'
                : 'bg-gradient-to-l from-green-500 via-teal-600 to-emerald-600'
              }
            `}
            style={{ minWidth: '160px' }}
          >
            {isOpen ? (
              <div className="flex items-center gap-2 w-full justify-center">
                <X className="w-4 h-4 text-white" />
                <span className="text-white text-xs font-semibold">إغلاق المحادثة</span>
              </div>
            ) : (
              <div
                className="flex items-center gap-2.5 w-full"
                style={{
                  opacity: fadeIn ? 1 : 0,
                  transform: fadeIn ? 'translateY(0)' : 'translateY(4px)',
                  transition: 'opacity 0.28s ease, transform 0.28s ease',
                }}
              >
                {/* Icon */}
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  {state.icon === 'bot' ? (
                    <div className="relative">
                      <Bot className="w-4 h-4 text-white" />
                      <Sparkles className="w-2 h-2 text-yellow-300 absolute -top-0.5 -right-0.5" />
                    </div>
                  ) : (
                    <span className="text-white font-black text-sm leading-none">ق</span>
                  )}
                </div>
                {/* Text */}
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-white font-bold text-xs">{state.line1}</span>
                  <span className="text-white/70 text-[10px]">{state.line2}</span>
                </div>
              </div>
            )}
          </button>

          {/* Dismiss button — attached on the left side */}
          {!isOpen && (
            <button
              onClick={handleDismiss}
              data-testid="btn-dismiss-ai-badge"
              title="إخفاء"
              className="flex items-center justify-center w-7 rounded-l-2xl rounded-r-none bg-teal-100/80 hover:bg-teal-100 border-r border-white/10 transition-colors shadow-xl"
            >
              <EyeOff className="w-3 h-3 text-white/60 hover:text-white/90" />
            </button>
          )}

          {/* Subtle pulse */}
          {!isOpen && (
            <span
              className="absolute inset-0 rounded-2xl bg-teal-100 animate-ping opacity-10 pointer-events-none"
              style={{ animationDuration: '2.5s' }}
            />
          )}
        </div>
      )}
    </div>
  );
}
