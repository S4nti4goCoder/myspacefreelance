import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CheckCheck,
  Trash2,
  MessageSquare,
  DollarSign,
  ListChecks,
  FolderKanban,
  FileText,
  Info,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useClearAllNotifications,
} from "@/hooks/useNotifications";
import { formatRelativeTime } from "@/lib/utils";
import type { NotificationType } from "@/types";

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: React.ElementType; color: string; bg: string }
> = {
  comment: {
    icon: MessageSquare,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  payment: {
    icon: DollarSign,
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  task: {
    icon: ListChecks,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  project: {
    icon: FolderKanban,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  quote: {
    icon: FileText,
    color: "text-teal-500",
    bg: "bg-teal-500/10",
  },
  system: {
    icon: Info,
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
};

interface NotificationCenterProps {
  collapsed?: boolean;
}

export default function NotificationCenter({
  collapsed,
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const { data: notifications, isLoading } = useNotifications();
  const unreadCount = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();
  const clearAll = useClearAllNotifications();
  const navigate = useNavigate();

  const handleClick = (notification: NonNullable<typeof notifications>[number]) => {
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }
    if (notification.project_id) {
      navigate(`/proyectos/${notification.project_id}`);
      setOpen(false);
    }
  };

  const panel = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col w-full h-full rounded-xl border border-border bg-card shadow-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            Notificaciones
          </h3>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={() => markAllAsRead.mutate()}
              title="Marcar todo como leído"
              aria-label="Marcar todo como leído"
            >
              <CheckCheck className="h-3.5 w-3.5" />
            </Button>
          )}
          {(notifications?.length ?? 0) > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => clearAll.mutate()}
              title="Eliminar todas"
              aria-label="Eliminar todas"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            onClick={() => setOpen(false)}
            aria-label="Cerrar notificaciones"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {isLoading ? (
          <div className="p-3 space-y-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : !notifications?.length ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <div className="bg-muted rounded-full p-4">
              <Bell className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium">No hay notificaciones</p>
            <p className="text-xs">Aqui aparecerán tus alertas</p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => {
              const config = TYPE_CONFIG[notification.type];
              const Icon = config.icon;

              return (
                <div
                  key={notification.id}
                  className={`group flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-accent/50 border-b border-border/50 last:border-0 ${
                    !notification.read ? "bg-primary/5" : ""
                  }`}
                  onClick={() => handleClick(notification)}
                >
                  <div
                    className={`shrink-0 rounded-lg p-2 h-8 w-8 flex items-center justify-center ${config.bg}`}
                  >
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-sm leading-snug truncate ${
                          !notification.read
                            ? "font-semibold text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="shrink-0 h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    {notification.message && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                        {notification.message}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground/60 mt-1">
                      {formatRelativeTime(notification.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification.mutate(notification.id);
                    }}
                    className="cursor-pointer shrink-0 self-center p-1 rounded-md hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Eliminar notificación"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <>
      <Button
        variant="ghost"
        size={collapsed ? "icon" : "sm"}
        className={
          collapsed
            ? "relative"
            : "relative w-full justify-start gap-3 px-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        }
        onClick={() => setOpen(!open)}
        aria-label="Notificaciones"
      >
        <Bell className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="text-sm font-medium">Notificaciones</span>}
        {unreadCount > 0 && (
          <span
            className={`absolute flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ${
              collapsed ? "top-0.5 right-0.5" : "top-1 right-2"
            }`}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/20"
              onClick={() => setOpen(false)}
            />

            {/* Desktop: panel fijo a la derecha del sidebar */}
            <div className="hidden md:block fixed left-60 bottom-4 z-50 w-96 h-[min(32rem,calc(100vh-2rem))]">
              {panel}
            </div>

            {/* Mobile: panel centrado */}
            <div className="md:hidden fixed inset-4 z-50 max-w-sm mx-auto">
              {panel}
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
