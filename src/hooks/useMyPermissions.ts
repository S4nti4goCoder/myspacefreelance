import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import type { CollaboratorModule, PermissionsMap } from "@/types";

async function fetchMyPermissions(userId: string): Promise<PermissionsMap> {
  // 1. Buscar el registro de collaborators donde collaborator_id = yo
  const { data: collabData, error: collabError } = await supabase
    .from("collaborators")
    .select("id")
    .eq("collaborator_id", userId)
    .single();

  if (collabError || !collabData) return {};

  // 2. Traer los permisos de ese colaborador
  const { data, error } = await supabase
    .from("collaborator_permissions")
    .select("*")
    .eq("collaborator_id", collabData.id);

  if (error || !data) return {};

  // 3. Convertir array a mapa indexado por módulo
  const map: PermissionsMap = {};
  data.forEach((p) => {
    map[p.module as CollaboratorModule] = p;
  });

  return map;
}

export function useMyPermissions() {
  const { profile } = useAuthStore();
  const isCollaborator = profile?.role === "collaborator";

  return useQuery({
    queryKey: ["my-permissions", profile?.id],
    queryFn: () => fetchMyPermissions(profile!.id),
    enabled: isCollaborator && !!profile?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos de caché
  });
}

// Helper — devuelve true si el freelancer o si el colaborador tiene el permiso
export function useCanAccess(
  module: CollaboratorModule,
  action: "can_view" | "can_create" | "can_edit" | "can_delete" = "can_view",
): boolean {
  const { profile } = useAuthStore();
  const { data: permissions } = useMyPermissions();

  // El freelancer siempre tiene acceso total
  if (profile?.role === "freelancer") return true;

  // Si no es colaborador tampoco tiene acceso al panel
  if (profile?.role !== "collaborator") return false;

  // Colaborador: revisar el mapa de permisos
  const perm = permissions?.[module];
  if (!perm) return false;
  return perm[action] === true;
}
