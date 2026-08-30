import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, Send, Users, Circle, Search, Headphones } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

interface Conversation {
  userId: string;
  userName: string;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
}

export default function ChatPage() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/ws/chat`);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      ws.send(JSON.stringify({ type: 'auth', userId: 'admin', role: 'admin', userName: 'الدعم الفني' }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_message' && data.message) {
          const msg = data.message;
          if (selectedUser && (msg.fromUserId === selectedUser || msg.toUserId === selectedUser)) {
            setMessages(prev => prev.find(m => m._id === msg._id) ? prev : [...prev, msg]);
          }
          fetchConversations();
        }
      } catch {}
    };

    ws.onclose = () => {
      setWsConnected(false);
      reconnectTimeout.current = setTimeout(connectWebSocket, 3000);
    };
    ws.onerror = () => ws.close();
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/admin/chat/conversations', { credentials: 'include' });
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch {}
  };

  const fetchMessages = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/chat/messages/${userId}`, { credentials: 'include' });
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {}
  };

  useEffect(() => {
    connectWebSocket();
    fetchConversations();
    const interval = setInterval(fetchConversations, 15000);
    return () => {
      clearInterval(interval);
      clearTimeout(reconnectTimeout.current);
      wsRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (selectedUser) fetchMessages(selectedUser);
  }, [selectedUser]);

  const handleSelectUser = (userId: string, userName: string) => {
    setSelectedUser(userId);
    setSelectedUserName(userName);
    fetchMessages(userId);
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedUser || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);

    const tempMsg: ChatMessage = {
      fromUserId: 'admin',
      fromUserName: 'الدعم الفني',
      fromUserRole: 'admin',
      toUserId: selectedUser,
      content,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'message',
          fromUserName: 'الدعم الفني',
          toUserId: selectedUser,
          content,
        }));
      } else {
        await fetch('/api/admin/chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ toUserId: selectedUser, content }),
        });
      }
    } catch {} finally {
      setSending(false);
      fetchConversations();
    }
  };

  const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

  const filtered = conversations.filter(c =>
    c.userName.includes(search) || c.lastMessage.includes(search)
  );

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700" dir="rtl">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 bg-white dark:bg-gray-800 border-l border-gray-100 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <Headphones className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white text-sm">الدعم الفني</h2>
              <div className="flex items-center gap-1">
                <Circle className={`w-2 h-2 fill-current ${wsConnected ? 'text-green-500' : 'text-gray-400'}`} />
                <span className="text-xs text-gray-400">{wsConnected ? 'متصل' : 'غير متصل'}</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              placeholder="بحث..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-8 h-8 text-xs"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-6 text-center">
              <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">لا توجد محادثات</p>
            </div>
          ) : (
            filtered.map(conv => (
              <button
                key={conv.userId}
                onClick={() => handleSelectUser(conv.userId, conv.userName)}
                className={`w-full p-3 text-right hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-50 dark:border-gray-700/50 ${
                  selectedUser === conv.userId ? 'bg-teal-50 dark:bg-teal-900/20 border-l-2 border-l-indigo-500' : ''
                }`}
                data-testid={`button-conv-${conv.userId}`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-green-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {conv.userName[0] || '؟'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{conv.userName}</span>
                      {conv.unreadCount > 0 && (
                        <Badge className="h-4 w-4 rounded-full p-0 text-xs bg-teal-600 flex items-center justify-center">{conv.unreadCount}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{conv.lastMessage}</p>
                    <p className="text-xs text-gray-300 mt-0.5">{conv.lastTime}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedUser ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-green-500 flex items-center justify-center text-white font-bold">
              {selectedUserName[0] || '؟'}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{selectedUserName}</p>
              <p className="text-xs text-gray-400">طالب</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-gray-50 dark:bg-gray-800/50">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">لا توجد رسائل بعد</p>
                </div>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isAdmin = msg.fromUserRole === 'admin';
                return (
                  <div key={msg._id || i} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'} mb-1`}>
                    <div className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${
                      isAdmin
                        ? 'bg-gradient-to-br from-teal-600 to-green-600 text-white rounded-tl-sm'
                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tr-sm shadow-sm'
                    }`}>
                      {msg.content}
                      <p className={`text-xs mt-0.5 opacity-70 ${isAdmin ? 'text-white/70 text-left' : 'text-gray-400 text-right'}`}>
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="اكتب ردك..."
                className="flex-1 h-9 text-sm"
                disabled={sending}
                data-testid="input-admin-chat-message"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="h-9 w-9 bg-teal-600 hover:bg-teal-700 flex-shrink-0"
                data-testid="button-admin-send"
              >
                <Send className="w-4 h-4 rotate-180" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50">
          <div className="text-center">
            <div className="w-20 h-20 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-9 h-9 text-teal-500" />
            </div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">اختر محادثة</h3>
            <p className="text-sm text-gray-400">اختر طالباً من القائمة للرد على رسائله</p>
          </div>
        </div>
      )}
    </div>
  );
}
