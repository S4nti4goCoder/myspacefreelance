import { usePageTitle } from "@/hooks/usePageTitle";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  FolderKanban,
  ArrowRight,
  X,
  Archive,
  LayoutGrid,
  CalendarDays,
} from "lucide-react";
import {
  useProjects,
  usePaginatedProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from "@/hooks/useProjects";
import { useCanAccess } from "@/hooks/useMyPermissions";
import { useProjectsFilters } from "@/hooks/projects-list/useProjectsFilters";
import { useProjectsBatchSelection } from "@/hooks/projects-list/useProjectsBatchSelection";
import { useProjectDuplicate } from "@/hooks/projects-list/useProjectDuplicate";
import ProjectForm from "@/components/shared/ProjectForm";
import type { ProjectFormData } from "@/components/shared/ProjectForm";
import ProjectCalendar from "@/components/shared/ProjectCalendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { PROJECT_STATUS_LABELS as statusLabels } from "@/lib/constants";
import { ProjectsToolbar } from "@/components/projects-list/ProjectsToolbar";
import { ProjectsGrid } from "@/components/projects-list/ProjectsGrid";
import { ProjectsBatchBar } from "@/components/projects-list/ProjectsBatchBar";
import { BatchConfirmDialog } from "@/components/projects-list/BatchConfirmDialog";
import { DeleteProjectDialog } from "@/components/projects-list/DeleteProjectDialog";
import { ArchiveProjectDialog } from "@/components/projects-list/ArchiveProjectDialog";
import { DuplicateProjectDialog } from "@/components/projects-list/DuplicateProjectDialog";
import type { Project, ProjectStatus } from "@/types";

export default function ProjectsPage() {
  usePageTitle("Proyectos");
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const canCreate = useCanAccess("projects", "can_create");
  const canEdit = useCanAccess("projects", "can_edit");
  const canDelete = useCanAccess("projects", "can_delete");

  const filters = useProjectsFilters();
  const batch = useProjectsBatchSelection();
  const duplicate = useProjectDuplicate();

  const [viewMode, setViewMode] = useState<"grid" | "calendar">("grid");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [archivingProject, setArchivingProject] = useState<Project | null>(
    null,
  );

  const filtersKey = `${filters.search}|${filters.statusFilter}|${filters.clientFilter}|${filters.sortBy}|${filters.showArchived}`;
  const [prevFiltersKey, setPrevFiltersKey] = useState(filtersKey);
  if (prevFiltersKey !== filtersKey) {
    setPrevFiltersKey(filtersKey);
    setPage(1);
  }

  const { data: paginatedData, isLoading } = usePaginatedProjects({
    search: filters.search,
    status: filters.statusFilter as ProjectStatus | "all",
    clientId: filters.clientFilter,
    sortBy: filters.sortBy,
    showArchived: filters.showArchived,
    page,
  });

  const { data: allProjects } = useProjects();

  const filtered = paginatedData?.projects ?? [];
  const totalPages = paginatedData?.totalPages ?? 1;
  const totalItems = paginatedData?.total ?? 0;
  const pageSize = paginatedData?.pageSize ?? 12;

  const clientOptions = useMemo(() => {
    if (!allProjects) return [];
    const seen = new Set<string>();
    return allProjects
      .filter(
        (p) =>
          p.status !== "archived" &&
          p.client &&
          !seen.has(p.client.id) &&
          seen.add(p.client.id),
      )
      .map((p) => ({ id: p.client!.id, name: p.client!.name }));
  }, [allProjects]);

  const archivedCount = useMemo(
    () => allProjects?.filter((p) => p.status === "archived").length ?? 0,
    [allProjects],
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

  const handleBatchConfirm = () => {
    if (!batch.batchConfirm) return;
    const ids = Array.from(batch.selectedIds);
    if (batch.batchConfirm.action === "delete") {
      ids.forEach((id) => deleteProject.mutate(id));
    } else if (batch.batchConfirm.action === "archive") {
      ids.forEach((id) => updateProject.mutate({ id, status: "archived" }));
    } else if (batch.batchConfirm.action === "status") {
      const status = batch.batchConfirm.status as Project["status"];
      ids.forEach((id) => updateProject.mutate({ id, status }));
    }
    batch.clear();
    batch.setBatchConfirm(null);
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {filters.showArchived ? "Proyectos archivados" : "Proyectos"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {totalItems} proyecto{totalItems !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {!filters.showArchived && (
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
              filters.setShowArchived(!filters.showArchived);
              filters.resetFilters();
            }}
            className="gap-2"
          >
            {filters.showArchived ? (
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
          {!filters.showArchived && canCreate && (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo proyecto
            </Button>
          )}
        </div>
      </motion.div>

      <ProjectsToolbar
        showArchived={filters.showArchived}
        search={filters.search}
        onSearchChange={filters.setSearch}
        statusFilter={filters.statusFilter}
        onStatusFilterChange={filters.setStatusFilter}
        clientFilter={filters.clientFilter}
        onClientFilterChange={filters.setClientFilter}
        clientOptions={clientOptions}
        sortBy={filters.sortBy}
        onSortByChange={filters.setSortBy}
        activeFiltersCount={filters.activeFiltersCount}
        onClear={filters.resetFilters}
      />

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-52 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 gap-3"
        >
          <div className="bg-muted rounded-full p-4">
            {filters.showArchived ? (
              <Archive className="h-8 w-8 text-muted-foreground" />
            ) : (
              <FolderKanban className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <p className="text-muted-foreground font-medium">
            {filters.showArchived
              ? "No hay proyectos archivados"
              : filters.activeFiltersCount > 0
                ? "No hay proyectos con estos filtros"
                : "Aún no tienes proyectos"}
          </p>
          {!filters.showArchived && filters.activeFiltersCount > 0 && (
            <Button variant="outline" onClick={filters.resetFilters}>
              <X className="mr-2 h-4 w-4" />
              Limpiar filtros
            </Button>
          )}
          {!filters.showArchived &&
            filters.activeFiltersCount === 0 &&
            canCreate && (
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Crear primer proyecto
              </Button>
            )}
        </motion.div>
      )}

      {viewMode === "calendar" && !filters.showArchived && !isLoading && (
        <ProjectCalendar
          projects={(allProjects ?? []).filter(
            (p) => p.status !== "archived",
          )}
        />
      )}

      {(viewMode === "grid" || filters.showArchived) && (
        <ProjectsGrid
          projects={filtered}
          selectedIds={batch.selectedIds}
          showArchived={filters.showArchived}
          viewMode={viewMode}
          canEdit={canEdit}
          canCreate={canCreate}
          canDelete={canDelete}
          isUpdatePending={updateProject.isPending}
          onToggleSelect={batch.toggle}
          onEdit={setEditingProject}
          onDuplicate={duplicate.open}
          onArchive={setArchivingProject}
          onUnarchive={handleUnarchive}
          onDelete={setDeletingProject}
        />
      )}

      {(viewMode === "grid" || filters.showArchived) &&
        !isLoading &&
        filtered.length > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalItems}
            pageSize={pageSize}
          />
        )}

      <ProjectsBatchBar
        count={batch.count}
        totalInPage={filtered.length}
        onToggleAll={() => batch.toggleAll(filtered.map((p) => p.id))}
        onClear={batch.clear}
        onSetStatus={(status) =>
          batch.setBatchConfirm({ action: "status", status })
        }
        onArchive={() => batch.setBatchConfirm({ action: "archive" })}
      />

      <BatchConfirmDialog
        action={batch.batchConfirm}
        count={batch.count}
        statusLabel={
          batch.batchConfirm?.action === "status"
            ? statusLabels[batch.batchConfirm.status]
            : undefined
        }
        onConfirm={handleBatchConfirm}
        onCancel={() => batch.setBatchConfirm(null)}
      />

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

      <DuplicateProjectDialog {...duplicate} />

      <ArchiveProjectDialog
        project={archivingProject}
        isPending={updateProject.isPending}
        onConfirm={handleArchiveConfirm}
        onCancel={() => setArchivingProject(null)}
      />

      <DeleteProjectDialog
        project={deletingProject}
        isPending={deleteProject.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingProject(null)}
      />
    </div>
  );
}
