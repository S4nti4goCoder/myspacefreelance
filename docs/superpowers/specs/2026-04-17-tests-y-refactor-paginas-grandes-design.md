# Tests de cálculos y refactor de páginas grandes

Fecha: 2026-04-17
Alcance: 3 fases en orden (A, luego B, luego C)
Estado: diseño aprobado, falta plan de implementación

## Por qué

Dos problemas concretos:

1. `QuoteEditorPage.tsx` tiene 1578 líneas y `ProjectsPage.tsx` tiene 1126. En ese tamaño todo está mezclado: JSX, cálculos de impuestos, handlers, efectos, subcomponentes inline. Cualquier cambio toma más de lo que debería y es fácil romper algo sin darse cuenta.
2. No hay ni un test. Los cálculos de IVA, Retefuente y ReteICA son fiscales. Si se equivocan, el cliente recibe una cotización con números mal, y eso es un problema real.

## Qué queremos conseguir

- Tests que cubran los cálculos de impuestos (unitarios, de componente y e2e de punta a punta).
- `QuoteEditorPage.tsx` baja a unas 250 líneas.
- `ProjectsPage.tsx` baja a unas 220.
- El usuario final no debe notar diferencia en la app mientras hacemos todo esto.
- Dejar un patrón que después sirva para partir otras páginas grandes (hay varias más: QuoteViewPage, ClientAccountsPage, ProfilePage).

## Qué no vamos a hacer

- No vamos a mover el estado a Zustand o `useReducer`. Es estado local de un formulario y `useState` con hooks custom alcanza. Meter Zustand sería agregar capas sin beneficio.
- No vamos a refactorizar otras páginas grandes en este ciclo. QuoteViewPage, ClientAccountsPage y ProfilePage quedan para después, como proyectos aparte.
- No vamos a cambiar cómo se traen los datos. TanStack Query se queda como está.
- No vamos a meter i18n, error tracking, ni cambios visuales.

---

## Fase A: infra de tests y extracción de cálculos

### Dependencias nuevas

```
devDependencies:
  vitest
  @vitest/ui
  jsdom
  @testing-library/react
  @testing-library/jest-dom
  @testing-library/user-event
  @playwright/test
```

### Archivos que se crean

```
vitest.config.ts                     (config de Vitest, alias @, jsdom, setup)
src/test/setup.ts                    (matchers de jest-dom, cleanup)
playwright.config.ts                 (config de e2e)
tests/e2e/quote-create.spec.ts       (flujo completo: login, crear cotización, totales, PDF)
src/lib/quoteCalculations.ts         (las funciones puras que hoy viven dentro de QuoteEditorPage)
src/lib/quoteCalculations.test.ts    (tests unitarios)
```

### Archivos que se tocan

- `package.json`: scripts `test`, `test:ui`, `test:run`, `test:e2e`, `test:coverage`.
- `.gitignore`: añadir `coverage/`, `playwright-report/`, `test-results/`, `.vitest-cache/`.
- `src/pages/QuoteEditorPage.tsx`: pasar a usar `lib/quoteCalculations.ts`. Sin cambiar cómo se ve ni cómo se comporta.

### API de `lib/quoteCalculations.ts`

```ts
interface QuoteItem { quantity: number; unit_price: number }

interface TaxConfig {
  applyIva: boolean;        ivaRate: number;
  applyRetefuente: boolean; retefuenteRate: number;
  applyReteica: boolean;    reteicaRate: number;
}

interface DiscountConfig {
  type: "percentage" | "fixed";
  value: number;
}

interface QuoteTotals {
  subtotal: number;
  discountAmount: number;
  afterDiscount: number;
  ivaAmount: number;
  retefuenteAmount: number;
  reteicaAmount: number;
  total: number;
}

calculateSubtotal(items: QuoteItem[]): number
calculateDiscount(subtotal: number, discount: DiscountConfig): number
calculateTaxes(base: number, config: TaxConfig): Pick<QuoteTotals, "ivaAmount" | "retefuenteAmount" | "reteicaAmount">
calculateQuoteTotals(items: QuoteItem[], discount: DiscountConfig, taxes: TaxConfig): QuoteTotals
```

### Tests unitarios que hay que cubrir

