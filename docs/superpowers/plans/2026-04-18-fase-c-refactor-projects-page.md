# Fase C — Refactor de ProjectsPage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Partir `src/pages/ProjectsPage.tsx` (1126 líneas) en 3 hooks + 8 subcomponentes, dejando la página en ≤280 líneas sin que el usuario note ningún cambio funcional.

**Architecture:** Extracción incremental de abajo hacia arriba: primero los 3 hooks (estado puro / queries), luego los 4 dialogs (hojas), después `ProjectCard` (la pieza con más variantes), después `ProjectsBatchBar` y `ProjectsToolbar`, después `ProjectsGrid`, y al final el rearmado del `return` de la página. Cada extracción termina con `npm run build` y `npm run test:run` en verde y un commit atómico.

**Tech Stack:** React 19, TypeScript 5.9 estricto, Vitest 4.1 + Testing Library, TanStack Query 5, framer-motion, Tailwind v4 + shadcn/ui.

**Rama:** `feat/refactor-projects-page` (ya creada desde `main`).

**Decisiones tomadas antes de empezar:**

1. `ProjectCard` se queda local en `components/projects-list/`. La tarjeta del Dashboard de "proyectos recientes" es estructuralmente distinta (solo nombre + badge + barra) y meterlas a compartir requeriría 5+ props condicionales que empeoran ambas vistas.
2. La query directa a Supabase para tareas del flujo de duplicación (líneas 132-143 del page actual) se mete dentro de `useProjectDuplicate`. Mismo patrón que el resto del archivo (todo lo de TanStack Query vive en hooks).
3. Hard limit del page: **≤280 líneas** (criterio "Cuándo damos por hecha la Fase C" del spec). El spec menciona ~220 como ideal, pero con la cantidad de dialogs y handlers 280 es realista.

---

## Mapa de archivos

### Crear

```
src/hooks/projects-list/
  useProjectsFilters.ts                              (~80 líneas)
  useProjectsFilters.test.ts
  useProjectsBatchSelection.ts                       (~70)
  useProjectsBatchSelection.test.ts
  useProjectDuplicate.ts                             (~110, incluye query interna de tasks)

src/components/projects-list/
  BatchConfirmDialog.tsx                             (~70)
  DeleteProjectDialog.tsx                            (~50)
  ArchiveProjectDialog.tsx                           (~50)
  DuplicateProjectDialog.tsx                         (~140)
  ProjectCard.tsx                                    (~180)
  ProjectCard.test.tsx
  ProjectsBatchBar.tsx                               (~110)
  ProjectsToolbar.tsx                                (~170)
  ProjectsGrid.tsx                                   (~50)
```

Notas sobre tamaños vs spec:
- `BatchConfirmDialog`, `DeleteProjectDialog`, `ArchiveProjectDialog` me quedaron un poco más arriba del spec (~50-70 vs 40-50) porque incluyen el shadcn `<DialogHeader>/<Title>/<Description>/<Footer>` completo — el spec subestimó.
- `ProjectCard` también queda arriba (~180 vs 130) porque tiene la variante `showArchived` y los 3 botones de acción.
- `ProjectsToolbar` queda arriba (~170 vs 120) porque incluye la barra de búsqueda + 3 dropdowns + botón de limpiar + variante archivados.

Ninguno pasa el límite de 250 líneas que se acordó como tope para subcomponentes en Fase B.

### Modificar

- `src/pages/ProjectsPage.tsx` — queda en ≤280 líneas: llama 3 hooks locales + 5 hooks de mutación + 2 queries, renderiza header + 4 secciones (toolbar/grid/batch-bar/dialogs), maneja handlers de mutación.

### No se toca

- `src/hooks/useProjects.ts` — las 7 funciones se siguen usando como están.
- `src/hooks/useMyPermissions.ts`, `usePageTitle.ts`.
- `src/components/shared/ProjectForm.tsx`, `ProjectCalendar.tsx` — se siguen importando.
- `src/components/ui/pagination.tsx` — se sigue usando.
- `src/lib/constants.ts`, `src/lib/utils.ts`, `src/lib/supabase.ts`.
- `src/types/*`.

---

## Orden de las tareas

