import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  User,
  DollarSign,
  Tag,
  Archive,
  ArchiveRestore,
  AlertTriangle,
} from "lucide-react";
import { useProject, useUpdateProject } from "@/hooks/useProjects";
import { useCanAccess } from "@/hooks/useMyPermissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import KanbanBoard from "@/components/shared/KanbanBoard";
import DocumentsTab from "@/components/shared/DocumentsTab";
import AttachmentsTab from "@/components/shared/AttachmentsTab";
import PaymentsTab from "@/components/shared/PaymentsTab";
import CommentsTab from "@/components/shared/CommentsTab";
import { formatDate, formatCOP } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  todo: "Pendiente",
  progress: "En progreso",
  review: "En revisión",
  done: "Completado",
  cancelled: "Cancelado",
  archived: "Archivado",
};

const statusVariants: {
  [key: string]: "default" | "secondary" | "outline" | "destructive";
} = {
  todo: "secondary",
  progress: "default",
  review: "outline",
  done: "default",
  cancelled: "destructive",
  archived: "secondary",
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(id!);
  const updateProject = useUpdateProject();

  const canEditProject = useCanAccess("projects", "can_edit");
  const canViewTasks = useCanAccess("tasks", "can_view");
  const canViewDocuments = useCanAccess("documents", "can_view");
  const canViewAttachments = useCanAccess("attachments", "can_view");
  const canViewPayments = useCanAccess("payments", "can_view");
  const canViewComments = useCanAccess("comments", "can_view");

  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  const isArchived = project?.status === "archived";

  const handleArchiveConfirm = () => {
    if (!project) return;
    updateProject.mutate(
      { id: project.id, status: "archived" },
      {
        onSuccess: () => {
          setIsArchiveOpen(false);
          navigate("/proyectos");
        },
      },
    );
  };

  const handleUnarchive = () => {
    if (!project) return;
    updateProject.mutate(
      { id: project.id, status: "todo" },
      { onSuccess: () => setIsArchiveOpen(false) },
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-32 bg-muted animate-pulse rounded-xl" />
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 flex flex-col items-center justify-center py-16 gap-3">
        <p className="text-muted-foreground">Proyecto no encontrado</p>
        <Button variant="outline" onClick={() => navigate("/proyectos")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a proyectos
        </Button>
      </div>
    );
  }

  // Determinar qué tabs mostrar según permisos
  const visibleTabs = [
    canViewTasks && "tareas",
    canViewDocuments && "documentos",
    canViewAttachments && "archivos",
    canViewPayments && "pagos",
    canViewComments && "comentarios",
  ].filter(Boolean) as string[];

  const defaultTab = visibleTabs[0] ?? "tareas";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/proyectos")}
          className="gap-2 -ml-2 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Proyectos
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">
                {project.name}
              </h1>
              <Badge variant={statusVariants[project.status]}>
                {statusLabels[project.status]}
              </Badge>
            </div>
            {project.description && (
              <p className="text-muted-foreground text-sm max-w-2xl">
                {project.description}
              </p>
            )}
          </div>

          {canEditProject && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsArchiveOpen(true)}
              className="gap-2 shrink-0"
              disabled={updateProject.isPending}
            >
              {isArchived ? (
                <>
                  <ArchiveRestore className="h-4 w-4" />
                  Desarchivar
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4" />
                  Archivar
                </>
              )}
            </Button>
          )}
        </div>

        {/* Archived banner */}
        {isArchived && (
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm text-muted-foreground">
            <Archive className="h-4 w-4 shrink-0" />
            Este proyecto está archivado. Puedes consultarlo pero no editarlo.
          </div>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {project.client && (
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              <span>{project.client.name}</span>
            </div>
          )}
          {project.due_date && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>Entrega: {formatDate(project.due_date)}</span>
            </div>
          )}
          {project.budget && (
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-4 w-4" />
              <span>{formatCOP(project.budget)}</span>
            </div>
          )}
          {project.tags && project.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Tag className="h-4 w-4" />
              {project.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progreso general</span>
            <span className="font-medium text-foreground">
              {project.progress}%
            </span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>

        <Separator />
      </motion.div>

      {/* Tabs — solo muestra las que el colaborador puede ver */}
      {visibleTabs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <AlertTriangle className="h-8 w-8" />
          <p className="text-sm font-medium">
            No tienes permisos para ver el contenido de este proyecto
          </p>
        </div>
      ) : (
        <Tabs defaultValue={defaultTab}>
          <TabsList className="mb-4">
            {canViewTasks && <TabsTrigger value="tareas">Tareas</TabsTrigger>}
            {canViewDocuments && (
              <TabsTrigger value="documentos">Documentación</TabsTrigger>
            )}
            {canViewAttachments && (
              <TabsTrigger value="archivos">Archivos</TabsTrigger>
            )}
            {canViewPayments && <TabsTrigger value="pagos">Pagos</TabsTrigger>}
            {canViewComments && (
              <TabsTrigger value="comentarios">Comentarios</TabsTrigger>
            )}
          </TabsList>

          {canViewTasks && (
            <TabsContent value="tareas">
              <KanbanBoard projectId={project.id} />
            </TabsContent>
          )}

          {canViewDocuments && (
            <TabsContent value="documentos">
              <DocumentsTab projectId={project.id} />
            </TabsContent>
          )}

          {canViewAttachments && (
            <TabsContent value="archivos">
              <AttachmentsTab projectId={project.id} />
            </TabsContent>
          )}

          {canViewPayments && (
            <TabsContent value="pagos">
              <PaymentsTab projectId={project.id} />
            </TabsContent>
          )}

          {canViewComments && (
            <TabsContent value="comentarios">
              <CommentsTab
                projectId={project.id}
                projectName={project.name}
                projectOwnerId={project.user_id}
              />
            </TabsContent>
          )}
        </Tabs>
      )}

      {/* Archive dialog */}
      <Dialog open={isArchiveOpen} onOpenChange={setIsArchiveOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isArchived ? (
                <>
                  <ArchiveRestore className="h-5 w-5 text-muted-foreground" />
                  Desarchivar proyecto
                </>
              ) : (
                <>
                  <Archive className="h-5 w-5 text-muted-foreground" />
                  Archivar proyecto
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {isArchived ? (
                <>
                  ¿Restaurar{" "}
                  <span className="font-semibold text-foreground">
                    "{project.name}"
                  </span>
                  ? Volverá a aparecer en la lista principal de proyectos.
                </>
              ) : (
                <>
                  ¿Archivar{" "}
                  <span className="font-semibold text-foreground">
                    "{project.name}"
                  </span>
                  ? Dejará de aparecer en la lista principal pero podrás
                  consultarlo y restaurarlo desde la vista de archivados.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsArchiveOpen(false)}>
              Cancelar
            </Button>
            {isArchived ? (
              <Button
                onClick={handleUnarchive}
                disabled={updateProject.isPending}
              >
                {updateProject.isPending ? "Restaurando..." : "Desarchivar"}
              </Button>
            ) : (
              <Button
                onClick={handleArchiveConfirm}
                disabled={updateProject.isPending}
              >
                {updateProject.isPending ? "Archivando..." : "Archivar"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
