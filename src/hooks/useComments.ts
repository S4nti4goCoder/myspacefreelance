import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Comment } from "@/types";

async function fetchComments(projectId: string) {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as Comment[];
}

async function createComment(comment: Omit<Comment, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("comments")
    .insert(comment)
    .select()
    .single();

  if (error) throw error;
  return data as Comment;
}

async function deleteComment(id: string) {
  const { error } = await supabase.from("comments").delete().eq("id", id);

  if (error) throw error;
}

export function useComments(projectId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["comments", projectId],
    queryFn: () => fetchComments(projectId),
    enabled: !!projectId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`comments:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["comments", projectId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  return query;
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createComment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", data.project_id],
      });
    },
    onError: (error: Error) => toast.error(error.message || "Error al enviar el comentario"),
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      toast.success("Comentario eliminado");
    },
    onError: (error: Error) => toast.error(error.message || "Error al eliminar el comentario"),
  });
}
