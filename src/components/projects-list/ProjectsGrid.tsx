import { motion } from "framer-motion";
import { ProjectCard } from "./ProjectCard";
import type { Project } from "@/types";

interface ProjectsGridProps {
  projects: Project[];
  selectedIds: Set<string>;
  showArchived: boolean;
  viewMode: "grid" | "calendar";
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

export function ProjectsGrid({
  projects,
  selectedIds,
  showArchived,
  viewMode,
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
}: ProjectsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {projects.map((project, i) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          layout
        >
          <ProjectCard
            project={project}
            showArchived={showArchived}
            viewMode={viewMode}
            isSelected={selectedIds.has(project.id)}
            canEdit={canEdit}
            canCreate={canCreate}
            canDelete={canDelete}
            isUpdatePending={isUpdatePending}
            onToggleSelect={onToggleSelect}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onArchive={onArchive}
            onUnarchive={onUnarchive}
            onDelete={onDelete}
          />
        </motion.div>
      ))}
    </div>
  );
}
