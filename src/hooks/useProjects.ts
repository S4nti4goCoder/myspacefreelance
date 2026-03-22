import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Project } from "@/types";

async function fetchProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select("*, client:clients(id, name)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as (Project & { client: { id: string; name: string } | null })[];
}

async function fetchProject(id: string) {
  const { data, error } = await supabase
    .from("projects")
    .select("*, client:clients(id, name)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Project & { client: { id: string; name: string } | null };
}

async function createProject(
  project: Omit<
    Project,
    "id" | "user_id" | "created_at" | "share_token" | "progress"
  >,
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data, error } = await supabase
    .from("projects")
    .insert({ ...project, user_id: session!.user.id })
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

async function updateProject({
  id,
  ...project
}: Partial<Project> & { id: string }) {
  const { data, error } = await supabase
    .from("projects")
    .update(project)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

async function deleteProject(id: string) {
  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) throw error;
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: () => fetchProject(id),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Proyecto creado exitosamente");
    },
    onError: () => {
      toast.error("Error al crear el proyecto");
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProject,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", data.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Proyecto actualizado exitosamente");
    },
    onError: () => {
      toast.error("Error al actualizar el proyecto");
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Proyecto eliminado exitosamente");
    },
    onError: () => {
      toast.error("Error al eliminar el proyecto");
    },
  });
}
