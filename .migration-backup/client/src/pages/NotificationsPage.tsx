import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import {
  Bell, CheckCheck, Trash2, Info, Trophy, Calendar,
  AlertTriangle, Zap, Sparkles, ArrowRight, Filter
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Notification {
  _id: string;
  title: string;
  body: string;
  type: string;
  link?: string;
  icon?: string;
  isRead: boolean;
  isGlobal: boolean;
  createdAt: string;
}

// ── Icon/style map ────────────────────────────────────────────────────────────
const typeConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  info:        { icon: Info,         color: "text-blue-500",   bg: "bg-blue-50 dark:bg-blue-900/20",        label: "معلومة" },
  success:     { icon: Trophy,       color: "text-emerald-500",bg: "bg-emerald-50 dark:bg-emerald-900/20",  label: "إنجاز" },
  warning:     { icon: AlertTriangle,color: "text-amber-500",  bg: "bg-amber-50 dark:bg-amber-900/20",      label: "تنبيه" },
  exam:        { icon: Calendar,     color: "text-teal-700", bg: "bg-teal-100 dark:bg-teal-100/20",    label: "اختبار" },
  achievement: { icon: Trophy,       color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20",    label: "إنجاز" },
  event:       { icon: Zap,          color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20",    label: "فعالية" },
  promo:       { icon: Sparkles,     color: "text-amber-700",   bg: "bg-amber-100 dark:bg-amber-100/20",        label: "عرض" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "الآن";
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `منذ ${hrs} ساعة`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `منذ ${days} يوم`;
  return new Date(dateStr).toLocaleDateString('ar-SA');
}

// ── Notification Card ─────────────────────────────────────────────────────────
function NotifCard({ notif, onRead, onDelete }: {
  notif: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [, navigate] = useLocation();
  const cfg = typeConfig[notif.type] || typeConfig.info;
  const Icon = cfg.icon;

  const handleClick = () => {
    if (!notif.isRead) onRead(notif._id);
    if (notif.link) navigate(notif.link);
  };

  return (
    <div
      data-testid={`notification-card-${notif._id}`}
      className={cn(
        "group flex gap-4 p-5 rounded-2xl border transition-all duration-200 cursor-pointer",
        notif.isRead
          ? "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-70"
          : cn(cfg.bg, "border-transparent shadow-sm"),
        "hover:shadow-md hover:scale-[1.01]"
      )}
      onClick={handleClick}
      dir="rtl"
    >
      {/* Icon */}
      <div className={cn(
        "w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0",
        "border",
        notif.isRead ? "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700" : cn(cfg.bg, "border-transparent")
      )}>
        <Icon className={cn("w-5 h-5", notif.isRead ? "text-gray-400" : cfg.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            "text-sm font-bold leading-snug",
            notif.isRead ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white"
          )}>
            {notif.title}
          </p>
          <div className="flex items-center gap-1 flex-shrink-0">
            {!notif.isRead && <div className="w-2 h-2 rounded-full bg-blue-500" />}
          </div>
        </div>
        <p className={cn(
          "text-sm mt-1 leading-relaxed",
          notif.isRead ? "text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-300"
        )}>
          {notif.body}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-gray-400">{timeAgo(notif.createdAt)}</span>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {!notif.isRead && (
              <button
                data-testid={`button-mark-read-${notif._id}`}
                onClick={(e) => { e.stopPropagation(); onRead(notif._id); }}
                className="text-[11px] text-blue-500 hover:text-blue-700 flex items-center gap-1"
              >
                <CheckCheck className="w-3 h-3" /> مقروء
              </button>
            )}
            <button
              data-testid={`button-delete-notif-${notif._id}`}
              onClick={(e) => { e.stopPropagation(); onDelete(notif._id); }}
              className="text-[11px] text-red-400 hover:text-red-600 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
            </button>
            {notif.link && (
              <ArrowRight className="w-3 h-3 text-gray-400" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const qc = useQueryClient();

  const userId = (() => {
    try {
      const u = localStorage.getItem('user') || sessionStorage.getItem('user');
      return u ? JSON.parse(u)?.id || JSON.parse(u)?._id : null;
    } catch { return null; }
  })();

  const { data: rawNotifs = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications/in-app', userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(`/api/notifications/in-app/${userId}?limit=100`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!userId,
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => apiRequest('PATCH', `/api/notifications/in-app/${id}/read`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/notifications/in-app', userId] }),
  });

  const markAll = useMutation({
    mutationFn: () => apiRequest('PATCH', `/api/notifications/in-app/mark-all-read/${userId}`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/notifications/in-app', userId] }),
  });

  const deleteNotif = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/notifications/in-app/${id}`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/notifications/in-app', userId] }),
  });

  const notifications = rawNotifs
    .filter(n => filter === 'all' || !n.isRead)
    .filter(n => typeFilter === 'all' || n.type === typeFilter);

  const unreadCount = rawNotifs.filter(n => !n.isRead).length;
  const typeLabels = Object.entries(typeConfig).map(([k, v]) => ({ key: k, label: v.label }));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center shadow-lg">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">الإشعارات</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{unreadCount} غير مقروء</p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            data-testid="button-mark-all-read"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="flex items-center gap-2 text-sm text-teal-700 dark:text-teal-700 hover:underline font-medium disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4" />
            تحديد الكل كمقروء
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {/* Read filter */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          {(['all', 'unread'] as const).map(f => (
            <button
              key={f}
              data-testid={`filter-${f}`}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                filter === f
                  ? "bg-teal-100 text-white"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              {f === 'all' ? 'الكل' : 'غير المقروء'}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-1 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          <button
            data-testid="filter-type-all"
            onClick={() => setTypeFilter('all')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              typeFilter === 'all'
                ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            الكل
          </button>
          {typeLabels.map(({ key, label }) => (
            <button
              key={key}
              data-testid={`filter-type-${key}`}
              onClick={() => setTypeFilter(key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                typeFilter === key
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <Bell className="w-14 h-14 mb-4 opacity-20" />
          <p className="text-base font-medium">
            {filter === 'unread' ? 'لا توجد إشعارات غير مقروءة' : 'لا توجد إشعارات بعد'}
          </p>
          <p className="text-sm mt-1 opacity-60">ستظهر هنا الإشعارات المهمة</p>
        </div>
      )}

      {/* List */}
      {!isLoading && notifications.length > 0 && (
        <div className="space-y-3">
          {notifications.map(notif => (
            <NotifCard
              key={notif._id}
              notif={notif}
              onRead={(id) => markRead.mutate(id)}
              onDelete={(id) => deleteNotif.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