1. Scaffolding de carpetas (`.gitkeep`).
2. `useProjectsFilters` + test.
3. `useProjectsBatchSelection` + test.
4. `useProjectDuplicate` (incluye query interna de tasks).
5. `BatchConfirmDialog` (hoja, sin test).
6. `DeleteProjectDialog` (hoja, sin test).
7. `ArchiveProjectDialog` (hoja, sin test).
8. `DuplicateProjectDialog` (hoja, sin test — usa `useProjectDuplicate` desde el page).
9. `ProjectCard` + test.
10. `ProjectsBatchBar` (hoja, sin test).
11. `ProjectsToolbar` (hoja, sin test).
12. `ProjectsGrid` (envuelve `ProjectCard`).
13. Cleanup final: rearmar `ProjectsPage`, validación manual con Playwright MCP.

**Regla entre tareas:** después de cada `npm run build` + `npm run test:run` en verde, proponer commit al usuario. El usuario commitea a mano (todo lo de git lo ejecuta el usuario).

---

## Task 1: Scaffolding

**Files:**
- Create: `src/hooks/projects-list/.gitkeep`
- Create: `src/components/projects-list/.gitkeep`

- [ ] **Step 1: Crear carpetas con `.gitkeep`**

```bash
mkdir -p src/hooks/projects-list src/components/projects-list
touch src/hooks/projects-list/.gitkeep src/components/projects-list/.gitkeep
```

- [ ] **Step 2: Verify**

Run: `git status`
Expected: dos archivos `.gitkeep` untracked.

- [ ] **Step 3: Proponer commit al usuario**

```
chore: scaffold projects-list folders
```

---

## Task 2: useProjectsFilters + test

**Files:**
- Create: `src/hooks/projects-list/useProjectsFilters.ts`
- Test: `src/hooks/projects-list/useProjectsFilters.test.ts`

**Diseño:**

El hook expone los 4 filtros (search/status/client/sort) + el toggle de archivados. `resetFilters` deja todo en defaults excepto `showArchived` (alternar archivados es una intención distinta del usuario). Cuando se cambia entre vista activa y archivada, el page llama `clearFilters()` aparte.

- [ ] **Step 1: Escribir el test (debe fallar)**

```ts
// src/hooks/projects-list/useProjectsFilters.test.ts
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProjectsFilters } from "./useProjectsFilters";

describe("useProjectsFilters", () => {
  it("starts with default values", () => {
    const { result } = renderHook(() => useProjectsFilters());
    expect(result.current.search).toBe("");
    expect(result.current.statusFilter).toBe("all");
    expect(result.current.clientFilter).toBe("all");
    expect(result.current.sortBy).toBe("created_desc");
    expect(result.current.showArchived).toBe(false);
  });

  it("updates each filter via its setter", () => {
    const { result } = renderHook(() => useProjectsFilters());
    act(() => result.current.setSearch("foo"));
    act(() => result.current.setStatusFilter("progress"));
    act(() => result.current.setClientFilter("client-1"));
    act(() => result.current.setSortBy("name_asc"));
    act(() => result.current.setShowArchived(true));
    expect(result.current.search).toBe("foo");
    expect(result.current.statusFilter).toBe("progress");
    expect(result.current.clientFilter).toBe("client-1");
    expect(result.current.sortBy).toBe("name_asc");
    expect(result.current.showArchived).toBe(true);
  });

  it("resetFilters returns search/status/client/sort to defaults but keeps showArchived", () => {
    const { result } = renderHook(() => useProjectsFilters());
    act(() => {
      result.current.setSearch("x");
      result.current.setStatusFilter("done");
      result.current.setClientFilter("c");
      result.current.setSortBy("name_asc");
      result.current.setShowArchived(true);
    });
    act(() => result.current.resetFilters());
    expect(result.current.search).toBe("");
    expect(result.current.statusFilter).toBe("all");
    expect(result.current.clientFilter).toBe("all");
    expect(result.current.sortBy).toBe("created_desc");
    expect(result.current.showArchived).toBe(true);
  });

  it("counts active filters (excluding sort and showArchived)", () => {
    const { result } = renderHook(() => useProjectsFilters());
    expect(result.current.activeFiltersCount).toBe(0);
    act(() => result.current.setSearch("x"));
    expect(result.current.activeFiltersCount).toBe(1);
    act(() => result.current.setStatusFilter("done"));
    expect(result.current.activeFiltersCount).toBe(2);
    act(() => result.current.setClientFilter("c"));
    expect(result.current.activeFiltersCount).toBe(3);
  });
});
```

