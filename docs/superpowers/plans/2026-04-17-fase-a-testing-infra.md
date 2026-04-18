# Fase A: Testing infra + extracción de cálculos de cotización

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar montada la infra de tests (Vitest + React Testing Library + Playwright), extraer los cálculos fiscales de `QuoteEditorPage` a un módulo puro con cobertura completa, y cubrir el flujo de creación de cotización con un test e2e.

**Architecture:** Vitest corre los tests unitarios y de componente (con jsdom). Playwright corre los e2e contra el dev server real. Los cálculos de cotización se extraen a `src/lib/quoteCalculations.ts` como funciones puras sin dependencias de React ni Supabase, para que se puedan testear en aislamiento.

**Tech Stack:** Vitest 2.x, jsdom, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom, @playwright/test.

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
    exclude: ["node_modules", "dist", "tests/e2e/**"],
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

## Task 6: Instalar Playwright

**Files:**
- Modify: `package.json`
- Create: `playwright.config.ts`
- Create: `tests/e2e/.gitkeep` (directorio nuevo)

- [ ] **Step 1: Instalar Playwright**

Run:
```bash
npm install -D @playwright/test
npx playwright install chromium
```

Expected: instala dependencia + descarga browser Chromium.

- [ ] **Step 2: Crear `playwright.config.ts`**

Create at project root:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 3: Crear directorio `tests/e2e/`**

Run: `mkdir -p tests/e2e`

- [ ] **Step 4: Agregar scripts e2e a `package.json`**

In the `scripts` object, add:

```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

- [ ] **Step 5: Excluir tests e2e de TypeScript app build**

Edit `tsconfig.app.json` — el `exclude` ya no existe; agregar:

```json
"exclude": ["tests/e2e/**"]
```

Si no existe el array `exclude`, agregarlo como hermano de `include`.

- [ ] **Step 6: Verificar que el build sigue funcionando**

Run: `npm run build`

Expected: sin errores.

- [ ] **Step 7: Mostrar al usuario el mensaje de commit**

Al usuario:

```
chore: add playwright for e2e tests
```

Archivos a stagear:
- `package.json`
- `package-lock.json`
- `playwright.config.ts`
- `tsconfig.app.json`

---

## Task 7: Test e2e del flujo de creación de cotización

**Files:**
- Create: `tests/e2e/quote-create.spec.ts`
- Create: `.env.test.example`
- Modify: `playwright.config.ts` (cargar env)

**Decisión de diseño para credenciales:**
El test e2e necesita un usuario freelancer de prueba real en el Supabase del proyecto. El usuario debe crearlo manualmente una vez y poner sus credenciales en `.env.test` (no se commitea). El archivo `.env.test.example` sí se commitea como plantilla.

- [ ] **Step 1: Crear `.env.test.example`**

Create at project root:

```
# Credenciales de usuario de prueba para tests e2e.
# Copiar este archivo a .env.test y completar con credenciales reales.
# .env.test NO debe commitearse.
E2E_TEST_EMAIL=test-freelancer@example.com
E2E_TEST_PASSWORD=
```

- [ ] **Step 2: Actualizar `.gitignore` para excluir `.env.test`**

Edit `.gitignore`, agregar una línea:

```
.env.test
```

(La Task 8 agrega más entradas al gitignore; esta queda por la sensibilidad.)

- [ ] **Step 3: Actualizar `playwright.config.ts` para cargar `.env.test`**

Modify `playwright.config.ts`, add at the top:

```ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });
```

Run: `npm install -D dotenv`

- [ ] **Step 4: Escribir el test e2e**

Create `tests/e2e/quote-create.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;

