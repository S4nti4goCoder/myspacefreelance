import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Task } from "@/types";

async function fetchTasks(projectId: string) {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("order_index", { ascending: true });

  if (error) throw error;
  return data as Task[];
}

async function createTask(task: Omit<Task, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("tasks")
    .insert(task)
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

async function updateTask({ id, ...task }: Partial<Task> & { id: string }) {
  const { data, error } = await supabase
    .from("tasks")
    .update(task)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

async function deleteTask(id: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

async function updateTasksOrder(
  tasks: { id: string; order_index: number; status: string }[],
) {
  const updates = tasks.map((t) =>
    supabase
      .from("tasks")
      .update({ order_index: t.order_index, status: t.status })
      .eq("id", t.id),
  );
  await Promise.all(updates);
}

export function useTasks(projectId: string) {
  return useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => fetchTasks(projectId),
    enabled: !!projectId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTask,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", data.project_id] });
      queryClient.invalidateQueries({
        queryKey: ["projects", data.project_id],
      });
      toast.success("Tarea creada exitosamente");
    },
    onError: () => toast.error("Error al crear la tarea"),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTask,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", data.project_id] });
      queryClient.invalidateQueries({
        queryKey: ["projects", data.project_id],
      });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => toast.error("Error al actualizar la tarea"),
  });
}

export function useUpdateTasksOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTasksOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarea eliminada");
    },
    onError: () => toast.error("Error al eliminar la tarea"),
  });
}
