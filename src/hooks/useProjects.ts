import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Project, Profile } from "@/types";

interface CreateProjectInput {
  name: string;
  description: string | null;
  start_date: string | null;
  due_date: string | null;
  status: Project["status"];
  budget: number | null;
  tags: string[];
  clientId?: string | null;
}

interface UpdateProjectInput {
  id: string;
  clientId?: string | null;
  name?: string;
  description?: string | null;
  start_date?: string | null;
  due_date?: string | null;
  status?: Project["status"];
  budget?: number | null;
  tags?: string[];
  progress?: number;
}

async function fetchProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select(
      `*,
      project_clients!left(
        client:profiles(id, name, email, phone, notes, role, password_changed, created_at)
      )`,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const clientRow = row.project_clients?.[0];
    const client = (clientRow?.client as Profile) ?? null;
    const { project_clients: _pc, ...rest } = row;
    return { ...rest, client } as Project & { client: Profile | null };
  });
}

async function fetchProject(id: string) {
  const { data, error } = await supabase
    .from("projects")
    .select(
      `*,
      project_clients!left(
        client:profiles(id, name, email, phone, notes, role, password_changed, created_at)
      )`,
    )
    .eq("id", id)
    .single();

  if (error) throw error;

  const clientRow = data.project_clients?.[0];
  const client = (clientRow?.client as Profile) ?? null;
  const { project_clients: _pc, ...rest } = data;
  return { ...rest, client } as Project & { client: Profile | null };
}

async function createProject(input: CreateProjectInput) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { clientId, ...projectData } = input;

  const { data, error } = await supabase
    .from("projects")
    .insert({ ...projectData, user_id: session!.user.id })
    .select()
    .single();

  if (error) throw error;

  if (clientId) {
    await supabase
      .from("project_clients")
      .insert({ project_id: data.id, client_id: clientId });
  }

  return data as Project;
}

async function updateProject(input: UpdateProjectInput) {
  const { id, clientId, ...project } = input;

  const { data, error } = await supabase
    .from("projects")
    .update(project)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  if (clientId !== undefined) {
    await supabase.from("project_clients").delete().eq("project_id", id);

    if (clientId) {
      await supabase
        .from("project_clients")
        .insert({ project_id: id, client_id: clientId });
    }
  }

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
      queryClient.invalidateQueries({ queryKey: ["client-projects"] });
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
      queryClient.invalidateQueries({ queryKey: ["client-projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-client-accounts"] });
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
