import { usePageTitle } from "@/hooks/usePageTitle";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  FolderKanban,
  BarChart3,
  Download,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCOP, formatCOPShort, downloadCSV } from "@/lib/utils";
import type { Payment } from "@/types";

interface ProjectClient {
  id: string;
  name: string;
}

interface ProjectWithPayments {
  id: string;
  name: string;
  status: string;
  budget: number | null;
  progress: number;
  client?: ProjectClient | null;
  payments: Payment[];
}

async function fetchReportsData() {
  const [projectsRes, paymentsRes] = await Promise.all([
    supabase
      .from("projects")
      .select(
        `*,
        project_clients!left(
          client:profiles(id, name)
        )`,
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("payments")
      .select("*")
      .order("payment_date", { ascending: true }),
  ]);

  const rawProjects = projectsRes.data ?? [];
  const payments = (paymentsRes.data ?? []) as Payment[];

  const projects: ProjectWithPayments[] = rawProjects.map((row) => {
    const clientRow = (
      row.project_clients as { client: ProjectClient | null }[] | null
    )?.[0];
    const { project_clients: _pc, ...rest } = row;
    return {
      ...rest,
      client: clientRow?.client ?? null,
      payments: payments.filter((pay) => pay.project_id === rest.id),
    };
  });

  const paymentsByMonth: Record<string, number> = {};
  payments.forEach((payment) => {
    const date = new Date(payment.payment_date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    paymentsByMonth[key] = (paymentsByMonth[key] ?? 0) + payment.amount;
  });

  const monthlyData = Object.entries(paymentsByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, amount]) => {
      const [year, month] = key.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return {
        month: date.toLocaleDateString("es-CO", {
          month: "short",
          year: "2-digit",
        }),
        amount,
      };
    });

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget ?? 0), 0);

  return {
    projects,
    monthlyData,
    totalCollected,
    totalBudget,
  };
}

import {
  PROJECT_STATUS_LABELS as statusLabels,
  PROJECT_STATUS_VARIANTS as statusVariants,
} from "@/lib/constants";

export default function ReportsPage() {
  usePageTitle("Reportes");
  const { data, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: fetchReportsData,
  });

  const {
    projects = [],
    monthlyData = [],
    totalCollected = 0,
    totalBudget = 0,
  } = data ?? {};

  const { collectedPercent, projectsWithBudget } = useMemo(
    () => ({
      collectedPercent:
        totalBudget > 0
          ? Math.round((totalCollected / totalBudget) * 100)
          : 0,
      projectsWithBudget: projects.filter((p) => p.budget && p.budget > 0),
    }),
    [projects, totalCollected, totalBudget],
  );

  const handleExportProjects = () => {
    const headers = ["Proyecto", "Cliente", "Estado", "Presupuesto", "Cobrado", "Pendiente", "% Cobrado"];
    const rows = projectsWithBudget.map((p) => {
      const collected = p.payments.reduce((sum, pay) => sum + pay.amount, 0);
      const pending = Math.max(0, (p.budget ?? 0) - collected);
      const percent = p.budget && p.budget > 0 ? Math.round((collected / p.budget) * 100) : 0;
      return [
        p.name,
        p.client?.name ?? "",
        statusLabels[p.status] ?? p.status,
        String(p.budget ?? 0),
        String(collected),
        String(pending),
        `${percent}%`,
      ];
    });
    downloadCSV("reporte-proyectos.csv", headers, rows);
  };

  const handleExportPayments = () => {
    const allPayments = projects.flatMap((p) =>
      p.payments.map((pay) => ({
        proyecto: p.name,
        cliente: p.client?.name ?? "",
        monto: pay.amount,
        fecha: pay.payment_date,
        metodo: pay.method ?? "",
        notas: pay.notes ?? "",
      })),
    );
    allPayments.sort((a, b) => a.fecha.localeCompare(b.fecha));
    const headers = ["Fecha", "Proyecto", "Cliente", "Monto", "Método", "Notas"];
    const rows = allPayments.map((p) => [
      p.fecha,
      p.proyecto,
      p.cliente,
      String(p.monto),
      p.metodo,
      p.notas,
    ]);
    downloadCSV("reporte-pagos.csv", headers, rows);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="h-72 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Resumen financiero de tus proyectos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportProjects}
            disabled={projectsWithBudget.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar proyectos
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPayments}
            disabled={projects.flatMap((p) => p.payments).length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar pagos
          </Button>
        </div>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground font-medium">
                  Total cobrado
                </p>
                <div className="p-2 rounded-lg bg-green-500/10">
                  <DollarSign className="h-4 w-4 text-green-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {formatCOP(totalCollected)}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground font-medium">
                  Total presupuestado
                </p>
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {formatCOP(totalBudget)}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground font-medium">
                  Cobrado vs presupuestado
                </p>
                <div className="p-2 rounded-lg bg-violet-500/10">
                  <BarChart3 className="h-4 w-4 text-violet-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {collectedPercent}%
              </p>
              <Progress value={collectedPercent} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Monthly chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Pagos por mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                <BarChart3 className="h-8 w-8" />
                <p className="text-sm font-medium">No hay pagos registrados</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={monthlyData}
                  margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    className="fill-muted-foreground"
                  />
                  <YAxis
                    tickFormatter={formatCOPShort}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    className="fill-muted-foreground"
                    width={60}
                  />
                  <Tooltip
                    formatter={(value: unknown) => [
                      formatCOP(value as number),
                      "Cobrado",
                    ]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar
                    dataKey="amount"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Projects breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
              Desglose por proyecto
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projectsWithBudget.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                <FolderKanban className="h-8 w-8" />
                <p className="text-sm font-medium">
                  No hay proyectos con presupuesto asignado
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b border-border">
                  <div className="col-span-4">Proyecto</div>
                  <div className="col-span-2 text-right">Presupuesto</div>
                  <div className="col-span-2 text-right">Cobrado</div>
                  <div className="col-span-2 text-right">Pendiente</div>
                  <div className="col-span-2 text-right">Estado</div>
                </div>
                {projectsWithBudget.map((project, i) => {
                  const collected = project.payments.reduce(
                    (sum, p) => sum + p.amount,
                    0,
                  );
                  const pending = (project.budget ?? 0) - collected;
                  const percent =
                    project.budget && project.budget > 0
                      ? Math.round((collected / project.budget) * 100)
                      : 0;

                  return (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="space-y-2"
                    >
                      <div className="grid grid-cols-12 gap-2 items-center text-sm">
                        <div className="col-span-4 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {project.name}
                          </p>
                          {project.client && (
                            <p className="text-xs text-muted-foreground truncate">
                              {project.client.name}
                            </p>
                          )}
                        </div>
                        <div className="col-span-2 text-right text-muted-foreground text-xs">
                          {formatCOP(project.budget ?? 0)}
                        </div>
                        <div className="col-span-2 text-right text-green-500 font-medium text-xs">
                          {formatCOP(collected)}
                        </div>
                        <div
                          className={`col-span-2 text-right text-xs font-medium ${pending > 0 ? "text-orange-500" : "text-muted-foreground"}`}
                        >
                          {formatCOP(Math.max(0, pending))}
                        </div>
                        <div className="col-span-2 text-right">
                          <Badge
                            variant={statusVariants[project.status]}
                            className="text-xs"
                          >
                            {statusLabels[project.status]}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <Progress value={percent} className="h-1.5" />
                        <p className="text-xs text-muted-foreground text-right">
                          {percent}% cobrado
                        </p>
                      </div>
                      {i < projectsWithBudget.length - 1 && (
                        <div className="border-b border-border/50 pt-1" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
