import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PROJECT_STATUS_LABELS as statusLabels,
  PROJECT_STATUS_VARIANTS as statusVariants,
} from "@/lib/constants";
import type { Project } from "@/types";

interface ProjectCalendarProps {
  projects: Project[];
}

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// Colores para distinguir proyectos
const BAR_COLORS = [
  { bg: "bg-blue-500/20", border: "border-blue-500/40", text: "text-blue-600 dark:text-blue-400" },
  { bg: "bg-green-500/20", border: "border-green-500/40", text: "text-green-600 dark:text-green-400" },
  { bg: "bg-purple-500/20", border: "border-purple-500/40", text: "text-purple-600 dark:text-purple-400" },
  { bg: "bg-orange-500/20", border: "border-orange-500/40", text: "text-orange-600 dark:text-orange-400" },
  { bg: "bg-teal-500/20", border: "border-teal-500/40", text: "text-teal-600 dark:text-teal-400" },
  { bg: "bg-pink-500/20", border: "border-pink-500/40", text: "text-pink-600 dark:text-pink-400" },
  { bg: "bg-amber-500/20", border: "border-amber-500/40", text: "text-amber-600 dark:text-amber-400" },
  { bg: "bg-indigo-500/20", border: "border-indigo-500/40", text: "text-indigo-600 dark:text-indigo-400" },
];

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

interface WeekProject {
  project: Project;
  startCol: number; // 0-6
  endCol: number;   // 0-6
  colorIdx: number;
  isStart: boolean;  // barr empieza en esta semana
  isEnd: boolean;    // barra termina en esta semana
}

