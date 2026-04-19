# Fase B — Refactor de QuoteEditorPage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Partir `src/pages/QuoteEditorPage.tsx` (1597 líneas) en 1 módulo puro para PDF + 4 hooks + 10 subcomponentes, dejando la página en ~250 líneas sin que cambie nada visible para el usuario.

**Architecture:** Extracción incremental de abajo hacia arriba: primero el módulo puro de PDF (sin JSX), luego los 4 hooks (estado + efectos aislados), después los componentes hoja (leaf-first) y finalmente el rearmado del `return` de la página. Cada extracción termina con `npm run build` y `npm run test:run` en verde y un commit atómico.

**Tech Stack:** React 19, TypeScript 5.9 estricto, Vitest 4.1 + Testing Library, jsPDF 3, TanStack Query 5, Tailwind v4 + shadcn/ui.

**Rama:** `feat/refactor-quote-editor` (ya creada desde `main`).

---

## Mapa de archivos

### Crear

```
src/lib/
  quotePdf.ts                                     (~230 líneas — función pura)

src/hooks/quote-editor/
  useUnsavedChangesGuard.ts                       (~50)
  useQuoteTotals.ts                               (~30)
  useQuoteItems.ts                                (~60)
  useQuoteForm.ts                                 (~130)

src/components/quote-editor/
  UnsavedChangesDialog.tsx                        (~40)
  QuoteTotalsDisplay.tsx                          (~80)
  QuoteTotalsDisplay.test.tsx
  QuoteItemsTable.tsx                             (~200)
  QuoteItemsTable.test.tsx
  QuoteTaxConfiguration.tsx                       (~100)
  QuoteTaxConfiguration.test.tsx
  QuoteDiscountControl.tsx                        (~60)
  QuoteClientSection.tsx                          (~120)
  QuoteHeader.tsx                                 (~80)
  QuoteProjectLink.tsx                            (~50)
  QuoteTermsNotes.tsx                             (~60)
  QuotePreviewPDF.tsx                             (~300)

src/test/
  renderWithRouter.tsx                            (helper, ~20)
```

### Modificar

- `src/pages/QuoteEditorPage.tsx` — queda en ~250 líneas: llama 4 hooks, renderiza 10 subcomponentes, maneja `handleSave` y navegación.

### No se toca

- `src/lib/quoteCalculations.ts` (ya está listo de la Fase A).
- `src/hooks/useQuotes.ts`, `useServices.ts`, `useProjects.ts` (siguen como están).
- `src/store/authStore.ts`.
- `src/types/*`.

---

## Orden de las tareas

1. Scaffolding de carpetas y helpers de test.
2. `lib/quotePdf.ts` (pura, sin JSX).
3. `useUnsavedChangesGuard`.
4. `useQuoteTotals`.
5. `useQuoteItems`.
6. `useQuoteForm`.
7. `UnsavedChangesDialog` (hoja, sin tests).
8. `QuoteTotalsDisplay` + test.
9. `QuoteItemsTable` + test.
10. `QuoteTaxConfiguration` + test.
11. `QuoteDiscountControl` (hoja).
12. `QuoteClientSection` (hoja).
13. `QuoteProjectLink` + `QuoteHeader` (la toolbar + meta).
14. `QuoteTermsNotes` (hoja).
15. `QuotePreviewPDF` (usa `QuoteTotalsDisplay` dentro).
16. Cleanup final: `QuoteEditorPage` < 300 líneas, todos los tests verdes, validación manual con el MCP de Playwright.

**Regla entre tareas:** después de cada `npm run build` + `npm run test:run` en verde, proponer commit al usuario. El usuario commitea a mano.

---

## Task 1: Scaffolding de carpetas y helper de test

**Files:**
- Create: `src/components/quote-editor/.gitkeep`
- Create: `src/hooks/quote-editor/.gitkeep`
- Create: `src/test/renderWithRouter.tsx`

- [ ] **Step 1: Crear las dos carpetas nuevas con `.gitkeep`**

```bash
mkdir -p src/components/quote-editor src/hooks/quote-editor
touch src/components/quote-editor/.gitkeep src/hooks/quote-editor/.gitkeep
```

- [ ] **Step 2: Crear helper `renderWithRouter` para tests de componentes que usan `useNavigate`**

Crear `src/test/renderWithRouter.tsx`:

```tsx
import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement } from "react";

export function renderWithRouter(
  ui: ReactElement,
  options?: { initialEntries?: string[] } & Omit<RenderOptions, "wrapper">,
) {
  const { initialEntries = ["/"], ...rest } = options ?? {};
  return render(ui, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    ),
    ...rest,
  });
}
```

- [ ] **Step 3: Verificar que el build sigue verde**

Run: `npm run build`
Expected: sin errores, sin warnings nuevos.

- [ ] **Step 4: Verificar que los tests siguen verdes**

Run: `npm run test:run`
Expected: 24 tests pasan (Fase A).

- [ ] **Step 5: Proponer commit**

Mensaje sugerido:

```
chore: scaffold quote-editor folders and router test helper
```

---

## Task 2: Extraer `lib/quotePdf.ts` (función pura)

Esta es la extracción más grande y la más aislable: `handleDownloadPDF` ocupa líneas 355-579 (~225 líneas) y solo depende de `jsPDF`, `formatCOP`, `toast`, y las variables del formulario. La convertimos en una función pura que recibe un único objeto `input` y devuelve un `jsPDF`. El `toast` + `pdf.save()` se quedan en la página (efecto secundario).

**Files:**
- Create: `src/lib/quotePdf.ts`
- Modify: `src/pages/QuoteEditorPage.tsx` (reemplazar cuerpo de `handleDownloadPDF`)

- [ ] **Step 1: Crear `src/lib/quotePdf.ts` con el tipo de entrada y el esqueleto**

```ts
import jsPDF from "jspdf";
import { formatCOP } from "@/lib/utils";
import type { Profile } from "@/types";

export interface QuotePdfItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface QuotePdfInput {
  profile: Profile | null;
  quoteNumber: string;
  validDays: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientIsCompany: boolean;
  clientCompany: string;
  clientNit: string;
  items: QuotePdfItem[];
  terms: string;
  applyIva: boolean;
  ivaRate: number;
  applyRetefuente: boolean;
  retefuenteRate: number;
  applyReteica: boolean;
  reteicaRate: number;
  discountType: "percentage" | "fixed";
  discountValue: number;
  subtotal: number;
  discountAmount: number;
  ivaAmount: number;
  retefuenteAmount: number;
  reteicaAmount: number;
  total: number;
}

export function generateQuotePdf(input: QuotePdfInput): jsPDF {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const margin = 20;
  let y = 20;

  const blue: [number, number, number] = [27, 42, 74];
  const red: [number, number, number] = [230, 57, 70];
  const gray: [number, number, number] = [102, 102, 102];
  const lightGray: [number, number, number] = [245, 246, 250];

  // (todo el cuerpo de handleDownloadPDF va acá, sin los toasts ni el pdf.save)
  return pdf;
}
```

- [ ] **Step 2: Copiar el cuerpo de `handleDownloadPDF` dentro de `generateQuotePdf`**

Copiar las líneas 360-572 de `src/pages/QuoteEditorPage.tsx` (todo lo que está entre `const pdf = new jsPDF(...)` y antes de `pdf.save(...)`), y sustituir:

- `profile?.name` y amigos → `input.profile?.name`, etc.
- `quoteNumber` → `input.quoteNumber`
- `validDays` → `input.validDays`
- `clientName`, `clientEmail`, etc. → `input.clientName`, etc.
- `items` → `input.items`
- `terms` → `input.terms`
- `subtotal`, `discountAmount`, `ivaAmount`, etc. → `input.subtotal`, etc.
- `applyIva`, `ivaRate`, etc. → `input.applyIva`, `input.ivaRate`, etc.
- `discountType`, `discountValue` → `input.discountType`, `input.discountValue`

Eliminar al inicio las líneas duplicadas (`const pdf = ...`, `const W = ...`, `const margin = ...`, `let y = ...`, y las tuplas de colores) porque ya están en el esqueleto.

- [ ] **Step 3: Reemplazar `handleDownloadPDF` en la página**

En `src/pages/QuoteEditorPage.tsx`, sustituir todo el bloque `const handleDownloadPDF = () => { ... }` (líneas 355-579) por:

```ts
import { generateQuotePdf } from "@/lib/quotePdf";

// ...

const handleDownloadPDF = () => {
  toast.info("Generando PDF...");
  try {
    const pdf = generateQuotePdf({
      profile,
      quoteNumber,
      validDays,
      clientName,
      clientEmail,
      clientPhone,
      clientIsCompany,
      clientCompany,
      clientNit,
      items: items
        .filter((i) => i.description.trim())
        .map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
      terms,
      applyIva,
      ivaRate,
      applyRetefuente,
      retefuenteRate,
      applyReteica,
      reteicaRate,
      discountType,
      discountValue,
      subtotal,
      discountAmount,
      ivaAmount,
      retefuenteAmount,
      reteicaAmount,
      total,
    });
    pdf.save(`${quoteNumber || "cotizacion"}.pdf`);
    toast.success("PDF descargado exitosamente");
  } catch (err) {
    console.error("PDF error:", err);
    toast.error("Error al generar el PDF");
  }
};
```

Nota: el filtro `i.description.trim()` se hace en el caller porque `QuotePdfInput.items` ya espera items filtrados.

- [ ] **Step 4: Remover el import de `jsPDF` de la página**

En `src/pages/QuoteEditorPage.tsx`, borrar la línea `import jsPDF from "jspdf";` (ya no se usa directamente).

- [ ] **Step 5: Build verde**

Run: `npm run build`
Expected: sin errores.

- [ ] **Step 6: Tests verdes**