- [ ] **Step 2: Run test, expect failure**

Run: `npm run test:run -- useProjectsFilters`
Expected: FAIL — module not found.

- [ ] **Step 3: Implementar el hook**

```ts
// src/hooks/projects-list/useProjectsFilters.ts
import { useState, useMemo } from "react";

export type SortOption =
  | "created_desc"
  | "created_asc"
  | "due_asc"
  | "due_desc"
  | "name_asc"
  | "progress_desc";

export const SORT_LABELS: Record<SortOption, string> = {
  created_desc: "Más recientes",
  created_asc: "Más antiguos",
  due_asc: "Entrega próxima",
  due_desc: "Entrega lejana",
  name_asc: "Nombre A-Z",
  progress_desc: "Mayor progreso",
};

export function useProjectsFilters() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("created_desc");
  const [showArchived, setShowArchived] = useState(false);

  const activeFiltersCount = useMemo(
    () =>
      [
        statusFilter !== "all",
        clientFilter !== "all",
        search.length > 0,
      ].filter(Boolean).length,
    [statusFilter, clientFilter, search],
  );

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setClientFilter("all");
    setSortBy("created_desc");
  };

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    clientFilter,
    setClientFilter,
    sortBy,
    setSortBy,
    showArchived,
    setShowArchived,
    activeFiltersCount,
    resetFilters,
  };
}
```

- [ ] **Step 4: Run tests, expect pass**

Run: `npm run test:run -- useProjectsFilters`
Expected: 4 passing.

- [ ] **Step 5: Run build**

Run: `npm run build`
Expected: success, no errors.

- [ ] **Step 6: Proponer commit al usuario**

```
refactor: extract useProjectsFilters hook
```

---

## Task 3: useProjectsBatchSelection + test

**Files:**
- Create: `src/hooks/projects-list/useProjectsBatchSelection.ts`
- Test: `src/hooks/projects-list/useProjectsBatchSelection.test.ts`

**Diseño:**

Encapsula el `Set<string>` de seleccionados, el dialog de confirmación batch (`{ action, status }`), y la helper `toggleAll(idsInPage)` que recibe las IDs visibles para alternar todas.

- [ ] **Step 1: Escribir el test (debe fallar)**

```ts
// src/hooks/projects-list/useProjectsBatchSelection.test.ts
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProjectsBatchSelection } from "./useProjectsBatchSelection";

describe("useProjectsBatchSelection", () => {
  it("starts empty", () => {
    const { result } = renderHook(() => useProjectsBatchSelection());
    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.count).toBe(0);
    expect(result.current.batchConfirm).toBeNull();
  });

  it("toggle adds and removes IDs", () => {
    const { result } = renderHook(() => useProjectsBatchSelection());
    act(() => result.current.toggle("a"));
    expect(result.current.selectedIds.has("a")).toBe(true);
    expect(result.current.count).toBe(1);
    act(() => result.current.toggle("a"));
    expect(result.current.selectedIds.has("a")).toBe(false);
    expect(result.current.count).toBe(0);
  });

  it("toggleAll selects all when none selected, clears when all selected", () => {
    const { result } = renderHook(() => useProjectsBatchSelection());
    const ids = ["a", "b", "c"];
    act(() => result.current.toggleAll(ids));
    expect(result.current.count).toBe(3);
    act(() => result.current.toggleAll(ids));
    expect(result.current.count).toBe(0);
  });

  it("toggleAll with partial selection selects all", () => {
    const { result } = renderHook(() => useProjectsBatchSelection());
    act(() => result.current.toggle("a"));
    act(() => result.current.toggleAll(["a", "b", "c"]));
    expect(result.current.count).toBe(3);
  });

  it("clear empties the selection", () => {
    const { result } = renderHook(() => useProjectsBatchSelection());
    act(() => result.current.toggle("a"));
    act(() => result.current.toggle("b"));
    act(() => result.current.clear());
    expect(result.current.count).toBe(0);
  });

  it("setBatchConfirm stores and clears the dialog state", () => {
    const { result } = renderHook(() => useProjectsBatchSelection());
    act(() => result.current.setBatchConfirm({ action: "archive" }));
    expect(result.current.batchConfirm).toEqual({ action: "archive" });
    act(() => result.current.setBatchConfirm(null));
    expect(result.current.batchConfirm).toBeNull();
  });
});
```

