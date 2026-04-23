import { Link } from "react-router-dom";
import {
  Pencil,
  Trash2,
  Calendar,
  User,
  Tag,
  ArrowRight,
  Archive,
  ArchiveRestore,
  Copy,
  CheckSquare,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatDateShort, formatCOP } from "@/lib/utils";
import {
  PROJECT_STATUS_LABELS as statusLabels,
  PROJECT_STATUS_VARIANTS as statusVariants,
  PROJECT_STATUS_COLORS as statusColors,
} from "@/lib/constants";
import type { Project } from "@/types";

interface ProjectCardProps {
  project: Project;
  showArchived: boolean;
  viewMode: "grid" | "calendar";
  isSelected: boolean;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
  isUpdatePending: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (project: Project) => void;
  onDuplicate: (project: Project) => void;
  onArchive: (project: Project) => void;
  onUnarchive: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export function ProjectCard({
  project,
  showArchived,
  viewMode,
  isSelected,
  canEdit,
  canCreate,
  canDelete,
  isUpdatePending,
  onToggleSelect,
  onEdit,
  onDuplicate,
  onArchive,
  onUnarchive,
  onDelete,
}: ProjectCardProps) {
  return (
    <Card
      className={`transition-colors group ${
        showArchived
          ? "opacity-75 hover:opacity-100"
          : "hover:border-primary/50"
      } ${isSelected ? "ring-2 ring-primary" : ""}`}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          {canEdit && !showArchived && viewMode === "grid" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect(project.id);
              }}
              className="cursor-pointer shrink-0 mt-0.5 text-muted-foreground hover:text-primary transition-colors"
              aria-label={isSelected ? "Deseleccionar" : "Seleccionar"}
            >
              {isSelected ? (
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
                    onClick={() => onUnarchive(project)}
                    disabled={isUpdatePending}
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
                    onClick={() => onDelete(project)}
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
                    onClick={() => onEdit(project)}
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
                    onClick={() => onDuplicate(project)}
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
                    onClick={() => onArchive(project)}
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </Button>
                )}
              </>
            )}
          </div>
          <Link to={`/proyectos/${project.id}`}>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
              Ver detalle
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
