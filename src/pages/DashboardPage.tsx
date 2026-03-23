import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  FolderKanban,
  Users,
  CheckSquare,
  DollarSign,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Project } from "@/types";

const statusLabels: Record<string, string> = {
  todo: "Pendiente",
  progress: "En progreso",
  review: "En revisión",
  done: "Completado",
  cancelled: "Cancelado",
};

const statusColors: Record<string, string> = {
  todo: "secondary",
  progress: "default",
  review: "outline",
  done: "default",
  cancelled: "destructive",
};

async function fetchDashboardData() {
  const [projectsRes, clientsRes, tasksRes] = await Promise.all([
    supabase
      .from("projects")
      .select("*, client:profiles(id, name)")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id").eq("role", "client"),
    supabase.from("tasks").select("id, status"),
  ]);

  return {
    projects: (projectsRes.data ?? []) as (Project & {
      client: { id: string; name: string } | null;
    })[],
    clientCount: clientsRes.data?.length ?? 0,
    tasks: tasksRes.data ?? [],
  };
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
  });

  const activeProjects =
    data?.projects.filter((p) => p.status === "progress").length ?? 0;
  const completedTasks =
    data?.tasks.filter((t) => t.status === "done").length ?? 0;
  const totalTasks = data?.tasks.length ?? 0;

  const upcomingProjects =
    data?.projects
      .filter(
        (p) => p.due_date && p.status !== "done" && p.status !== "cancelled",
      )
      .sort(
        (a, b) =>
          new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime(),
      )
      .slice(0, 5) ?? [];

  const metrics = [
    {
      label: "Proyectos activos",
      value: activeProjects,
      icon: FolderKanban,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Clientes",
      value: data?.clientCount ?? 0,
      icon: Users,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      label: "Tareas completadas",
      value: `${completedTasks}/${totalTasks}`,
      icon: CheckSquare,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Total proyectos",
      value: data?.projects.length ?? 0,
      icon: TrendingUp,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Resumen de tu actividad freelance
        </p>
      </motion.div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.07 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground font-medium">
                    {metric.label}
                  </p>
                  <div className={`p-2 rounded-lg ${metric.bg}`}>
                    <metric.icon className={`h-4 w-4 ${metric.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {metric.value}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming deadlines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Próximos vencimientos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay proyectos con fechas próximas
                </p>
              ) : (
                upcomingProjects.map((project) => {
                  const daysLeft = Math.ceil(
                    (new Date(project.due_date!).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24),
                  );
                  const isUrgent = daysLeft <= 3;
                  const isWarning = daysLeft <= 7;

                  return (
                    <Link key={project.id} to={`/proyectos/${project.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {project.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {project.client?.name ?? "Sin cliente"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <span
                            className={`text-xs font-medium ${
                              isUrgent
                                ? "text-destructive"
                                : isWarning
                                  ? "text-orange-500"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {daysLeft < 0
                              ? "Vencido"
                              : daysLeft === 0
                                ? "Hoy"
                                : `${daysLeft}d`}
                          </span>
                          <Badge
                            variant={
                              statusColors[project.status] as
                                | "default"
                                | "secondary"
                                | "outline"
                                | "destructive"
                            }
                          >
                            {statusLabels[project.status]}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Proyectos recientes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data?.projects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay proyectos aún
                </p>
              ) : (
                data?.projects.slice(0, 5).map((project) => (
                  <Link key={project.id} to={`/proyectos/${project.id}`}>
                    <div className="p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground truncate">
                          {project.name}
                        </p>
                        <Badge
                          variant={
                            statusColors[project.status] as
                              | "default"
                              | "secondary"
                              | "outline"
                              | "destructive"
                          }
                        >
                          {statusLabels[project.status]}
                        </Badge>
                      </div>
                      <Progress value={project.progress} className="h-1.5" />
                      <p className="text-xs text-muted-foreground">
                        {project.progress}% completado
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