- [ ] **Step 2: Run test, expect failure**

Run: `npm run test:run -- useProjectsBatchSelection`
Expected: FAIL — module not found.

- [ ] **Step 3: Implementar el hook**

```ts
// src/hooks/projects-list/useProjectsBatchSelection.ts
import { useState } from "react";

export type BatchAction =
  | { action: "archive" }
  | { action: "delete" }
  | { action: "status"; status: string };

export function useProjectsBatchSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchConfirm, setBatchConfirm] = useState<BatchAction | null>(null);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (ids: string[]) => {
    setSelectedIds((prev) =>
      prev.size === ids.length ? new Set() : new Set(ids),
    );
  };

  const clear = () => setSelectedIds(new Set());

  return {
    selectedIds,
    count: selectedIds.size,
    toggle,
    toggleAll,
    clear,
    batchConfirm,
    setBatchConfirm,
  };
}
```

- [ ] **Step 4: Run tests, expect pass**

Run: `npm run test:run -- useProjectsBatchSelection`
Expected: 6 passing.

- [ ] **Step 5: Run build**

Run: `npm run build`
Expected: success.

- [ ] **Step 6: Proponer commit al usuario**

```
refactor: extract useProjectsBatchSelection hook
```

---

## Task 4: useProjectDuplicate

**Files:**
- Create: `src/hooks/projects-list/useProjectDuplicate.ts`

**Diseño:**

Este hook encapsula todo el estado del flujo de duplicación: qué proyecto se está duplicando, su nombre nuevo, las tareas cargadas desde Supabase, las IDs seleccionadas. Internamente usa un `useQuery` para traer las tareas (en vez del `useEffect + supabase` que tiene el page hoy). Cuando confirmás, llama al `useDuplicateProject` mutation existente y limpia el estado en `onSuccess`.

No lleva test unitario: la query toca Supabase y la lógica es básicamente un wrapper. Se cubre con la validación manual al final.

- [ ] **Step 1: Implementar el hook**

```ts
// src/hooks/projects-list/useProjectDuplicate.ts
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useDuplicateProject } from "@/hooks/useProjects";
import type { Project, Task } from "@/types";

export function useProjectDuplicate() {
  const [duplicatingProject, setDuplicatingProject] = useState<Project | null>(
    null,
  );
  const [duplicateName, setDuplicateName] = useState("");
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set(),
  );
  const duplicateMutation = useDuplicateProject();

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ["project-tasks", duplicatingProject?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", duplicatingProject!.id)
        .order("order_index", { ascending: true });
      return (data ?? []) as Task[];
    },
    enabled: !!duplicatingProject,
  });

  // Reset name + select all tasks whenever a new project is opened
  useEffect(() => {
    if (!duplicatingProject) return;
    setDuplicateName(`Copia de ${duplicatingProject.name}`);
  }, [duplicatingProject]);

  useEffect(() => {
    if (tasks.length > 0) {
      setSelectedTaskIds(new Set(tasks.map((t) => t.id)));
    }
  }, [tasks]);

  const allSelected = useMemo(
    () => tasks.length > 0 && selectedTaskIds.size === tasks.length,
    [tasks, selectedTaskIds],
  );

  const toggleTask = (id: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllTasks = () => {
    if (allSelected) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(tasks.map((t) => t.id)));
    }
  };

  const close = () => {
    setDuplicatingProject(null);
    setSelectedTaskIds(new Set());
  };

  const confirm = () => {
    if (!duplicatingProject || !duplicateName.trim()) return;
    duplicateMutation.mutate(
      {
        project: duplicatingProject,
        newName: duplicateName.trim(),
        taskIds: Array.from(selectedTaskIds),
      },
      { onSuccess: close },
    );
  };

  return {
    duplicatingProject,
    open: setDuplicatingProject,
    close,
    duplicateName,
    setDuplicateName,
    tasks,
    isLoadingTasks,
    selectedTaskIds,
    allSelected,
    toggleTask,
    toggleAllTasks,
    confirm,
    isPending: duplicateMutation.isPending,
  };
}
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: success — el hook no se usa todavía pero compila.

- [ ] **Step 3: Run tests, asegurar que no se rompió nada**

Run: `npm run test:run`
Expected: todos los tests previos en verde.

- [ ] **Step 4: Proponer commit al usuario**

```
refactor: extract useProjectDuplicate hook
```

---

## Task 5: BatchConfirmDialog

**Files:**
- Create: `src/components/projects-list/BatchConfirmDialog.tsx`

**Diseño:**

Dialog simple con 3 variantes (`archive` | `delete` | `status`). Recibe el `action` (o null para cerrarse), `count` de seleccionados, `onConfirm`, `onCancel`. Para `status` también recibe el `statusLabel` ya formateado por el padre (no importa `PROJECT_STATUS_LABELS` aquí — el page lo resuelve antes de pasar la prop).

- [ ] **Step 1: Implementar componente**

```tsx
// src/components/projects-list/BatchConfirmDialog.tsx
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
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: success.