- Subtotal: lista vacía, 1 item, N items, cantidad con decimal, precio en 0.
- Descuento en porcentaje: 0%, 10%, 50%, 100%.
- Descuento fijo: menor al subtotal, igual, y mayor (aquí probablemente da negativo; documentamos el comportamiento actual antes de decidir si se cambia).
- IVA 19% con el toggle prendido y apagado, probando también tasas de 0% y 5%.
- Retefuente 10% separado de IVA.
- ReteICA 0.414% (la tasa que se usa en Colombia).
- Un caso realista colombiano: IVA 19% + Retefuente 10% + ReteICA 0.414% + 5% de descuento.
- Un item con cantidad 0: ver qué hace hoy y fijarlo.
- Redondeo: cifras con decimales que pueden dar errores de precisión en float.

### Test e2e `quote-create.spec.ts`

El flujo que queremos cubrir:

1. Login con un usuario de prueba.
2. Ir a `/cotizaciones/nueva`.
3. Llenar los datos del cliente (empresa, NIT, email).
4. Agregar 2 items con cantidades y precios conocidos.
5. Prender IVA 19% y Retefuente 10%.
6. Poner descuento del 5%.
7. Revisar que los totales en pantalla cuadran con lo esperado.
8. Guardar.
9. Verificar que aparece en `/cotizaciones` con el número y estado correctos.

### Cuándo damos por hecha la Fase A

- `npm run test:run` pasa, con cobertura completa en `quoteCalculations.ts`.
- `npm run test:e2e` pasa.
- `npm run build` no tira errores ni warnings nuevos.
- `QuoteEditorPage` se ve y se comporta igual que antes.

---

## Fase B: partir `QuoteEditorPage`

### Cómo queda la estructura

```
src/
├─ components/
│  └─ quote-editor/                    (nueva)
│     ├─ QuoteHeader.tsx               (~80 líneas)
│     ├─ QuoteClientSection.tsx        (~120)
│     ├─ QuoteItemsTable.tsx           (~200)
│     ├─ QuoteTaxConfiguration.tsx     (~100)
│     ├─ QuoteDiscountControl.tsx      (~60)
│     ├─ QuoteTotalsDisplay.tsx        (~80)
│     ├─ QuoteTermsNotes.tsx           (~60)
│     ├─ QuoteProjectLink.tsx          (~50)
│     ├─ QuotePreviewPDF.tsx           (~150)
│     └─ UnsavedChangesDialog.tsx      (~40)
│
├─ hooks/
│  └─ quote-editor/                    (nueva)
│     ├─ useQuoteForm.ts               (~100)
│     ├─ useQuoteTotals.ts             (~30)
│     ├─ useQuoteItems.ts              (~60)
│     └─ useUnsavedChangesGuard.ts     (~50)
│
├─ lib/
│  └─ quotePdf.ts                      (nueva, generación de PDF como función pura)
│
└─ pages/
   └─ QuoteEditorPage.tsx              (~250 líneas, solo conecta las piezas)
```

### Qué queda haciendo la página padre

Tres cosas, básicamente:

1. Llamar los 4 hooks para sacar estado y handlers.
2. Renderizar los 10 subcomponentes y pasarles props tipadas.
3. Manejar el submit (crear o actualizar) y la navegación.

Los subcomponentes reciben props y ya. No importan hooks globales, no acceden a stores. Son tontos a propósito: así se pueden testear uno por uno con React Testing Library sin armar toda la app.

### Qué devuelve cada hook

- `useQuoteForm(existingQuote?, profile?)`: el estado completo del form, los setters, y `isDirty`.
- `useQuoteItems(items, setItems, markDirty)`: `{ addItem, removeItem, updateItem, reorderItems }`.
- `useQuoteTotals(items, discount, taxes)`: el `QuoteTotals` memoizado, llamando por dentro a `calculateQuoteTotals`.
- `useUnsavedChangesGuard(isDirty)`: `{ safeNavigate, showDialog, confirmLeave, cancelLeave }`, y de paso pone el listener de `beforeunload`.

### Tests de componente

- `QuoteTotalsDisplay.test.tsx`: render con distintos totales y chequear formato de moneda.
- `QuoteItemsTable.test.tsx`: agregar item crea fila, eliminar la quita, editar cantidad dispara el callback con el valor nuevo.
- `QuoteTaxConfiguration.test.tsx`: prender IVA habilita el input de tasa, cambiar la tasa dispara el callback.

### Cuándo damos por hecha la Fase B

- Los tests de la Fase A siguen verdes.
- Los tests nuevos de componente pasan.
- `QuoteEditorPage.tsx` no pasa de 300 líneas.
- Ningún subcomponente pasa de 250.
- Ningún hook pasa de 150.
- El PDF sale igual (prueba manual comparando dos cotizaciones).
- Todos los flujos funcionan igual en el browser: crear, editar, duplicar, bajar PDF, dialog de cambios sin guardar.

---

## Fase C: partir `ProjectsPage`

