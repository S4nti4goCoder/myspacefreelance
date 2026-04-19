import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Project, Task } from "@/types";

interface DuplicateProjectDialogProps {
  duplicatingProject: Project | null;
  duplicateName: string;
  setDuplicateName: (v: string) => void;
  tasks: Task[];
  isLoadingTasks: boolean;
  selectedTaskIds: Set<string>;
  allSelected: boolean;
  toggleTask: (id: string) => void;
  toggleAllTasks: () => void;
  confirm: () => void;
  close: () => void;
  isPending: boolean;
}

export function DuplicateProjectDialog({
  duplicatingProject,
  duplicateName,
  setDuplicateName,
  tasks,
  isLoadingTasks,
  selectedTaskIds,
  allSelected,
  toggleTask,
  toggleAllTasks,
  confirm,
  close,
  isPending,
}: DuplicateProjectDialogProps) {
  return (
    <Dialog
      open={!!duplicatingProject}
      onOpenChange={(open) => !open && close()}
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
                {tasks.length > 0 && (
                  <span className="ml-1.5 text-muted-foreground font-normal">
                    ({selectedTaskIds.size}/{tasks.length})
                  </span>
                )}
              </label>
              {tasks.length > 0 && (
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
            ) : tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                Este proyecto no tiene tareas.
              </p>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                {tasks.map((task, i) => (
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
          <Button variant="outline" onClick={close}>
            Cancelar
          </Button>
          <Button
            onClick={confirm}
            disabled={!duplicateName.trim() || isPending}
          >
            {isPending ? "Duplicando..." : "Duplicar proyecto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