- [ ] **Step 3: Proponer commit**

```
refactor: extract BatchConfirmDialog component
```

---

## Task 6: DeleteProjectDialog

**Files:**
- Create: `src/components/projects-list/DeleteProjectDialog.tsx`

- [ ] **Step 1: Implementar**

```tsx
// src/components/projects-list/DeleteProjectDialog.tsx
import { AlertTriangle } from "lucide-react";
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

interface DeleteProjectDialogProps {
  project: Project | null;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteProjectDialog({
  project,
  isPending,
  onConfirm,
  onCancel,
}: DeleteProjectDialogProps) {
  return (
    <Dialog open={!!project} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Eliminar proyecto
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar permanentemente{" "}
            <span className="font-semibold text-foreground">
              "{project?.name}"
            </span>
            ? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Eliminando..." : "Sí, eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: success.

- [ ] **Step 3: Proponer commit**

```
refactor: extract DeleteProjectDialog component
```

---

## Task 7: ArchiveProjectDialog

**Files:**
- Create: `src/components/projects-list/ArchiveProjectDialog.tsx`

- [ ] **Step 1: Implementar**

```tsx
// src/components/projects-list/ArchiveProjectDialog.tsx
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
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: success.

- [ ] **Step 3: Proponer commit**

```
refactor: extract ArchiveProjectDialog component
```

---

## Task 8: DuplicateProjectDialog

**Files:**
- Create: `src/components/projects-list/DuplicateProjectDialog.tsx`

**Diseño:**

Recibe el `useProjectDuplicate` hook spread por props. El page hace `<DuplicateProjectDialog {...duplicate} />`. El componente es 100% controlado.

- [ ] **Step 1: Implementar**

```tsx
// src/components/projects-list/DuplicateProjectDialog.tsx
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
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: success.

- [ ] **Step 3: Proponer commit**

```
refactor: extract DuplicateProjectDialog component
```

---

## Task 9: ProjectCard + test

**Files:**
- Create: `src/components/projects-list/ProjectCard.tsx`
- Test: `src/components/projects-list/ProjectCard.test.tsx`

**Diseño:**

Una sola tarjeta con dos variantes según `showArchived`:
- Activa: muestra checkbox de selección (si `canEdit` y `viewMode === "grid"`), botones Editar/Duplicar/Archivar.
- Archivada: oculta checkbox, muestra botones Desarchivar/Eliminar.

Recibe el `project`, los flags de permisos, el modo de vista, el estado de selección, y los callbacks por acción. NO importa hooks ni stores. NO se memoiza por ahora — Phase B mostró que `React.memo` agrega complejidad sin beneficio medible aquí.

`<Link>` necesita router context, por eso el test usa `renderWithRouter`.

- [ ] **Step 1: Escribir el test (debe fallar)**

```tsx
// src/components/projects-list/ProjectCard.test.tsx
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRouter } from "@/test/renderWithRouter";
import { ProjectCard } from "./ProjectCard";
import type { Project } from "@/types";

const baseProject = {
  id: "p1",
  name: "Test project",
  description: "Test description",
  status: "progress",
  progress: 42,
  due_date: null,
  budget: null,
  tags: [],
  start_date: null,
  client: null,
} as unknown as Project;

const noopHandlers = {
  onToggleSelect: vi.fn(),
  onEdit: vi.fn(),
  onDuplicate: vi.fn(),
  onArchive: vi.fn(),
  onUnarchive: vi.fn(),
  onDelete: vi.fn(),
};

