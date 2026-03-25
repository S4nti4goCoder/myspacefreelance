import { useState, useMemo } from "react";
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
} from "lucide-react";
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from "@/hooks/useProjects";
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
import type { Project } from "@/types";

const statusLabels: Record<string, string> = {
  todo: "Pendiente",
  progress: "En progreso",
  review: "En revisión",
  done: "Completado",
  cancelled: "Cancelado",
};

type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

const statusVariants: Record<string, BadgeVariant> = {
  todo: "secondary",
  progress: "default",
  review: "outline",
  done: "default",
  cancelled: "destructive",
};

const statusColors: Record<string, string> = {
  todo: "text-muted-foreground",
  progress: "text-blue-500",
  review: "text-orange-500",
  done: "text-green-500",
  cancelled: "text-destructive",
};

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
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("created_desc");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const clientOptions = useMemo(() => {
    if (!projects) return [];
    const seen = new Set<string>();
    return projects
      .filter(
        (p) => p.client && !seen.has(p.client.id) && seen.add(p.client.id),
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

    if (statusFilter !== "all") {
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
  }, [projects, search, statusFilter, clientFilter, sortBy]);

  const handleCreate = (data: ProjectFormData) => {
    createProject.mutate(data, {
      onSuccess: () => setIsCreateOpen(false),
    });
  };

  const handleUpdate = (data: ProjectFormData) => {
    if (!editingProject) return;
    updateProject.mutate(
      { id: editingProject.id, ...data },
      { onSuccess: () => setEditingProject(null) },
    );
  };

  const handleDeleteConfirm = () => {
    if (!deletingProject) return;
    deleteProject.mutate(deletingProject.id, {
      onSettled: () => setDeletingProject(null),
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Proyectos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {filtered.length} de {projects?.length ?? 0} proyecto
            {(projects?.length ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo proyecto
        </Button>
      </motion.div>

      {/* Filters */}
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
                {statusFilter === "all" ? "Estado" : statusLabels[statusFilter]}
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
                    : (clientOptions.find((c) => c.id === clientFilter)?.name ??
                      "Cliente")}
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
            <FolderKanban className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">
            {activeFiltersCount > 0
              ? "No hay proyectos con estos filtros"
              : "Aún no tienes proyectos"}
          </p>
          {activeFiltersCount > 0 ? (
            <Button variant="outline" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Limpiar filtros
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear primer proyecto
            </Button>
          )}
        </motion.div>
      )}

      {/* Projects grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            layout
          >
            <Card className="hover:border-primary/50 transition-colors group">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
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
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEditingProject(project)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeletingProject(project)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
      </div>

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
              ¿Estás seguro de que deseas eliminar{" "}
              <span className="font-semibold text-foreground">
                "{deletingProject?.name}"
              </span>
              ? Esta acción eliminará todas las tareas, documentos, archivos y
              pagos asociados.
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
