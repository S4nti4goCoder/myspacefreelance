import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { lazy, Suspense, type ReactNode } from "react";
import { useAuthStore } from "@/store/authStore";
import { useMyPermissions, useCanAccess } from "@/hooks/useMyPermissions";
import Layout from "@/components/shared/Layout";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import type { CollaboratorModule } from "@/types";

const LoginPage = lazy(() => import("@/pages/LoginPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const ProjectsPage = lazy(() => import("@/pages/ProjectsPage"));
const ProjectDetailPage = lazy(() => import("@/pages/ProjectDetailPage"));
const ClientAccountsPage = lazy(() => import("@/pages/ClientAccountsPage"));
const ClientDashboardPage = lazy(
  () => import("@/pages/client/ClientDashboardPage"),
);
const ClientProjectPage = lazy(
  () => import("@/pages/client/ClientProjectPage"),
);
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
const ServicesPage = lazy(() => import("@/pages/ServicesPage"));
const QuotesPage = lazy(() => import("@/pages/QuotesPage"));
const QuoteEditorPage = lazy(() => import("@/pages/QuoteEditorPage"));
const QuoteViewPage = lazy(() => import("@/pages/QuoteViewPage"));
const CollaboratorsPage = lazy(() => import("@/pages/CollaboratorsPage"));
const PrivacyPolicyPage = lazy(() => import("@/pages/PrivacyPolicyPage"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    </div>
  );
}

function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <ErrorBoundary resetKeys={[location.pathname]}>{children}</ErrorBoundary>
  );
}

// Panel principal — freelancer y colaborador
function ProtectedPanelRoute({ children }: { children: ReactNode }) {
  const { user, profile, isLoading } = useAuthStore();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role === "client")
    return <Navigate to="/cliente/dashboard" replace />;
  return <>{children}</>;
}

// Solo freelancer — bloquea colaboradores y clientes
function FreelancerOnlyRoute({ children }: { children: ReactNode }) {
  const { user, profile, isLoading } = useAuthStore();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role === "client")
    return <Navigate to="/cliente/dashboard" replace />;
  if (profile?.role === "collaborator") return <Navigate to="/" replace />;
  return <>{children}</>;
}

// Solo clientes
function ProtectedClientRoute({ children }: { children: ReactNode }) {
  const { user, profile, isLoading } = useAuthStore();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role === "freelancer") return <Navigate to="/" replace />;
  if (profile?.role === "collaborator") return <Navigate to="/" replace />;
  return <>{children}</>;
}

// Guard de módulo para colaboradores — bloquea acceso por URL si no tiene can_view
function ModuleGuardRoute({
  module,
  children,
}: {
  module: CollaboratorModule;
  children: ReactNode;
}) {
  const { profile } = useAuthStore();
  const { isLoading: permissionsLoading } = useMyPermissions();
  const canView = useCanAccess(module, "can_view");

  // Freelancer siempre tiene acceso
  if (profile?.role === "freelancer") return <>{children}</>;

  // Colaborador: esperar a que carguen los permisos
  if (profile?.role === "collaborator" && permissionsLoading) {
    return <LoadingScreen />;
  }

  if (!canView) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/privacidad" element={<PrivacyPolicyPage />} />
        <Route path="/terminos" element={<TermsPage />} />

        {/* Panel principal — freelancer y colaborador */}
        <Route
          path="/*"
          element={
            <ProtectedPanelRoute>
              <Layout>
                <RouteErrorBoundary>
                  <Routes>
                    {/* Libre para freelancer y colaborador */}
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/perfil" element={<ProfilePage />} />

                    {/* Módulos con permisos por colaborador */}
                    <Route
                      path="/proyectos"
                      element={
                        <ModuleGuardRoute module="projects">
                          <ProjectsPage />
                        </ModuleGuardRoute>
                      }
                    />
                    <Route
                      path="/proyectos/:id"
                      element={
                        <ModuleGuardRoute module="projects">
                          <ProjectDetailPage />
                        </ModuleGuardRoute>
                      }
                    />
                    <Route
                      path="/reportes"
                      element={
                        <ModuleGuardRoute module="reports">
                          <ReportsPage />
                        </ModuleGuardRoute>
                      }
                    />
                    <Route
                      path="/servicios"
                      element={
                        <ModuleGuardRoute module="services">
                          <ServicesPage />
                        </ModuleGuardRoute>
                      }
                    />
                    <Route
                      path="/cotizaciones"
                      element={
                        <ModuleGuardRoute module="quotes">
                          <QuotesPage />
                        </ModuleGuardRoute>
                      }
                    />
                    <Route
                      path="/cotizaciones/nueva"
                      element={
                        <ModuleGuardRoute module="quotes">
                          <QuoteEditorPage />
                        </ModuleGuardRoute>
                      }
                    />
                    <Route
                      path="/cotizaciones/:id/editar"
                      element={
                        <ModuleGuardRoute module="quotes">
                          <QuoteEditorPage />
                        </ModuleGuardRoute>
                      }
                    />
                    <Route
                      path="/cotizaciones/:id"
                      element={
                        <ModuleGuardRoute module="quotes">
                          <QuoteViewPage />
                        </ModuleGuardRoute>
                      }
                    />
                    <Route
                      path="/cuentas-clientes"
                      element={
                        <ModuleGuardRoute module="clients">
                          <ClientAccountsPage />
                        </ModuleGuardRoute>
                      }
                    />

                    {/* Exclusivo del freelancer */}
                    <Route
                      path="/colaboradores"
                      element={
                        <FreelancerOnlyRoute>
                          <CollaboratorsPage />
                        </FreelancerOnlyRoute>
                      }
                    />

                    {/* Fallback: redirigir al dashboard */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </RouteErrorBoundary>
              </Layout>
            </ProtectedPanelRoute>
          }
        />

        {/* Panel del cliente */}
        <Route
          path="/cliente/*"
          element={
            <ProtectedClientRoute>
              <RouteErrorBoundary>
                <Routes>
                  <Route path="dashboard" element={<ClientDashboardPage />} />
                  <Route path="proyecto/:id" element={<ClientProjectPage />} />
                  <Route
                    path="*"
                    element={<Navigate to="/cliente/dashboard" replace />}
                  />
                </Routes>
              </RouteErrorBoundary>
            </ProtectedClientRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}