describe("ProjectCard", () => {
  it("renders name, status badge and progress", () => {
    renderWithRouter(
      <ProjectCard
        project={baseProject}
        showArchived={false}
        viewMode="grid"
        isSelected={false}
        canEdit
        canCreate
        canDelete
        isUpdatePending={false}
        {...noopHandlers}
      />,
    );
    expect(screen.getByText("Test project")).toBeInTheDocument();
    expect(screen.getByText("En progreso")).toBeInTheDocument();
    expect(screen.getByText("42%")).toBeInTheDocument();
  });

  it("hides edit/duplicate/archive buttons when canEdit is false", () => {
    renderWithRouter(
      <ProjectCard
        project={baseProject}
        showArchived={false}
        viewMode="grid"
        isSelected={false}
        canEdit={false}
        canCreate={false}
        canDelete={false}
        isUpdatePending={false}
        {...noopHandlers}
      />,
    );
    expect(screen.queryByTitle("Editar")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Duplicar")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Archivar")).not.toBeInTheDocument();
  });

  it("shows unarchive and delete in archived variant", () => {
    renderWithRouter(
      <ProjectCard
        project={baseProject}
        showArchived
        viewMode="grid"
        isSelected={false}
        canEdit
        canCreate
        canDelete
        isUpdatePending={false}
        {...noopHandlers}
      />,
    );
    expect(screen.getByTitle("Desarchivar")).toBeInTheDocument();
    expect(screen.getByTitle("Eliminar permanentemente")).toBeInTheDocument();
    expect(screen.queryByTitle("Editar")).not.toBeInTheDocument();
  });

  it("fires onEdit when the edit button is clicked", async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    renderWithRouter(
      <ProjectCard
        project={baseProject}
        showArchived={false}
        viewMode="grid"
        isSelected={false}
        canEdit
        canCreate
        canDelete
        isUpdatePending={false}
        {...noopHandlers}
        onEdit={onEdit}
      />,
    );
    await user.click(screen.getByTitle("Editar"));
    expect(onEdit).toHaveBeenCalledWith(baseProject);
  });

  it("fires onToggleSelect when the checkbox is clicked", async () => {
    const onToggleSelect = vi.fn();
    const user = userEvent.setup();
    renderWithRouter(
      <ProjectCard
        project={baseProject}
        showArchived={false}
        viewMode="grid"
        isSelected={false}
        canEdit
        canCreate
        canDelete
        isUpdatePending={false}
        {...noopHandlers}
        onToggleSelect={onToggleSelect}
      />,
    );
    await user.click(screen.getByLabelText("Seleccionar"));
    expect(onToggleSelect).toHaveBeenCalledWith("p1");
  });
});
```

- [ ] **Step 2: Run test, expect failure**

Run: `npm run test:run -- ProjectCard`
Expected: FAIL — module not found.

- [ ] **Step 3: Implementar el componente**

```tsx
// src/components/projects-list/ProjectCard.tsx
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
              className="shrink-0 mt-0.5 text-muted-foreground hover:text-primary transition-colors"
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
```

- [ ] **Step 4: Run tests, expect pass**

Run: `npm run test:run -- ProjectCard`
Expected: 5 passing.

- [ ] **Step 5: Run build**

Run: `npm run build`
Expected: success.

- [ ] **Step 6: Proponer commit**

```
refactor: extract ProjectCard component with tests
```

---

## Task 10: ProjectsBatchBar

**Files:**
- Create: `src/components/projects-list/ProjectsBatchBar.tsx`

**Diseño:**

La barra flotante con animación de framer-motion. Recibe `count`, `totalInPage` (para el toggleAll), y los handlers. Lista de estados disponibles para "Cambiar estado" hardcodeada (mismas opciones que el page actual).

- [ ] **Step 1: Implementar**

```tsx
// src/components/projects-list/ProjectsBatchBar.tsx
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
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: success.

- [ ] **Step 3: Proponer commit**

```
refactor: extract ProjectsBatchBar component
```

---

## Task 11: ProjectsToolbar

**Files:**
- Create: `src/components/projects-list/ProjectsToolbar.tsx`

**Diseño:**

Recibe el spread de `useProjectsFilters` + la lista de `clientOptions` ya derivada por el padre. Renderiza:
- Variante activos: search + 3 dropdowns (status/client/sort) + botón Limpiar (si `activeFiltersCount > 0`).
- Variante archivados: solo el search.

El padre decide qué variante mostrar según `showArchived`.

- [ ] **Step 1: Implementar**

