import type { TaskStatus } from "@/types";

// ─── Badge variant type ─────────────────────────────────────────────────────
export type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

// ─── Project status ─────────────────────────────────────────────────────────
export const PROJECT_STATUS_LABELS: Record<string, string> = {
  todo: "Pendiente",
  progress: "En progreso",
  review: "En revisión",
  done: "Completado",
  cancelled: "Cancelado",
  archived: "Archivado",
};

export const PROJECT_STATUS_VARIANTS: Record<string, BadgeVariant> = {
  todo: "secondary",
  progress: "default",
  review: "outline",
  done: "default",
  cancelled: "destructive",
  archived: "secondary",
};

export const PROJECT_STATUS_COLORS: Record<string, string> = {
  todo: "text-muted-foreground",
  progress: "text-blue-500",
  review: "text-orange-500",
  done: "text-green-500",
  cancelled: "text-destructive",
  archived: "text-muted-foreground",
};

// ─── Task status ────────────────────────────────────────────────────────────
export const TASK_COLUMNS: { id: TaskStatus; label: string; color: string }[] =
  [
    { id: "todo", label: "Pendiente", color: "text-muted-foreground" },
    { id: "progress", label: "En progreso", color: "text-blue-500" },
    { id: "review", label: "En revisión", color: "text-orange-500" },
    { id: "done", label: "Completado", color: "text-green-500" },
  ];

export const TASK_STATUS_BG: Record<string, string> = {
  todo: "bg-muted-foreground",
  progress: "bg-blue-500",
  review: "bg-orange-500",
  done: "bg-green-500",
};

// ─── Quote status ───────────────────────────────────────────────────────────
export const QUOTE_STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviada",
  accepted: "Aceptada",
  rejected: "Rechazada",
  archived: "Archivada",
};

export const QUOTE_STATUS_VARIANTS: Record<string, BadgeVariant> = {
  draft: "secondary",
  sent: "default",
  accepted: "default",
  rejected: "destructive",
  archived: "secondary",
};

export const QUOTE_STATUS_COLORS: Record<string, string> = {
  draft: "text-muted-foreground",
  sent: "text-blue-500",
  accepted: "text-green-500",
  rejected: "text-destructive",
  archived: "text-muted-foreground",
};
