import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import type { Notification } from "@/types";

async function fetchNotifications(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data as Notification[];
}

async function markAsRead(id: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id);

  if (error) throw error;
}

async function markAllAsRead(userId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) throw error;
}

async function deleteNotification(id: string) {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

async function clearAllNotifications(userId: string) {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("user_id", userId);

  if (error) throw error;
}

// Singleton: solo un canal realtime por usuario, compartido entre todas las instancias del hook
const activeChannels = new Map<string, ReturnType<typeof supabase.channel>>();
const subscriberCount = new Map<string, number>();

export function useNotifications() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.id;
  const channelKeyRef = useRef<string | null>(null);

  const query = useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => fetchNotifications(userId!),
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId) return;

    const key = `notifications:${userId}`;
    channelKeyRef.current = key;
    const count = subscriberCount.get(key) ?? 0;
    subscriberCount.set(key, count + 1);

    // Solo crear el canal si es el primer suscriptor
    if (!activeChannels.has(key)) {
      const channel = supabase
        .channel(key)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
          },
          () => {
            queryClient.invalidateQueries({
              queryKey: ["notifications", userId],
            });
          },
        )
        .subscribe();

      activeChannels.set(key, channel);
    }

    return () => {
      const currentKey = channelKeyRef.current;
      if (!currentKey) return;

      const remaining = (subscriberCount.get(currentKey) ?? 1) - 1;
      subscriberCount.set(currentKey, remaining);

      // Solo eliminar el canal si no quedan suscriptores
      if (remaining <= 0) {
        const channel = activeChannels.get(currentKey);
        if (channel) {
          supabase.removeChannel(channel);
          activeChannels.delete(currentKey);
        }
        subscriberCount.delete(currentKey);
      }
    };
  }, [userId, queryClient]);

  return query;
}

export function useUnreadCount() {
  const { data: notifications } = useNotifications();
  return notifications?.filter((n) => !n.read).length ?? 0;
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", user?.id],
      });
    },
    onError: (error: Error) =>
      toast.error(error.message || "Error al marcar notificación"),
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: () => markAllAsRead(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", user?.id],
      });
    },
    onError: (error: Error) =>
      toast.error(error.message || "Error al marcar notificaciones"),
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", user?.id],
      });
    },
    onError: (error: Error) =>
      toast.error(error.message || "Error al eliminar notificación"),
  });
}

export function useClearAllNotifications() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: () => clearAllNotifications(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", user?.id],
      });
      toast.success("Notificaciones eliminadas");
    },
    onError: (error: Error) =>
      toast.error(error.message || "Error al limpiar notificaciones"),
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (
      notification: Omit<Notification, "id" | "user_id" | "read" | "created_at">,
    ) => {
      const { data, error } = await supabase
        .from("notifications")
        .insert({ ...notification, user_id: user!.id, read: false })
        .select()
        .single();

      if (error) throw error;
      return data as Notification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", user?.id],
      });
    },
  });
}