```tsx
// src/components/projects-list/ProjectsToolbar.tsx
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Filter,
  ChevronDown,
  User,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PROJECT_STATUS_LABELS as statusLabels } from "@/lib/constants";
import {
  type SortOption,
  SORT_LABELS,
} from "@/hooks/projects-list/useProjectsFilters";

interface ClientOption {
  id: string;
  name: string;
}

interface ProjectsToolbarProps {
  showArchived: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  clientFilter: string;
  onClientFilterChange: (v: string) => void;
  clientOptions: ClientOption[];
  sortBy: SortOption;
  onSortByChange: (v: SortOption) => void;
  activeFiltersCount: number;
  onClear: () => void;
}

export function ProjectsToolbar({
  showArchived,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  clientFilter,
  onClientFilterChange,
  clientOptions,
  sortBy,
  onSortByChange,
  activeFiltersCount,
  onClear,
}: ProjectsToolbarProps) {
  if (showArchived) {
    return (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar proyectos archivados..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, descripción, etiqueta o cliente..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <Filter className="h-3.5 w-3.5" />
              {statusFilter === "all" ? "Estado" : statusLabels[statusFilter]}
              {statusFilter !== "all" && (
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              )}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onStatusFilterChange("all")}>
              Todos los estados
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onStatusFilterChange("todo")}>
              Pendiente
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusFilterChange("progress")}>
              En progreso
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusFilterChange("review")}>
              En revisión
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusFilterChange("done")}>
              Completado
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusFilterChange("cancelled")}>
              Cancelado
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {clientOptions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <User className="h-3.5 w-3.5" />
                {clientFilter === "all"
                  ? "Cliente"
                  : (clientOptions.find((c) => c.id === clientFilter)?.name ??
                    "Cliente")}
                {clientFilter !== "all" && (
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                )}
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => onClientFilterChange("all")}>
                Todos los clientes
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {clientOptions.map((c) => (
                <DropdownMenuItem
                  key={c.id}
                  onClick={() => onClientFilterChange(c.id)}
                >
                  {c.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <ArrowUpDown className="h-3.5 w-3.5" />
              {SORT_LABELS[sortBy]}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
              <DropdownMenuItem key={key} onClick={() => onSortByChange(key)}>
                <span
                  className={
                    sortBy === key ? "font-semibold text-primary" : ""
                  }
                >
                  {SORT_LABELS[key]}
                </span>
                {sortBy === key && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <AnimatePresence>
          {activeFiltersCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={onClear}
                className="h-9 gap-2"
              >
                <X className="h-3.5 w-3.5" />
                Limpiar
                <Badge
                  variant="secondary"
                  className="text-xs px-1.5 py-0 h-4"
                >
                  {activeFiltersCount}
                </Badge>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: success.

- [ ] **Step 3: Proponer commit**

```
refactor: extract ProjectsToolbar component
```

---

## Task 12: ProjectsGrid

**Files:**
- Create: `src/components/projects-list/ProjectsGrid.tsx`

**Diseño:**

Wrapper minimal sobre `ProjectCard`: arma el grid responsive y aplica las animaciones por tarjeta. No conoce permisos ni handlers — los pasa pelados al `ProjectCard`. Recibe `projects`, `selectedIds` (para `isSelected`) y los mismos handlers que `ProjectCard`.

- [ ] **Step 1: Implementar**

```tsx
// src/components/projects-list/ProjectsGrid.tsx
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
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: success.

- [ ] **Step 3: Proponer commit**

```
refactor: extract ProjectsGrid component
```

---

## Task 13: Cleanup final — rearmar ProjectsPage

**Files:**
- Modify: `src/pages/ProjectsPage.tsx` (de 1126 → ≤280 líneas)

**Diseño:**

La página final solo:

1. Llama hooks (mutation, queries, permisos, los 3 hooks locales).
2. Deriva `clientOptions`, `archivedCount`, `paginatedData`.
3. Effect para resetear `page` cuando cambian los filtros.
4. Define handlers de mutación (`handleCreate`, `handleUpdate`, `handleArchiveConfirm`, `handleUnarchive`, `handleDeleteConfirm`, `handleBatchConfirm`).
5. Renderiza header (inline, ~75 líneas — único bloque que sigue inline porque es chico y mezcla viewMode + archived toggle + Nuevo proyecto).
6. Conditional toolbar / loading / empty / calendar / grid + pagination.
7. Renderiza `<ProjectsBatchBar>`, las 4 dialogs y los 2 dialogs de form (Create + Edit, ambos con `<ProjectForm>`).

