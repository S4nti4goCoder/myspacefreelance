import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Profile, ProjectClient } from "@/types";

async function fetchClientAccounts() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "client")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Profile[];
}

async function fetchClientProjects(clientId: string) {
  const { data, error } = await supabase
    .from("project_clients")
    .select("*, project:projects(id, name, status, progress, due_date)")
    .eq("client_id", clientId);

  if (error) throw error;
  return data as ProjectClient[];
}

async function fetchProjectClientAccounts(projectId: string) {
  const { data, error } = await supabase
    .from("project_clients")
    .select("*, profile:profiles(id, name, email)")
    .eq("project_id", projectId);

  if (error) throw error;
  return data as ProjectClient[];
}

async function registerClient({
  name,
  email,
  password,
  phone,
  notes,
}: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  notes?: string;
}) {
  // Verificar duplicado antes de intentar registrar
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (existing) {
    throw new Error("Ya existe una cuenta con este correo electrónico");
  }

  // Save freelancer session before signUp
  const {
    data: { session: freelancerSession },
  } = await supabase.auth.getSession();

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { name, role: "client" },
    },
  });

  if (error) {
    if (
      error.message.toLowerCase().includes("already registered") ||
      error.message.toLowerCase().includes("already exists") ||
      error.message.toLowerCase().includes("user already")
    ) {
      throw new Error("Ya existe una cuenta con este correo electrónico");
    }
    throw error;
  }

  if (!data.user) throw new Error("No se pudo crear el usuario");

  const newUserId = data.user.id;

  if (phone || notes) {
    await supabase
      .from("profiles")
      .update({ phone: phone || null, notes: notes || null })
      .eq("id", newUserId);
  }

  if (freelancerSession) {
    await supabase.auth.setSession({
      access_token: freelancerSession.access_token,
      refresh_token: freelancerSession.refresh_token,
    });
  }

  return newUserId;
}

async function updateClientProfile({
  id,
  name,
  phone,
  notes,
}: {
  id: string;
  name: string;
  phone?: string;
  notes?: string;
}) {
  const { error } = await supabase
    .from("profiles")
    .update({ name, phone: phone || null, notes: notes || null })
    .eq("id", id);

  if (error) throw error;
}

async function assignProjectToClient({
  projectId,
  clientId,
}: {
  projectId: string;
  clientId: string;
}) {
  const { data, error } = await supabase
    .from("project_clients")
    .insert({ project_id: projectId, client_id: clientId })
    .select()
    .single();

  if (error) throw error;
  return data as ProjectClient;
}

async function removeProjectFromClient(id: string) {
  const { error } = await supabase
    .from("project_clients")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

async function deleteClientAccount(id: string) {
  const { error } = await supabase.rpc("delete_client_account", {
    client_id: id,
  });
  if (error) throw error;
}

export function useClientAccounts() {
  return useQuery({
    queryKey: ["client-accounts"],
    queryFn: fetchClientAccounts,
  });
}

export function useClientProjects(clientId: string) {
  return useQuery({
    queryKey: ["client-projects", clientId],
    queryFn: () => fetchClientProjects(clientId),
    enabled: !!clientId,
  });
}

export function useProjectClientAccounts(projectId: string) {
  return useQuery({
    queryKey: ["project-client-accounts", projectId],
    queryFn: () => fetchProjectClientAccounts(projectId),
    enabled: !!projectId,
  });
}

export function useRegisterClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registerClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-accounts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al registrar cliente");
    },
  });
}

export function useUpdateClientProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateClientProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-accounts"] });
      toast.success("Cliente actualizado exitosamente");
    },
    onError: () => toast.error("Error al actualizar el cliente"),
  });
}

export function useAssignProjectToClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignProjectToClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-client-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["client-projects"] });
      toast.success("Proyecto asignado al cliente");
    },
    onError: () => toast.error("Error al asignar proyecto"),
  });
}

export function useRemoveProjectFromClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeProjectFromClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-client-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["client-projects"] });
      toast.success("Proyecto removido del cliente");
    },
    onError: () => toast.error("Error al remover proyecto"),
  });
}

export function useDeleteClientAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteClientAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-accounts"] });
      toast.success("Cliente eliminado");
    },
    onError: () => toast.error("Error al eliminar cliente"),
  });
}
