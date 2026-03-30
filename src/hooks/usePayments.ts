import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Payment } from "@/types";

async function fetchPayments(projectId: string) {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("project_id", projectId)
    .order("payment_date", { ascending: false });

  if (error) throw error;
  return data as Payment[];
}

async function createPayment(payment: Omit<Payment, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("payments")
    .insert(payment)
    .select()
    .single();

  if (error) throw error;
  return data as Payment;
}

async function updatePayment({
  id,
  ...payment
}: Partial<Payment> & { id: string }) {
  const { data, error } = await supabase
    .from("payments")
    .update(payment)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Payment;
}

async function deletePayment({
  id,
  projectId,
}: {
  id: string;
  projectId: string;
}) {
  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) throw error;
  return { projectId };
}

export function usePayments(projectId: string) {
  return useQuery({
    queryKey: ["payments", projectId],
    queryFn: () => fetchPayments(projectId),
    enabled: !!projectId,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPayment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["payments", data.project_id],
      });
      toast.success("Pago registrado exitosamente");
    },
    onError: (error: Error) => toast.error(error.message || "Error al registrar el pago"),
  });
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePayment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["payments", data.project_id],
      });
      toast.success("Pago actualizado exitosamente");
    },
    onError: (error: Error) => toast.error(error.message || "Error al actualizar el pago"),
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePayment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["payments", data.projectId],
      });
      toast.success("Pago eliminado");
    },
    onError: (error: Error) => toast.error(error.message || "Error al eliminar el pago"),
  });
}