- [ ] **Step 1: Reescribir el page**

Reemplazar el contenido completo de `src/pages/ProjectsPage.tsx` con esto:

```tsx
import { usePageTitle } from "@/hooks/usePageTitle";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  FolderKanban,
  Search,
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
import type { Project } from "@/types";

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

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [
    filters.search,
    filters.statusFilter,
    filters.clientFilter,
    filters.sortBy,
    filters.showArchived,
  ]);

  const { data: paginatedData, isLoading } = usePaginatedProjects({
    search: filters.search,
    status: filters.statusFilter as any,
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
      {/* Header */}
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
```

Notar que `Search` queda importado aunque el page no lo use directo — eliminarlo (TS6133 con `noUnusedLocals`).

- [ ] **Step 2: Verificar imports no usados**

Quitar de los imports de `lucide-react` los que ya no se usan en el page (debería quedar: `Plus`, `FolderKanban`, `ArrowRight`, `X`, `Archive`, `LayoutGrid`, `CalendarDays`).

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: success, sin TS6133 ni warnings nuevos.

- [ ] **Step 4: Run tests**

Run: `npm run test:run`
Expected: todos verdes (los anteriores + los 3 nuevos: `useProjectsFilters`, `useProjectsBatchSelection`, `ProjectCard`).

- [ ] **Step 5: Verificar tamaño del page**

```bash
wc -l src/pages/ProjectsPage.tsx
```
Expected: ≤280 líneas.

- [ ] **Step 6: Validación manual con Playwright MCP**

Levantar dev server (`npm run dev`) y validar a mano:

1. **Crear proyecto:** abrir Dialog Nuevo, llenar form, guardar, ver que aparece en la lista.
2. **Editar proyecto:** click en lápiz, cambiar nombre, guardar, ver actualización.
3. **Filtros:** poner búsqueda, cambiar status, cambiar cliente, cambiar sort. Verificar que el contador "Limpiar (N)" suma correctamente y que limpiar resetea todo (excepto el toggle de archivados).
4. **Selección batch:** seleccionar 2 proyectos con los checkboxes, verificar que aparece la barra flotante con `2 seleccionados`. Cambiar estado batch a "En revisión", confirmar, verificar que ambos cambiaron.
5. **Archivar batch:** seleccionar proyectos, click Archivar en la barra, confirmar, verificar que desaparecen de la lista activa y aparecen en archivados.
6. **Duplicar:** click en duplicar, ver Dialog con nombre prellenado "Copia de X", lista de tareas con todas seleccionadas. Deseleccionar 1 tarea, confirmar, verificar que se creó el proyecto duplicado y que tiene la cantidad correcta de tareas.
7. **Archivar individual:** click en archivar, confirmar, verificar que desaparece y se ve el contador de archivados.
8. **Vista archivados:** click "Archivados", verificar que la barra de filtros se simplifica al search. Buscar uno, click Desarchivar, verificar que vuelve a la lista activa.
9. **Eliminar permanentemente:** desde archivados, click Eliminar, confirmar, verificar que desaparece y baja el contador.
10. **Vista calendario:** click ícono calendario en el header, verificar que muestra `ProjectCalendar`. Volver a grid.
11. **Paginación:** si hay más de 1 página, navegar a página 2, aplicar un filtro, verificar que vuelve a página 1.

- [ ] **Step 7: Proponer commit final**

```
refactor: rewrite ProjectsPage using projects-list components and hooks
```

- [ ] **Step 8: Proponer commit del plan**

```
docs: add fase C refactor projects page plan
```

(Este último commit incluye `docs/superpowers/plans/2026-04-18-fase-c-refactor-projects-page.md`.)

---

## Criterios para dar Phase C por terminada

- `src/pages/ProjectsPage.tsx` ≤280 líneas.
- `npm run build` verde, sin warnings nuevos.
- `npm run test:run` verde, incluidos los 3 tests nuevos (`useProjectsFilters`, `useProjectsBatchSelection`, `ProjectCard`).
- Los 11 escenarios de validación manual pasan.
- Todos los commits chicos y atómicos están propuestos al usuario y mergeados a `feat/refactor-projects-page`.
- PR creado contra `main`, mergeado, branch local + remota borradas.