export default function ProjectCalendar({ projects }: ProjectCalendarProps) {
  const navigate = useNavigate();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfWeek(currentYear, currentMonth);
  const todayKey = toDateKey(today);

  // Build weeks array: each week is an array of 7 cells (day number or null)
  const weeks = useMemo<(number | null)[][]>(() => {
    const result: (number | null)[][] = [];
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    for (let i = 0; i < cells.length; i += 7) {
      result.push(cells.slice(i, i + 7));
    }
    return result;
  }, [firstDay, daysInMonth]);

  // Assign color to each project (stable based on index)
  const projectColorMap = useMemo(() => {
    const map = new Map<string, number>();
    const withDates = projects.filter((p) => p.start_date || p.due_date);
    withDates.forEach((p, i) => map.set(p.id, i % BAR_COLORS.length));
    return map;
  }, [projects]);

  // For each week, find which projects overlap
  const weekProjects = useMemo(() => {
    return weeks.map((week) => {
      const weekDates: Date[] = week.map((day) =>
        day !== null
          ? new Date(currentYear, currentMonth, day)
          : null as unknown as Date,
      );

      const results: WeekProject[] = [];

      projects.forEach((p) => {
        if (!p.start_date && !p.due_date) return;

        const pStart = p.start_date
          ? new Date(p.start_date + "T00:00:00")
          : p.due_date
            ? new Date(p.due_date + "T00:00:00")
            : null;
        const pEnd = p.due_date
          ? new Date(p.due_date + "T00:00:00")
          : p.start_date
            ? new Date(p.start_date + "T00:00:00")
            : null;

        if (!pStart || !pEnd) return;

        // Find overlap with this week
        let startCol = -1;
        let endCol = -1;

        for (let col = 0; col < 7; col++) {
          if (!weekDates[col] || week[col] === null) continue;
          const cellDate = weekDates[col];
          const cellKey = toDateKey(cellDate);
          const startKey = toDateKey(pStart);
          const endKey = toDateKey(pEnd);

          if (cellKey >= startKey && cellKey <= endKey) {
            if (startCol === -1) startCol = col;
            endCol = col;
          }
        }

        if (startCol === -1) return;

        const isStart = week[startCol] !== null &&
          toDateKey(weekDates[startCol]) === toDateKey(pStart);
        const isEnd = week[endCol] !== null &&
          toDateKey(weekDates[endCol]) === toDateKey(pEnd);

        results.push({
          project: p,
          startCol,
          endCol,
          colorIdx: projectColorMap.get(p.id) ?? 0,
          isStart,
          isEnd,
        });
      });

      return results;
    });
  }, [weeks, projects, currentMonth, currentYear, projectColorMap]);

  return (
    <div className="space-y-4">
      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth} aria-label="Mes anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold text-foreground min-w-44 text-center">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h2>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth} aria-label="Mes siguiente">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday}>
          Hoy
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-t-lg overflow-hidden">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="bg-muted/50 text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="bg-border rounded-b-lg overflow-hidden -mt-4 space-y-px">
        {weeks.map((week, wi) => (
          <div key={wi} className="relative">
            {/* Day cells */}
            <div className="grid grid-cols-7 gap-px">
              {week.map((day, col) => {
                if (day === null) {
                  return <div key={`empty-${wi}-${col}`} className="bg-card min-h-28" />;
                }

                const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isToday = dateKey === todayKey;

                return (
                  <div
                    key={dateKey}
                    className={`bg-card min-h-28 p-1.5 ${
                      isToday ? "ring-2 ring-primary ring-inset" : ""
                    }`}
                  >
                    <span
                      className={`text-xs font-medium ${
                        isToday
                          ? "bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center"
                          : "text-muted-foreground"
                      }`}
                    >
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Project bars overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="grid grid-cols-7 h-full">
                {/* Invisible grid columns for positioning */}
                {week.map((_, col) => (
                  <div key={col} className="relative" />
                ))}
              </div>
              {weekProjects[wi]?.map((wp, pi) => {
                const color = BAR_COLORS[wp.colorIdx];
                const left = `${(wp.startCol / 7) * 100}%`;
                const width = `${((wp.endCol - wp.startCol + 1) / 7) * 100}%`;
                const top = `${24 + pi * 22}px`;

                return (
                  <div
                    key={`${wp.project.id}-${wi}`}
                    className={`absolute h-[18px] flex items-center pointer-events-auto cursor-pointer transition-all hover:brightness-110 border ${color.bg} ${color.border} ${
                      wp.isStart ? "rounded-l-md ml-1" : ""
                    } ${wp.isEnd ? "rounded-r-md mr-1" : ""}`}
                    style={{ left, width, top }}
                    title={`${wp.project.name} — ${statusLabels[wp.project.status]} (${wp.project.progress}%)`}
                    onClick={() => navigate(`/proyectos/${wp.project.id}`)}
                  >
                    {wp.isStart && (
                      <span className={`text-[10px] font-medium truncate px-1.5 ${color.text}`}>
                        {wp.project.name}
                      </span>
                    )}
                    {wp.isEnd && (
                      <span className={`text-[10px] font-medium px-1.5 ml-auto shrink-0 ${color.text}`}>
                        Entrega ✓
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming deadlines */}
      {projects.filter((p) => p.due_date && new Date(p.due_date) >= new Date(todayKey)).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Próximas entregas</h3>
          <div className="space-y-1.5">
            {projects
              .filter((p) => p.due_date && new Date(p.due_date) >= new Date(todayKey))
              .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
              .slice(0, 5)
              .map((project) => {
                const dueDate = new Date(project.due_date!);
                const diffDays = Math.ceil(
                  (dueDate.getTime() - today.getTime()) / 86400000,
                );
                const color = BAR_COLORS[projectColorMap.get(project.id) ?? 0];

                return (
                  <button
                    key={project.id}
                    onClick={() => navigate(`/proyectos/${project.id}`)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border border-border hover:bg-accent/50 transition-colors text-left"
                  >
                    <div className={`w-3 h-3 rounded-sm shrink-0 border ${color.bg} ${color.border}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {project.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dueDate.toLocaleDateString("es-CO", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                        {" — "}
                        <span
                          className={
                            diffDays <= 3
                              ? "text-destructive font-medium"
                              : diffDays <= 7
                                ? "text-orange-500"
                                : ""
                          }
                        >
                          {diffDays === 0
                            ? "Hoy"
                            : diffDays === 1
                              ? "Mañana"
                              : `${diffDays} días`}
                        </span>
                      </p>
                    </div>
                    <Badge variant={statusVariants[project.status]} className="shrink-0">
                      {statusLabels[project.status]}
                    </Badge>
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
