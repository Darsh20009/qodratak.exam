import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Minimize2, Maximize2, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChatMessage {
  _id?: string;
  fromUserId: string;
  fromUserName: string;
  fromUserRole: 'student' | 'admin';
  toUserId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface SupportChatProps {
  userId: string;
  userName: string;
}

export default function SupportChat({ userId, userName }: SupportChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages]);

  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws/chat`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      ws.send(JSON.stringify({ type: 'auth', userId, role: 'student', userName }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_message' && data.message) {
          const msg = data.message;
          if (msg.fromUserRole === 'admin' || msg.toUserId === userId) {
            setMessages(prev => {
              if (prev.find(m => m._id === msg._id)) return prev;
              return [...prev, msg];
            });
            if (!isOpen || isMinimized) {
              setUnreadCount(c => c + 1);
            }
          }
        }
      } catch {}
    };

    ws.onclose = () => {
      setWsConnected(false);
      reconnectTimeout.current = setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  };

  useEffect(() => {
    connectWebSocket();
    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(reconnectTimeout.current);
      wsRef.current?.close();
    };
  }, [userId]);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch(`/api/chat/unread-count?userId=${userId}`, { credentials: 'include' });
      const data = await res.json();
      setUnreadCount(data.count || 0);
    } catch {}
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat/messages?userId=${userId}`, { credentials: 'include' });
      const data = await res.json();
      setMessages(data.messages || []);
      setUnreadCount(0);
    } catch {}
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
    fetchMessages();
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const content = input.trim();
    setInput('');
    setSending(true);

    const tempMsg: ChatMessage = {
      fromUserId: userId,
      fromUserName: userName,
      fromUserRole: 'student',
      toUserId: 'admin',
      content,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'message',
          fromUserName: userName,
          content,
        }));
      } else {
        await fetch('/api/chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ fromUserId: userId, fromUserName: userName, content }),
        });
      }
    } catch {
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'اليوم';
    if (date.toDateString() === yesterday.toDateString()) return 'أمس';
    return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
  };

  const groupedMessages = messages.reduce((groups: Record<string, ChatMessage[]>, msg) => {
    const date = formatDate(msg.createdAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-20 left-6 md:bottom-6 z-50 w-14 h-14 bg-gradient-to-br from-teal-600 to-emerald-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
        data-testid="button-open-chat"
      >
        <Headphones className="w-6 h-6 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-20 left-6 md:bottom-6 z-50 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col transition-all duration-300 ${
        isMinimized ? 'h-14' : 'h-[480px]'
      }`}
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-t-2xl flex-shrink-0">
        <div className="relative">
          <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
            <Headphones className="w-4 h-4 text-white" />
          </div>
          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${wsConnected ? 'bg-green-400' : 'bg-gray-400'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">الدعم الفني</p>
          <p className="text-white/70 text-xs">{wsConnected ? 'متصل' : 'غير متصل'} · عادةً يرد خلال ساعات</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(m => !m)}
            className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            data-testid="button-minimize-chat"
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5 text-white" /> : <Minimize2 className="w-3.5 h-3.5 text-white" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            data-testid="button-close-chat"
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1 bg-gray-50 dark:bg-gray-800/50">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="w-16 h-16 bg-teal-100 dark:bg-teal-100/30 rounded-full flex items-center justify-center mb-3">
                  <MessageCircle className="w-7 h-7 text-teal-700" />
                </div>
                <p className="font-semibold text-gray-700 dark:text-gray-300 text-sm">مرحباً بك في الدعم الفني</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-[200px]">
                  أرسل رسالتك وسيرد عليك فريق الدعم في أقرب وقت
                </p>
              </div>
            )}

            {Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date}>
                <div className="text-center my-3">
                  <span className="text-xs text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">{date}</span>
                </div>
                {msgs.map((msg, i) => {
                  const isMe = msg.fromUserRole === 'student';
                  return (
                    <div key={msg._id || i} className={`flex ${isMe ? 'justify-start' : 'justify-end'} mb-1`}>
                      <div className={`max-w-[75%] ${isMe ? 'order-2' : 'order-1'}`}>
                        {!isMe && (
                          <p className="text-xs text-teal-700 font-medium mb-0.5 text-left px-1">الدعم الفني</p>
                        )}
                        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tr-sm shadow-sm'
                            : 'bg-gradient-to-br from-teal-600 to-emerald-600 text-white rounded-tl-sm'
                        }`}>
                          {msg.content}
                        </div>
                        <p className={`text-xs text-gray-400 mt-0.5 px-1 ${isMe ? 'text-right' : 'text-left'}`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 rounded-b-2xl flex-shrink-0">
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="اكتب رسالتك..."
                className="flex-1 text-sm h-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded-xl"
                disabled={sending}
                data-testid="input-chat-message"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="h-9 w-9 bg-teal-100 hover:bg-teal-100 rounded-xl flex-shrink-0"
                data-testid="button-send-message"
              >
                <Send className="w-4 h-4 rotate-180" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
