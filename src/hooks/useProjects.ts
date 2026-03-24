import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Project, Profile } from "@/types";

async function fetchProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select("*, client:profiles(id, name, email, phone, notes, role)")
    .eq("profiles.role", "client")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as (Project & { client: Profile | null })[];
}

async function fetchProject(id: string) {
  const { data, error } = await supabase
    .from("projects")
    .select("*, client:profiles(id, name, email, phone, notes, role)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Project & { client: Profile | null };
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
  const { data: attachments } = await supabase
    .from("attachments")
    .select("file_path")
    .eq("project_id", id);

  if (attachments && attachments.length > 0) {
    const filePaths = attachments.map(
      (a: { file_path: string }) => a.file_path,
    );
    await supabase.storage.from("project-files").remove(filePaths);
  }

  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

async function notifyProjectDone(project: Project) {
  // Get all clients assigned to this project
  const { data: projectClients } = await supabase
    .from("project_clients")
    .select("client_id")
    .eq("project_id", project.id);

  if (!projectClients || projectClients.length === 0) return;

  // Insert notification for each client
  const notifications = projectClients.map((pc: { client_id: string }) => ({
    user_id: pc.client_id,
    type: "project_done",
    title: "¡Proyecto completado!",
    message: `El proyecto "${project.name}" ha sido marcado como completado.`,
    project_id: project.id,
  }));

  await supabase.from("notifications").insert(notifications);
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

      // Notify clients when project is marked as done
      if (data.status === "done") {
        notifyProjectDone(data);
      }
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
