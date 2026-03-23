import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Attachment } from "@/types";

async function fetchAttachments(projectId: string) {
  const { data, error } = await supabase
    .from("attachments")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Attachment[];
}

async function uploadAttachment(file: File, projectId: string) {
  const sanitizedName = file.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");

  const filePath = `${projectId}/${Date.now()}-${sanitizedName}`;

  const { error: uploadError } = await supabase.storage
    .from("project-files")
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("attachments")
    .insert({
      project_id: projectId,
      file_name: file.name,
      file_path: filePath,
      mime_type: file.type,
      size: file.size,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Attachment;
}

async function deleteAttachment(attachment: Attachment) {
  const { error: storageError } = await supabase.storage
    .from("project-files")
    .remove([attachment.file_path]);

  if (storageError) throw storageError;

  const { error } = await supabase
    .from("attachments")
    .delete()
    .eq("id", attachment.id);

  if (error) throw error;
}

export function getFileUrl(filePath: string) {
  const { data } = supabase.storage
    .from("project-files")
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export function useAttachments(projectId: string) {
  return useQuery({
    queryKey: ["attachments", projectId],
    queryFn: () => fetchAttachments(projectId),
    enabled: !!projectId,
  });
}

export function useUploadAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, projectId }: { file: File; projectId: string }) =>
      uploadAttachment(file, projectId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["attachments", data.project_id],
      });
      toast.success("Archivo subido exitosamente");
    },
    onError: () => toast.error("Error al subir el archivo"),
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAttachment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments"] });
      toast.success("Archivo eliminado");
    },
    onError: () => toast.error("Error al eliminar el archivo"),
  });
}
