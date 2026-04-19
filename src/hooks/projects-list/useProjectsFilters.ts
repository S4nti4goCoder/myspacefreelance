import { useState, useMemo } from "react";

export type SortOption =
  | "created_desc"
  | "created_asc"
  | "due_asc"
  | "due_desc"
  | "name_asc"
  | "progress_desc";

export const SORT_LABELS: Record<SortOption, string> = {
  created_desc: "Más recientes",
  created_asc: "Más antiguos",
  due_asc: "Entrega próxima",
  due_desc: "Entrega lejana",
  name_asc: "Nombre A-Z",
  progress_desc: "Mayor progreso",
};

export function useProjectsFilters() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("created_desc");
  const [showArchived, setShowArchived] = useState(false);

  const activeFiltersCount = useMemo(
    () =>
      [
        statusFilter !== "all",
        clientFilter !== "all",
        search.length > 0,
      ].filter(Boolean).length,
    [statusFilter, clientFilter, search],
  );

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setClientFilter("all");
    setSortBy("created_desc");
  };

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    clientFilter,
    setClientFilter,
    sortBy,
    setSortBy,
    showArchived,
    setShowArchived,
    activeFiltersCount,
    resetFilters,
  };
}
