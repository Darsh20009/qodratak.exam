import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowRight, Send, Bot, User, Sparkles, RefreshCw, BookOpen, TrendingUp, Calendar, Lightbulb, Copy, Check } from "lucide-react";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_ACTIONS = [
  { label: "📊 حلّل أدائي", prompt: "حلّل أدائي في القياس واخبرني عن نقاط ضعفي وقوتي بناءً على ما تعرفه عني", icon: TrendingUp },
  { label: "🎯 خطة دراسة", prompt: "أنشئ لي خطة دراسية أسبوعية لرفع درجتي في القياس. لدي 3 ساعات يومياً", icon: Calendar },
  { label: "💡 نصائح القياس", prompt: "اعطني أهم 5 نصائح عملية لرفع درجة اختبار القياس", icon: Lightbulb },
  { label: "📚 القسم اللفظي", prompt: "شرح أنواع أسئلة القسم اللفظي في القياس مع أمثلة وأسلوب الحل", icon: BookOpen },
  { label: "🔢 القسم الكمي", prompt: "شرح أنواع أسئلة القسم الكمي في القياس مع الاستراتيجيات المثلى للحل", icon: BookOpen },
  { label: "⏱️ إدارة الوقت", prompt: "ما أفضل استراتيجية لإدارة الوقت في اختبار القياس؟ كيف أوزع الوقت على الأسئلة؟", icon: RefreshCw },
];

const WELCOME_MESSAGE = `مرحباً! أنا **مساعد قدراتك** 🤖

أنا هنا لمساعدتك في رحلتك نحو النجاح في اختبار القدرات (قياس). يمكنني:

- 📊 **تحليل أدائك** وتحديد نقاط ضعفك وقوتك
- 💡 **شرح الأسئلة** التي أخطأت فيها بالتفصيل
- 🎯 **إنشاء خطط دراسية** مخصصة لك
- 📚 **شرح المفاهيم** في القسم اللفظي والكمي
- ⚡ **تقديم نصائح** وإستراتيجيات لرفع درجتك

اختر إحدى الأسئلة السريعة أو اكتب سؤالك مباشرة! 🚀`;

function MessageBubble({ msg, onCopy }: { msg: Message; onCopy: (text: string) => void }) {
  const [copied, setCopied] = useState(false);
  const isAI = msg.role === 'assistant';

  const handleCopy = () => {
    onCopy(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContent = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className={`flex gap-3 ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
      <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-sm ${
        isAI ? 'bg-gradient-to-br from-green-500 to-teal-500' : 'bg-gradient-to-br from-slate-600 to-slate-700'
      }`}>
        {isAI ? <Bot className="w-5 h-5 text-white" /> : <User className="w-4 h-4 text-white" />}
      </div>
      <div className={`max-w-[80%] group relative ${isAI ? '' : ''}`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line shadow-sm ${
          isAI
            ? 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm'
            : 'bg-gradient-to-br from-teal-600 to-emerald-500 text-white rounded-tr-sm'
        }`}>
          {renderContent(msg.content)}
        </div>
        <div className={`flex items-center gap-2 mt-1 ${isAI ? '' : 'flex-row-reverse'}`}>
          <span className="text-[10px] text-slate-400">
            {msg.timestamp.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isAI && (
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600"
              title="نسخ"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AiTutorPage() {
  const [, navigate] = useLocation();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: WELCOME_MESSAGE, timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const chatMutation = useMutation({
    mutationFn: async (userMessages: { role: 'user' | 'assistant'; content: string }[]) => {
      const res = await apiRequest('POST', '/api/ai/chat', { messages: userMessages });
      return res.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply || 'عذراً، لم أتمكن من الإجابة.',
        timestamp: new Date()
      }]);
    },
    onError: () => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.',
        timestamp: new Date()
      }]);
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatMutation.isPending]);

  const sendMessage = (text: string = input.trim()) => {
    if (!text || chatMutation.isPending) return;
    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const history = [...messages, userMsg]
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: m.content }));
    chatMutation.mutate(history);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: WELCOME_MESSAGE, timestamp: new Date() }]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-teal-600/30 to-emerald-500/20" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            data-testid="btn-back-ai"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5 flex-1">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-slate-800 text-sm">مساعد قدراتك</h1>
                <Sparkles className="w-3.5 h-3.5 text-teal-700" />
              </div>
              <p className="text-[10px] text-emerald-500 font-medium">متصل الآن</p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
            title="محادثة جديدة"
            data-testid="btn-clear-chat"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} onCopy={copyToClipboard} />
          ))}

          {/* Loading indicator */}
          {chatMutation.isPending && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center shadow-sm flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1.5 items-center">
                  <div className="w-2 h-2 bg-teal-100 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-teal-100 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-teal-100 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="max-w-3xl mx-auto px-4 pb-2 w-full">
          <p className="text-xs text-slate-400 mb-2 text-center">أسئلة سريعة</p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map((action, i) => (
              <button
                key={i}
                onClick={() => sendMessage(action.prompt)}
                disabled={chatMutation.isPending}
                className="text-right px-3 py-2.5 bg-white border border-slate-200 hover:border-teal-400 hover:bg-teal-100 rounded-xl text-xs font-medium text-slate-700 transition-all shadow-sm disabled:opacity-50"
                data-testid={`btn-quick-action-${i}`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-slate-100 shadow-t-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex gap-2 items-end bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-green-500 transition-all px-3 py-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب سؤالك هنا..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-slate-800 resize-none outline-none placeholder:text-slate-400 max-h-32"
              style={{ height: 'auto', minHeight: '24px' }}
              onInput={e => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = 'auto';
                t.style.height = Math.min(t.scrollHeight, 128) + 'px';
              }}
              disabled={chatMutation.isPending}
              data-testid="input-ai-message"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || chatMutation.isPending}
              className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-teal-500 hover:from-green-500 hover:to-teal-500 disabled:from-slate-300 disabled:to-slate-400 rounded-xl flex items-center justify-center transition-all shadow-sm disabled:shadow-none"
              data-testid="btn-send-ai"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-1.5">Enter للإرسال • Shift+Enter لسطر جديد</p>
        </div>
      </div>
    </div>
  );
}
