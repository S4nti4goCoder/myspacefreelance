import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Shield,
  FolderKanban,
  Save,
  CheckSquare,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useUpdatePermissions,
  useUpdateCollaboratorProjects,
  ALL_MODULES,
} from "@/hooks/useCollaborators";
import { useProjects } from "@/hooks/useProjects";
import type {
  Collaborator,
  CollaboratorModule,
  CollaboratorPermission,
} from "@/types";

interface CollaboratorPermissionsPageProps {
  collaborator: Collaborator;
  onBack: () => void;
}

// Etiquetas en español para cada módulo
const MODULE_LABELS: Record<CollaboratorModule, string> = {
  projects: "Proyectos",
  tasks: "Tareas",
  documents: "Documentos",
  attachments: "Adjuntos",
  payments: "Pagos",
  quotes: "Cotizaciones",
  services: "Servicios",
  clients: "Cuentas de clientes",
  comments: "Comentarios",
  reports: "Reportes",
};

// Módulos que no tienen acción create/edit/delete (solo ver)
const VIEW_ONLY_MODULES: CollaboratorModule[] = ["reports"];

type PermissionAction = "can_view" | "can_create" | "can_edit" | "can_delete";

interface PermissionRow {
  module: CollaboratorModule;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

function buildInitialPermissions(collaborator: Collaborator): PermissionRow[] {
  return ALL_MODULES.map((module) => {
    const existing = collaborator.permissions?.find((p) => p.module === module);
    return {
      module,
      can_view: existing?.can_view ?? false,
      can_create: existing?.can_create ?? false,
      can_edit: existing?.can_edit ?? false,
      can_delete: existing?.can_delete ?? false,
    };
  });
}

function buildInitialProjectIds(collaborator: Collaborator): string[] {
  return (collaborator.projects ?? []).map((p) => p.id);
}

export default function CollaboratorPermissionsPage({
  collaborator,
  onBack,
}: CollaboratorPermissionsPageProps) {
  const { data: allProjects } = useProjects();
  const updatePermissions = useUpdatePermissions();
  const updateProjects = useUpdateCollaboratorProjects();

  const [permissions, setPermissions] = useState<PermissionRow[]>(() =>
    buildInitialPermissions(collaborator),
  );
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(() =>
    buildInitialProjectIds(collaborator),
  );

  // Re-inicializar si cambia el colaborador
  useEffect(() => {
    setPermissions(buildInitialPermissions(collaborator));
    setSelectedProjectIds(buildInitialProjectIds(collaborator));
  }, [collaborator]);

  const handleToggle = (
    module: CollaboratorModule,
    action: PermissionAction,
  ) => {
    setPermissions((prev) =>
      prev.map((row) => {
        if (row.module !== module) return row;
        const updated = { ...row, [action]: !row[action] };
        // Si se desactiva can_view, desactivar todo lo demás
        if (action === "can_view" && !updated.can_view) {
          updated.can_create = false;
          updated.can_edit = false;
          updated.can_delete = false;
        }
        // Si se activa create/edit/delete, activar can_view automáticamente
        if (action !== "can_view" && updated[action]) {
          updated.can_view = true;
        }
        return updated;
      }),
    );
  };

  const handleSelectAllModules = () => {
    setPermissions((prev) =>
      prev.map((row) => ({
        ...row,
        can_view: true,
        can_create: VIEW_ONLY_MODULES.includes(row.module) ? false : true,
        can_edit: VIEW_ONLY_MODULES.includes(row.module) ? false : true,
        can_delete: VIEW_ONLY_MODULES.includes(row.module) ? false : true,
      })),
    );
  };

  const handleDeselectAllModules = () => {
    setPermissions((prev) =>
      prev.map((row) => ({
        ...row,
        can_view: false,
        can_create: false,
        can_edit: false,
        can_delete: false,
      })),
    );
  };

  const handleToggleProject = (projectId: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId],
    );
  };

  const handleSelectAllProjects = () => {
    setSelectedProjectIds(
      (allProjects ?? [])
        .filter((p) => p.status !== "archived")
        .map((p) => p.id),
    );
  };

  const handleDeselectAllProjects = () => {
    setSelectedProjectIds([]);
  };

  const handleSave = () => {
    updatePermissions.mutate({
      collaboratorId: collaborator.id,
      permissions: permissions.map((p) => ({
        module: p.module,
        can_view: p.can_view,
        can_create: p.can_create,
        can_edit: p.can_edit,
        can_delete: p.can_delete,
      })),
    });
    updateProjects.mutate({
      collaboratorId: collaborator.id,
      projectIds: selectedProjectIds,
    });
  };

  const isSaving = updatePermissions.isPending || updateProjects.isPending;
  const activeProjects = (allProjects ?? []).filter(
    (p) => p.status !== "archived",
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2 -ml-2 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Colaboradores
          </Button>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? "Guardando..." : "Guardar permisos"}
        </Button>
      </motion.div>

      {/* Collaborator info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl"
      >
        <div className="bg-primary/10 rounded-xl h-12 w-12 flex items-center justify-center shrink-0">
          <span className="text-primary font-bold text-xl">
            {collaborator.profile?.name?.charAt(0).toUpperCase() ?? "C"}
          </span>
        </div>
        <div>
          <p className="font-semibold text-foreground">
            {collaborator.profile?.name}
          </p>
          <p className="text-sm text-muted-foreground">
            {collaborator.profile?.email}
          </p>
        </div>
      </motion.div>

      {/* Permissions matrix */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Permisos por módulo
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-xs"
                  onClick={handleSelectAllModules}
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  Seleccionar todo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-xs"
                  onClick={handleDeselectAllModules}
                >
                  <Square className="h-3.5 w-3.5" />
                  Deseleccionar todo
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b border-border mb-1">
              <div className="col-span-4">Módulo</div>
              <div className="col-span-2 text-center">Ver</div>
              <div className="col-span-2 text-center">Crear</div>
              <div className="col-span-2 text-center">Editar</div>
              <div className="col-span-2 text-center">Eliminar</div>
            </div>

            {/* Table rows */}
            <div className="divide-y divide-border">
              {permissions.map((row, i) => {
                const isViewOnly = VIEW_ONLY_MODULES.includes(row.module);
                return (
                  <motion.div
                    key={row.module}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="grid grid-cols-12 gap-2 items-center py-3"
                  >
                    <div className="col-span-4">
                      <p className="text-sm font-medium text-foreground">
                        {MODULE_LABELS[row.module]}
                      </p>
                    </div>
                    {(
                      [
                        "can_view",
                        "can_create",
                        "can_edit",
                        "can_delete",
                      ] as PermissionAction[]
                    ).map((action) => {
                      const disabled = isViewOnly && action !== "can_view";
                      return (
                        <div
                          key={action}
                          className="col-span-2 flex justify-center"
                        >
                          <input
                            type="checkbox"
                            checked={row[action]}
                            onChange={() =>
                              !disabled && handleToggle(row.module, action)
                            }
                            disabled={disabled}
                            className="h-4 w-4 rounded accent-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
                          />
                        </div>
                      );
                    })}
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Projects assignment */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
                Proyectos asignados
                <span className="text-xs font-normal text-muted-foreground">
                  ({selectedProjectIds.length} de {activeProjects.length})
                </span>
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-xs"
                  onClick={handleSelectAllProjects}
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  Seleccionar todos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-xs"
                  onClick={handleDeselectAllProjects}
                >
                  <Square className="h-3.5 w-3.5" />
                  Deseleccionar todos
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activeProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                <FolderKanban className="h-8 w-8" />
                <p className="text-sm">No hay proyectos activos</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {activeProjects.map((project, i) => {
                  const isSelected = selectedProjectIds.includes(project.id);
                  return (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3 py-3 cursor-pointer group"
                      onClick={() => handleToggleProject(project.id)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleProject(project.id)}
                        className="h-4 w-4 rounded accent-primary cursor-pointer shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {project.name}
                        </p>
                        {project.client && (
                          <p className="text-xs text-muted-foreground truncate">
                            {project.client.name}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                          isSelected
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isSelected ? "Asignado" : "Sin acceso"}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
