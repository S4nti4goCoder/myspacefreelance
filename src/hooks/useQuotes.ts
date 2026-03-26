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

async function generateQuoteNumber(): Promise<string> {
  const { count } = await supabase
    .from("quotes")
    .select("*", { count: "exact", head: true });
  const next = (count ?? 0) + 1;
  return `COT-${String(next).padStart(3, "0")}`;
}

async function createQuote(
  quote: Omit<Quote, "id" | "created_at" | "updated_at" | "items"> & {
    items: Omit<QuoteItem, "id" | "quote_id">[];
  },
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const { items, ...quoteData } = quote;

  const { data: newQuote, error } = await supabase
    .from("quotes")
    .insert({ ...quoteData, user_id: session!.user.id })
    .select()
    .single();

  if (error) throw error;

  if (items.length > 0) {
    await supabase
      .from("quote_items")
      .insert(items.map((item) => ({ ...item, quote_id: newQuote.id })));
  }

  return newQuote as Quote;
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

export { generateQuoteNumber };

export function useCreateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Cotización creada exitosamente");
    },
    onError: () => toast.error("Error al crear la cotización"),
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
    onError: () => toast.error("Error al actualizar la cotización"),
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
    onError: () => toast.error("Error al eliminar la cotización"),
  });
}
