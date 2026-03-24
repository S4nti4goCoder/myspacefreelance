# MySpaceFreelance

Herramienta de gestión de proyectos para freelancers con portal de clientes.

## Stack

- **Frontend:** Vite + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui
- **Estado:** Zustand + TanStack Query v5
- **Backend:** Supabase (Auth, RLS, Storage, Realtime)
- **Extras:** Framer Motion, @hello-pangea/dnd, react-markdown

## Instalación

```bash
npm install
npm run dev
```

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

## Funcionalidades

- Gestión de proyectos con Kanban, documentos, archivos y pagos
- Chat en tiempo real entre freelancer y cliente
- Portal del cliente con vista de solo lectura
- Sistema de cuentas de clientes con cambio de contraseña obligatorio
- Búsqueda global con atajo `Ctrl+K`
- Tema claro/oscuro/sistema
