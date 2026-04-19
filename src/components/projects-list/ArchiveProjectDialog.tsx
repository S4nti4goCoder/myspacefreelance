import { Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Project } from "@/types";

interface ArchiveProjectDialogProps {
  project: Project | null;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ArchiveProjectDialog({
  project,
  isPending,
  onConfirm,
  onCancel,
}: ArchiveProjectDialogProps) {
  return (
    <Dialog open={!!project} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-muted-foreground" />
            Archivar proyecto
          </DialogTitle>
          <DialogDescription>
            ¿Archivar{" "}
            <span className="font-semibold text-foreground">
              "{project?.name}"
            </span>
            ? El proyecto dejará de aparecer en la lista principal pero podrás
            consultarlo y restaurarlo desde la vista de archivados.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending ? "Archivando..." : "Archivar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
