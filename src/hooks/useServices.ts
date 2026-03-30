import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Service } from "@/types";

async function fetchServices() {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Service[];
}

async function createService(
  service: Omit<Service, "id" | "created_at" | "user_id">,
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const { data, error } = await supabase
    .from("services")
    .insert({ ...service, user_id: session!.user.id })
    .select()
    .single();
  if (error) throw error;
  return data as Service;
}

async function updateService({
  id,
  ...service
}: Partial<Service> & { id: string }) {
  const { data, error } = await supabase
    .from("services")
    .update(service)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Service;
}

async function deleteService(id: string) {
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw error;
}

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: fetchServices,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Servicio creado exitosamente");
    },
    onError: (error: Error) => toast.error(error.message || "Error al crear el servicio"),
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Servicio actualizado exitosamente");
    },
    onError: (error: Error) => toast.error(error.message || "Error al actualizar el servicio"),
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Servicio eliminado");
    },
    onError: (error: Error) => toast.error(error.message || "Error al eliminar el servicio"),
  });
}
