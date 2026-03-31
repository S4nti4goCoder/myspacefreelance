import { usePageTitle } from "@/hooks/usePageTitle";
import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  FolderKanban,
  Pencil,
  Trash2,
  AlertTriangle,
  Calendar,
  User,
  Tag,
  ArrowRight,
  ArrowUpDown,
  X,
  Filter,
  ChevronDown,
  Archive,
  ArchiveRestore,
  Copy,
  LayoutGrid,
  CalendarDays,
  CheckSquare,
  Square,
} from "lucide-react";
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useDuplicateProject,
} from "@/hooks/useProjects";
import { useCanAccess } from "@/hooks/useMyPermissions";
import ProjectForm from "@/components/shared/ProjectForm";
import type { ProjectFormData } from "@/components/shared/ProjectForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatDateShort, formatCOP } from "@/lib/utils";
import {
  PROJECT_STATUS_LABELS as statusLabels,
  PROJECT_STATUS_VARIANTS as statusVariants,
  PROJECT_STATUS_COLORS as statusColors,
} from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import ProjectCalendar from "@/components/shared/ProjectCalendar";
import type { Project, Task } from "@/types";

type SortOption =
  | "created_desc"
  | "created_asc"
  | "due_asc"
  | "due_desc"
  | "name_asc"
  | "progress_desc";

const sortLabels: Record<SortOption, string> = {
  created_desc: "Más recientes",
  created_asc: "Más antiguos",
  due_asc: "Entrega próxima",
  due_desc: "Entrega lejana",
  name_asc: "Nombre A-Z",
  progress_desc: "Mayor progreso",
};

