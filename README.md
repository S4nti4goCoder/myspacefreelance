# MySpaceFreelance

Plataforma integral de gestion de proyectos disenada para freelancers. Permite administrar proyectos, clientes, cotizaciones, pagos, colaboradores y reportes desde un solo lugar, con portal dedicado para clientes.

## Stack tecnologico

| Capa | Tecnologias |
|------|------------|
| **Frontend** | React 19, TypeScript 5.9, Vite 8 |
| **Estilos** | Tailwind CSS v4, shadcn/ui (Radix UI) |
| **Estado del servidor** | TanStack Query v5 (cache, paginacion, mutations) |
| **Estado del cliente** | Zustand 5 (auth, tema) |
| **Backend** | Supabase (Auth, PostgreSQL, RLS, Storage, Realtime) |
| **Graficas** | Recharts 3 |
| **Drag & Drop** | @hello-pangea/dnd |
| **Documentos** | react-markdown, @uiw/react-md-editor |
| **PDF** | jsPDF |
| **Animaciones** | Framer Motion 12 |
| **Iconos** | Lucide React |
| **Notificaciones** | Sonner (toasts) |

## Instalacion

```bash
git clone <repo-url>
cd myspacefreelance
npm install
npm run dev
```

## Variables de entorno

Crea un archivo `.env` en la raiz del proyecto:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

## Modulos y funcionalidades

### Dashboard
- Resumen con tarjetas de estadisticas: proyectos activos, clientes, tareas pendientes, pagos totales
- Lista de proyectos recientes con acceso rapido

### Proyectos
- CRUD completo de proyectos con nombre, descripcion, presupuesto, fechas, tags y cliente asignado
- **6 estados**: Pendiente, En progreso, En revision, Completado, Cancelado, Archivado
- **Vista cuadricula** con tarjetas y filtros por estado, cliente, busqueda y ordenamiento
- **Vista calendario** con barras horizontales tipo Gantt mostrando duracion de cada proyecto
- **Tablero Kanban** de tareas con drag & drop (todo, en progreso, en revision, completado)
- **Documentos** con editor Markdown enriquecido por proyecto
- **Archivos adjuntos** con subida a Supabase Storage
- **Registro de pagos** por proyecto con metodo y notas
- **Comentarios** en tiempo real entre freelancer y cliente
- **Operaciones batch**: seleccion multiple para cambiar estado o archivar varios proyectos
- **Duplicar proyecto** con opcion de copiar tareas seleccionadas
- **Barra de progreso** automatica basada en tareas completadas

### Cotizaciones
- Creacion y edicion de cotizaciones con items, cantidades y precios unitarios
- Numeracion automatica secuencial (COT-001, COT-002...)
- **4 estados**: Borrador, Enviada, Aceptada, Rechazada (+ Archivada)
- Soporte completo de impuestos colombianos: IVA, Retefuente, ReteICA con tasas configurables
- Descuentos por porcentaje o monto fijo
- Terminos, condiciones y notas personalizables
- **Exportacion a PDF** profesional con datos del freelancer, cliente y desglose completo
- Crear proyecto directamente desde una cotizacion aceptada
- Valores por defecto de impuestos configurables desde el perfil

### Clientes
- Registro de cuentas de cliente con email, contrasena generada, telefono y notas
- Gestion de proyectos asignados por cliente
- Reset de contrasena desde el panel del freelancer
- **Busqueda** por nombre, email o telefono
- **Paginacion server-side**

### Portal del cliente
- Dashboard dedicado para clientes con sus proyectos asignados
- Vista de detalle de proyecto (solo lectura) con tareas, documentos, archivos y pagos
- Comentarios bidireccionales con el freelancer
- Cambio de contrasena obligatorio en primer inicio de sesion

### Servicios
- Catalogo de servicios con nombre, descripcion, precio base y categoria
- Agrupacion visual por categoria
- Busqueda y paginacion

### Colaboradores
- Invitacion de colaboradores por email
- **Permisos granulares** por modulo (10 modulos x 4 permisos CRUD)
- Asignacion de proyectos especificos por colaborador
- Los colaboradores solo ven los modulos y acciones que tienen permitidos

### Reportes
- **Total cobrado** vs **total presupuestado** con porcentaje
- **Grafica de barras** de pagos por mes
- **Desglose por proyecto** con presupuesto, cobrado, pendiente, estado y barra de progreso
- Paginacion en la tabla de desglose
- **Exportar a CSV**: reporte de proyectos y reporte de pagos (compatible con Excel)

### Notificaciones
- Centro de notificaciones en tiempo real via Supabase Realtime
- Notificaciones automaticas generadas por triggers de base de datos
- Tipos: comentarios, pagos, tareas, proyectos, cotizaciones, sistema
- Marcar como leida, marcar todas, eliminar individual o limpiar todas

### Busqueda global
- Busqueda rapida con atajo `Ctrl+K`
- Busca en proyectos, clientes, cotizaciones y servicios simultaneamente

### Tema
- Modo claro, oscuro y sistema
- Persistencia de preferencia del usuario

## Paginacion

Todos los listados principales (proyectos, cotizaciones, clientes, servicios) implementan **paginacion server-side** con:
- Consultas con `.range()` y `count: 'exact'` en Supabase
- Filtros y busqueda ejecutados en el servidor
- Transiciones suaves con `keepPreviousData` de TanStack Query
- Componente de paginacion reutilizable con navegacion por paginas
- 6 items por pagina por defecto

## Roles y permisos

| Rol | Acceso |
|-----|--------|
| **Freelancer** | Acceso completo a todos los modulos |
| **Colaborador** | Acceso limitado segun permisos configurados por el freelancer |
| **Cliente** | Solo portal de cliente: dashboard, proyectos asignados y comentarios |

## Estructura del proyecto

```
src/
  components/
    shared/       # Layout, KanbanBoard, ProjectCalendar, NotificationCenter, etc.
    ui/           # Componentes base shadcn/ui (button, card, dialog, pagination, etc.)
  hooks/          # Custom hooks con TanStack Query (useProjects, useQuotes, etc.)
  lib/            # Supabase client, utilidades, constantes
  pages/          # Paginas por modulo
    client/       # Paginas del portal de cliente
  store/          # Zustand stores (auth, tema)
  types/          # Tipos e interfaces TypeScript
```

## Scripts

```bash
npm run dev       # Servidor de desarrollo
npm run build     # Build de produccion
npm run preview   # Preview del build
npm run lint      # Lint con ESLint
```

