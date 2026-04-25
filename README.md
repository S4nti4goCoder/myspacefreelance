# MySpaceFreelance

> Plataforma SaaS integral para freelancers — gestión de proyectos, clientes, cotizaciones, pagos, colaboradores y reportes en un solo lugar, con portal dedicado para clientes.

![Tech](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Tech](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Tech](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)
![Tech](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)
![Tech](https://img.shields.io/badge/Supabase-2-3ECF8E?logo=supabase)
![Tests](https://img.shields.io/badge/tests-54%20passing-success)

---

## 📸 Capturas

> _(Espacio reservado para capturas del proyecto)_

- Dashboard con KPIs y actividad reciente
- Login con split layout
- Vista calendario tipo Gantt
- Tablero Kanban con drag & drop
- Editor de cotizaciones con cálculo en vivo
- Portal del cliente

---

## 🚀 Features principales

### Para el freelancer
- **Dashboard ejecutivo** — ingresos del mes, proyectos activos, cotizaciones pendientes, próximos vencimientos, gráfica de proyectos por estado.
- **Gestión de proyectos** — CRUD completo con 6 estados, vista cuadrícula, **vista calendario tipo Gantt**, tablero Kanban con drag & drop, batch operations (multi-selección, archivar masivo, cambiar estado), duplicación con copia de tareas.
- **Cotizaciones profesionales** — editor con cálculo en vivo, numeración secuencial automática, soporte completo de impuestos colombianos (IVA, Retefuente, ReteICA), exportación a PDF profesional, conversión directa a proyecto.
- **Gestión de clientes** — registro con generación automática de credenciales, asignación múltiple de proyectos, reset remoto de contraseña, búsqueda + paginación server-side.
- **Catálogo de servicios** — agrupados por categoría con precios base reutilizables en cotizaciones.
- **Colaboradores** con permisos granulares — 10 módulos × 4 acciones (view/create/edit/delete) por colaborador, asignación de proyectos específicos.
- **Reportes** — total cobrado vs presupuestado, gráfica mensual de pagos, desglose por proyecto, exportación CSV compatible con Excel.
- **Notificaciones en tiempo real** vía Supabase Realtime — comentarios, pagos, tareas, proyectos, cotizaciones.
- **Búsqueda global** con `Ctrl+K` — busca en proyectos, tareas y archivos al mismo tiempo.

### Para el cliente
- Portal dedicado con dashboard de sus proyectos asignados.
- Vista de detalle con tareas, documentos, archivos y pagos (solo lectura).
- Comentarios bidireccionales con el freelancer.
- Cambio obligatorio de contraseña en primer ingreso.

### Para el colaborador
- Acceso restringido a los módulos y proyectos autorizados por el freelancer.
- Permisos granulares: puede ver el módulo pero no crear, o editar pero no borrar, etc.
- Indicador visible de su rol y módulos disponibles.

---

## 🛠️ Stack técnico

| Capa | Tecnología |
|------|-----------|
| **Framework** | React 19 + TypeScript 5.9 |
| **Build tool** | Vite 8 |
| **Estilos** | Tailwind CSS v4 + shadcn/ui (Radix UI primitives) |
| **Estado servidor** | TanStack Query v5 (cache, paginación, mutations, retry inteligente) |
| **Estado cliente** | Zustand 5 |
| **Routing** | React Router 7 con lazy routes |
| **Backend** | Supabase (Auth + PostgreSQL + RLS + Storage + Realtime) |
| **Forms** | Componentes nativos con validación in-line |
| **Charts** | Recharts 3 |
| **Drag & Drop** | @hello-pangea/dnd |
| **Markdown** | react-markdown + @uiw/react-md-editor |
| **PDF** | jsPDF + html2canvas |
| **Animaciones** | Framer Motion 12 |
| **Iconos** | Lucide React |
| **Toasts** | Sonner |
| **Testing** | Vitest 4 + Testing Library + jsdom |
| **Deploy** | Vercel |

---

## 🏗️ Decisiones técnicas destacadas

### Performance
- **Code-splitting agresivo** — cada ruta es un chunk lazy. La página de detalle de proyecto (con sus 5 tabs pesados) bajó de **1.7MB a 9.45KB** en el bundle principal.
- **Lazy loading de dependencias pesadas** — el editor Markdown (`@uiw/react-md-editor`, ~1.5MB) solo se descarga cuando el usuario hace click en "Editar".
- **TanStack Query con `keepPreviousData`** — transiciones suaves entre páginas paginadas sin flickers.
- **Retry policy inteligente** — exponential backoff en 5xx y errores de red, sin retry en 4xx (no tiene sentido reintentar un 401), `retry: 0` en mutations para evitar dobles escrituras.

### Seguridad
- **4 capas de autorización** complementarias:
  1. Route-level guards (`ProtectedPanelRoute`, `FreelancerOnlyRoute`, `ProtectedClientRoute`, `ModuleGuardRoute`).
  2. Component-level (`useCanAccess` hook esconde botones según permisos).
  3. Session-level (sesión expirada → toast + redirect automático).
  4. **Supabase RLS** — la capa real: aunque el frontend sea bypasseado, la DB filtra a nivel de fila.
- **Validación de email** con regex + normalización a lowercase antes de enviar a Auth.
- **Headers de seguridad en producción** — `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`.
- **`robots: noindex, nofollow`** — SaaS privado, no se indexa en Google.

### Resiliencia
- **Error boundaries por ruta** con auto-reset cuando cambia `pathname` — si una página crashea, el sidebar sigue vivo y al navegar a otra se limpia el error.
- **Session expiration handling** — diferencia entre logout voluntario (toast "Sesión cerrada") y expiración (toast "Tu sesión ha expirado, inicia sesión de nuevo") con un flag en el authStore.
- **Loading states consistentes** durante auth init para evitar flashes de redirección.

### Accesibilidad
- `aria-label` en todos los botones icon-only (paginación, vistas toggle, acciones de fila).
- `aria-pressed` y `aria-current` para estados activos.
- `cursor-pointer` consistente en todos los elementos clickeables (Tailwind v4 tiene `cursor: default` por defecto en buttons).
- `focus-visible` con anillo de focus en todos los elementos interactivos.
- Atajos de teclado (`Ctrl+K` para búsqueda global).

### Developer experience
- **Tests con Vitest** — 54 tests cubren hooks de filtros, batch selection, cálculos de cotizaciones y componentes clave.
- **TypeScript estricto** — sin `any`, tipos compartidos en `src/types/index.ts` como single source of truth.
- **ESLint + React Compiler rules** — `react-hooks/preserve-manual-memoization`, `set-state-in-effect`, `purity` activadas.
- **Single-file router** — `src/routes/AppRouter.tsx` centraliza todas las rutas, lazy imports, guards y error boundaries (~220 líneas).

---

## 📂 Estructura del proyecto

```
src/
├── routes/
│   └── AppRouter.tsx       # Routing centralizado: lazy imports + guards + error boundaries
├── store/
│   └── authStore.ts        # Zustand: user, profile, isLoading, isLoggingOut
├── hooks/                  # Custom hooks con TanStack Query
│   ├── useProjects.ts
│   ├── useQuotes.ts
│   ├── useClientAccounts.ts
│   ├── useMyPermissions.ts # incluye useCanAccess()
│   ├── projects-list/      # hooks específicos de la lista de proyectos
│   └── quote-editor/       # hooks del editor de cotizaciones
├── pages/                  # Páginas por módulo
│   ├── client/             # Portal del cliente (subpath /cliente/*)
│   ├── DashboardPage.tsx
│   ├── ProjectsPage.tsx
│   ├── ProjectDetailPage.tsx  # con tabs lazy: Kanban, Documentos, Archivos, Pagos, Comentarios
│   ├── QuotesPage.tsx
│   ├── QuoteEditorPage.tsx
│   ├── QuoteViewPage.tsx
│   ├── ClientAccountsPage.tsx
│   ├── CollaboratorsPage.tsx
│   ├── ReportsPage.tsx
│   ├── ServicesPage.tsx
│   ├── ProfilePage.tsx
│   ├── LoginPage.tsx
│   ├── PrivacyPolicyPage.tsx
│   └── TermsPage.tsx
├── components/
│   ├── shared/             # Layout, KanbanBoard, ProjectCalendar, GlobalSearch, NotificationCenter, ErrorBoundary, etc.
│   ├── ui/                 # shadcn primitives (button, card, dialog, dropdown, select, tabs, etc.)
│   ├── projects-list/      # desglose de ProjectsPage (toolbar, grid, batch bar, dialogs)
│   └── quote-editor/       # desglose de QuoteEditorPage (items table, totals, taxes)
├── lib/
│   ├── supabase.ts         # Cliente Supabase
│   ├── utils.ts            # cn(), formatDate, formatCOP, downloadCSV, isValidEmail
│   ├── quoteCalculations.ts
│   ├── quotePdf.ts
│   └── constants.ts
├── test/
│   ├── setup.ts
│   └── renderWithRouter.tsx
└── types/
    └── index.ts            # Single source of truth — Project, Task, Quote, Profile, etc.
```

---

## 🚦 Roles y permisos

| Rol | Acceso |
|-----|--------|
| **Freelancer** | Acceso completo a todos los módulos. Único que puede gestionar colaboradores. |
| **Colaborador** | Acceso limitado por módulo (10 módulos × 4 permisos CRUD). Solo ve los proyectos a los que está asignado. |
| **Cliente** | Solo portal de cliente: dashboard, proyectos asignados, comentarios, descarga de archivos compartidos. |

### Módulos con permisos granulares (colaborador)
`projects` · `tasks` · `documents` · `attachments` · `payments` · `quotes` · `services` · `clients` · `comments` · `reports`

---

## 🧪 Testing

```bash
npm run test          # modo watch
npm run test:run      # corrida única
npm run test:ui       # interfaz gráfica
npm run test:coverage # con cobertura
```

54 tests cubriendo:
- Cálculos de cotizaciones (impuestos, descuentos, totales)
- Hooks de filtros y selección masiva de proyectos
- Componentes del editor de cotizaciones (items table, taxes, totals display)
- Componentes de lista de proyectos (ProjectCard)

---

## ⚙️ Instalación

```bash
git clone <repo-url>
cd myspacefreelance
npm install
```

Crea un archivo `.env.local` en la raíz:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

```bash
npm run dev
```

---

## 📜 Scripts disponibles

```bash
npm run dev            # Servidor de desarrollo (Vite)
npm run build          # Build de producción (tsc + vite build)
npm run preview        # Preview del build
npm run lint           # ESLint
npm run test           # Vitest en modo watch
npm run test:run       # Vitest corrida única
npm run test:ui        # Vitest con UI gráfica
npm run test:coverage  # Vitest con reporte de cobertura
```

---

## ☁️ Deploy en Vercel

El proyecto incluye [`vercel.json`](./vercel.json) listo para deploy:

1. Conecta el repo en [vercel.com](https://vercel.com).
2. Vercel detecta automáticamente Vite (build: `npm run build`, output: `dist`).
3. Configura las env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) en Project Settings.
4. En Supabase Dashboard → Authentication → URL Configuration, añade la URL de Vercel a **Site URL** y **Redirect URLs** (con `/**`).

El `vercel.json` ya incluye:
- SPA rewrites (todas las rutas → `index.html` para que React Router funcione).
- Headers de seguridad (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` que bloquea cámara/mic/GPS).

---

## 🗄️ Esquema de base de datos (resumen)

Tablas principales en Supabase:

- `profiles` — usuarios (freelancer / cliente / colaborador)
- `projects` — proyectos con presupuesto, fechas, estado, progreso, tags
- `tasks` — tareas con estado y orden (para Kanban)
- `documents` — documentación markdown por proyecto
- `attachments` — archivos en Supabase Storage
- `payments` — pagos recibidos por proyecto
- `comments` — comentarios bidireccionales (freelancer / cliente)
- `quotes` + `quote_items` — cotizaciones con items
- `services` — catálogo del freelancer
- `project_clients` — relación N:M proyecto → cliente
- `collaborators` — vínculo freelancer ↔ colaborador
- `collaborator_permissions` — permisos por módulo
- `collaborator_projects` — proyectos asignados a cada colaborador
- `notifications` — generadas por triggers de DB

Todas las tablas tienen políticas RLS configuradas. La cascada `ON DELETE` está pensada para que borrar un proyecto limpie automáticamente sus tareas/pagos/documentos/comentarios.

---

## 🧭 Roadmap (futuras mejoras)

- [ ] Tests E2E con Playwright
- [ ] Error monitoring con Sentry
- [ ] GitHub Actions (CI: lint + tests + build en cada PR)
- [ ] PWA con manifest + service worker
- [ ] Internacionalización (i18n) — actualmente solo español
- [ ] Tema personalizable por freelancer (colores de marca)

---

## 📄 Licencia

Proyecto privado. Todos los derechos reservados.

---

**Desarrollado por** [@S4nti4goCoder](https://github.com/S4nti4goCoder)
