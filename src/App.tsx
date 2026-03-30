import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import Layout from "@/components/shared/Layout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ProjectsPage from "@/pages/ProjectsPage";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import ClientAccountsPage from "@/pages/ClientAccountsPage";
import ClientDashboardPage from "@/pages/client/ClientDashboardPage";
import ClientProjectPage from "@/pages/client/ClientProjectPage";
import ProfilePage from "@/pages/ProfilePage";
import ReportsPage from "@/pages/ReportsPage";
import ServicesPage from "@/pages/ServicesPage";
import QuotesPage from "@/pages/QuotesPage";
import QuoteEditorPage from "@/pages/QuoteEditorPage";
import QuoteViewPage from "@/pages/QuoteViewPage";
import CollaboratorsPage from "@/pages/CollaboratorsPage";

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

// Freelancer y colaborador entran al panel principal
function ProtectedPanelRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuthStore();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role === "client")
    return <Navigate to="/cliente/dashboard" replace />;
  return <>{children}</>;
}

// Solo el freelancer puede acceder a ciertas rutas
function FreelancerOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuthStore();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role === "client")
    return <Navigate to="/cliente/dashboard" replace />;
  if (profile?.role === "collaborator") return <Navigate to="/" replace />;
  return <>{children}</>;
}

// Solo clientes
function ProtectedClientRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuthStore();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role === "freelancer") return <Navigate to="/" replace />;
  if (profile?.role === "collaborator") return <Navigate to="/" replace />;
  return <>{children}</>;
}

async function loadProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

export default function App() {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          useAuthStore.getState().setUser(session.user);
          const profile = await loadProfile(session.user.id);
          useAuthStore.getState().setProfile(profile);
        } else {
          useAuthStore.getState().setUser(null);
          useAuthStore.getState().setProfile(null);
        }
      } catch {
        useAuthStore.getState().setUser(null);
        useAuthStore.getState().setProfile(null);
      } finally {
        useAuthStore.getState().setIsLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        useAuthStore.getState().setUser(null);
        useAuthStore.getState().setProfile(null);
        useAuthStore.getState().setIsLoading(false);
        return;
      }

      if (
        (event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED" ||
          event === "INITIAL_SESSION") &&
        session?.user
      ) {
        try {
          useAuthStore.getState().setUser(session.user);
          const profile = await loadProfile(session.user.id);
          useAuthStore.getState().setProfile(profile);
        } catch {
          useAuthStore.getState().setUser(null);
          useAuthStore.getState().setProfile(null);
        } finally {
          useAuthStore.getState().setIsLoading(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/*"
        element={
          <ProtectedPanelRoute>
            <Layout>
              <Routes>
                {/* Rutas compartidas — freelancer y colaborador */}
                <Route path="/" element={<DashboardPage />} />
                <Route path="/proyectos" element={<ProjectsPage />} />
                <Route path="/proyectos/:id" element={<ProjectDetailPage />} />
                <Route path="/perfil" element={<ProfilePage />} />
                <Route path="/reportes" element={<ReportsPage />} />
                <Route path="/servicios" element={<ServicesPage />} />
                <Route path="/cotizaciones" element={<QuotesPage />} />
                <Route
                  path="/cotizaciones/nueva"
                  element={<QuoteEditorPage />}
                />
                <Route
                  path="/cotizaciones/:id/editar"
                  element={<QuoteEditorPage />}
                />
                <Route path="/cotizaciones/:id" element={<QuoteViewPage />} />

                {/* Cuentas — freelancer siempre, colaborador si tiene permiso */}
                <Route
                  path="/cuentas-clientes"
                  element={<ClientAccountsPage />}
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

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedPanelRoute>
        }
      />

      <Route
        path="/cliente/*"
        element={
          <ProtectedClientRoute>
            <Routes>
              <Route path="dashboard" element={<ClientDashboardPage />} />
              <Route path="proyecto/:id" element={<ClientProjectPage />} />
              <Route
                path="*"
                element={<Navigate to="/cliente/dashboard" replace />}
              />
            </Routes>
          </ProtectedClientRoute>
        }
      />
    </Routes>
  );
}
