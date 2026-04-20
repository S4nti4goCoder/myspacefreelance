import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FolderKanban,
  LogOut,
  Menu,
  X,
  Briefcase,
  UserCog,
  UserCircle,
  BarChart3,
  BookOpen,
  Users,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import ThemeToggle from "@/components/shared/ThemeToggle";
import NotificationCenter from "@/components/shared/NotificationCenter";
import { cn } from "@/lib/utils";
import { useMyPermissions } from "@/hooks/useMyPermissions";
import type { CollaboratorModule } from "@/types";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  end: boolean;
  module?: CollaboratorModule;
}

const navItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  {
    to: "/proyectos",
    label: "Proyectos",
    icon: FolderKanban,
    end: false,
    module: "projects",
  },
  {
    to: "/cuentas-clientes",
    label: "Clientes",
    icon: UserCog,
    end: false,
    module: "clients",
  },
  {
    to: "/reportes",
    label: "Reportes",
    icon: BarChart3,
    end: false,
    module: "reports",
  },
  {
    to: "/servicios",
    label: "Mis servicios",
    icon: BookOpen,
    end: false,
    module: "services",
  },
  {
    to: "/cotizaciones",
    label: "Cotizaciones",
    icon: FileText,
    end: false,
    module: "quotes",
  },
  {
    to: "/colaboradores",
    label: "Colaboradores",
    icon: Users,
    end: false,
  },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    useAuthStore.getState().setIsLoggingOut(true);
    await supabase.auth.signOut();
    setUser(null);
    toast.success("Sesión cerrada");
    navigate("/login");
  };

  return (
    <div className="h-screen overflow-hidden bg-background flex">
      <aside className="hidden md:flex flex-col w-60 border-r border-border bg-card overflow-y-auto">
        <SidebarContent onLogout={handleLogout} />
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-60 flex flex-col bg-card border-r border-border md:hidden"
            >
              <SidebarContent
                onLogout={handleLogout}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-lg p-1.5">
              <Briefcase className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">
              MySpaceFreelance
            </span>
          </div>
          <div className="flex items-center gap-1">
            <NotificationCenter collapsed />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

interface SidebarContentProps {
  onLogout: () => void;
  onClose?: () => void;
}

function SidebarContent({ onLogout, onClose }: SidebarContentProps) {
  const { profile } = useAuthStore();
  const { data: permissions, isLoading: permissionsLoading } =
    useMyPermissions();
  const isFreelancer = profile?.role === "freelancer";
  const isCollaborator = profile?.role === "collaborator";

  const visibleNavItems = navItems.filter((item) => {
    // Dashboard siempre visible
    if (item.to === "/" && !item.module) return true;

    // Colaboradores solo para freelancer
    if (item.to === "/colaboradores") return isFreelancer;

    // Freelancer ve todo
    if (isFreelancer) return true;

    // Colaborador: esperar a que carguen los permisos
    if (isCollaborator && permissionsLoading) return false;

    // Colaborador: solo mostrar si tiene can_view en ese módulo
    if (isCollaborator && item.module) {
      return permissions?.[item.module]?.can_view === true;
    }

    return false;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <div className="bg-primary rounded-lg p-1.5">
            <Briefcase className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">
            MySpaceFreelance
          </span>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar menú">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Separator />

      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <Separator />

      <div className="px-3 py-4 space-y-1">
        <NavLink
          to="/perfil"
          onClick={onClose}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )
          }
        >
          <UserCircle className="h-4 w-4 shrink-0" />
          <span className="truncate">{profile?.name ?? "Mi perfil"}</span>
        </NavLink>

        {isCollaborator && (
          <div className="px-3 py-1">
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              Colaborador
            </span>
          </div>
        )}

        <NotificationCenter />

        <ThemeToggle showLabel />

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          size="sm"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm">Cerrar sesión</span>
        </Button>
      </div>

      <div className="px-4 py-3 text-center">
        <p className="text-[11px] text-muted-foreground/60">
          Desarrollado por{" "}
          <a
            href="https://github.com/S4nti4goCoder"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-muted-foreground transition-colors"
          >
            @S4nti4goCoder
          </a>{" "}
          ❤️
        </p>
      </div>
    </div>
  );
}