### Cómo queda la estructura

```
src/
├─ components/
│  └─ projects-list/                   (nueva)
│     ├─ ProjectsToolbar.tsx           (~120)
│     ├─ ProjectsGrid.tsx              (~150)
│     ├─ ProjectCard.tsx               (~130)
│     ├─ ProjectsBatchBar.tsx          (~80)
│     ├─ DuplicateProjectDialog.tsx    (~120)
│     ├─ DeleteProjectDialog.tsx       (~40)
│     ├─ ArchiveProjectDialog.tsx      (~40)
│     └─ BatchConfirmDialog.tsx        (~50)
│
├─ hooks/
│  └─ projects-list/                   (nueva)
│     ├─ useProjectsFilters.ts         (~80)
│     ├─ useProjectsBatchSelection.ts  (~70)
│     └─ useProjectDuplicate.ts        (~80)
│
└─ pages/
   └─ ProjectsPage.tsx                 (~220 líneas)
```

### Qué devuelve cada hook

- `useProjectsFilters()`: `{ search, setSearch, statusFilter, setStatusFilter, clientFilter, setClientFilter, sortBy, setSortBy, showArchived, setShowArchived, resetFilters }`.
- `useProjectsBatchSelection()`: `{ selectedIds, toggle, toggleAll, clear, count, batchConfirm, setBatchConfirm }`.
- `useProjectDuplicate()`: carga las tareas del proyecto que se va a duplicar y maneja qué tareas copiar.

### Un punto a mirar: `ProjectCard`

Mientras implementamos hay que revisar si `ProjectCard` se puede reusar en `DashboardPage` (la sección de proyectos recientes). Si encaja bien en los dos lados, lo movemos a `components/shared/ProjectCard.tsx` con props que soporten los dos casos. Si no, se queda en `projects-list/`.

### Tests

- `useProjectsFilters.test.ts`: combinaciones de filtros y reset.
- `useProjectsBatchSelection.test.ts`: toggle, clear, select-all, conteos.
- `ProjectCard.test.tsx`: render según estado del proyecto y según permisos (`can_edit`, `can_delete`).

### Cuándo damos por hecha la Fase C

- `ProjectsPage.tsx` no pasa de 280 líneas.
- Todos los tests de A y B siguen verdes.
- Los tests nuevos pasan.
- Filtros, sort, paginación, selección batch, duplicar, archivar y eliminar funcionan igual que antes.

---

## Commits

Cada fase va en su propia rama, con commits chicos y atómicos. El usuario commitea a mano; el asistente solo propone el mensaje cuando detecta que un punto está listo.

### Reglas mientras trabajamos

1. Un commit = un cambio coherente. Si sin querer se tocan dos cosas, se separan.
2. Antes de cualquier commit: `npm run build` + `npm run test:run` + (cuando aplica) `npm run test:e2e`, todo verde.
3. Nada de mezclar refactor con feature nueva en el mismo commit.
4. Durante el refactor, la app se ve y se comporta igual. Si cambia algo visible, los e2e lo agarran.
5. Si aparece un bug que ya estaba, se avisa antes de tocarlo.

### Mapa de commits (21 en total)

| Fase | Commits | Qué va ahí |
|------|---------|------------|
| A    | A1-A6   | Infra de tests, extracción de cálculos, e2e |
| B    | B1-B9   | Refactor QuoteEditor: 4 hooks, 10 componentes, tests |
| C    | C1-C7   | Refactor ProjectsPage: 3 hooks, 8 componentes, tests |

Los mensajes exactos los vamos proponiendo a medida que cada punto termine.

---

## Orden

A, luego B, luego C. No se puede saltar A porque los tests son los que nos avisan si B rompe algo. No se puede saltar B porque el patrón que sale de ahí es el molde para C.

## Dónde puede salir mal

- Diferencias de redondeo entre el cálculo viejo (inline) y el nuevo (módulo). Los tests unitarios fijan los valores esperados y deberían pescarlo.
- Regresiones en el PDF. Se prueban dos cotizaciones a mano después del refactor y se comparan visualmente.
- Tipos que se descuadran al mover estado a hooks. El `tsc` estricto del build se encarga.
- E2e flakey por depender de Supabase. Usamos un usuario de prueba dedicado y datos sembrados. El cómo lo sembramos se define en el plan de implementación.

## Cuánto va a tomar

- Fase A: medio día.
- Fase B: un día. Esta es la más delicada por los cálculos fiscales.
- Fase C: medio día.

En total, unos 2 días de trabajo entre los dos (asistente escribiendo, usuario revisando y commiteando).
