import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { AppRouter } from "@/routes/AppRouter";

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
        const { isLoggingOut, user } = useAuthStore.getState();
        const wasSessionExpired = !isLoggingOut && !!user;
        useAuthStore.getState().setUser(null);
        useAuthStore.getState().setProfile(null);
        useAuthStore.getState().setIsLoading(false);
        useAuthStore.getState().setIsLoggingOut(false);
        if (wasSessionExpired) {
          toast.error("Tu sesión ha expirado. Inicia sesión de nuevo.");
        }
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

  return <AppRouter />;
}
