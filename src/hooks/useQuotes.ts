import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Quote, QuoteItem, QuoteStatus } from "@/types";

const PAGE_SIZE = 6;

export interface QuoteFilters {
  search?: string;
  status?: QuoteStatus | "all";
  showArchived?: boolean;
  page?: number;
  pageSize?: number;
}

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

async function fetchPaginatedQuotes(filters: QuoteFilters) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("quotes")
    .select("*, items:quote_items(*)", { count: "exact" });

  if (filters.showArchived) {
    query = query.eq("status", "archived");
  } else {
    query = query.neq("status", "archived");
    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
  }

  if (filters.search?.trim()) {
    const q = `%${filters.search.trim()}%`;
    query = query.or(`quote_number.ilike.${q},client_name.ilike.${q},notes.ilike.${q}`);
  }

  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    quotes: data as Quote[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export function useQuotes() {
  return useQuery({
    queryKey: ["quotes"],
    queryFn: fetchQuotes,
  });
}

export function usePaginatedQuotes(filters: QuoteFilters) {
  return useQuery({
    queryKey: ["quotes", "paginated", filters],
    queryFn: () => fetchPaginatedQuotes(filters),
    placeholderData: keepPreviousData,
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
