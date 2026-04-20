import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Project, Profile, Task, ProjectStatus } from "@/types";

const PAGE_SIZE = 6;

export interface ProjectFilters {
  search?: string;
  status?: ProjectStatus | "all";
  clientId?: string | "all";
  sortBy?: string;
  showArchived?: boolean;
  page?: number;
  pageSize?: number;
}

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

interface DuplicateProjectInput {
  project: Project & { client?: Profile | null };
  newName: string;
  taskIds: string[];
}

type ProjectRow = Omit<Project, "client"> & {
  project_clients?: Array<{ client: Profile | null }> | null;
};

function mapProjectRows(data: unknown[]) {
  return (data ?? []).map((row) => {
    const r = row as ProjectRow;
    const client = r.project_clients?.[0]?.client ?? null;
    const { project_clients: _pc, ...rest } = r;
    return { ...rest, client } as Project & { client: Profile | null };
  });
}

const projectSelect = `*,
  project_clients!left(
    client:profiles(id, name, email, phone, notes, role, password_changed, created_at)
  )`;

async function fetchProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select(projectSelect)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return mapProjectRows(data);
}

async function fetchPaginatedProjects(filters: ProjectFilters) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("projects")
    .select(projectSelect, { count: "exact" });

  // Filter archived vs active
  if (filters.showArchived) {
    query = query.eq("status", "archived");
  } else {
    query = query.neq("status", "archived");

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
  }

  // Search
  if (filters.search?.trim()) {
    const q = `%${filters.search.trim()}%`;
    query = query.or(`name.ilike.${q},description.ilike.${q}`);
  }

  // Sort
  switch (filters.sortBy) {
    case "created_asc":
      query = query.order("created_at", { ascending: true });
      break;
    case "due_asc":
      query = query.order("due_date", { ascending: true, nullsFirst: false });
      break;
    case "due_desc":
      query = query.order("due_date", { ascending: false, nullsFirst: false });
      break;
    case "name_asc":
      query = query.order("name", { ascending: true });
      break;
    case "progress_desc":
      query = query.order("progress", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  const projects = mapProjectRows(data);

  // Client-side filter by clientId (join table makes server-side filtering complex)
  let filtered = projects;
  if (filters.clientId && filters.clientId !== "all") {
    filtered = projects.filter((p) => p.client?.id === filters.clientId);
  }

  return {
    projects: filtered,
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
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

async function duplicateProject({
  project,
  newName,
  taskIds,
}: DuplicateProjectInput) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Crear el nuevo proyecto
  const { data: newProject, error: projectError } = await supabase
    .from("projects")
    .insert({
      user_id: session!.user.id,
      name: newName,
      description: project.description,
      start_date: project.start_date,
      due_date: project.due_date,
      status: "todo",
      budget: project.budget,
      tags: project.tags,
      progress: 0,
    })
    .select()
    .single();

  if (projectError) throw projectError;

  // Copiar cliente si tenía uno asignado
  if (project.client?.id) {
    await supabase.from("project_clients").insert({
      project_id: newProject.id,
      client_id: project.client.id,
    });
  }

  // Copiar tareas seleccionadas
  if (taskIds.length > 0) {
    const { data: originalTasks } = await supabase
      .from("tasks")
      .select("*")
      .in("id", taskIds)
      .order("order_index", { ascending: true });

    if (originalTasks && originalTasks.length > 0) {
      const newTasks = originalTasks.map((t: Task) => ({
        project_id: newProject.id,
        title: t.title,
        description: t.description,
        due_date: t.due_date,
        status: "todo" as const,
        order_index: t.order_index,
      }));

      await supabase.from("tasks").insert(newTasks);
    }
  }

  return newProject as Project;
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

export function usePaginatedProjects(filters: ProjectFilters) {
  return useQuery({
    queryKey: ["projects", "paginated", filters],
    queryFn: () => fetchPaginatedProjects(filters),
    placeholderData: keepPreviousData,
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
    onError: (error: Error) => toast.error(error.message || "Error al crear el proyecto"),
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
    onError: (error: Error) => toast.error(error.message || "Error al actualizar el proyecto"),
  });
}

export function useDuplicateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: duplicateProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Proyecto duplicado exitosamente");
    },
    onError: (error: Error) => toast.error(error.message || "Error al duplicar el proyecto"),
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
    onError: (error: Error) => toast.error(error.message || "Error al eliminar el proyecto"),
  });
}
