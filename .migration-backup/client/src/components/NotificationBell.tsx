import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Bell, X, CheckCheck, ExternalLink, Sparkles, Trophy, Calendar, Info, AlertTriangle, Zap } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface Notification {
  _id: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'exam' | 'achievement' | 'event';
  icon?: string;
  link?: string;
  isRead: boolean;
  isGlobal: boolean;
  sentBy: string;
  createdAt: string;
}

const typeConfig = {
  info:        { icon: Info,        color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-950/40',    border: 'border-blue-200 dark:border-blue-800' },
  success:     { icon: CheckCheck,  color: 'text-emerald-500',bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800' },
  warning:     { icon: AlertTriangle,color:'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-950/40',  border: 'border-amber-200 dark:border-amber-800' },
  exam:        { icon: Calendar,    color: 'text-teal-700', bg: 'bg-teal-100 dark:bg-teal-100/40',border: 'border-teal-400 dark:border-teal-400' },
  achievement: { icon: Trophy,      color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/40',border: 'border-yellow-200 dark:border-yellow-800' },
  event:       { icon: Zap,         color: 'text-amber-700',   bg: 'bg-amber-100 dark:bg-amber-100/40',   border: 'border-pink-200 dark:border-pink-800' },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} ساعة`;
  return `منذ ${Math.floor(hrs / 24)} يوم`;
}

interface Props { userId: string | null; }

export default function NotificationBell({ userId }: Props) {
  const [open, setOpen] = useState(false);
  const [animating, setAnimating] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/notifications/in-app', userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(`/api/notifications/in-app/${userId}`);
      return res.ok ? res.json() : [];
    },
    enabled: !!userId,
    refetchInterval: 15000,
  });

  const unread = notifications.filter(n => !n.isRead).length;

  const markRead = useMutation({
    mutationFn: (id: string) => apiRequest('PATCH', `/api/notifications/in-app/${id}/read`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/notifications/in-app', userId] }),
  });

  const markAll = useMutation({
    mutationFn: () => apiRequest('PATCH', `/api/notifications/in-app/mark-all-read/${userId}`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/notifications/in-app', userId] }),
  });

  // Real-time WS listener
  useEffect(() => {
    const onMessage = (e: CustomEvent) => {
      if (e.detail?.type === 'new_notification') {
        qc.invalidateQueries({ queryKey: ['/api/notifications/in-app', userId] });
        setAnimating(true);
        setTimeout(() => setAnimating(false), 1000);
      }
    };
    window.addEventListener('ws_notification' as any, onMessage);
    return () => window.removeEventListener('ws_notification' as any, onMessage);
  }, [userId, qc]);

  // Animate bell when new notification
  useEffect(() => {
    if (unread > 0) {
      setAnimating(true);
      const t = setTimeout(() => setAnimating(false), 800);
      return () => clearTimeout(t);
    }
  }, [unread]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Push notification setup
  useEffect(() => {
    if (!userId) return;
    const setup = async () => {
      try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') return;

        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (existing) return;

        const keyRes = await fetch('/api/notifications/vapid-public-key');
        const { publicKey } = await keyRes.json();
        if (!publicKey) return;

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        await apiRequest('POST', '/api/notifications/subscribe', { subscription: sub.toJSON(), userId });
      } catch (e) {
        console.warn('Push setup failed:', e);
      }
    };
    setup();
  }, [userId]);

  if (!userId) return null;

  return (
    <div ref={panelRef} className="relative" dir="rtl">
      <button
        data-testid="button-notifications"
        onClick={() => setOpen(v => !v)}
        className={cn(
          "relative p-2 rounded-xl transition-all duration-300",
          "hover:bg-white/20 dark:hover:bg-white/10",
          animating && "animate-bounce"
        )}
      >
        <Bell className={cn("w-5 h-5", unread > 0 ? "text-amber-400" : "text-gray-500 dark:text-gray-400")} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 animate-pulse">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className={cn(
          "absolute top-12 right-0 w-96 max-h-[520px] rounded-2xl shadow-2xl z-50",
          "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700",
          "flex flex-col overflow-hidden",
          "animate-in slide-in-from-top-2 duration-200"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-green-500 to-blue-500">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-white" />
              <span className="font-bold text-white text-base">الإشعارات</span>
              {unread > 0 && (
                <span className="bg-white/25 text-white text-xs rounded-full px-2 py-0.5">{unread} جديد</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={() => markAll.mutate()}
                  className="text-white/80 hover:text-white text-xs flex items-center gap-1 transition"
                  title="تحديد الكل كمقروء"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>الكل</span>
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto max-h-80 flex-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Sparkles className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">لا توجد إشعارات بعد</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {notifications.map(notif => {
                  const cfg = typeConfig[notif.type] || typeConfig.info;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={notif._id}
                      data-testid={`notification-item-${notif._id}`}
                      className={cn(
                        "flex gap-3 p-4 cursor-pointer transition-all",
                        !notif.isRead ? cn(cfg.bg, "hover:brightness-95") : "hover:bg-gray-50 dark:hover:bg-gray-800/50",
                      )}
                      onClick={() => {
                        if (!notif.isRead) markRead.mutate(notif._id);
                        if (notif.link) { window.location.href = notif.link; setOpen(false); }
                      }}
                    >
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5", cfg.bg, cfg.border, "border")}>
                        <Icon className={cn("w-4 h-4", cfg.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn("text-sm font-semibold leading-snug", !notif.isRead ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400")}>
                            {notif.title}
                          </p>
                          {!notif.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{notif.body}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[10px] text-gray-400">{timeAgo(notif.createdAt)}</span>
                          {notif.link && <ExternalLink className="w-3 h-3 text-gray-400" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
            <button
              data-testid="link-all-notifications"
              onClick={() => { setOpen(false); window.location.href = '/notifications'; }}
              className="w-full text-center text-sm text-teal-700 dark:text-teal-700 hover:underline font-medium py-1"
            >
              عرض جميع الإشعارات
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from(Array.from(raw).map(c => c.charCodeAt(0)));
}
