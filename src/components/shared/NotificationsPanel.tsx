import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellOff,
  MessageSquare,
  Clock,
  CheckSquare,
  FolderKanban,
  User,
  X,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NotificationsPanelProps {
  showLabel?: boolean;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "new_message":
      return <MessageSquare className="h-4 w-4 text-blue-500" />;
    case "due_soon":
      return <Clock className="h-4 w-4 text-orange-500" />;
    case "task_review":
      return <CheckSquare className="h-4 w-4 text-violet-500" />;
    case "project_done":
      return <FolderKanban className="h-4 w-4 text-green-500" />;
    case "client_first_login":
      return <User className="h-4 w-4 text-cyan-500" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `Hace ${diffMins}m`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return date.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onNavigate: (projectId: string | null) => void;
}

function NotificationItem({
  notification,
  onRead,
  onNavigate,
}: NotificationItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent",
        !notification.read && "bg-primary/5",
      )}
      onClick={() => {
        if (!notification.read) onRead(notification.id);
        if (notification.project_id) onNavigate(notification.project_id);
      }}
    >
      <div className="shrink-0 mt-0.5">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm truncate",
            !notification.read
              ? "font-semibold text-foreground"
              : "text-foreground",
          )}
        >
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatTime(notification.created_at)}
        </p>
      </div>
      {!notification.read && (
        <div className="shrink-0 h-2 w-2 rounded-full bg-primary mt-1.5" />
      )}
    </motion.div>
  );
}

export default function NotificationsPanel({
  showLabel = false,
}: NotificationsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { notifications, isLoading, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const navigate = useNavigate();

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavigate = (projectId: string | null) => {
    if (projectId) {
      navigate(`/proyectos/${projectId}`);
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <Button
        variant="ghost"
        size={showLabel ? "sm" : "icon"}
        className={cn(
          "relative",
          showLabel && "w-full justify-start gap-3 px-3",
        )}
        onClick={() => setIsOpen((p) => !p)}
        aria-label="Notificaciones"
      >
        <div className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        {showLabel && (
          <span className="text-sm">
            Notificaciones
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs px-1.5 py-0">
                {unreadCount}
              </Badge>
            )}
          </span>
        )}
      </Button>

      {/* Panel — opens upward and to the right */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-2 w-80 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-foreground" />
                <span className="font-semibold text-sm text-foreground">
                  Notificaciones
                </span>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs px-1.5 py-0">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={markAllAsRead}
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Marcar todas
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="space-y-2 p-3">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-16 bg-muted animate-pulse rounded-lg"
                    />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
                  <BellOff className="h-8 w-8" />
                  <p className="text-sm font-medium">Sin notificaciones</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={markAsRead}
                      onNavigate={handleNavigate}
                    />
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <>
                <Separator />
                <div className="px-4 py-2 text-center">
                  <p className="text-xs text-muted-foreground">
                    Mostrando las últimas {notifications.length} notificaciones
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
