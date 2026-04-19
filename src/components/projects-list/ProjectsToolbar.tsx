import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Filter,
  ChevronDown,
  User,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PROJECT_STATUS_LABELS as statusLabels } from "@/lib/constants";
import {
  type SortOption,
  SORT_LABELS,
} from "@/hooks/projects-list/useProjectsFilters";

interface ClientOption {
  id: string;
  name: string;
}

interface ProjectsToolbarProps {
  showArchived: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  clientFilter: string;
  onClientFilterChange: (v: string) => void;
  clientOptions: ClientOption[];
  sortBy: SortOption;
  onSortByChange: (v: SortOption) => void;
  activeFiltersCount: number;
  onClear: () => void;
}

export function ProjectsToolbar({
  showArchived,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  clientFilter,
  onClientFilterChange,
  clientOptions,
  sortBy,
  onSortByChange,
  activeFiltersCount,
  onClear,
}: ProjectsToolbarProps) {
  if (showArchived) {
    return (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar proyectos archivados..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, descripción, etiqueta o cliente..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <Filter className="h-3.5 w-3.5" />
              {statusFilter === "all" ? "Estado" : statusLabels[statusFilter]}
              {statusFilter !== "all" && (
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              )}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onStatusFilterChange("all")}>
              Todos los estados
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onStatusFilterChange("todo")}>
              Pendiente
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusFilterChange("progress")}>
              En progreso
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusFilterChange("review")}>
              En revisión
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusFilterChange("done")}>
              Completado
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusFilterChange("cancelled")}>
              Cancelado
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {clientOptions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <User className="h-3.5 w-3.5" />
                {clientFilter === "all"
                  ? "Cliente"
                  : (clientOptions.find((c) => c.id === clientFilter)?.name ??
                    "Cliente")}
                {clientFilter !== "all" && (
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                )}
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => onClientFilterChange("all")}>
                Todos los clientes
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {clientOptions.map((c) => (
                <DropdownMenuItem
                  key={c.id}
                  onClick={() => onClientFilterChange(c.id)}
                >
                  {c.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <ArrowUpDown className="h-3.5 w-3.5" />
              {SORT_LABELS[sortBy]}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
              <DropdownMenuItem key={key} onClick={() => onSortByChange(key)}>
                <span
                  className={
                    sortBy === key ? "font-semibold text-primary" : ""
                  }
                >
                  {SORT_LABELS[key]}
                </span>
                {sortBy === key && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <AnimatePresence>
          {activeFiltersCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={onClear}
                className="h-9 gap-2"
              >
                <X className="h-3.5 w-3.5" />
                Limpiar
                <Badge
                  variant="secondary"
                  className="text-xs px-1.5 py-0 h-4"
                >
                  {activeFiltersCount}
                </Badge>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
