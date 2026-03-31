import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Service } from "@/types";

const PAGE_SIZE = 6;

export interface ServiceFilters {
  search?: string;
  category?: string | "all";
  page?: number;
  pageSize?: number;
}

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

async function fetchPaginatedServices(filters: ServiceFilters) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("services")
    .select("*", { count: "exact" });

  if (filters.search?.trim()) {
    const q = `%${filters.search.trim()}%`;
    query = query.or(`name.ilike.${q},description.ilike.${q}`);
  }

  if (filters.category && filters.category !== "all") {
    query = query.eq("category", filters.category);
  }

  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    services: data as Service[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: fetchServices,
  });
}

export function usePaginatedServices(filters: ServiceFilters) {
  return useQuery({
    queryKey: ["services", "paginated", filters],
    queryFn: () => fetchPaginatedServices(filters),
    placeholderData: keepPreviousData,
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
