import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Quote, QuoteItem } from "@/types";

async function fetchQuotes() {
  const { data, error } = await supabase
    .from("quotes")
    .select("*, items:quote_items(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Quote[];
}

async function fetchQuote(id: string) {
  const { data, error } = await supabase
    .from("quotes")
    .select("*, items:quote_items(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Quote;
}

async function createQuote(
  quote: Omit<
    Quote,
    "id" | "created_at" | "updated_at" | "items" | "quote_number"
  > & {
    items: Omit<QuoteItem, "id" | "quote_id">[];
    quote_number?: string;
  },
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const { items, ...quoteData } = quote;

  const { data: newQuote, error } = await supabase
    .from("quotes")
    .insert({
      ...quoteData,
      user_id: session!.user.id,
      quote_number: quoteData.quote_number ?? "",
    })
    .select()
    .single();

  if (error) throw error;

  if (items.length > 0) {
    await supabase
      .from("quote_items")
      .insert(items.map((item) => ({ ...item, quote_id: newQuote.id })));
  }

  // Re-fetch para obtener el quote_number generado por el trigger SQL
  const { data: freshQuote, error: fetchError } = await supabase
    .from("quotes")
    .select("*, items:quote_items(*)")
    .eq("id", newQuote.id)
    .single();

  if (fetchError) throw fetchError;
  return freshQuote as Quote;
}

async function updateQuote({
  id,
  items,
  ...quote
}: Partial<Omit<Quote, "user_id">> & {
  id: string;
  items?: Omit<QuoteItem, "id" | "quote_id">[];
}) {
  const { data, error } = await supabase
    .from("quotes")
    .update({ ...quote, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  if (items !== undefined) {
    await supabase.from("quote_items").delete().eq("quote_id", id);
    if (items.length > 0) {
      await supabase
        .from("quote_items")
        .insert(items.map((item) => ({ ...item, quote_id: id })));
    }
  }

  return data as Quote;
}

async function deleteQuote(id: string) {
  const { error } = await supabase.from("quotes").delete().eq("id", id);
  if (error) throw error;
}

export function useQuotes() {
  return useQuery({
    queryKey: ["quotes"],
    queryFn: fetchQuotes,
  });
}

export function useQuote(id: string) {
  return useQuery({
    queryKey: ["quotes", id],
    queryFn: () => fetchQuote(id),
    enabled: !!id,
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Cotización creada exitosamente");
    },
    onError: (error: Error) => toast.error(error.message || "Error al crear la cotización"),
  });
}

export function useUpdateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateQuote,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["quotes", data.id] });
      toast.success("Cotización actualizada");
    },
    onError: (error: Error) => toast.error(error.message || "Error al actualizar la cotización"),
  });
}

export function useDeleteQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Cotización eliminada");
    },
    onError: (error: Error) => toast.error(error.message || "Error al eliminar la cotización"),
  });
}
