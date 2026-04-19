import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpDown, Archive, X, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectsBatchBarProps {
  count: number;
  totalInPage: number;
  onToggleAll: () => void;
  onClear: () => void;
  onSetStatus: (status: string) => void;
  onArchive: () => void;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "todo", label: "Pendiente" },
  { value: "progress", label: "En progreso" },
  { value: "review", label: "En revisión" },
  { value: "done", label: "Completado" },
  { value: "cancelled", label: "Cancelado" },
];

export function ProjectsBatchBar({
  count,
  totalInPage,
  onToggleAll,
  onClear,
  onSetStatus,
  onArchive,
}: ProjectsBatchBarProps) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card shadow-xl"
        >
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleAll}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {count === totalInPage ? (
                <CheckSquare className="h-4 w-4 text-primary" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </button>
            <span className="text-sm font-medium text-foreground">
              {count} seleccionado{count !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="h-5 w-px bg-border" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                Cambiar estado
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              {STATUS_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => onSetStatus(opt.value)}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={onArchive}
          >
            <Archive className="h-3.5 w-3.5" />
            Archivar
          </Button>

          <div className="h-5 w-px bg-border" />

          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={onClear}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Cancelar
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