test.describe("Quote creation flow", () => {
  test.skip(
    !email || !password,
    "Missing E2E_TEST_EMAIL / E2E_TEST_PASSWORD — see .env.test.example",
  );

  test("creates a quote with IVA and Retefuente, calculated correctly", async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(email!);
    await page.getByLabel(/contraseña/i).fill(password!);
    await page.getByRole("button", { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL(/\/(|proyectos|cotizaciones)/, {
      timeout: 10_000,
    });

    // Ir al editor de cotización
    await page.goto("/cotizaciones/nueva");
    await expect(
      page.getByRole("heading", { name: /editor de cotización/i }),
    ).toBeVisible();

    // Llenar datos del cliente (persona)
    await page.getByLabel(/nombre/i).first().fill("Cliente E2E Test");
    await page.getByLabel(/email/i).first().fill("cliente@test.com");

    // Llenar el primer item (el form ya viene con uno vacío)
    const firstItemDescription = page
      .getByPlaceholder(/descripción/i)
      .first();
    await firstItemDescription.fill("Servicio de prueba 1");
    const firstItemQty = page
      .locator('input[type="number"]')
      .first();
    await firstItemQty.fill("2");
    const firstItemPrice = page
      .locator('input[type="number"]')
      .nth(1);
    await firstItemPrice.fill("500");

    // Agregar segundo item
    await page.getByRole("button", { name: /agregar item/i }).click();
    const secondItemDescription = page
      .getByPlaceholder(/descripción/i)
      .nth(1);
    await secondItemDescription.fill("Servicio de prueba 2");
    await page.locator('input[type="number"]').nth(2).fill("1");
    await page.locator('input[type="number"]').nth(3).fill("500");

    // Prender IVA y Retefuente
    await page.getByLabel(/iva/i).check();
    await page.getByLabel(/retefuente/i).check();

    // Descuento 5%
    const discountInput = page.getByLabel(/descuento/i);
    await discountInput.fill("5");

    // Verificar totales
    // Subtotal: 1500; Descuento 75; Base 1425; IVA 270.75; Retefuente 142.5
    // Total: 1425 + 270.75 - 142.5 = 1553.25
    await expect(page.getByText(/1[.,]?500/)).toBeVisible();
    await expect(page.getByText(/1[.,]?553/)).toBeVisible();

    // Guardar
    await page.getByRole("button", { name: /guardar/i }).click();
    await expect(page).toHaveURL(/\/cotizaciones($|\/)/, { timeout: 10_000 });

    // Aparece en listado
    await expect(page.getByText("Cliente E2E Test")).toBeVisible();
  });
});
```

**Nota al ejecutor:** los selectores por placeholder / label pueden necesitar ajuste. Después de escribirlos, correr el test con `--ui` y corregir selectores que no encuentren elementos. Preferir `getByRole` y `getByLabel` sobre selectores por clase.

- [ ] **Step 5: El usuario debe crear `.env.test` con credenciales reales**

Indicar al usuario:

1. Copiar `.env.test.example` a `.env.test`.
2. Crear un usuario freelancer de prueba en Supabase (vía la UI de signup o insertándolo manualmente).
3. Poner email y password en `.env.test`.

Sin `.env.test` el test queda `skipped` pero no falla — así el CI no se rompe por falta de credenciales.

- [ ] **Step 6: Correr el test e2e**

Si el usuario ya creó `.env.test`:

Run: `npm run test:e2e`

Expected: 1 test pasa.

Si no hay `.env.test`:

Run: `npm run test:e2e`

Expected: 1 test skipped con el mensaje "Missing E2E_TEST_EMAIL...".

Si el test falla por selectores (muy probable en la primera corrida), iterar:

Run: `npm run test:e2e:ui`

Ajustar los selectores en el `.spec.ts` hasta que el test pase.

- [ ] **Step 7: Verificar que todo lo demás sigue verde**

Run: `npm run test:run && npm run build`

Expected: ambos pasan.

- [ ] **Step 8: Mostrar al usuario el mensaje de commit**

Al usuario:

```
test: add e2e test for quote creation flow
```

Archivos a stagear:
- `tests/e2e/quote-create.spec.ts`
- `.env.test.example`
- `.gitignore`
- `playwright.config.ts`
- `package.json`
- `package-lock.json`

No stagear `.env.test` (ya está en gitignore).

---

## Task 8: Actualizar `.gitignore` para artefactos de tests

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Ver el `.gitignore` actual**

Read `.gitignore`.

- [ ] **Step 2: Agregar entradas para artefactos de tests**

Append at the end of `.gitignore`:

```
# Test artifacts
coverage/
playwright-report/
test-results/
.vitest-cache/
```

(La entrada `.env.test` ya se agregó en la Task 7.)

- [ ] **Step 3: Verificar que git ya no trackea estos directorios**

Run: `git status`

Expected: no aparecen archivos dentro de `coverage/`, `playwright-report/`, `test-results/` como untracked. Si ya están trackeados (porque se commiteo alguno sin querer), el usuario tendrá que decidir qué hacer. Avisarle.

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

- [ ] `npm run test:run` pasa con 25 tests en verde.
- [ ] `npm run test:coverage` muestra 100% en `src/lib/quoteCalculations.ts`.
- [ ] `npm run test:e2e` pasa (si hay `.env.test`) o skippea limpiamente.
- [ ] `npm run build` pasa sin errores nuevos.
- [ ] `QuoteEditorPage` se ve y se comporta igual en el browser (prueba manual: crear y editar una cotización, verificar totales y PDF).
- [ ] Los 8 commits sugeridos se han aplicado.

Una vez cumplido esto, la rama está lista para mergear. Después viene la Fase B (refactor de `QuoteEditorPage`), que tendrá su propio plan.
