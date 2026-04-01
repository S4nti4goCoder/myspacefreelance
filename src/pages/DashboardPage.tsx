import { usePageTitle } from "@/hooks/usePageTitle";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  FolderKanban,
  CheckSquare,
  DollarSign,
  Clock,
  FileText,
  CreditCard,
  MessageSquare,
  CircleCheck,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatCOP } from "@/lib/utils";
import type { Project } from "@/types";
import GlobalSearch from "@/components/shared/GlobalSearch";
import {
  PROJECT_STATUS_LABELS as statusLabels,
  PROJECT_STATUS_VARIANTS as statusVariants,
} from "@/lib/constants";

async function fetchDashboardData() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [projectsRes, clientsRes, tasksRes, paymentsMonthRes, paymentsAllRes, quotesRes, recentCommentsRes] =
    await Promise.all([
      supabase
        .from("projects")
        .select(
          `id, name, status, progress, due_date, created_at,
          project_clients!left(
            client:profiles(id, name)
          )`,
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "client"),
      supabase.from("tasks").select("id, status"),
      supabase
        .from("payments")
        .select("amount")
        .gte("payment_date", monthStart.split("T")[0]),
      supabase
        .from("payments")
        .select("amount, payment_date, project_id")
        .order("payment_date", { ascending: false })
        .limit(5),
      supabase
        .from("quotes")
        .select("id, status, quote_number, client_name, created_at")
        .in("status", ["sent", "draft"])
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("comments")
        .select("id, message, author, created_at, project_id, is_from_client")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const projects = (projectsRes.data ?? []).map((row) => {
    const clientRow = (
      row.project_clients as unknown as {
        client: { id: string; name: string } | null;
      }[]
    )?.[0];
    const client = clientRow?.client ?? null;
    const { project_clients: _pc, ...rest } = row;
    return { ...rest, client } as Project & {
      client: { id: string; name: string } | null;
    };
  });

  const monthlyIncome = (paymentsMonthRes.data ?? []).reduce(
    (sum, p) => sum + (p as { amount: number }).amount,
    0,
  );

  const pendingQuotes = (quotesRes.data ?? []).filter(
    (q) => (q as { status: string }).status === "sent",
  ).length;

  return {
    projects,
    clientCount: clientsRes.count ?? 0,
    tasks: tasksRes.data ?? [],
    monthlyIncome,
    pendingQuotes,
    recentQuotes: quotesRes.data ?? [],
    recentPayments: (paymentsAllRes.data ?? []) as {
      amount: number;
      payment_date: string;
      project_id: string;
    }[],
    recentComments: (recentCommentsRes.data ?? []) as {
      id: string;
      message: string;
      author: string;
      created_at: string;
      project_id: string;
      is_from_client: boolean;
    }[],
  };
}

const STATUS_CHART_COLORS: Record<string, string> = {
  todo: "#94a3b8",
  progress: "#3b82f6",
  review: "#f59e0b",
  done: "#22c55e",
  cancelled: "#ef4444",
};

const STATUS_CHART_LABELS: Record<string, string> = {
  todo: "Pendiente",
  progress: "En progreso",
  review: "En revisión",
  done: "Completado",
  cancelled: "Cancelado",
};

export default function DashboardPage() {
  usePageTitle("Dashboard");
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
  });

  const {
    activeProjects,
    completedTasks,
    totalTasks,
    upcomingProjects,
    statusDistribution,
  } = useMemo(() => {
    const projects = data?.projects ?? [];
    const tasks = data?.tasks ?? [];

    const nonArchived = projects.filter((p) => p.status !== "archived");
    const distribution: Record<string, number> = {};
    nonArchived.forEach((p) => {
      distribution[p.status] = (distribution[p.status] ?? 0) + 1;
    });

    return {
      activeProjects: projects.filter((p) => p.status === "progress").length,
      completedTasks: tasks.filter((t) => t.status === "done").length,
      totalTasks: tasks.length,
      upcomingProjects: projects
        .filter(
          (p) =>
            p.due_date && p.status !== "done" && p.status !== "cancelled" && p.status !== "archived",
        )
        .sort(
          (a, b) =>
            new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime(),
        )
        .slice(0, 5),
      statusDistribution: Object.entries(distribution).map(([status, count]) => ({
        name: STATUS_CHART_LABELS[status] ?? status,
        value: count,
        color: STATUS_CHART_COLORS[status] ?? "#94a3b8",
      })),
    };
  }, [data]);

  const recentActivity = useMemo(() => {
    if (!data) return [];

    const items: {
      id: string;
      icon: typeof DollarSign;
      iconColor: string;
      iconBg: string;
      title: string;
      description: string;
      date: string;
      link?: string;
    }[] = [];

    data.recentPayments.forEach((p) => {
      const project = data.projects.find((pr) => pr.id === p.project_id);
      items.push({
        id: `pay-${p.payment_date}-${p.amount}`,
        icon: CreditCard,
        iconColor: "text-green-500",
        iconBg: "bg-green-500/10",
        title: `Pago recibido: ${formatCOP(p.amount)}`,
        description: project?.name ?? "Proyecto",
        date: p.payment_date,
        link: project ? `/proyectos/${project.id}` : undefined,
      });
    });

    data.recentComments.forEach((c) => {
      items.push({
        id: `comment-${c.id}`,
        icon: MessageSquare,
        iconColor: "text-blue-500",
        iconBg: "bg-blue-500/10",
        title: c.is_from_client ? `${c.author} comentó` : "Comentaste",
        description: c.message.length > 60 ? c.message.slice(0, 60) + "..." : c.message,
        date: c.created_at,
        link: `/proyectos/${c.project_id}`,
      });
    });

    return items
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [data]);

  const metrics = useMemo(
    () => [
      {
        label: "Ingresos del mes",
        value: formatCOP(data?.monthlyIncome ?? 0),
        icon: DollarSign,
        color: "text-green-500",
        bg: "bg-green-500/10",
      },
      {
        label: "Proyectos activos",
        value: activeProjects,
        icon: FolderKanban,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
      },
      {
        label: "Cotizaciones pendientes",
        value: data?.pendingQuotes ?? 0,
        icon: FileText,
        color: "text-orange-500",
        bg: "bg-orange-500/10",
      },
      {
        label: "Tareas completadas",
        value: `${completedTasks}/${totalTasks}`,
        icon: CheckSquare,
        color: "text-violet-500",
        bg: "bg-violet-500/10",
      },
    ],
    [activeProjects, completedTasks, totalTasks, data],
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-muted animate-pulse rounded-xl" />
          <div className="h-72 bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
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

      <GlobalSearch />

      {/* Metric cards */}
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

      {/* Charts + upcoming row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project status distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
                Proyectos por estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statusDistribution.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                  <FolderKanban className="h-8 w-8" />
                  <p className="text-sm font-medium">No hay proyectos aún</p>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={180}>
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(value: unknown) => [`${value} proyecto(s)`, ""]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 flex-1">
                    {statusDistribution.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {item.name}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-foreground">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming deadlines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
        >
          <Card className="h-full">
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
                          <Badge variant={statusVariants[project.status]}>
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
      </div>

      {/* Bottom row: recent activity + recent projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CircleCheck className="h-4 w-4 text-muted-foreground" />
                Actividad reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay actividad reciente
                </p>
              ) : (
                <div className="space-y-1">
                  {recentActivity.map((item) => {
                    const timeAgo = getTimeAgo(item.date);
                    const content = (
                      <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent transition-colors">
                        <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${item.iconBg}`}>
                          <item.icon className={`h-3.5 w-3.5 ${item.iconColor}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {item.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.description}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                          {timeAgo}
                        </span>
                      </div>
                    );

                    return item.link ? (
                      <Link key={item.id} to={item.link}>{content}</Link>
                    ) : (
                      <div key={item.id}>{content}</div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.45 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-muted-foreground" />
                  Proyectos recientes
                </CardTitle>
                <Link to="/proyectos">
                  <span className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                    Ver todos
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {data?.projects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay proyectos aún
                </p>
              ) : (
                data?.projects
                  .filter((p) => p.status !== "archived")
                  .slice(0, 5)
                  .map((project) => (
                    <Link key={project.id} to={`/proyectos/${project.id}`}>
                      <div className="p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground truncate">
                            {project.name}
                          </p>
                          <Badge variant={statusVariants[project.status]}>
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

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}sem`;
}
