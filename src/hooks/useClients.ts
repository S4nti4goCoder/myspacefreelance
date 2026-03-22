import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Client } from "@/types";

async function fetchClients() {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data as Client[];
}

async function createClient(
  client: Omit<Client, "id" | "user_id" | "created_at">,
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data, error } = await supabase
    .from("clients")
    .insert({ ...client, user_id: session!.user.id })
    .select()
    .single();

  if (error) throw error;
  return data as Client;
}

async function updateClient({
  id,
  ...client
}: Partial<Client> & { id: string }) {
  const { data, error } = await supabase
    .from("clients")
    .update(client)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Client;
}

async function deleteClient(id: string) {
  const { error } = await supabase.from("clients").delete().eq("id", id);

  if (error) throw error;
}

export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Cliente creado exitosamente");
    },
    onError: () => {
      toast.error("Error al crear el cliente");
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente actualizado exitosamente");
    },
    onError: () => {
      toast.error("Error al actualizar el cliente");
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Cliente eliminado exitosamente");
    },
    onError: () => {
      toast.error("Error al eliminar el cliente");
    },
  });
}
