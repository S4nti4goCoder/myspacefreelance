import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type {
  Collaborator,
  CollaboratorPermission,
  CollaboratorModule,
  PermissionsMap,
} from "@/types";

const ALL_MODULES: CollaboratorModule[] = [
  "projects",
  "tasks",
  "documents",
  "attachments",
  "payments",
  "quotes",
  "services",
  "clients",
  "comments",
  "reports",
];

interface DefaultPermission {
  module: CollaboratorModule;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

const DEFAULT_PERMISSIONS: DefaultPermission[] = ALL_MODULES.map((module) => ({
  module,
  can_view: false,
  can_create: false,
  can_edit: false,
  can_delete: false,
}));

// ─── Fetchers ────────────────────────────────────────────────────────────────

async function fetchCollaborators(): Promise<Collaborator[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return [];

  const { data, error } = await supabase
    .from("collaborators")
    .select(
      `*,
      profile:profiles!collaborators_collaborator_id_fkey(
        id, name, email, role, phone, notes, password_changed, created_at,
        nit, address, city, website, logo_url,
        apply_iva, apply_retefuente, apply_reteica,
        iva_rate, retefuente_rate, reteica_rate
      ),
      permissions:collaborator_permissions(*),
      projects:collaborator_projects(
        project:projects(*)
      )`,
    )
    .eq("owner_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const projects =
      (row.projects as { project: unknown }[] | null)?.map((p) => p.project) ??
      [];
    return { ...row, projects } as Collaborator;
  });
}

async function fetchCollaboratorPermissions(
  collaboratorId: string,
): Promise<PermissionsMap> {
  const { data, error } = await supabase
    .from("collaborator_permissions")
    .select("*")
    .eq("collaborator_id", collaboratorId);

  if (error) throw error;

  const map: PermissionsMap = {};
  (data as CollaboratorPermission[]).forEach((p) => {
    map[p.module] = p;
  });
  return map;
}

// ─── Mutations ───────────────────────────────────────────────────────────────

interface CreateCollaboratorInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

async function createCollaborator(input: CreateCollaboratorInput) {
  const { data, error } = await supabase.rpc(
    "create_collaborator_with_permissions",
    {
      p_email: input.email.trim().toLowerCase(),
      p_password: input.password,
      p_name: input.name,
      p_phone: input.phone ?? "",
      p_modules: ALL_MODULES,
    },
  );

  if (error) throw new Error(error.message);
  return data;
}

interface UpdatePermissionsInput {
  collaboratorId: string;
  permissions: Omit<CollaboratorPermission, "id" | "collaborator_id">[];
}

async function updatePermissions({
  collaboratorId,
  permissions,
}: UpdatePermissionsInput) {
  const { error } = await supabase.from("collaborator_permissions").upsert(
    permissions.map((p) => ({
      collaborator_id: collaboratorId,
      module: p.module,
      can_view: p.can_view,
      can_create: p.can_create,
      can_edit: p.can_edit,
      can_delete: p.can_delete,
    })),
    { onConflict: "collaborator_id,module" },
  );

  if (error) throw error;
}

interface UpdateProjectsInput {
  collaboratorId: string;
  projectIds: string[];
}

async function updateCollaboratorProjects({
  collaboratorId,
  projectIds,
}: UpdateProjectsInput) {
  const { error: deleteError } = await supabase
    .from("collaborator_projects")
    .delete()
    .eq("collaborator_id", collaboratorId);

  if (deleteError) throw deleteError;

  if (projectIds.length > 0) {
    const { error: insertError } = await supabase
      .from("collaborator_projects")
      .insert(
        projectIds.map((project_id) => ({
          collaborator_id: collaboratorId,
          project_id,
        })),
      );

    if (insertError) throw insertError;
  }
}

async function deleteCollaborator(collaboratorId: string) {
  const { error } = await supabase
    .from("collaborators")
    .delete()
    .eq("id", collaboratorId);

  if (error) throw error;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useCollaborators() {
  return useQuery({
    queryKey: ["collaborators"],
    queryFn: fetchCollaborators,
  });
}

export function useCollaboratorPermissions(collaboratorId: string) {
  return useQuery({
    queryKey: ["collaborator-permissions", collaboratorId],
    queryFn: () => fetchCollaboratorPermissions(collaboratorId),
    enabled: !!collaboratorId,
  });
}

export function useCreateCollaborator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCollaborator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collaborators"] });
      toast.success("Colaborador creado exitosamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al crear el colaborador");
    },
  });
}

export function useUpdatePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePermissions,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["collaborators"] });
      queryClient.invalidateQueries({
        queryKey: ["collaborator-permissions", variables.collaboratorId],
      });
      toast.success("Permisos guardados exitosamente");
    },
    onError: () => toast.error("Error al guardar los permisos"),
  });
}

export function useUpdateCollaboratorProjects() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCollaboratorProjects,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collaborators"] });
      toast.success("Proyectos asignados exitosamente");
    },
    onError: () => toast.error("Error al asignar los proyectos"),
  });
}

export function useDeleteCollaborator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCollaborator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collaborators"] });
      toast.success("Colaborador eliminado");
    },
    onError: () => toast.error("Error al eliminar el colaborador"),
  });
}

export { ALL_MODULES, DEFAULT_PERMISSIONS };