Run: `npm run test:run`
Expected: 24 tests pasan.

- [ ] **Step 7: Validación manual — generar un PDF antes y después**

Abrir `http://localhost:5173/cotizaciones/COT-003/editar` con `npm run dev`, pulsar "Descargar PDF", comparar visualmente con el PDF previo al refactor (mismo contenido, mismos colores, misma alineación). Si algo cambió, rollback y revisar qué variable no se mapeó bien.

- [ ] **Step 8: Proponer commit**

Mensaje sugerido:

```
refactor: extract pdf generation to lib/quotePdf
```

---

## Task 3: Extraer `useUnsavedChangesGuard`

Concentra `isDirty`, `markDirty`, `showUnsavedDialog`, `safeNavigate`, `confirmLeave`, `cancelLeave`, y el listener de `beforeunload`. La página deja de importar `useRef` para `pendingNavRef`.

**Files:**
- Create: `src/hooks/quote-editor/useUnsavedChangesGuard.ts`
- Modify: `src/pages/QuoteEditorPage.tsx`

- [ ] **Step 1: Crear `src/hooks/quote-editor/useUnsavedChangesGuard.ts`**

```ts
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export interface UnsavedChangesGuard {
  isDirty: boolean;
  markDirty: () => void;
  clearDirty: () => void;
  showDialog: boolean;
  safeNavigate: (to: string) => void;
  confirmLeave: () => void;
  cancelLeave: () => void;
}

export function useUnsavedChangesGuard(): UnsavedChangesGuard {
  const navigate = useNavigate();
  const [isDirty, setIsDirty] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const pendingNavRef = useRef<string | null>(null);

  const markDirty = useCallback(() => setIsDirty(true), []);
  const clearDirty = useCallback(() => setIsDirty(false), []);

  const safeNavigate = useCallback(
    (to: string) => {
      if (isDirty) {
        pendingNavRef.current = to;
        setShowDialog(true);
      } else {
        navigate(to);
      }
    },
    [isDirty, navigate],
  );

  const confirmLeave = useCallback(() => {
    setShowDialog(false);
    if (pendingNavRef.current) {
      navigate(pendingNavRef.current);
      pendingNavRef.current = null;
    }
  }, [navigate]);

  const cancelLeave = useCallback(() => {
    setShowDialog(false);
    pendingNavRef.current = null;
  }, []);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  return {
    isDirty,
    markDirty,
    clearDirty,
    showDialog,
    safeNavigate,
    confirmLeave,
    cancelLeave,
  };
}
```

- [ ] **Step 2: Integrar en `QuoteEditorPage.tsx`**

Reemplazar las líneas 146-178 (bloque de `isDirty` + `safeNavigate` + `confirmLeave` + effect) + la línea donde se declara `showUnsavedDialog` + `pendingNavRef` por una sola llamada:

```ts
import { useUnsavedChangesGuard } from "@/hooks/quote-editor/useUnsavedChangesGuard";

// Dentro del componente, cerca del principio:
const {
  isDirty,
  markDirty,
  clearDirty,
  showDialog: showUnsavedDialog,
  safeNavigate,
  confirmLeave,
  cancelLeave,
} = useUnsavedChangesGuard();
```

Ajustes en el resto de la página:
- Donde está `setIsDirty(false)` dentro de `handleSave` (dos sitios: `onSuccess` de update y de create), cambiar a `clearDirty()`.
- Eliminar el `useRef` `pendingNavRef` (ahora vive en el hook).
- En el `<Dialog ...>` de abajo, cambiar `onOpenChange={(open) => !open && setShowUnsavedDialog(false)}` por `onOpenChange={(open) => !open && cancelLeave()}`.
- El `onClick` del botón "Seguir editando" pasa de `() => setShowUnsavedDialog(false)` a `cancelLeave`.

- [ ] **Step 3: Build verde**

Run: `npm run build`

- [ ] **Step 4: Tests verdes**

Run: `npm run test:run`
Expected: 24 tests pasan.

- [ ] **Step 5: Validación manual — escenarios de unsaved changes**

Con `npm run dev`:
1. Ir a `/cotizaciones/nueva`, escribir algo en el nombre del cliente, pulsar el botón de volver (flecha) → debe aparecer el dialog.
2. "Seguir editando" → cierra dialog, te quedas en la página.
3. Cambiar algo, pulsar volver, "Salir sin guardar" → te saca a `/cotizaciones`.
4. Refrescar con F5 tras tocar algo → debe salir el prompt nativo del browser.

- [ ] **Step 6: Proponer commit**

Mensaje sugerido:

```
refactor: extract useUnsavedChangesGuard hook
```

---

## Task 4: Extraer `useQuoteTotals`

Wrapper tonto alrededor de `calculateQuoteTotals` + `useMemo`. Lo separamos para que los componentes de preview y totales puedan recibir el resultado sin recalcular.

**Files:**
- Create: `src/hooks/quote-editor/useQuoteTotals.ts`
- Modify: `src/pages/QuoteEditorPage.tsx`

- [ ] **Step 1: Crear `src/hooks/quote-editor/useQuoteTotals.ts`**

```ts
import { useMemo } from "react";
import {
  calculateQuoteTotals,
  type DiscountConfig,
  type QuoteItemForCalc,
  type QuoteTotals,
  type TaxConfig,
} from "@/lib/quoteCalculations";

export function useQuoteTotals(
  items: QuoteItemForCalc[],
  discount: DiscountConfig,
  taxes: TaxConfig,
): QuoteTotals {
  return useMemo(
    () => calculateQuoteTotals(items, discount, taxes),
    [
      items,
      discount.type,
      discount.value,
      taxes.applyIva,
      taxes.ivaRate,
      taxes.applyRetefuente,
      taxes.retefuenteRate,
      taxes.applyReteica,
      taxes.reteicaRate,
    ],
  );
}
```

- [ ] **Step 2: Sustituir el `useMemo` actual en la página**

En `src/pages/QuoteEditorPage.tsx`, reemplazar el bloque `const totals = useMemo(...)` (líneas 180-205) por:

```ts
import { useQuoteTotals } from "@/hooks/quote-editor/useQuoteTotals";

// ...
const totals = useQuoteTotals(
  items.map((i) => ({ quantity: i.quantity, unit_price: i.unit_price })),
  { type: discountType, value: discountValue },
  {
    applyIva,
    ivaRate,
    applyRetefuente,
    retefuenteRate,
    applyReteica,
    reteicaRate,
  },
);
```

El destructuring `const { subtotal, discountAmount, ivaAmount, retefuenteAmount, reteicaAmount, total } = totals;` se mantiene igual.

El import de `calculateQuoteTotals` directamente desde `@/lib/quoteCalculations` ya no hace falta en la página: bórralo.

- [ ] **Step 3: Build verde**

Run: `npm run build`

- [ ] **Step 4: Tests verdes**

Run: `npm run test:run`
Expected: 24 tests pasan.

- [ ] **Step 5: Proponer commit**

Mensaje sugerido:

```
refactor: extract useQuoteTotals hook
```

---

## Task 5: Extraer `useQuoteItems`

Concentra los handlers sobre la lista de items: `addItem`, `removeItem`, `updateItem`, `addServiceToItems`. La página sigue siendo dueña de `items` + `setItems` (porque los necesita para el submit); el hook recibe ambos + `markDirty` y devuelve handlers estables.

**Files:**
- Create: `src/hooks/quote-editor/useQuoteItems.ts`
- Modify: `src/pages/QuoteEditorPage.tsx`

- [ ] **Step 1: Crear `src/hooks/quote-editor/useQuoteItems.ts`**

```ts
import { useCallback } from "react";
import type { Service } from "@/types";

export interface ItemRow {
  tempId: string;
  description: string;
  quantity: number;
  unit_price: number;
  order_index: number;
}

export interface QuoteItemsHandlers {
  addItem: () => void;
  removeItem: (tempId: string) => void;
  updateItem: (
    tempId: string,
    field: "description" | "quantity" | "unit_price",
    value: string | number,
  ) => void;
  addServiceToItems: (service: Service) => void;
}

export function useQuoteItems(
  items: ItemRow[],
  setItems: React.Dispatch<React.SetStateAction<ItemRow[]>>,
  markDirty: () => void,
): QuoteItemsHandlers {
  const addItem = useCallback(() => {
    markDirty();
    setItems((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        description: "",
        quantity: 1,
        unit_price: 0,
        order_index: prev.length,
      },
    ]);
  }, [markDirty, setItems]);

  const removeItem = useCallback(
    (tempId: string) => {
      setItems((prev) => {
        if (prev.length === 1) return prev;
        markDirty();
        return prev.filter((i) => i.tempId !== tempId);
      });
    },
    [markDirty, setItems],
  );

  const updateItem = useCallback(
    (tempId: string, field: "description" | "quantity" | "unit_price", value: string | number) => {
      setItems((prev) =>
        prev.map((i) => (i.tempId === tempId ? { ...i, [field]: value } : i)),
      );
    },
    [setItems],
  );

  const addServiceToItems = useCallback(
    (service: Service) => {
      markDirty();
      setItems((prev) => [
        ...prev,
        {
          tempId: crypto.randomUUID(),
          description: service.name,
          quantity: 1,
          unit_price: service.price,
          order_index: prev.length,
        },
      ]);
    },
    [markDirty, setItems],
  );

  return { addItem, removeItem, updateItem, addServiceToItems };
}
```

Nota: exportamos `ItemRow` desde este archivo porque pasa a ser el "dueño" del tipo. La interfaz local en `QuoteEditorPage.tsx` (líneas 49-51) se reemplaza por un import.

- [ ] **Step 2: Integrar en la página**

En `src/pages/QuoteEditorPage.tsx`:

