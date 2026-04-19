import { AlertTriangle, Archive, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type BatchAction =
  | { action: "archive" }
  | { action: "delete" }
  | { action: "status"; status: string };

interface BatchConfirmDialogProps {
  action: BatchAction | null;
  count: number;
  statusLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BatchConfirmDialog({
  action,
  count,
  statusLabel,
  onConfirm,
  onCancel,
}: BatchConfirmDialogProps) {
  const plural = count !== 1 ? "s" : "";

  return (
    <Dialog open={!!action} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {action?.action === "delete" ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : action?.action === "archive" ? (
              <Archive className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ArrowUpDown className="h-5 w-5 text-muted-foreground" />
            )}
            {action?.action === "delete"
              ? "Eliminar proyectos"
              : action?.action === "archive"
                ? "Archivar proyectos"
                : "Cambiar estado"}
          </DialogTitle>
          <DialogDescription>
            {action?.action === "delete"
              ? `¿Eliminar permanentemente ${count} proyecto${plural}? Esta acción no se puede deshacer.`
              : action?.action === "archive"
                ? `¿Archivar ${count} proyecto${plural}?`
                : `¿Cambiar ${count} proyecto${plural} a "${statusLabel ?? ""}"?`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant={action?.action === "delete" ? "destructive" : "default"}
            onClick={onConfirm}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
