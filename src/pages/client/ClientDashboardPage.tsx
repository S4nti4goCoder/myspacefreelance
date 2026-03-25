import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FolderKanban,
  CheckSquare,
  Clock,
  ChevronRight,
  LogOut,
  Briefcase,
  KeyRound,
  Eye,
  EyeOff,
  Calendar,
  Tag,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import ThemeToggle from "@/components/shared/ThemeToggle";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/lib/utils";
import type { Project, Task } from "@/types";

const statusLabels: Record<string, string> = {
  todo: "Pendiente",
  progress: "En progreso",
  review: "En revisión",
  done: "Completado",
  cancelled: "Cancelado",
};

type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

const statusVariants: Record<string, BadgeVariant> = {
  todo: "secondary",
  progress: "default",
  review: "outline",
  done: "default",
  cancelled: "destructive",
};

const statusColors: Record<string, string> = {
  todo: "text-muted-foreground",
  progress: "text-blue-500",
  review: "text-orange-500",
  done: "text-green-500",
  cancelled: "text-destructive",
};

interface ProjectWithTasks extends Project {
  tasks: Task[];
}

async function fetchClientProjectsWithTasks(
  clientId: string,
): Promise<ProjectWithTasks[]> {
  const { data, error } = await supabase
    .from("project_clients")
    .select("project_id")
    .eq("client_id", clientId);

  if (error || !data || data.length === 0) return [];

  const projectIds = data.map((d: { project_id: string }) => d.project_id);

  const { data: projectsData } = await supabase
    .from("projects")
    .select("*")
    .in("id", projectIds)
    .order("created_at", { ascending: false });

  if (!projectsData || projectsData.length === 0) return [];

  const { data: tasksData } = await supabase
    .from("tasks")
    .select("*")
    .in("project_id", projectIds);

  return projectsData.map((project) => ({
    ...project,
    tasks: (tasksData ?? []).filter((t: Task) => t.project_id === project.id),
  }));
}

export default function ClientDashboardPage() {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectWithTasks[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    if (profile && profile.role === "client" && !profile.password_changed) {
      setIsPasswordOpen(true);
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    async function loadProjects() {
      setIsLoading(true);
      const data = await fetchClientProjectsWithTasks(user!.id);
      setProjects(data);
      setIsLoading(false);
    }
    loadProjects();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`client-projects:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "project_clients",
          filter: `client_id=eq.${user.id}`,
        },
        async () => {
          const data = await fetchClientProjectsWithTasks(user.id);
          setProjects(data);
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "project_clients" },
        async () => {
          const data = await fetchClientProjectsWithTasks(user.id);
          setProjects(data);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    useAuthStore.getState().setUser(null);
    useAuthStore.getState().setProfile(null);
    toast.success("Sesión cerrada");
    navigate("/login");
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setIsChangingPassword(true);
    const { error } = await supabase.auth.updateUser({
      password: passwordForm.newPassword,
    });
    if (error) {
      toast.error("Error al cambiar la contraseña");
      setIsChangingPassword(false);
      return;
    }
    await supabase
      .from("profiles")
      .update({ password_changed: true })
      .eq("id", user!.id);
    useAuthStore.getState().setProfile({ ...profile!, password_changed: true });
    toast.success("Contraseña actualizada exitosamente");
    setIsPasswordOpen(false);
    setPasswordForm({ newPassword: "", confirmPassword: "" });
    setIsChangingPassword(false);
  };

  const activeProjects = projects.filter((p) => p.status === "progress").length;
  const completedProjects = projects.filter((p) => p.status === "done").length;
  const isPasswordRequired =
    profile?.role === "client" && !profile?.password_changed;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary rounded-lg p-1.5">
              <Briefcase className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">MySpaceFreelance</p>
              <p className="text-xs text-muted-foreground">
                Bienvenido, {profile?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPasswordOpen(true)}
              className="gap-2"
            >
              <KeyRound className="h-4 w-4" />
              <span className="hidden sm:inline">Cambiar contraseña</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-foreground">Mis proyectos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Aquí puedes ver el avance de tus proyectos
          </p>
        </motion.div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-blue-500/10 rounded-lg p-2 shrink-0">
                <FolderKanban className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{projects.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-orange-500/10 rounded-lg p-2 shrink-0">
                <Clock className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">En progreso</p>
                <p className="text-xl font-bold">{activeProjects}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-green-500/10 rounded-lg p-2 shrink-0">
                <CheckSquare className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completados</p>
                <p className="text-xl font-bold">{completedProjects}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <div className="bg-muted rounded-full p-4">
              <FolderKanban className="h-8 w-8" />
            </div>
            <p className="font-medium">No tienes proyectos asignados aún</p>
            <p className="text-sm text-center max-w-xs">
              Cuando tu freelancer te asigne un proyecto aparecerá aquí
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project, i) => {
              const doneTasks = project.tasks.filter(
                (t) => t.status === "done",
              ).length;
              const totalTasks = project.tasks.length;
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to={`/cliente/proyecto/${project.id}`}>
                    <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground truncate">
                              {project.name}
                            </p>
                            {project.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {project.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant={statusVariants[project.status]}>
                              {statusLabels[project.status]}
                            </Badge>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                              Progreso general
                            </span>
                            <span
                              className={`font-medium ${statusColors[project.status]}`}
                            >
                              {project.progress}%
                            </span>
                          </div>
                          <Progress
                            value={project.progress}
                            className="h-1.5"
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {totalTasks > 0 && (
                            <div className="flex items-center gap-1">
                              <CheckSquare className="h-3 w-3" />
                              <span>
                                {doneTasks}/{totalTasks} tareas
                              </span>
                            </div>
                          )}
                          {project.due_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Entrega: {formatDate(project.due_date)}
                              </span>
                            </div>
                          )}
                          {project.tags && project.tags.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              <Tag className="h-3 w-3" />
                              {project.tags.slice(0, 2).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="text-xs h-4 px-1"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {project.tags.length > 2 && (
                                <span>+{project.tags.length - 2}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog
        open={isPasswordOpen}
        onOpenChange={(open) => {
          if (!isPasswordRequired) setIsPasswordOpen(open);
        }}
      >
        <DialogContent
          className={`max-w-sm ${isPasswordRequired ? "[&>button]:hidden" : ""}`}
          onInteractOutside={(e) => {
            if (isPasswordRequired) e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {isPasswordRequired
                ? "⚠️ Cambio de contraseña requerido"
                : "Cambiar contraseña"}
            </DialogTitle>
          </DialogHeader>
          {isPasswordRequired && (
            <p className="text-sm text-muted-foreground -mt-2">
              Por seguridad debes cambiar tu contraseña antes de continuar.
            </p>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nueva contraseña</Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({
                      ...p,
                      newPassword: e.target.value,
                    }))
                  }
                  className="pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((p) => !p)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirmar contraseña</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((p) => ({
                    ...p,
                    confirmPassword: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            {!isPasswordRequired && (
              <Button
                variant="outline"
                onClick={() => setIsPasswordOpen(false)}
                disabled={isChangingPassword}
              >
                Cancelar
              </Button>
            )}
            <Button
              onClick={handleChangePassword}
              disabled={
                !passwordForm.newPassword ||
                !passwordForm.confirmPassword ||
                isChangingPassword
              }
            >
              {isChangingPassword ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