export default function ProjectsPage() {
  usePageTitle("Proyectos");
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const duplicateProject = useDuplicateProject();

  const canCreate = useCanAccess("projects", "can_create");
  const canEdit = useCanAccess("projects", "can_edit");
  const canDelete = useCanAccess("projects", "can_delete");

  const [viewMode, setViewMode] = useState<"grid" | "calendar">("grid");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchConfirm, setBatchConfirm] = useState<{
    action: "archive" | "delete" | "status";
    status?: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("created_desc");
  const [showArchived, setShowArchived] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [archivingProject, setArchivingProject] = useState<Project | null>(
    null,
  );

  const [duplicatingProject, setDuplicatingProject] = useState<Project | null>(
    null,
  );
  const [duplicateName, setDuplicateName] = useState("");
  const [duplicateTasks, setDuplicateTasks] = useState<Task[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set(),
  );
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  useEffect(() => {
    if (!duplicatingProject) return;
    setDuplicateName(`Copia de ${duplicatingProject.name}`);
    setIsLoadingTasks(true);

    supabase
      .from("tasks")
      .select("*")
      .eq("project_id", duplicatingProject.id)
      .order("order_index", { ascending: true })
      .then(({ data }) => {
        const tasks = (data ?? []) as Task[];
        setDuplicateTasks(tasks);
        setSelectedTaskIds(new Set(tasks.map((t) => t.id)));
        setIsLoadingTasks(false);
      });
  }, [duplicatingProject]);

  const allSelected =
    duplicateTasks.length > 0 && selectedTaskIds.size === duplicateTasks.length;

  const toggleAllTasks = () => {
    if (allSelected) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(duplicateTasks.map((t) => t.id)));
    }
  };

  const toggleTask = (id: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDuplicateConfirm = () => {
    if (!duplicatingProject || !duplicateName.trim()) return;
    duplicateProject.mutate(
      {
        project: duplicatingProject,
        newName: duplicateName.trim(),
        taskIds: Array.from(selectedTaskIds),
      },
      {
        onSuccess: () => {
          setDuplicatingProject(null);
          setDuplicateTasks([]);
          setSelectedTaskIds(new Set());
        },
      },
    );
  };

  const clientOptions = useMemo(() => {
    if (!projects) return [];
    const seen = new Set<string>();
    return projects
      .filter(
        (p) =>
          p.status !== "archived" &&
          p.client &&
          !seen.has(p.client.id) &&
          seen.add(p.client.id),
      )
      .map((p) => ({ id: p.client!.id, name: p.client!.name }));
  }, [projects]);

  const activeFiltersCount = [
    statusFilter !== "all",
    clientFilter !== "all",
    search.length > 0,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setClientFilter("all");
    setSortBy("created_desc");
  };

  const filtered = useMemo(() => {
    let result = projects ?? [];

    result = showArchived
      ? result.filter((p) => p.status === "archived")
      : result.filter((p) => p.status !== "archived");

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q)) ||
          p.client?.name.toLowerCase().includes(q),
      );
    }

    if (!showArchived && statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (clientFilter !== "all") {
      result = result.filter((p) => p.client?.id === clientFilter);
    }

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "created_asc":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "created_desc":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "due_asc": {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return (
            new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
          );
        }
        case "due_desc": {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return (
            new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
          );
        }
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "progress_desc":
          return b.progress - a.progress;
        default:
          return 0;
      }
    });

    return result;
  }, [projects, search, statusFilter, clientFilter, sortBy, showArchived]);

  const archivedCount = useMemo(
    () => projects?.filter((p) => p.status === "archived").length ?? 0,
    [projects],
  );

  const handleCreate = (data: ProjectFormData) => {
    createProject.mutate(data, { onSuccess: () => setIsCreateOpen(false) });
  };

  const handleUpdate = (data: ProjectFormData) => {
    if (!editingProject) return;
    updateProject.mutate(
      { id: editingProject.id, ...data },
      { onSuccess: () => setEditingProject(null) },
    );
  };

  const handleArchiveConfirm = () => {
    if (!archivingProject) return;
    updateProject.mutate(
      { id: archivingProject.id, status: "archived" },
      { onSettled: () => setArchivingProject(null) },
    );
  };

  const handleUnarchive = (project: Project) => {
    updateProject.mutate({ id: project.id, status: "todo" });
  };

  const handleDeleteConfirm = () => {
    if (!deletingProject) return;
    deleteProject.mutate(deletingProject.id, {
      onSettled: () => setDeletingProject(null),
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBatchConfirm = () => {
    if (!batchConfirm) return;
    const ids = Array.from(selectedIds);

    if (batchConfirm.action === "delete") {
      ids.forEach((id) => deleteProject.mutate(id));
    } else if (batchConfirm.action === "archive") {
      ids.forEach((id) => updateProject.mutate({ id, status: "archived" }));
    } else if (batchConfirm.action === "status" && batchConfirm.status) {
      ids.forEach((id) =>
        updateProject.mutate({ id, status: batchConfirm.status as Project["status"] }),
      );
    }

    setSelectedIds(new Set());
    setBatchConfirm(null);
  };

  const selectionMode = selectedIds.size > 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {showArchived ? "Proyectos archivados" : "Proyectos"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {filtered.length} de{" "}
            {showArchived
              ? archivedCount
              : (projects?.filter((p) => p.status !== "archived").length ??
                0)}{" "}
            proyecto{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {!showArchived && (
            <div className="flex border border-border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                className="h-9 w-9 rounded-none"
                onClick={() => setViewMode("grid")}
                title="Vista cuadrícula"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "calendar" ? "default" : "ghost"}
                size="icon"
                className="h-9 w-9 rounded-none"
                onClick={() => setViewMode("calendar")}
                title="Vista calendario"
              >
                <CalendarDays className="h-4 w-4" />
              </Button>
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => {
              setShowArchived(!showArchived);
              clearFilters();
            }}
            className="gap-2"
          >
            {showArchived ? (
              <>
                <ArrowRight className="h-4 w-4" />
                Ver activos
              </>
            ) : (
              <>
                <Archive className="h-4 w-4" />
                Archivados
                {archivedCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-xs px-1.5 py-0 h-4"
                  >
                    {archivedCount}
                  </Badge>
                )}
              </>
            )}
          </Button>
          {!showArchived && canCreate && (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo proyecto
            </Button>
          )}
        </div>
      </motion.div>

      {/* Filters */}
      {!showArchived && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, descripción, etiqueta o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
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
                  {statusFilter === "all"
                    ? "Estado"
                    : statusLabels[statusFilter]}
                  {statusFilter !== "all" && (
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                  Todos los estados
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter("todo")}>
                  Pendiente
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("progress")}>
                  En progreso
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("review")}>
                  En revisión
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("done")}>
                  Completado
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("cancelled")}>
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
                      : (clientOptions.find((c) => c.id === clientFilter)
                          ?.name ?? "Cliente")}
                    {clientFilter !== "all" && (
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setClientFilter("all")}>
                    Todos los clientes
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {clientOptions.map((c) => (
                    <DropdownMenuItem
                      key={c.id}
                      onClick={() => setClientFilter(c.id)}
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
                  {sortLabels[sortBy]}
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {(Object.keys(sortLabels) as SortOption[]).map((key) => (
                  <DropdownMenuItem key={key} onClick={() => setSortBy(key)}>
                    <span
                      className={
                        sortBy === key ? "font-semibold text-primary" : ""
                      }
                    >
                      {sortLabels[key]}
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
                    onClick={clearFilters}
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
      )}

      {/* Search en vista archivados */}
      {showArchived && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar proyectos archivados..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-52 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 gap-3"
        >
          <div className="bg-muted rounded-full p-4">
            {showArchived ? (
              <Archive className="h-8 w-8 text-muted-foreground" />
            ) : (
              <FolderKanban className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <p className="text-muted-foreground font-medium">
            {showArchived
              ? "No hay proyectos archivados"
              : activeFiltersCount > 0
                ? "No hay proyectos con estos filtros"
                : "Aún no tienes proyectos"}
          </p>
          {!showArchived && activeFiltersCount > 0 && (
            <Button variant="outline" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Limpiar filtros
            </Button>
          )}
          {!showArchived && activeFiltersCount === 0 && canCreate && (
            <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear primer proyecto
            </Button>
          )}
        </motion.div>
      )}

      {/* Calendar view */}
      {viewMode === "calendar" && !showArchived && !isLoading && (
        <ProjectCalendar projects={filtered} />
      )}

      {/* Projects grid */}
      {(viewMode === "grid" || showArchived) && <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            layout
          >
            <Card
              className={`transition-colors group ${showArchived ? "opacity-75 hover:opacity-100" : "hover:border-primary/50"} ${selectedIds.has(project.id) ? "ring-2 ring-primary" : ""}`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  {canEdit && !showArchived && viewMode === "grid" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(project.id);
                      }}
                      className="shrink-0 mt-0.5 text-muted-foreground hover:text-primary transition-colors"
                      aria-label={selectedIds.has(project.id) ? "Deseleccionar" : "Seleccionar"}
                    >
                      {selectedIds.has(project.id) ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">
                      {project.name}
                    </p>
                    {project.client && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground truncate">
                          {project.client.name}
                        </p>
                      </div>
                    )}
                  </div>
                  <Badge variant={statusVariants[project.status]}>
                    {statusLabels[project.status]}
                  </Badge>
                </div>

                {project.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progreso</span>
                    <span className={statusColors[project.status]}>
                      {project.progress}%
                    </span>
                  </div>
                  <Progress value={project.progress} className="h-1.5" />
                </div>

                <div className="space-y-1">
                  {project.due_date && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 shrink-0" />
                      <span>Entrega: {formatDateShort(project.due_date)}</span>
                    </div>
                  )}
                  {project.budget && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-medium text-foreground">
                        {formatCOP(project.budget)}
                      </span>
                    </div>
                  )}
                  {project.tags && project.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
                      {project.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs h-4 px-1"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {project.tags.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{project.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <div className="flex gap-1">
                    {showArchived ? (
                      <>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Desarchivar"
                            onClick={() => handleUnarchive(project)}
                            disabled={updateProject.isPending}
                          >
                            <ArchiveRestore className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Eliminar permanentemente"
                            onClick={() => setDeletingProject(project)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Editar"
                            onClick={() => setEditingProject(project)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {canCreate && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Duplicar"
                            onClick={() => setDuplicatingProject(project)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Archivar"
                            onClick={() => setArchivingProject(project)}
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                  <Link to={`/proyectos/${project.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs"
                    >
                      Ver detalle
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>}

      {/* Batch action bar */}
      <AnimatePresence>
        {selectionMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card shadow-xl"
          >
            <div className="flex items-center gap-2">
              <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-primary transition-colors">
                {selectedIds.size === filtered.length ? (
                  <CheckSquare className="h-4 w-4 text-primary" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </button>
              <span className="text-sm font-medium text-foreground">
                {selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="h-5 w-px bg-border" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  Cambiar estado
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem onClick={() => setBatchConfirm({ action: "status", status: "todo" })}>
                  Pendiente
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setBatchConfirm({ action: "status", status: "progress" })}>
                  En progreso
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setBatchConfirm({ action: "status", status: "review" })}>
                  En revisión
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setBatchConfirm({ action: "status", status: "done" })}>
                  Completado
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setBatchConfirm({ action: "status", status: "cancelled" })}>
                  Cancelado
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setBatchConfirm({ action: "archive" })}
            >
              <Archive className="h-3.5 w-3.5" />
              Archivar
            </Button>

            <div className="h-5 w-px bg-border" />

            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearSelection}>
              <X className="h-3.5 w-3.5 mr-1" />
              Cancelar
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Batch confirm dialog */}
      <Dialog open={!!batchConfirm} onOpenChange={(open) => !open && setBatchConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {batchConfirm?.action === "delete" ? (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              ) : batchConfirm?.action === "archive" ? (
                <Archive className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ArrowUpDown className="h-5 w-5 text-muted-foreground" />
              )}
              {batchConfirm?.action === "delete"
                ? "Eliminar proyectos"
                : batchConfirm?.action === "archive"
                  ? "Archivar proyectos"
                  : "Cambiar estado"}
            </DialogTitle>
            <DialogDescription>
              {batchConfirm?.action === "delete"
                ? `¿Eliminar permanentemente ${selectedIds.size} proyecto${selectedIds.size !== 1 ? "s" : ""}? Esta acción no se puede deshacer.`
                : batchConfirm?.action === "archive"
                  ? `¿Archivar ${selectedIds.size} proyecto${selectedIds.size !== 1 ? "s" : ""}?`
                  : `¿Cambiar ${selectedIds.size} proyecto${selectedIds.size !== 1 ? "s" : ""} a "${statusLabels[batchConfirm?.status ?? ""]}"?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant={batchConfirm?.action === "delete" ? "destructive" : "default"}
              onClick={handleBatchConfirm}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo proyecto</DialogTitle>
          </DialogHeader>
          <ProjectForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateOpen(false)}
            isLoading={createProject.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={!!editingProject}
        onOpenChange={(open) => !open && setEditingProject(null)}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar proyecto</DialogTitle>
          </DialogHeader>
          {editingProject && (
            <ProjectForm
              initialData={{
                ...editingProject,
                clientId: editingProject.client?.id ?? null,
              }}
              onSubmit={handleUpdate}
              onCancel={() => setEditingProject(null)}
              isLoading={updateProject.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Duplicate dialog */}
      <Dialog
        open={!!duplicatingProject}
        onOpenChange={(open) => {
          if (!open) {
            setDuplicatingProject(null);
            setDuplicateTasks([]);
            setSelectedTaskIds(new Set());
          }
        }}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5" />
              Duplicar proyecto
            </DialogTitle>
            <DialogDescription>
              Se creará un nuevo proyecto en estado Pendiente con progreso 0%.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Nombre del nuevo proyecto
              </label>
              <Input
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
                placeholder="Nombre del proyecto..."
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Tareas a copiar
                  {duplicateTasks.length > 0 && (
                    <span className="ml-1.5 text-muted-foreground font-normal">
                      ({selectedTaskIds.size}/{duplicateTasks.length})
                    </span>
                  )}
                </label>
                {duplicateTasks.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={toggleAllTasks}
                  >
                    {allSelected ? "Deseleccionar todas" : "Seleccionar todas"}
                  </Button>
                )}
              </div>

              {isLoadingTasks ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-9 bg-muted animate-pulse rounded-lg"
                    />
                  ))}
                </div>
              ) : duplicateTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Este proyecto no tiene tareas.
                </p>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  {duplicateTasks.map((task, i) => (
                    <label
                      key={task.id}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-accent transition-colors ${i > 0 ? "border-t border-border" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTaskIds.has(task.id)}
                        onChange={() => toggleTask(task.id)}
                        className="h-4 w-4 rounded accent-primary"
                      />
                      <span className="text-sm text-foreground truncate">
                        {task.title}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDuplicatingProject(null);
                setDuplicateTasks([]);
                setSelectedTaskIds(new Set());
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDuplicateConfirm}
              disabled={!duplicateName.trim() || duplicateProject.isPending}
            >
              {duplicateProject.isPending
                ? "Duplicando..."
                : "Duplicar proyecto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive confirmation */}
      <Dialog
        open={!!archivingProject}
        onOpenChange={(open) => !open && setArchivingProject(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-muted-foreground" />
              Archivar proyecto
            </DialogTitle>
            <DialogDescription>
              ¿Archivar{" "}
              <span className="font-semibold text-foreground">
                "{archivingProject?.name}"
              </span>
              ? El proyecto dejará de aparecer en la lista principal pero podrás
              consultarlo y restaurarlo desde la vista de archivados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchivingProject(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleArchiveConfirm}
              disabled={updateProject.isPending}
            >
              {updateProject.isPending ? "Archivando..." : "Archivar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={!!deletingProject}
        onOpenChange={(open) => !open && setDeletingProject(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Eliminar proyecto
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar permanentemente{" "}
              <span className="font-semibold text-foreground">
                "{deletingProject?.name}"
              </span>
              ? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingProject(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteProject.isPending}
            >
              {deleteProject.isPending ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
