import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Document } from "@/types";

async function fetchDocuments(projectId: string) {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Document[];
}

async function createDocument(
  doc: Omit<Document, "id" | "created_at" | "updated_at">,
) {
  const { data, error } = await supabase
    .from("documents")
    .insert(doc)
    .select()
    .single();

  if (error) throw error;
  return data as Document;
}

async function updateDocument({
  id,
  ...doc
}: Partial<Document> & { id: string }) {
  const { data, error } = await supabase
    .from("documents")
    .update(doc)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Document;
}

async function deleteDocument({
  id,
  projectId,
}: {
  id: string;
  projectId: string;
}) {
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw error;
  return { projectId };
}

export function useDocuments(projectId: string) {
  return useQuery({
    queryKey: ["documents", projectId],
    queryFn: () => fetchDocuments(projectId),
    enabled: !!projectId,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDocument,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["documents", data.project_id],
      });
      toast.success("Documento creado exitosamente");
    },
    onError: () => toast.error("Error al crear el documento"),
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDocument,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["documents", data.project_id],
      });
      toast.success("Documento guardado");
    },
    onError: () => toast.error("Error al guardar el documento"),
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["documents", data.projectId],
      });
      toast.success("Documento eliminado");
    },
    onError: () => toast.error("Error al eliminar el documento"),
  });
}
