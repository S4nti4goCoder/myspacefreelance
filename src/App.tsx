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

function ProtectedFreelancerRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role === "client")
    return <Navigate to="/cliente/dashboard" replace />;
  return <>{children}</>;
}

function ProtectedClientRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role === "freelancer") return <Navigate to="/" replace />;
  return <>{children}</>;
}

async function loadProfile(userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}

export default function App() {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
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

      useAuthStore.getState().setIsLoading(false);
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

      if (event === "SIGNED_IN" && session?.user) {
        useAuthStore.getState().setUser(session.user);
        const profile = await loadProfile(session.user.id);
        useAuthStore.getState().setProfile(profile);
        useAuthStore.getState().setIsLoading(false);
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
          <ProtectedFreelancerRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/proyectos" element={<ProjectsPage />} />
                <Route path="/proyectos/:id" element={<ProjectDetailPage />} />
                <Route
                  path="/cuentas-clientes"
                  element={<ClientAccountsPage />}
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedFreelancerRoute>
        }
      />

      <Route
        path="/cliente/*"
        element={
          <ProtectedClientRoute>
            <div className="p-8 text-foreground">
              Dashboard Cliente — próximo paso
            </div>
          </ProtectedClientRoute>
        }
      />
    </Routes>
  );
}