1. Borrar el `interface ItemRow extends Omit<QuoteItem, "id" | "quote_id"> { tempId: string; }` (líneas 49-51).
2. Importar `ItemRow` desde el hook:
   ```ts
   import { useQuoteItems, type ItemRow } from "@/hooks/quote-editor/useQuoteItems";
   ```
3. Reemplazar `addItem`, `removeItem`, `updateItem`, `addServiceToItems` (líneas 216-260) por:
   ```ts
   const { addItem, removeItem, updateItem, addServiceToItems } = useQuoteItems(
     items,
     setItems,
     markDirty,
   );
   ```
4. En el JSX, donde hoy se hace `addServiceToItems(s.id)` pasándole un id, cambiar a `addServiceToItems(s)` (ahora recibe el objeto service directo) — línea ~829.

- [ ] **Step 3: Build verde**

Run: `npm run build`

- [ ] **Step 4: Tests verdes**

Run: `npm run test:run`

- [ ] **Step 5: Validación manual — items**

Con `npm run dev`, abrir `/cotizaciones/nueva`:
1. Pulsar "Agregar ítem" → nueva fila aparece.
2. Borrar todas las filas menos una → el botón de borrar queda disabled en la única fila.
3. Editar cantidad/precio → el total de la fila y el total general se actualizan.
4. "Agregar servicio" → aparece con nombre y precio del servicio.

- [ ] **Step 6: Proponer commit**

Mensaje sugerido:

```
refactor: extract useQuoteItems hook
```

---

## Task 6: Extraer `useQuoteForm`

El hook más grande: consolida todo el estado del formulario (quote meta + client + items + taxes + discount + terms) y el effect de carga inicial. Recibe `existingQuote?`, `profile?` y `markDirty`, devuelve el estado + setters.

**Files:**
- Create: `src/hooks/quote-editor/useQuoteForm.ts`
- Modify: `src/pages/QuoteEditorPage.tsx`

- [ ] **Step 1: Crear `src/hooks/quote-editor/useQuoteForm.ts`**

```ts
import { useEffect, useState } from "react";
import type { Profile, Quote, QuoteStatus } from "@/types";
import type { ItemRow } from "./useQuoteItems";

export interface QuoteFormState {
  // Meta
  quoteNumber: string;
  setQuoteNumber: React.Dispatch<React.SetStateAction<string>>;
  status: QuoteStatus;
  setStatus: React.Dispatch<React.SetStateAction<QuoteStatus>>;
  validDays: number;
  setValidDays: React.Dispatch<React.SetStateAction<number>>;
  projectId: string;
  setProjectId: React.Dispatch<React.SetStateAction<string>>;
  terms: string;
  setTerms: React.Dispatch<React.SetStateAction<string>>;
  notes: string;
  setNotes: React.Dispatch<React.SetStateAction<string>>;

  // Client
  clientName: string;
  setClientName: React.Dispatch<React.SetStateAction<string>>;
  clientEmail: string;
  setClientEmail: React.Dispatch<React.SetStateAction<string>>;
  clientPhone: string;
  setClientPhone: React.Dispatch<React.SetStateAction<string>>;
  clientIsCompany: boolean;
  setClientIsCompany: React.Dispatch<React.SetStateAction<boolean>>;
  clientCompany: string;
  setClientCompany: React.Dispatch<React.SetStateAction<string>>;
  clientNit: string;
  setClientNit: React.Dispatch<React.SetStateAction<string>>;

  // Items
  items: ItemRow[];
  setItems: React.Dispatch<React.SetStateAction<ItemRow[]>>;

  // Taxes + discount
  applyIva: boolean;
  setApplyIva: React.Dispatch<React.SetStateAction<boolean>>;
  applyRetefuente: boolean;
  setApplyRetefuente: React.Dispatch<React.SetStateAction<boolean>>;
  applyReteica: boolean;
  setApplyReteica: React.Dispatch<React.SetStateAction<boolean>>;
  ivaRate: number;
  setIvaRate: React.Dispatch<React.SetStateAction<number>>;
  retefuenteRate: number;
  setRetefuenteRate: React.Dispatch<React.SetStateAction<number>>;
  reteicaRate: number;
  setReteicaRate: React.Dispatch<React.SetStateAction<number>>;
  discountType: "percentage" | "fixed";
  setDiscountType: React.Dispatch<React.SetStateAction<"percentage" | "fixed">>;
  discountValue: number;
  setDiscountValue: React.Dispatch<React.SetStateAction<number>>;
}

export function useQuoteForm(
  existingQuote: Quote | undefined,
  profile: Profile | null,
  isEditing: boolean,
): QuoteFormState {
  const [quoteNumber, setQuoteNumber] = useState("");
  const [status, setStatus] = useState<QuoteStatus>("draft");
  const [validDays, setValidDays] = useState(30);
  const [projectId, setProjectId] = useState<string>("");
  const [terms, setTerms] = useState("");
  const [notes, setNotes] = useState("");

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientIsCompany, setClientIsCompany] = useState(false);
  const [clientCompany, setClientCompany] = useState("");
  const [clientNit, setClientNit] = useState("");

  const [items, setItems] = useState<ItemRow[]>([
    {
      tempId: crypto.randomUUID(),
      description: "",
      quantity: 1,
      unit_price: 0,
      order_index: 0,
    },
  ]);

  const [applyIva, setApplyIva] = useState(false);
  const [applyRetefuente, setApplyRetefuente] = useState(false);
  const [applyReteica, setApplyReteica] = useState(false);
  const [ivaRate, setIvaRate] = useState(19);
  const [retefuenteRate, setRetefuenteRate] = useState(10);
  const [reteicaRate, setReteicaRate] = useState(0.414);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    "percentage",
  );
  const [discountValue, setDiscountValue] = useState(0);

  useEffect(() => {
    if (isEditing && existingQuote) {
      setQuoteNumber(existingQuote.quote_number);
      setStatus(existingQuote.status);
      setValidDays(existingQuote.valid_days);
      setProjectId(existingQuote.project_id ?? "");
      setTerms(existingQuote.terms ?? "");
      setNotes(existingQuote.notes ?? "");
      setClientName(existingQuote.client_name);
      setClientEmail(existingQuote.client_email ?? "");
      setClientPhone(existingQuote.client_phone ?? "");
      setClientIsCompany(existingQuote.client_is_company);
      setClientCompany(existingQuote.client_company ?? "");
      setClientNit(existingQuote.client_nit ?? "");
      setApplyIva(existingQuote.apply_iva);
      setApplyRetefuente(existingQuote.apply_retefuente);
      setApplyReteica(existingQuote.apply_reteica);
      setIvaRate(existingQuote.iva_rate);
      setRetefuenteRate(existingQuote.retefuente_rate);
      setReteicaRate(existingQuote.reteica_rate);
      setDiscountType(existingQuote.discount_type);
      setDiscountValue(existingQuote.discount_value);
      if (existingQuote.items && existingQuote.items.length > 0) {
        setItems(existingQuote.items.map((i) => ({ ...i, tempId: i.id })));
      }
      return;
    }
    if (profile) {
      setApplyIva(profile.apply_iva ?? false);
      setApplyRetefuente(profile.apply_retefuente ?? false);
      setApplyReteica(profile.apply_reteica ?? false);
      setIvaRate(profile.iva_rate ?? 19);
      setRetefuenteRate(profile.retefuente_rate ?? 10);
      setReteicaRate(profile.reteica_rate ?? 0.414);
    }
  }, [profile, existingQuote, isEditing]);

  return {
    quoteNumber, setQuoteNumber,
    status, setStatus,
    validDays, setValidDays,
    projectId, setProjectId,
    terms, setTerms,
    notes, setNotes,
    clientName, setClientName,
    clientEmail, setClientEmail,
    clientPhone, setClientPhone,
    clientIsCompany, setClientIsCompany,
    clientCompany, setClientCompany,
    clientNit, setClientNit,
    items, setItems,
    applyIva, setApplyIva,
    applyRetefuente, setApplyRetefuente,
    applyReteica, setApplyReteica,
    ivaRate, setIvaRate,
    retefuenteRate, setRetefuenteRate,
    reteicaRate, setReteicaRate,
    discountType, setDiscountType,
    discountValue, setDiscountValue,
  };
}
```

- [ ] **Step 2: Integrar en la página**

En `src/pages/QuoteEditorPage.tsx`:

1. Borrar todos los `useState` del formulario (líneas 71-104).
2. Borrar el `useEffect` de carga inicial (líneas 106-144).
3. Reemplazar por:

```ts
import { useQuoteForm } from "@/hooks/quote-editor/useQuoteForm";

// Dentro del componente:
const form = useQuoteForm(existingQuote, profile ?? null, isEditing);
```

4. Usar `form.quoteNumber`, `form.setQuoteNumber`, etc., en todos los puntos del JSX y de `handleSave`. Alternativa más legible: destructurar al inicio:

```ts
const {
  quoteNumber, setQuoteNumber, status, setStatus, validDays, setValidDays,
  projectId, setProjectId, terms, setTerms, notes, setNotes,
  clientName, setClientName, clientEmail, setClientEmail,
  clientPhone, setClientPhone, clientIsCompany, setClientIsCompany,
  clientCompany, setClientCompany, clientNit, setClientNit,
  items, setItems,
  applyIva, setApplyIva, applyRetefuente, setApplyRetefuente,
  applyReteica, setApplyReteica, ivaRate, setIvaRate,
  retefuenteRate, setRetefuenteRate, reteicaRate, setReteicaRate,
  discountType, setDiscountType, discountValue, setDiscountValue,
} = useQuoteForm(existingQuote, profile ?? null, isEditing);
```

5. `profile` sigue viniendo de `useAuthStore`; el hook lo recibe como parámetro.

- [ ] **Step 3: Build verde**

Run: `npm run build`
Expected: sin errores.

