import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
} from "lucide-react";
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from "@/hooks/useProjects";
import ProjectForm from "@/components/shared/ProjectForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Project } from "@/types";

const statusLabels: Record<string, string> = {
  todo: "Pendiente",
  progress: "En progreso",
  review: "En revisión",
  done: "Completado",
  cancelled: "Cancelado",
};

const statusVariants: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
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

type ProjectFormData = Omit<
  Project,
  "id" | "user_id" | "created_at" | "share_token" | "progress"
>;

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const filtered =
    projects?.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase()) ||
        p.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase())),
    ) ?? [];

  const handleCreate = (data: ProjectFormData) => {
    createProject.mutate(data, {
      onSuccess: () => setIsCreateOpen(false),
    });
  };

  const handleUpdate = (data: ProjectFormData) => {
    if (!editingProject) return;
    updateProject.mutate(
      { id: editingProject.id, ...data },
      {
        onSuccess: () => setEditingProject(null),
      },
    );
  };

  const handleDeleteConfirm = () => {
    if (!deletingProject) return;
    deleteProject.mutate(deletingProject.id, {
      onSettled: () => setDeletingProject(null),
    });
  };

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatBudget = (budget: number | null) => {
    if (!budget) return null;
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(budget);
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
            {projects?.length ?? 0} proyecto{projects?.length !== 1 ? "s" : ""}{" "}
            en total
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo proyecto
        </Button>
      </motion.div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, descripción o etiqueta..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
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
            {search ? "No se encontraron proyectos" : "Aún no tienes proyectos"}
          </p>
          {!search && (
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
            transition={{ delay: i * 0.05 }}
          >
            <Card className="hover:border-primary/50 transition-colors group">
              <CardContent className="p-4 space-y-3">
                {/* Header */}
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

                {/* Description */}
                {project.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                )}

                {/* Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progreso</span>
                    <span className={statusColors[project.status]}>
                      {project.progress}%
                    </span>
                  </div>
                  <Progress value={project.progress} className="h-1.5" />
                </div>

                {/* Dates & budget */}
                <div className="space-y-1">
                  {project.due_date && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 shrink-0" />
                      <span>Entrega: {formatDate(project.due_date)}</span>
                    </div>
                  )}
                  {project.budget && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="font-medium">$</span>
                      <span>{formatBudget(project.budget)}</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {project.tags && project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <Tag className="h-3 w-3 text-muted-foreground mt-0.5" />
                    {project.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-xs px-1.5 py-0"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {project.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        +{project.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Actions */}
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
                      className="h-7 text-xs gap-1"
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
          <ProjectForm
            initialData={editingProject ?? undefined}
            onSubmit={handleUpdate}
            onCancel={() => setEditingProject(null)}
            isLoading={updateProject.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
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
                {deletingProject?.name}
              </span>
              ? Se eliminarán también todas las tareas, documentos y archivos
              asociados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeletingProject(null)}
              disabled={deleteProject.isPending}
            >
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
