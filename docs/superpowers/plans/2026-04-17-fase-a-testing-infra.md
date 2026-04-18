# Fase A: Testing infra + extracción de cálculos de cotización

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar montada la infra de tests (Vitest + React Testing Library) y extraer los cálculos fiscales de `QuoteEditorPage` a un módulo puro con cobertura completa.

**Architecture:** Vitest corre los tests unitarios y de componente (con jsdom). Los cálculos de cotización se extraen a `src/lib/quoteCalculations.ts` como funciones puras sin dependencias de React ni Supabase, para que se puedan testear en aislamiento.

**Tech Stack:** Vitest 2.x, jsdom, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom.

**Nota importante:** El usuario commitea manualmente. Cada tarea termina con un mensaje de commit sugerido (breve, en inglés, conventional commits). No ejecutes `git commit`, `git add`, ni nada que cree commits — solo muestra el mensaje.

---

## Task 1: Instalar Vitest y dependencias de testing

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Instalar dependencias**

Run:
```bash
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitest/coverage-v8
```

Expected: instala sin errores, actualiza `package.json` y `package-lock.json`.

- [ ] **Step 2: Crear `vitest.config.ts`**

Create file at project root with:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    exclude: ["node_modules", "dist"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/lib/quoteCalculations.ts"],
    },
  },
});
```

- [ ] **Step 3: Crear `src/test/setup.ts`**

Create file with:

```ts
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
```

- [ ] **Step 4: Agregar scripts a `package.json`**

In the `scripts` object, add:

```json
"test": "vitest",
"test:ui": "vitest --ui",
"test:run": "vitest run",
"test:coverage": "vitest run --coverage"
```

- [ ] **Step 5: Verificar que la config funciona con un test de humo**

Create temporary file `src/test/sanity.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("vitest setup", () => {
  it("runs tests", () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `npm run test:run`

Expected: 1 test pasa.

- [ ] **Step 6: Borrar el test de humo**

Delete `src/test/sanity.test.ts`. Solo era para verificar que la config carga.

- [ ] **Step 7: Verificar que `npm run build` sigue funcionando**

Run: `npm run build`

Expected: build pasa sin errores nuevos.

- [ ] **Step 8: Mostrar al usuario el mensaje de commit**

Al usuario:

```
chore: add vitest and testing-library
```

Archivos que el usuario debe stagear:
- `package.json`
- `package-lock.json`
- `vitest.config.ts`
- `src/test/setup.ts`

No ejecutes `git add` ni `git commit`.

---

## Task 2: TDD — Extraer `calculateSubtotal` y `calculateDiscount`

**Files:**
- Create: `src/lib/quoteCalculations.ts`
- Create: `src/lib/quoteCalculations.test.ts`

- [ ] **Step 1: Escribir el test para `calculateSubtotal` (va a fallar)**

Create `src/lib/quoteCalculations.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { calculateSubtotal, calculateDiscount } from "./quoteCalculations";

describe("calculateSubtotal", () => {
  it("returns 0 for an empty list", () => {
    expect(calculateSubtotal([])).toBe(0);
  });

  it("multiplies quantity by unit_price for a single item", () => {
    expect(
      calculateSubtotal([{ quantity: 3, unit_price: 100 }]),
    ).toBe(300);
  });

  it("sums multiple items", () => {
    expect(
      calculateSubtotal([
        { quantity: 2, unit_price: 50 },
        { quantity: 1, unit_price: 200 },
      ]),
    ).toBe(300);
  });

  it("handles decimal quantities", () => {
    expect(
      calculateSubtotal([{ quantity: 1.5, unit_price: 100 }]),
    ).toBe(150);
  });

  it("returns 0 when all items have price 0", () => {
    expect(
      calculateSubtotal([
        { quantity: 5, unit_price: 0 },
        { quantity: 2, unit_price: 0 },
      ]),
    ).toBe(0);
  });
});

describe("calculateDiscount", () => {
  it("returns 0 for percentage 0", () => {
    expect(
      calculateDiscount(1000, { type: "percentage", value: 0 }),
    ).toBe(0);
  });

  it("calculates 10% of the subtotal", () => {
    expect(
      calculateDiscount(1000, { type: "percentage", value: 10 }),
    ).toBe(100);
  });

  it("calculates 50% of the subtotal", () => {
    expect(
      calculateDiscount(2000, { type: "percentage", value: 50 }),
    ).toBe(1000);
  });

  it("calculates 100% of the subtotal (full discount)", () => {
    expect(
      calculateDiscount(1500, { type: "percentage", value: 100 }),
    ).toBe(1500);
  });

  it("returns the fixed value when type is fixed and value is smaller than subtotal", () => {
    expect(
      calculateDiscount(1000, { type: "fixed", value: 200 }),
    ).toBe(200);
  });

  it("returns the fixed value when it equals subtotal", () => {
    expect(
      calculateDiscount(500, { type: "fixed", value: 500 }),
    ).toBe(500);
  });

  it("returns the fixed value even if it exceeds subtotal (documents current behavior)", () => {
    // Si el descuento fijo supera al subtotal, el cálculo actual lo permite.
    // Si en el futuro se decide clampear a subtotal, este test debe cambiar.
    expect(
      calculateDiscount(100, { type: "fixed", value: 500 }),
    ).toBe(500);
  });
});
```

- [ ] **Step 2: Correr los tests para verificar que fallan**

Run: `npm run test:run`

Expected: FAIL con "Cannot find module './quoteCalculations'" o similar.

- [ ] **Step 3: Crear el módulo `quoteCalculations.ts` con las dos funciones**

Create `src/lib/quoteCalculations.ts`:

```ts
export interface QuoteItemForCalc {
  quantity: number;
  unit_price: number;
}

export interface DiscountConfig {
  type: "percentage" | "fixed";
  value: number;
}

export function calculateSubtotal(items: QuoteItemForCalc[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
}

export function calculateDiscount(
  subtotal: number,
  discount: DiscountConfig,
): number {
  if (discount.type === "percentage") {
    return subtotal * (discount.value / 100);
  }
  return discount.value;
}
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `npm run test:run`

Expected: 13 tests pasan (5 de subtotal + 8 de descuento).

- [ ] **Step 5: Mostrar al usuario el mensaje de commit**

Al usuario:

```
feat: add subtotal and discount calculation helpers
```

Archivos a stagear:
- `src/lib/quoteCalculations.ts`
- `src/lib/quoteCalculations.test.ts`

---

## Task 3: TDD — Extraer `calculateTaxes`

**Files:**
- Modify: `src/lib/quoteCalculations.ts`
- Modify: `src/lib/quoteCalculations.test.ts`

- [ ] **Step 1: Agregar tests para `calculateTaxes` al archivo existente**

Append to `src/lib/quoteCalculations.test.ts` (antes de cualquier cierre de archivo, al final):

```ts
import { calculateTaxes } from "./quoteCalculations";

const NO_TAXES = {
  applyIva: false,
  applyRetefuente: false,
  applyReteica: false,
  ivaRate: 19,
  retefuenteRate: 10,
  reteicaRate: 0.414,
};

describe("calculateTaxes", () => {
  it("returns all zeros when no tax is applied", () => {
    const result = calculateTaxes(1000, NO_TAXES);
    expect(result).toEqual({
      ivaAmount: 0,
      retefuenteAmount: 0,
      reteicaAmount: 0,
    });
  });

  it("applies only IVA at 19%", () => {
    const result = calculateTaxes(1000, { ...NO_TAXES, applyIva: true });
    expect(result.ivaAmount).toBe(190);
    expect(result.retefuenteAmount).toBe(0);
    expect(result.reteicaAmount).toBe(0);
  });

  it("applies IVA at a custom rate (5%)", () => {
    const result = calculateTaxes(1000, {
      ...NO_TAXES,
      applyIva: true,
      ivaRate: 5,
    });
    expect(result.ivaAmount).toBe(50);
  });

  it("applies only Retefuente at 10%", () => {
    const result = calculateTaxes(1000, {
      ...NO_TAXES,
      applyRetefuente: true,
    });
    expect(result.retefuenteAmount).toBe(100);
    expect(result.ivaAmount).toBe(0);
  });

  it("applies only ReteICA at 0.414%", () => {
    const result = calculateTaxes(1000, {
      ...NO_TAXES,
      applyReteica: true,
    });
    expect(result.reteicaAmount).toBeCloseTo(4.14, 5);
    expect(result.ivaAmount).toBe(0);
  });

  it("applies all three taxes independently", () => {
    const result = calculateTaxes(1000, {
      applyIva: true,
      applyRetefuente: true,
      applyReteica: true,
      ivaRate: 19,
      retefuenteRate: 10,
      reteicaRate: 0.414,
    });
    expect(result.ivaAmount).toBe(190);
    expect(result.retefuenteAmount).toBe(100);
    expect(result.reteicaAmount).toBeCloseTo(4.14, 5);
  });

  it("ignores rates when their toggle is off", () => {
    const result = calculateTaxes(1000, {
      applyIva: false,
      applyRetefuente: false,
      applyReteica: false,
      ivaRate: 50,
      retefuenteRate: 50,
      reteicaRate: 50,
    });
    expect(result).toEqual({
      ivaAmount: 0,
      retefuenteAmount: 0,
      reteicaAmount: 0,
    });
  });
});
```

- [ ] **Step 2: Correr los tests para verificar que fallan**

Run: `npm run test:run`

Expected: los nuevos tests fallan con "calculateTaxes is not a function".

- [ ] **Step 3: Agregar `calculateTaxes` al módulo**

Append to `src/lib/quoteCalculations.ts`:

```ts
export interface TaxConfig {
  applyIva: boolean;
  ivaRate: number;
  applyRetefuente: boolean;
  retefuenteRate: number;
  applyReteica: boolean;
  reteicaRate: number;
}

export interface TaxAmounts {
  ivaAmount: number;
  retefuenteAmount: number;
  reteicaAmount: number;
}

export function calculateTaxes(base: number, config: TaxConfig): TaxAmounts {
  return {
    ivaAmount: config.applyIva ? base * (config.ivaRate / 100) : 0,
    retefuenteAmount: config.applyRetefuente
      ? base * (config.retefuenteRate / 100)
      : 0,
    reteicaAmount: config.applyReteica ? base * (config.reteicaRate / 100) : 0,
  };
}
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `npm run test:run`

Expected: todos los tests (13 anteriores + 7 nuevos = 20) pasan.

- [ ] **Step 5: Mostrar al usuario el mensaje de commit**

Al usuario:

```
feat: add tax calculation helper
```

Archivos a stagear:
- `src/lib/quoteCalculations.ts`
- `src/lib/quoteCalculations.test.ts`

---

## Task 4: TDD — Extraer `calculateQuoteTotals` (integración)

**Files:**
- Modify: `src/lib/quoteCalculations.ts`
- Modify: `src/lib/quoteCalculations.test.ts`

- [ ] **Step 1: Agregar tests de integración**

Append to `src/lib/quoteCalculations.test.ts`:

```ts
import { calculateQuoteTotals } from "./quoteCalculations";

describe("calculateQuoteTotals (integration)", () => {
  it("computes totals for a realistic Colombia quote", () => {
    // Items: 2 × 500 = 1000, 1 × 500 = 500 → subtotal 1500
    // Descuento 5% = 75 → afterDiscount 1425
    // IVA 19% = 270.75
    // Retefuente 10% = 142.5
    // ReteICA 0.414% = 5.8995
    // Total = 1425 + 270.75 - 142.5 - 5.8995 = 1547.3505
    const result = calculateQuoteTotals(
      [
        { quantity: 2, unit_price: 500 },
        { quantity: 1, unit_price: 500 },
      ],
      { type: "percentage", value: 5 },
      {
        applyIva: true,
        applyRetefuente: true,
        applyReteica: true,
        ivaRate: 19,
        retefuenteRate: 10,
        reteicaRate: 0.414,
      },
    );

    expect(result.subtotal).toBe(1500);
    expect(result.discountAmount).toBe(75);
    expect(result.afterDiscount).toBe(1425);
    expect(result.ivaAmount).toBe(270.75);
    expect(result.retefuenteAmount).toBe(142.5);
    expect(result.reteicaAmount).toBeCloseTo(5.8995, 5);
    expect(result.total).toBeCloseTo(1547.3505, 5);
  });

  it("returns zeros for empty items", () => {
    const result = calculateQuoteTotals(
      [],
      { type: "percentage", value: 0 },
      {
        applyIva: false,
        applyRetefuente: false,
        applyReteica: false,
        ivaRate: 19,
        retefuenteRate: 10,
        reteicaRate: 0.414,
      },
    );

    expect(result.subtotal).toBe(0);
    expect(result.discountAmount).toBe(0);
    expect(result.afterDiscount).toBe(0);
    expect(result.total).toBe(0);
  });

  it("handles a quote without any taxes or discount", () => {
    const result = calculateQuoteTotals(
      [{ quantity: 1, unit_price: 1000 }],
      { type: "percentage", value: 0 },
      {
        applyIva: false,
        applyRetefuente: false,
        applyReteica: false,
        ivaRate: 19,
        retefuenteRate: 10,
        reteicaRate: 0.414,
      },
    );

    expect(result.total).toBe(1000);
  });

  it("handles fixed discount greater than subtotal (documents current behavior)", () => {
    // Comportamiento actual: el total puede quedar negativo.
    // Este test fija ese comportamiento; si se decide clampear, el test se actualiza.
    const result = calculateQuoteTotals(
      [{ quantity: 1, unit_price: 100 }],
      { type: "fixed", value: 500 },
      {
        applyIva: false,
        applyRetefuente: false,
        applyReteica: false,
        ivaRate: 19,
        retefuenteRate: 10,
        reteicaRate: 0.414,
      },
    );

    expect(result.subtotal).toBe(100);
    expect(result.discountAmount).toBe(500);
    expect(result.afterDiscount).toBe(-400);
    expect(result.total).toBe(-400);
  });

  it("ignores items with quantity 0 in the subtotal", () => {
    const result = calculateQuoteTotals(
      [
        { quantity: 0, unit_price: 999 },
        { quantity: 2, unit_price: 100 },
      ],
      { type: "percentage", value: 0 },
      {
        applyIva: false,
        applyRetefuente: false,
        applyReteica: false,
        ivaRate: 19,
        retefuenteRate: 10,
        reteicaRate: 0.414,
      },
    );

    expect(result.subtotal).toBe(200);
  });
});
```

- [ ] **Step 2: Correr los tests para verificar que fallan**

Run: `npm run test:run`

Expected: los 5 tests nuevos fallan con "calculateQuoteTotals is not a function".

- [ ] **Step 3: Agregar `calculateQuoteTotals` al módulo**

Append to `src/lib/quoteCalculations.ts`:

```ts
export interface QuoteTotals extends TaxAmounts {
  subtotal: number;
  discountAmount: number;
  afterDiscount: number;
  total: number;
}

export function calculateQuoteTotals(
  items: QuoteItemForCalc[],
  discount: DiscountConfig,
  taxes: TaxConfig,
): QuoteTotals {
  const subtotal = calculateSubtotal(items);
  const discountAmount = calculateDiscount(subtotal, discount);
  const afterDiscount = subtotal - discountAmount;
  const taxAmounts = calculateTaxes(afterDiscount, taxes);
  const total =
    afterDiscount +
    taxAmounts.ivaAmount -
    taxAmounts.retefuenteAmount -
    taxAmounts.reteicaAmount;

  return {
    subtotal,
    discountAmount,
    afterDiscount,
    ...taxAmounts,
    total,
  };
}
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `npm run test:run`

Expected: 25 tests pasan en total.

- [ ] **Step 5: Verificar cobertura**

Run: `npm run test:coverage`

Expected: `src/lib/quoteCalculations.ts` tiene 100% (lines, statements, branches, functions).

- [ ] **Step 6: Mostrar al usuario el mensaje de commit**

Al usuario:

```
feat: add quote totals integration helper
```

Archivos a stagear:
- `src/lib/quoteCalculations.ts`
- `src/lib/quoteCalculations.test.ts`

---

## Task 5: Migrar `QuoteEditorPage` a usar `quoteCalculations`

**Files:**
- Modify: `src/pages/QuoteEditorPage.tsx` (líneas 179-195 aprox.)

- [ ] **Step 1: Ver el código actual**

Read `src/pages/QuoteEditorPage.tsx` líneas 179-195:

```tsx
const subtotal = useMemo(
  () => items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0),
  [items],
);

const discountAmount = useMemo(() => {
  if (discountType === "percentage") return subtotal * (discountValue / 100);
  return discountValue;
}, [subtotal, discountType, discountValue]);

const afterDiscount = subtotal - discountAmount;
const ivaAmount = applyIva ? afterDiscount * (ivaRate / 100) : 0;
const retefuenteAmount = applyRetefuente
  ? afterDiscount * (retefuenteRate / 100)
  : 0;
const reteicaAmount = applyReteica ? afterDiscount * (reteicaRate / 100) : 0;
const total = afterDiscount + ivaAmount - retefuenteAmount - reteicaAmount;
```

- [ ] **Step 2: Reemplazar con llamada al módulo**

Replace the block above with:

```tsx
const totals = useMemo(
  () =>
    calculateQuoteTotals(
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
    ),
  [
    items,
    discountType,
    discountValue,
    applyIva,
    ivaRate,
    applyRetefuente,
    retefuenteRate,
    applyReteica,
    reteicaRate,
  ],
);

const {
  subtotal,
  discountAmount,
  afterDiscount,
  ivaAmount,
  retefuenteAmount,
  reteicaAmount,
  total,
} = totals;
```

- [ ] **Step 3: Agregar el import al top del archivo**

Add near the other imports in `QuoteEditorPage.tsx`:

```tsx
import { calculateQuoteTotals } from "@/lib/quoteCalculations";
```

- [ ] **Step 4: Verificar que TypeScript compila**

Run: `npm run build`

Expected: sin errores. Si hay warning por `useMemo` con dependencias muchas, ignorar — son las mismas que ya existían distribuidas en los `useMemo` originales.

- [ ] **Step 5: Verificar tests unitarios siguen verdes**

Run: `npm run test:run`

Expected: 25 tests pasan.

- [ ] **Step 6: Verificación manual en el browser**

1. Run: `npm run dev`
2. Abrir `/cotizaciones/nueva`.
3. Agregar 2 items, prender IVA, Retefuente y ReteICA, aplicar descuento 5%.
4. Verificar que los totales en pantalla coinciden con los del caso realista del test (si usas los mismos valores).
5. Si existe una cotización guardada, abrirla en modo edición y verificar que los totales cargan igual.

Expected: visualmente idéntico al comportamiento previo.

- [ ] **Step 7: Mostrar al usuario el mensaje de commit**

Al usuario:

```
refactor: use quoteCalculations in QuoteEditorPage
```

Archivos a stagear:
- `src/pages/QuoteEditorPage.tsx`

---

## Task 6: Actualizar `.gitignore` para artefactos de tests

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Ver el `.gitignore` actual**

Read `.gitignore`.

- [ ] **Step 2: Agregar entradas para artefactos de tests**

Append at the end of `.gitignore`:

```
# Test artifacts
coverage/
.vitest-cache/
.playwright-mcp/
```

- [ ] **Step 3: Verificar que git ya no trackea estos directorios**

Run: `git status`

Expected: no aparecen archivos dentro de `coverage/`, `.vitest-cache/`, `.playwright-mcp/` como untracked.

- [ ] **Step 4: Mostrar al usuario el mensaje de commit**

Al usuario:

```
chore: gitignore test artifacts
```

Archivos a stagear:
- `.gitignore`

---

## Criterios de cierre de la Fase A

Antes de dar la fase por cerrada, verificar:

- [ ] `npm run test:run` pasa con 24 tests en verde.
- [ ] `npm run test:coverage` muestra 100% en `src/lib/quoteCalculations.ts`.
- [ ] `npm run build` pasa sin errores nuevos.
- [ ] `QuoteEditorPage` se ve y se comporta igual en el browser (prueba manual: crear y editar una cotización, verificar totales y PDF).
- [ ] Los 6 commits sugeridos se han aplicado.

Una vez cumplido esto, la rama está lista para mergear. Después viene la Fase B (refactor de `QuoteEditorPage`), que tendrá su propio plan.