- [ ] **Step 4: Tests verdes**

Run: `npm run test:run`

- [ ] **Step 5: Validación manual — modo creación y edición**

1. `/cotizaciones/nueva`: el form arranca vacío con defaults del profile en IVA/Retefuente/ReteICA.
2. `/cotizaciones/COT-003/editar`: carga todos los campos de la cotización existente.
3. Cambiar un campo en edición → el botón de descarga de PDF refleja el cambio en tiempo real.

- [ ] **Step 6: Proponer commit**

Mensaje sugerido:

```
refactor: extract useQuoteForm hook
```

---

## Task 7: Extraer `UnsavedChangesDialog`

Componente hoja, sin estado propio. Props: `open`, `onConfirm`, `onCancel`.

**Files:**
- Create: `src/components/quote-editor/UnsavedChangesDialog.tsx`
- Modify: `src/pages/QuoteEditorPage.tsx`

- [ ] **Step 1: Crear `src/components/quote-editor/UnsavedChangesDialog.tsx`**

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UnsavedChangesDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function UnsavedChangesDialog({
  open,
  onConfirm,
  onCancel,
}: UnsavedChangesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cambios sin guardar</DialogTitle>
          <DialogDescription>
            Tienes cambios sin guardar en esta cotización. ¿Deseas salir sin
            guardar?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Seguir editando
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Salir sin guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Integrar en la página**

En `src/pages/QuoteEditorPage.tsx`:

1. Reemplazar el bloque `<Dialog ...>` completo del final (líneas 1569-1594) por:
   ```tsx
   <UnsavedChangesDialog
     open={showUnsavedDialog}
     onConfirm={confirmLeave}
     onCancel={cancelLeave}
   />
   ```
2. Importar: `import { UnsavedChangesDialog } from "@/components/quote-editor/UnsavedChangesDialog";`
3. Borrar los imports de `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`, `DialogDescription` de la página si ya no se usan en ningún otro lado.

- [ ] **Step 3: Build verde**

Run: `npm run build`

- [ ] **Step 4: Tests verdes**

Run: `npm run test:run`

- [ ] **Step 5: Proponer commit**

Mensaje sugerido:

```
refactor: extract UnsavedChangesDialog component
```

---

## Task 8: Extraer `QuoteTotalsDisplay` + test

Componente presentacional que recibe un `QuoteTotals` + los toggles/rates + `formatCOP` (import directo) y renderiza la tabla de totales. Se usará dentro del `QuotePreviewPDF` (task 15) y eventualmente también en otras vistas.

**Files:**
- Create: `src/components/quote-editor/QuoteTotalsDisplay.tsx`
- Create: `src/components/quote-editor/QuoteTotalsDisplay.test.tsx`

- [ ] **Step 1: Escribir el test (que falla)**

Crear `src/components/quote-editor/QuoteTotalsDisplay.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuoteTotalsDisplay } from "./QuoteTotalsDisplay";

const baseTotals = {
  subtotal: 1500,
  discountAmount: 75,
  afterDiscount: 1425,
  ivaAmount: 270.75,
  retefuenteAmount: 142.5,
  reteicaAmount: 5.8995,
  total: 1547.3505,
};

describe("QuoteTotalsDisplay", () => {
  it("renders the subtotal formatted as COP", () => {
    render(
      <QuoteTotalsDisplay
        totals={baseTotals}
        applyIva
        applyRetefuente
        applyReteica
        ivaRate={19}
        retefuenteRate={10}
        reteicaRate={0.414}
        discountType="percentage"
        discountValue={5}
      />,
    );
    expect(screen.getByText(/subtotal/i)).toBeInTheDocument();
    expect(screen.getByText(/\$\s?1\.500/)).toBeInTheDocument();
  });

  it("does not render IVA row when applyIva is false", () => {
    render(
      <QuoteTotalsDisplay
        totals={baseTotals}
        applyIva={false}
        applyRetefuente={false}
        applyReteica={false}
        ivaRate={19}
        retefuenteRate={10}
        reteicaRate={0.414}
        discountType="percentage"
        discountValue={0}
      />,
    );
    expect(screen.queryByText(/IVA/)).not.toBeInTheDocument();
  });

  it("renders discount row only when discountAmount > 0", () => {
    render(
      <QuoteTotalsDisplay
        totals={{ ...baseTotals, discountAmount: 0 }}
        applyIva={false}
        applyRetefuente={false}
        applyReteica={false}
        ivaRate={19}
        retefuenteRate={10}
        reteicaRate={0.414}
        discountType="percentage"
        discountValue={0}
      />,
    );
    expect(screen.queryByText(/descuento/i)).not.toBeInTheDocument();
  });

  it("shows the total formatted as COP", () => {
    render(
      <QuoteTotalsDisplay
        totals={baseTotals}
        applyIva
        applyRetefuente
        applyReteica
        ivaRate={19}
        retefuenteRate={10}
        reteicaRate={0.414}
        discountType="percentage"
        discountValue={5}
      />,
    );
    expect(screen.getByText(/total/i)).toBeInTheDocument();
    // total 1547.3505 → formato COP sin decimales: $ 1.547
    expect(screen.getByText(/\$\s?1\.547/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Correr el test para confirmar que falla**

Run: `npx vitest run src/components/quote-editor/QuoteTotalsDisplay.test.tsx`
Expected: FAIL — "Cannot find module './QuoteTotalsDisplay'".

- [ ] **Step 3: Implementar el componente**

Crear `src/components/quote-editor/QuoteTotalsDisplay.tsx`:

```tsx
import type { QuoteTotals } from "@/lib/quoteCalculations";
import { formatCOP } from "@/lib/utils";

interface QuoteTotalsDisplayProps {
  totals: QuoteTotals;
  applyIva: boolean;
  applyRetefuente: boolean;
  applyReteica: boolean;
  ivaRate: number;
  retefuenteRate: number;
  reteicaRate: number;
  discountType: "percentage" | "fixed";
  discountValue: number;
}

const ACCENT_BLUE = "#1B2A4A";
const ACCENT_RED = "#E63946";

export function QuoteTotalsDisplay({
  totals,
  applyIva,
  applyRetefuente,
  applyReteica,
  ivaRate,
  retefuenteRate,
  reteicaRate,
  discountType,
  discountValue,
}: QuoteTotalsDisplayProps) {
  const { subtotal, discountAmount, ivaAmount, retefuenteAmount, reteicaAmount, total } = totals;
  const row = (label: string, value: string, color = "#1a1a1a", bold = false) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
      <span style={{ fontSize: bold ? "13px" : "11px", color: "#666", fontWeight: bold ? "bold" : "normal" }}>
        {label}
      </span>
      <span style={{ fontSize: bold ? "15px" : "12px", color, fontWeight: bold ? "bold" : "normal" }}>
        {value}
      </span>
    </div>
  );
  return (
    <div style={{ borderTop: "1px solid #eee", paddingTop: "12px" }}>
      {row("SUBTOTAL:", formatCOP(subtotal))}
      {discountAmount > 0 &&
        row(
          `DESCUENTO ${discountType === "percentage" ? `${discountValue}%` : ""}:`,
          `-${formatCOP(discountAmount)}`,
          ACCENT_RED,
        )}
      {applyIva && row(`IVA ${ivaRate}%:`, `+${formatCOP(ivaAmount)}`)}
      {applyRetefuente && row(`RETEFUENTE ${retefuenteRate}%:`, `-${formatCOP(retefuenteAmount)}`, ACCENT_RED)}
      {applyReteica && row(`RETEICA ${reteicaRate}%:`, `-${formatCOP(reteicaAmount)}`, ACCENT_RED)}
      <div style={{ borderTop: "1px solid #eee", marginTop: "8px", paddingTop: "8px" }}>
        {row("TOTAL:", formatCOP(total), ACCENT_BLUE, true)}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Correr el test para confirmar que pasa**

Run: `npx vitest run src/components/quote-editor/QuoteTotalsDisplay.test.tsx`
Expected: 4 tests pasan.

- [ ] **Step 5: Suite completa verde**

Run: `npm run test:run`
Expected: 28 tests pasan (24 + 4 nuevos).

- [ ] **Step 6: Build verde**

Run: `npm run build`

- [ ] **Step 7: Proponer commit**

Mensaje sugerido:

```
feat: add QuoteTotalsDisplay component with tests
```

---

## Task 9: Extraer `QuoteItemsTable` + test

Componente que recibe `items`, `onAdd`, `onRemove`, `onUpdate`, `services?`, `onAddService`. Mueve el bloque de items actual (líneas 808-924) fuera de la página.

**Files:**
- Create: `src/components/quote-editor/QuoteItemsTable.tsx`
- Create: `src/components/quote-editor/QuoteItemsTable.test.tsx`
- Modify: `src/pages/QuoteEditorPage.tsx`

- [ ] **Step 1: Escribir el test**

Crear `src/components/quote-editor/QuoteItemsTable.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuoteItemsTable } from "./QuoteItemsTable";
import type { ItemRow } from "@/hooks/quote-editor/useQuoteItems";

const makeItem = (overrides: Partial<ItemRow> = {}): ItemRow => ({
  tempId: "t1",
  description: "Servicio",
  quantity: 1,
  unit_price: 100,
  order_index: 0,
  ...overrides,
});

describe("QuoteItemsTable", () => {
  it("renders one row per item", () => {
    render(
      <QuoteItemsTable
        items={[makeItem({ tempId: "a" }), makeItem({ tempId: "b" })]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onUpdate={vi.fn()}
        services={[]}
        onAddService={vi.fn()}
      />,
    );
    expect(screen.getAllByPlaceholderText(/descripción del ítem/i)).toHaveLength(2);
  });

  it("calls onAdd when the user clicks 'Agregar ítem'", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(
      <QuoteItemsTable
        items={[makeItem()]}
        onAdd={onAdd}
        onRemove={vi.fn()}
        onUpdate={vi.fn()}
        services={[]}
        onAddService={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /agregar ítem/i }));
    expect(onAdd).toHaveBeenCalledOnce();
  });

  it("calls onRemove with the tempId when the trash button is clicked", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <QuoteItemsTable
        items={[makeItem({ tempId: "abc" }), makeItem({ tempId: "def" })]}
        onAdd={vi.fn()}
        onRemove={onRemove}
        onUpdate={vi.fn()}
        services={[]}
        onAddService={vi.fn()}
      />,
    );
    const removeButtons = screen.getAllByRole("button", { name: /eliminar ítem/i });
    await user.click(removeButtons[0]);
    expect(onRemove).toHaveBeenCalledWith("abc");
  });

  it("disables the trash button when only one item remains", () => {
    render(
      <QuoteItemsTable
        items={[makeItem()]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onUpdate={vi.fn()}
        services={[]}
        onAddService={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /eliminar ítem/i })).toBeDisabled();
  });

  it("calls onUpdate when the description input changes", () => {
    const onUpdate = vi.fn();
    render(
      <QuoteItemsTable
        items={[makeItem({ tempId: "x" })]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onUpdate={onUpdate}
        services={[]}
        onAddService={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText(/descripción del ítem/i), {
      target: { value: "Nueva descripción" },
    });
    expect(onUpdate).toHaveBeenCalledWith("x", "description", "Nueva descripción");
  });
});
```

- [ ] **Step 2: Correr el test — debe fallar**

Run: `npx vitest run src/components/quote-editor/QuoteItemsTable.test.tsx`
Expected: FAIL — "Cannot find module './QuoteItemsTable'".

- [ ] **Step 3: Implementar el componente**

Crear `src/components/quote-editor/QuoteItemsTable.tsx`:

```tsx
import { Plus, Trash2, GripVertical, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCOP } from "@/lib/utils";
import type { Service } from "@/types";
import type { ItemRow } from "@/hooks/quote-editor/useQuoteItems";

interface QuoteItemsTableProps {
  items: ItemRow[];
  onAdd: () => void;
  onRemove: (tempId: string) => void;
  onUpdate: (
    tempId: string,
    field: "description" | "quantity" | "unit_price",
    value: string | number,
  ) => void;
  services: Service[] | undefined;
  onAddService: (service: Service) => void;
}

export function QuoteItemsTable({
  items,
  onAdd,
  onRemove,
  onUpdate,
  services,
  onAddService,
}: QuoteItemsTableProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Ítems</h2>
        {services && services.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-8 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Agregar servicio
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {services.map((s) => (
                <DropdownMenuItem key={s.id} onClick={() => onAddService(s)}>
                  <span className="flex-1 truncate">{s.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {formatCOP(s.price)}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2">
        <div className="col-span-5">Descripción</div>
        <div className="col-span-2 text-center">Cant.</div>
        <div className="col-span-3 text-right">Precio unit.</div>
        <div className="col-span-1 text-right">Total</div>
        <div className="col-span-1" />
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.tempId} className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-1 flex justify-center">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="col-span-4">
              <Input
                placeholder="Descripción del ítem"
                value={item.description}
                onChange={(e) => onUpdate(item.tempId, "description", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="col-span-2">
              <Input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) =>
                  onUpdate(
                    item.tempId,
                    "quantity",
                    Math.max(1, parseFloat(e.target.value) || 1),
                  )
                }
                className="h-8 text-sm text-center"
              />
            </div>
            <div className="col-span-3">
              <Input
                type="number"
                min="0"
                value={item.unit_price}
                onChange={(e) =>
                  onUpdate(
                    item.tempId,
                    "unit_price",
                    Math.max(0, parseFloat(e.target.value) || 0),
                  )
                }
                className="h-8 text-sm text-right"
              />
            </div>
            <div className="col-span-1 text-right text-xs font-medium text-foreground">
              {formatCOP(item.quantity * item.unit_price)}
            </div>
            <div className="col-span-1 flex justify-center">
              <button
                type="button"
                aria-label="Eliminar ítem"
                onClick={() => onRemove(item.tempId)}
                className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                disabled={items.length === 1}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAdd}
        className="w-full gap-2 border-dashed"
      >
        <Plus className="h-3.5 w-3.5" />
        Agregar ítem
      </Button>
    </div>
  );
}
```

Nota: el `aria-label="Eliminar ítem"` y `type="button"` del botón de borrado son los que permiten testearlo limpio con RTL.

- [ ] **Step 4: Correr los tests del componente — deben pasar**

Run: `npx vitest run src/components/quote-editor/QuoteItemsTable.test.tsx`
Expected: 5 tests pasan.

- [ ] **Step 5: Integrar en la página**

En `src/pages/QuoteEditorPage.tsx`:

1. Reemplazar el bloque `{/* Items */} <div ...>...</div>` (líneas 808-924) por:

```tsx
<QuoteItemsTable
  items={items}
  onAdd={addItem}
  onRemove={removeItem}
  onUpdate={updateItem}
  services={services}
  onAddService={addServiceToItems}
/>
```

2. Importar: `import { QuoteItemsTable } from "@/components/quote-editor/QuoteItemsTable";`
3. Borrar de los imports `GripVertical` y `Trash2` si ya no se usan en la página.

- [ ] **Step 6: Suite completa verde**

Run: `npm run test:run`
Expected: 33 tests pasan (28 + 5).

- [ ] **Step 7: Build verde**

Run: `npm run build`

- [ ] **Step 8: Proponer commit**

Mensaje sugerido:

```
feat: add QuoteItemsTable component with tests
```

---

## Task 10: Extraer `QuoteTaxConfiguration` + test

Componente que maneja los tres toggles de impuestos. Props: `applyIva`, `onApplyIvaChange`, `ivaRate`, `onIvaRateChange`, y lo mismo para Retefuente + ReteICA.

**Files:**
- Create: `src/components/quote-editor/QuoteTaxConfiguration.tsx`
- Create: `src/components/quote-editor/QuoteTaxConfiguration.test.tsx`
- Modify: `src/pages/QuoteEditorPage.tsx`

- [ ] **Step 1: Escribir el test**

Crear `src/components/quote-editor/QuoteTaxConfiguration.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuoteTaxConfiguration } from "./QuoteTaxConfiguration";

const defaultProps = {
  applyIva: false,
  onApplyIvaChange: vi.fn(),
  ivaRate: 19,
  onIvaRateChange: vi.fn(),
  applyRetefuente: false,
  onApplyRetefuenteChange: vi.fn(),
  retefuenteRate: 10,
  onRetefuenteRateChange: vi.fn(),
  applyReteica: false,
  onApplyReteicaChange: vi.fn(),
  reteicaRate: 0.414,
  onReteicaRateChange: vi.fn(),
};

describe("QuoteTaxConfiguration", () => {
  it("renders all three tax toggles", () => {
    render(<QuoteTaxConfiguration {...defaultProps} />);
    expect(screen.getByLabelText(/IVA/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Retención en la fuente/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ReteICA/i)).toBeInTheDocument();
  });

  it("disables the IVA rate input when applyIva is false", () => {
    render(<QuoteTaxConfiguration {...defaultProps} applyIva={false} />);
    const rateInputs = screen.getAllByRole("spinbutton");
    expect(rateInputs[0]).toBeDisabled();
  });

  it("enables the IVA rate input when applyIva is true", () => {
    render(<QuoteTaxConfiguration {...defaultProps} applyIva />);
    const rateInputs = screen.getAllByRole("spinbutton");
    expect(rateInputs[0]).not.toBeDisabled();
  });

  it("fires onApplyIvaChange when the IVA checkbox is clicked", async () => {
    const user = userEvent.setup();
    const onApplyIvaChange = vi.fn();
    render(
      <QuoteTaxConfiguration {...defaultProps} onApplyIvaChange={onApplyIvaChange} />,
    );
    await user.click(screen.getByLabelText(/IVA/i));
    expect(onApplyIvaChange).toHaveBeenCalledWith(true);
  });

  it("fires onIvaRateChange with the new numeric value", () => {
    const onIvaRateChange = vi.fn();
    render(
      <QuoteTaxConfiguration {...defaultProps} applyIva onIvaRateChange={onIvaRateChange} />,
    );
    const rateInputs = screen.getAllByRole("spinbutton");
    fireEvent.change(rateInputs[0], { target: { value: "5" } });
    expect(onIvaRateChange).toHaveBeenCalledWith(5);
  });

  it("clamps rate values between 0 and 100", () => {
    const onIvaRateChange = vi.fn();
    render(
      <QuoteTaxConfiguration {...defaultProps} applyIva onIvaRateChange={onIvaRateChange} />,
    );
    const rateInputs = screen.getAllByRole("spinbutton");
    fireEvent.change(rateInputs[0], { target: { value: "150" } });
    expect(onIvaRateChange).toHaveBeenCalledWith(100);
    fireEvent.change(rateInputs[0], { target: { value: "-10" } });
    expect(onIvaRateChange).toHaveBeenCalledWith(0);
  });
});
```

- [ ] **Step 2: Confirmar que el test falla**

Run: `npx vitest run src/components/quote-editor/QuoteTaxConfiguration.test.tsx`
Expected: FAIL — "Cannot find module './QuoteTaxConfiguration'".

- [ ] **Step 3: Implementar el componente**

Crear `src/components/quote-editor/QuoteTaxConfiguration.tsx`:

```tsx
import { Input } from "@/components/ui/input";

interface QuoteTaxConfigurationProps {
  applyIva: boolean;
  onApplyIvaChange: (next: boolean) => void;
  ivaRate: number;
  onIvaRateChange: (next: number) => void;
  applyRetefuente: boolean;
  onApplyRetefuenteChange: (next: boolean) => void;
  retefuenteRate: number;
  onRetefuenteRateChange: (next: number) => void;
  applyReteica: boolean;
  onApplyReteicaChange: (next: boolean) => void;
  reteicaRate: number;
  onReteicaRateChange: (next: number) => void;
}

interface TaxRow {
  id: string;
  label: string;
  desc: string;
  checked: boolean;
  setChecked: (next: boolean) => void;
  rate: number;
  setRate: (next: number) => void;
}

export function QuoteTaxConfiguration(props: QuoteTaxConfigurationProps) {
  const rows: TaxRow[] = [
    {
      id: "iva",
      label: "IVA",
      desc: "Responsable de IVA",
      checked: props.applyIva,
      setChecked: props.onApplyIvaChange,
      rate: props.ivaRate,
      setRate: props.onIvaRateChange,
    },
    {
      id: "rete",
      label: "Retención en la fuente",
      desc: "El cliente te retiene",
      checked: props.applyRetefuente,
      setChecked: props.onApplyRetefuenteChange,
      rate: props.retefuenteRate,
      setRate: props.onRetefuenteRateChange,
    },
    {
      id: "reteica",
      label: "ReteICA",
      desc: "Bogotá: 0.414%",
      checked: props.applyReteica,
      setChecked: props.onApplyReteicaChange,
      rate: props.reteicaRate,
      setRate: props.onReteicaRateChange,
    },
  ];
  return (
    <div className="space-y-2">
      {rows.map((tax) => (
        <div
          key={tax.id}
          className="flex items-center justify-between p-3 rounded-lg border border-border"
        >
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id={tax.id}
              checked={tax.checked}
              onChange={(e) => tax.setChecked(e.target.checked)}
              className="h-4 w-4 rounded accent-primary"
            />
            <div>
              <label htmlFor={tax.id} className="text-sm font-medium cursor-pointer">
                {tax.label}
              </label>
              <p className="text-xs text-muted-foreground">{tax.desc}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={tax.rate}
              onChange={(e) =>
                tax.setRate(
                  Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)),
                )
              }
              className="w-20 h-8 text-sm text-right"
              disabled={!tax.checked}
              step="0.001"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Tests del componente verdes**

Run: `npx vitest run src/components/quote-editor/QuoteTaxConfiguration.test.tsx`
Expected: 6 tests pasan.

- [ ] **Step 5: Integrar en la página**

En `src/pages/QuoteEditorPage.tsx`, dentro del bloque `{/* Taxes & discount */}` sustituir el `<div className="space-y-2">{[ {id: "iva", ...}, ...].map(...)}</div>` (el `.map` de los 3 impuestos, aproximadamente líneas 971-1040) por:

```tsx
<QuoteTaxConfiguration
  applyIva={applyIva}
  onApplyIvaChange={setApplyIva}
  ivaRate={ivaRate}
  onIvaRateChange={setIvaRate}
  applyRetefuente={applyRetefuente}
  onApplyRetefuenteChange={setApplyRetefuente}
  retefuenteRate={retefuenteRate}
  onRetefuenteRateChange={setRetefuenteRate}
  applyReteica={applyReteica}
  onApplyReteicaChange={setApplyReteica}
  reteicaRate={reteicaRate}
  onReteicaRateChange={setReteicaRate}
/>
```

Importar: `import { QuoteTaxConfiguration } from "@/components/quote-editor/QuoteTaxConfiguration";`

El descuento (que sigue en el mismo card) se queda por ahora — sale en la próxima tarea.

- [ ] **Step 6: Suite completa verde**

Run: `npm run test:run`
Expected: 39 tests pasan (33 + 6).

- [ ] **Step 7: Build verde**

Run: `npm run build`

- [ ] **Step 8: Validación manual — toggles**

1. Prender IVA → el input de 19% se habilita.
2. Cambiar a 5% → el preview de la derecha refleja "IVA 5%".
3. Apagar IVA → el input se deshabilita y desaparece la fila en el preview.

- [ ] **Step 9: Proponer commit**

Mensaje sugerido:

```
feat: add QuoteTaxConfiguration component with tests
```

---

## Task 11: Extraer `QuoteDiscountControl` (hoja)

El selector de tipo (%/fijo) + el input del valor. El card completo `{/* Taxes & discount */}` pasa a ser: `<DiscountControl />` + `<QuoteTaxConfiguration />`.

**Files:**
- Create: `src/components/quote-editor/QuoteDiscountControl.tsx`
- Modify: `src/pages/QuoteEditorPage.tsx`

- [ ] **Step 1: Crear el componente**

Crear `src/components/quote-editor/QuoteDiscountControl.tsx`:

```tsx
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface QuoteDiscountControlProps {
  discountType: "percentage" | "fixed";
  onDiscountTypeChange: (next: "percentage" | "fixed") => void;
  discountValue: number;
  onDiscountValueChange: (next: number) => void;
}

export function QuoteDiscountControl({
  discountType,
  onDiscountTypeChange,
  discountValue,
  onDiscountValueChange,
}: QuoteDiscountControlProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Tipo de descuento</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {discountType === "percentage" ? "Porcentaje %" : "Valor fijo $"}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onDiscountTypeChange("percentage")}>
              Porcentaje %
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDiscountTypeChange("fixed")}>
              Valor fijo $
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="space-y-2">
        <Label>Valor del descuento</Label>
        <Input
          type="number"
          min="0"
          value={discountValue}
          onChange={(e) =>
            onDiscountValueChange(Math.max(0, parseFloat(e.target.value) || 0))
          }
          placeholder="0"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Integrar en la página**

En `src/pages/QuoteEditorPage.tsx`, dentro del card `{/* Taxes & discount */}`, reemplazar el primer `<div className="grid grid-cols-2 gap-4">` (el del descuento, líneas 931-970) por:

```tsx
<QuoteDiscountControl
  discountType={discountType}
  onDiscountTypeChange={setDiscountType}
  discountValue={discountValue}
  onDiscountValueChange={setDiscountValue}
/>
```

Importar: `import { QuoteDiscountControl } from "@/components/quote-editor/QuoteDiscountControl";`

- [ ] **Step 3: Build verde**

Run: `npm run build`

- [ ] **Step 4: Tests verdes**

Run: `npm run test:run`

- [ ] **Step 5: Proponer commit**

Mensaje sugerido:

```
refactor: extract QuoteDiscountControl component
```

---

## Task 12: Extraer `QuoteClientSection` (hoja)

Mueve el card de datos del cliente (líneas 714-806) fuera.

**Files:**
- Create: `src/components/quote-editor/QuoteClientSection.tsx`
- Modify: `src/pages/QuoteEditorPage.tsx`

- [ ] **Step 1: Crear el componente**

Crear `src/components/quote-editor/QuoteClientSection.tsx`:

```tsx
import { motion } from "framer-motion";
import { Building2, User, Phone, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface QuoteClientSectionProps {
  clientName: string;
  onClientNameChange: (v: string) => void;
  clientEmail: string;
  onClientEmailChange: (v: string) => void;
  clientPhone: string;
  onClientPhoneChange: (v: string) => void;
  clientIsCompany: boolean;
  onClientIsCompanyChange: (v: boolean) => void;
  clientCompany: string;
  onClientCompanyChange: (v: string) => void;
  clientNit: string;
  onClientNitChange: (v: string) => void;
}

export function QuoteClientSection(props: QuoteClientSectionProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <User className="h-4 w-4" />
        Datos del cliente
      </h2>
      <div className="space-y-2">
        <Label>
          Nombre <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nombre del cliente"
            value={props.clientName}
            onChange={(e) => props.onClientNameChange(e.target.value)}
            className="pl-9"
            maxLength={100}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="email@ejemplo.com"
              value={props.clientEmail}
              onChange={(e) => props.onClientEmailChange(e.target.value)}
              className="pl-9"
              maxLength={100}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Teléfono</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="tel"
              placeholder="+57 300 000 0000"
              value={props.clientPhone}
              onChange={(e) => props.onClientPhoneChange(e.target.value)}
              className="pl-9"
              maxLength={20}
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
        <input
          type="checkbox"
          id="is-company"
          checked={props.clientIsCompany}
          onChange={(e) => props.onClientIsCompanyChange(e.target.checked)}
          className="h-4 w-4 rounded accent-primary"
        />
        <label
          htmlFor="is-company"
          className="text-sm font-medium cursor-pointer flex items-center gap-2"
        >
          <Building2 className="h-4 w-4" />
          Es empresa
        </label>
      </div>
      {props.clientIsCompany && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="space-y-2">
            <Label>Nombre empresa</Label>
            <Input
              placeholder="Empresa S.A.S."
              value={props.clientCompany}
              onChange={(e) => props.onClientCompanyChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>NIT</Label>
            <Input
              placeholder="900.000.000-0"
              value={props.clientNit}
              onChange={(e) => props.onClientNitChange(e.target.value)}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Integrar en la página**

En `src/pages/QuoteEditorPage.tsx`, reemplazar el bloque `{/* Client data */} <div ...>...</div>` (líneas 714-806) por:

```tsx
<QuoteClientSection
  clientName={clientName}
  onClientNameChange={setClientName}
  clientEmail={clientEmail}
  onClientEmailChange={setClientEmail}
  clientPhone={clientPhone}
  onClientPhoneChange={setClientPhone}
  clientIsCompany={clientIsCompany}
  onClientIsCompanyChange={setClientIsCompany}
  clientCompany={clientCompany}
  onClientCompanyChange={setClientCompany}
  clientNit={clientNit}
  onClientNitChange={setClientNit}
/>
```

Importar: `import { QuoteClientSection } from "@/components/quote-editor/QuoteClientSection";`

De la página se pueden borrar los imports de `Building2`, `User`, `Phone`, `Mail` si ya no se usan en otros sitios.

- [ ] **Step 3: Build + tests verdes**

Run: `npm run build && npm run test:run`

- [ ] **Step 4: Proponer commit**

Mensaje sugerido:

```
refactor: extract QuoteClientSection component
```

---

## Task 13: Extraer `QuoteProjectLink` y `QuoteHeader`

Dos componentes en una tarea para no inflar tareas chicas:

- `QuoteHeader`: la toolbar de arriba (botón volver + Descargar PDF + Guardar), líneas 589-620.
- `QuoteProjectLink` + meta: el card de "Datos de la cotización" (número, estado, válida por N días, vincular proyecto), líneas 626-712.

**Files:**
- Create: `src/components/quote-editor/QuoteHeader.tsx`
- Create: `src/components/quote-editor/QuoteProjectLink.tsx`
- Modify: `src/pages/QuoteEditorPage.tsx`

- [ ] **Step 1: Crear `QuoteHeader`**

Crear `src/components/quote-editor/QuoteHeader.tsx`:

```tsx
import { ArrowLeft, Download, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuoteHeaderProps {
  onBack: () => void;
  onDownloadPdf: () => void;
  onSave: () => void;
  saving: boolean;
}

export function QuoteHeader({
  onBack,
  onDownloadPdf,
  onSave,
  saving,
}: QuoteHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="gap-2 -ml-2 text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Cotizaciones
      </Button>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onDownloadPdf} className="gap-2">
          <Download className="h-4 w-4" />
          Descargar PDF
        </Button>
        <Button onClick={onSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Guardando..." : "Guardar cotización"}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Crear `QuoteProjectLink`**

Crear `src/components/quote-editor/QuoteProjectLink.tsx`:

```tsx
import { ChevronDown, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Project, QuoteStatus } from "@/types";
import { QUOTE_STATUS_LABELS as statusLabels } from "@/lib/constants";

interface QuoteProjectLinkProps {
  quoteNumber: string;
  onQuoteNumberChange: (v: string) => void;
  isEditing: boolean;
  status: QuoteStatus;
  onStatusChange: (v: QuoteStatus) => void;
  validDays: number;
  onValidDaysChange: (v: number) => void;
  projectId: string;
  onProjectIdChange: (v: string) => void;
  projects: Project[] | undefined;
}

export function QuoteProjectLink({
  quoteNumber,
  onQuoteNumberChange,
  isEditing,
  status,
  onStatusChange,
  validDays,
  onValidDaysChange,
  projectId,
  onProjectIdChange,
  projects,
}: QuoteProjectLinkProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Datos de la cotización
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Número</Label>
          <Input
            value={quoteNumber || (isEditing ? "" : "Auto-generado")}
            onChange={(e) => onQuoteNumberChange(e.target.value)}
            placeholder="Auto-generado al guardar"
            disabled={!isEditing}
            className={!isEditing ? "text-muted-foreground" : ""}
          />
        </div>
        <div className="space-y-2">
          <Label>Estado</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {statusLabels[status]}
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full">
              {(Object.keys(statusLabels) as QuoteStatus[])
                .filter((s) => s !== "archived")
                .map((s) => (
                  <DropdownMenuItem key={s} onClick={() => onStatusChange(s)}>
                    {statusLabels[s]}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Válida por (días)</Label>
          <Input
            type="number"
            min="1"
            value={validDays}
            onChange={(e) => onValidDaysChange(parseInt(e.target.value) || 30)}
          />
        </div>
        <div className="space-y-2">
          <Label>Vincular a proyecto</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between truncate">
                <span className="truncate">
                  {projectId
                    ? (projects?.find((p) => p.id === projectId)?.name ?? "Proyecto")
                    : "Sin proyecto"}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuItem onClick={() => onProjectIdChange("")}>
                Sin proyecto
              </DropdownMenuItem>
              <Separator />
              {projects
                ?.filter((p) => p.status !== "archived")
                .map((p) => (
                  <DropdownMenuItem key={p.id} onClick={() => onProjectIdChange(p.id)}>
                    {p.name}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Integrar en la página**

En `src/pages/QuoteEditorPage.tsx`:

1. Reemplazar el bloque header toolbar (líneas 589-620) por:
   ```tsx
   <QuoteHeader
     onBack={() => safeNavigate("/cotizaciones")}
     onDownloadPdf={handleDownloadPDF}
     onSave={handleSave}
     saving={createQuote.isPending || updateQuote.isPending}
   />
   ```

2. Reemplazar el card `{/* Quote metadata */}` (líneas 626-712) por:
   ```tsx
   <QuoteProjectLink
     quoteNumber={quoteNumber}
     onQuoteNumberChange={setQuoteNumber}
     isEditing={isEditing}
     status={status}
     onStatusChange={setStatus}
     validDays={validDays}
     onValidDaysChange={setValidDays}
     projectId={projectId}
     onProjectIdChange={setProjectId}
     projects={projects}
   />
   ```

3. Importar ambos componentes. Borrar los imports de `ArrowLeft`, `Download`, `Save`, `FileText`, `QUOTE_STATUS_LABELS`, `Separator`, `ChevronDown` de la página si ya no se usan.

- [ ] **Step 4: Build + tests verdes**

Run: `npm run build && npm run test:run`

- [ ] **Step 5: Proponer commit**

Mensaje sugerido:

```
refactor: extract QuoteHeader and QuoteProjectLink components
```

---

## Task 14: Extraer `QuoteTermsNotes` (hoja)

Mueve el card final de términos y notas (líneas 1044-1076).

**Files:**
- Create: `src/components/quote-editor/QuoteTermsNotes.tsx`
- Modify: `src/pages/QuoteEditorPage.tsx`

- [ ] **Step 1: Crear el componente**

Crear `src/components/quote-editor/QuoteTermsNotes.tsx`:

```tsx
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface QuoteTermsNotesProps {
  terms: string;
  onTermsChange: (v: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
}

export function QuoteTermsNotes({
  terms,
  onTermsChange,
  notes,
  onNotesChange,
}: QuoteTermsNotesProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <h2 className="text-sm font-semibold text-foreground">Términos y notas</h2>
      <div className="space-y-2">
        <Label>
          Términos y condiciones{" "}
          <span className="text-xs text-muted-foreground">(aparece en el PDF)</span>
        </Label>
        <Textarea
          placeholder="Ej: La cotización es válida por 30 días..."
          value={terms}
          onChange={(e) => onTermsChange(e.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label>
          Notas internas{" "}
          <span className="text-xs text-muted-foreground">(no aparece en el PDF)</span>
        </Label>
        <Textarea
          placeholder="Notas privadas sobre esta cotización..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={2}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Integrar en la página**

En `src/pages/QuoteEditorPage.tsx`, reemplazar el bloque `{/* Terms & notes */}` (líneas 1044-1076) por:

```tsx
<QuoteTermsNotes
  terms={terms}
  onTermsChange={setTerms}
  notes={notes}
  onNotesChange={setNotes}
/>
```

Importar: `import { QuoteTermsNotes } from "@/components/quote-editor/QuoteTermsNotes";`

Borrar de la página el import de `Textarea` si ya no se usa.

- [ ] **Step 3: Build + tests verdes**

Run: `npm run build && npm run test:run`

- [ ] **Step 4: Proponer commit**

Mensaje sugerido:

```
refactor: extract QuoteTermsNotes component
```

---

## Task 15: Extraer `QuotePreviewPDF`

El componente más grande en JSX (líneas 1080-1565, ~485 líneas). Renderiza el PDF preview del lado derecho. Recibe todas las props necesarias + el `totals` ya calculado. Internamente usa `QuoteTotalsDisplay`.

**Files:**
- Create: `src/components/quote-editor/QuotePreviewPDF.tsx`
- Modify: `src/pages/QuoteEditorPage.tsx`

- [ ] **Step 1: Crear el componente**

Crear `src/components/quote-editor/QuotePreviewPDF.tsx`:

```tsx
import { forwardRef } from "react";
import { formatCOP } from "@/lib/utils";
import type { Profile } from "@/types";
import type { QuoteTotals } from "@/lib/quoteCalculations";
import type { ItemRow } from "@/hooks/quote-editor/useQuoteItems";
import { QuoteTotalsDisplay } from "./QuoteTotalsDisplay";

const ACCENT_BLUE = "#1B2A4A";
const ACCENT_RED = "#E63946";

interface QuotePreviewPDFProps {
  profile: Profile | null;
  quoteNumber: string;
  validDays: number;
  today: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientIsCompany: boolean;
  clientCompany: string;
  clientNit: string;
  items: ItemRow[];
  terms: string;
  totals: QuoteTotals;
  applyIva: boolean;
  ivaRate: number;
  applyRetefuente: boolean;
  retefuenteRate: number;
  applyReteica: boolean;
  reteicaRate: number;
  discountType: "percentage" | "fixed";
  discountValue: number;
}

export const QuotePreviewPDF = forwardRef<HTMLDivElement, QuotePreviewPDFProps>(
  function QuotePreviewPDF(props, ref) {
    const {
      profile, quoteNumber, validDays, today,
      clientName, clientEmail, clientPhone, clientIsCompany, clientCompany, clientNit,
      items, terms, totals,
      applyIva, ivaRate, applyRetefuente, retefuenteRate,
      applyReteica, reteicaRate, discountType, discountValue,
    } = props;
    return (
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Vista previa</h2>
        </div>
        <div className="overflow-auto max-h-[calc(100vh-200px)] rounded-lg border border-border">
          <div
            ref={ref}
            style={{
              width: "794px",
              minHeight: "1123px",
              backgroundColor: "#ffffff",
              fontFamily: "Arial, sans-serif",
              fontSize: "12px",
              color: "#1a1a1a",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* El JSX completo del preview va aquí.
                COPIAR VERBATIM desde la línea 1101 hasta la línea 1562
                de QuoteEditorPage.tsx (todo lo que está entre <div style={{ padding: "48px" }}>
                y el cierre </div> de ese mismo div), con estas sustituciones:
                  - profile?.xxx   (ya viene como prop)
                  - quoteNumber    (prop)
                  - validDays      (prop)
                  - today          (prop)
                  - clientXxx      (props)
                  - items          (prop)
                  - terms          (prop)
                  - subtotal, discountAmount, ivaAmount, etc. → totals.xxx
                  - applyIva, ivaRate, etc. (props)
             */}
            <div style={{ padding: "48px" }}>
              {/* ... JSX trasplantado desde la página ... */}
              {/* Al final del bloque de totales (donde hoy hay cálculos inline),
                  sustituir ese subárbol por: */}
              <QuoteTotalsDisplay
                totals={totals}
                applyIva={applyIva}
                applyRetefuente={applyRetefuente}
                applyReteica={applyReteica}
                ivaRate={ivaRate}
                retefuenteRate={retefuenteRate}
                reteicaRate={reteicaRate}
                discountType={discountType}
                discountValue={discountValue}
              />
            </div>
          </div>
        </div>
      </div>
    );
  },
);
```

**Cómo hacer el trasplante del JSX grande sin errores:**

1. Abrir `QuoteEditorPage.tsx`, localizar el bloque que empieza en la línea 1081 (`<div className="bg-card border border-border rounded-xl p-4 space-y-3">`) y termina en la línea 1565 (cierre `</div>` antes del `</div>` del grid).
2. Cortar TODO ese bloque (Ctrl+X).
3. Pegar en `QuotePreviewPDF.tsx` dentro del componente, reemplazando la estructura placeholder mostrada arriba.
4. Mover `ACCENT_BLUE` y `ACCENT_RED` al componente nuevo (ya están arriba) y borrarlos de la página.
5. Reemplazar los identificadores por el acceso vía props (ver lista arriba).
6. Reemplazar el subárbol de "Totals" del preview por `<QuoteTotalsDisplay />` con las props ya listadas.

- [ ] **Step 2: Integrar en la página**

En `src/pages/QuoteEditorPage.tsx`:

1. Donde estaba el bloque del preview, ahora poner:

```tsx
<div className="xl:sticky xl:top-6 xl:self-start">
  <QuotePreviewPDF
    ref={previewRef}
    profile={profile ?? null}
    quoteNumber={quoteNumber}
    validDays={validDays}
    today={today}
    clientName={clientName}
    clientEmail={clientEmail}
    clientPhone={clientPhone}
    clientIsCompany={clientIsCompany}
    clientCompany={clientCompany}
    clientNit={clientNit}
    items={items}
    terms={terms}
    totals={totals}
    applyIva={applyIva}
    ivaRate={ivaRate}
    applyRetefuente={applyRetefuente}
    retefuenteRate={retefuenteRate}
    applyReteica={applyReteica}
    reteicaRate={reteicaRate}
    discountType={discountType}
    discountValue={discountValue}
  />
</div>
```

2. Importar: `import { QuotePreviewPDF } from "@/components/quote-editor/QuotePreviewPDF";`
3. Borrar `ACCENT_BLUE`, `ACCENT_RED` y los imports de iconos que ya no se usan en la página.

- [ ] **Step 3: Build verde**

Run: `npm run build`
Expected: sin errores. Si aparecen errores de "cannot find name", es porque una variable del preview se pasó pero no está mapeada a prop — revisar el listado de sustituciones.

- [ ] **Step 4: Tests verdes**

Run: `npm run test:run`

- [ ] **Step 5: Validación manual — comparación visual del preview**

Abrir `npm run dev`, ir a `/cotizaciones/COT-003/editar`, y comparar píxel a píxel con el preview previo al refactor:
- Logo + datos del freelancer arriba a la izquierda.
- Número de cotización y fecha arriba a la derecha.
- Bloque de cliente.
- Tabla de items con filas alternadas.
- Totales (subtotal, descuento, IVA, retefuente, reteica, total).
- Términos si existen.
- Footer con teléfono/email/web/NIT.

Abrir también el PDF descargado y comparar con una descarga previa.

- [ ] **Step 6: Proponer commit**

Mensaje sugerido:

```
refactor: extract QuotePreviewPDF component
```

---

## Task 16: Cleanup final y verificación de tamaños

Después de las 15 tareas la página debería quedar en el rango objetivo. Esta tarea verifica y limpia.

**Files:**
- Modify: `src/pages/QuoteEditorPage.tsx` (si hace falta terminar de limpiar imports)

- [ ] **Step 1: Verificar líneas**

Run:
```bash
wc -l src/pages/QuoteEditorPage.tsx \
      src/hooks/quote-editor/*.ts \
      src/components/quote-editor/*.tsx
```
Expected:
- `QuoteEditorPage.tsx` ≤ 300 líneas.
- Ningún componente > 350 líneas (QuotePreviewPDF puede ser el más grande).
- Ningún hook > 150 líneas.

Si algo se pasa del límite, revisar qué quedó inline que debería haber salido.

- [ ] **Step 2: Limpiar imports no usados en la página**

Abrir `src/pages/QuoteEditorPage.tsx` y quitar imports no referenciados. En particular, candidatos a estar sobrando:
- Iconos de `lucide-react` (`Plus`, `Trash2`, `Save`, `Download`, `ArrowLeft`, `GripVertical`, `FileText`, `Building2`, `User`, `Phone`, `Mail`, `ChevronDown`) — los que ya no se usen.
- `motion` de `framer-motion`.
- `Separator`, `DropdownMenu*`, `Dialog*`, `Label`, `Textarea` que ahora viven dentro de subcomponentes.
- `useRef` si `previewRef` es lo único que queda — se mantiene.

Criterio: TypeScript con `noUnusedLocals: true` ya marca los no usados. Apoyarse en `npm run build`.

- [ ] **Step 3: Build verde sin warnings**

Run: `npm run build`
Expected: 0 errores, 0 warnings nuevos de TypeScript.

- [ ] **Step 4: Suite completa verde**

Run: `npm run test:run`
Expected: 39+ tests pasan (24 de Fase A + 15 de componentes nuevos = 39 mínimo).

- [ ] **Step 5: Validación manual end-to-end con el MCP de Playwright del asistente**

Escenarios a cubrir (el asistente usa sus herramientas de browser):

1. **Creación completa**: ir a `/cotizaciones/nueva`, llenar cliente (nombre + email + es empresa + NIT), agregar 2 items, prender IVA 19% + Retefuente 10% + ReteICA 0.414%, aplicar 5% de descuento, verificar que los totales coinciden con el test de integración de la Fase A (`subtotal 1500, total 1547.35`), guardar.
2. **Edición**: abrir una cotización existente (COT-003), cambiar cantidad de un item, verificar que totales y preview se actualizan en vivo.
3. **Descarga PDF**: en ambas cotizaciones, pulsar "Descargar PDF" y verificar visualmente que el PDF es idéntico al previo al refactor.
4. **Unsaved changes**: tocar un campo, pulsar "Cotizaciones" (flecha de volver) → aparece el dialog. Probar las dos ramas (seguir editando / salir sin guardar).
5. **Agregar servicio**: desde un servicio preexistente.
6. **Borrar item**: dejar la lista en 1 item, verificar que el botón de borrar queda deshabilitado.
7. **Validaciones de submit**: intentar guardar sin nombre de cliente → toast de error. Intentar guardar con descuento negativo → toast de error.

- [ ] **Step 6: Proponer commit final**

Si el Step 2 tocó algo, proponer:

```
chore: remove unused imports from QuoteEditorPage
```

Si no, saltar este commit.

- [ ] **Step 7: Cuando damos por hecha la Fase B**

- `npm run build` ✅
- `npm run test:run` ✅ (39+ tests)
- `QuoteEditorPage.tsx` ≤ 300 líneas ✅
- Ningún subcomponente pasa de 350 líneas ✅ (QuotePreviewPDF puede ser el más grande)
- Ningún hook pasa de 150 líneas ✅
- PDF descargado idéntico antes/después ✅ (verificado manualmente)
- Los 7 escenarios manuales pasan ✅

---

## Commits propuestos (orden final)

1. `chore: scaffold quote-editor folders and router test helper`
2. `refactor: extract pdf generation to lib/quotePdf`
3. `refactor: extract useUnsavedChangesGuard hook`
4. `refactor: extract useQuoteTotals hook`
5. `refactor: extract useQuoteItems hook`
6. `refactor: extract useQuoteForm hook`
7. `refactor: extract UnsavedChangesDialog component`
8. `feat: add QuoteTotalsDisplay component with tests`
9. `feat: add QuoteItemsTable component with tests`
10. `feat: add QuoteTaxConfiguration component with tests`
11. `refactor: extract QuoteDiscountControl component`
12. `refactor: extract QuoteClientSection component`
13. `refactor: extract QuoteHeader and QuoteProjectLink components`
14. `refactor: extract QuoteTermsNotes component`
15. `refactor: extract QuotePreviewPDF component`
16. (opcional) `chore: remove unused imports from QuoteEditorPage`

Total: 15-16 commits.

---

## Reglas durante la ejecución

- Nada de mezclar tareas: un commit = una tarea.
- Después de cada tarea: `npm run build` + `npm run test:run` en verde antes de proponer commit.
- El usuario commitea a mano. El asistente solo escribe el mensaje sugerido.
- Si en medio de una tarea aparece un bug preexistente (no causado por el refactor), avisar y NO arreglarlo en el mismo commit.
- Durante todo el refactor, la UI se ve idéntica. Cualquier cambio visible = rollback y revisión.
