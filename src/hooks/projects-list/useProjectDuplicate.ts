import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useDuplicateProject } from "@/hooks/useProjects";
import type { Project, Task } from "@/types";

export function useProjectDuplicate() {
  const [duplicatingProject, setDuplicatingProject] = useState<Project | null>(
    null,
  );
  const [duplicateName, setDuplicateName] = useState("");
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set(),
  );
  const duplicateMutation = useDuplicateProject();

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ["project-tasks", duplicatingProject?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", duplicatingProject!.id)
        .order("order_index", { ascending: true });
      return (data ?? []) as Task[];
    },
    enabled: !!duplicatingProject,
  });

  const [prevProject, setPrevProject] = useState(duplicatingProject);
  if (prevProject !== duplicatingProject) {
    setPrevProject(duplicatingProject);
    if (duplicatingProject) {
      setDuplicateName(`Copia de ${duplicatingProject.name}`);
    }
  }

  const [prevTasks, setPrevTasks] = useState(tasks);
  if (prevTasks !== tasks) {
    setPrevTasks(tasks);
    if (tasks.length > 0) {
      setSelectedTaskIds(new Set(tasks.map((t) => t.id)));
    }
  }

  const allSelected = useMemo(
    () => tasks.length > 0 && selectedTaskIds.size === tasks.length,
    [tasks, selectedTaskIds],
  );

  const toggleTask = (id: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllTasks = () => {
    if (allSelected) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(tasks.map((t) => t.id)));
    }
  };

  const close = () => {
    setDuplicatingProject(null);
    setSelectedTaskIds(new Set());
  };

  const confirm = () => {
    if (!duplicatingProject || !duplicateName.trim()) return;
    duplicateMutation.mutate(
      {
        project: duplicatingProject,
        newName: duplicateName.trim(),
        taskIds: Array.from(selectedTaskIds),
      },
      { onSuccess: close },
    );
  };

  return {
    duplicatingProject,
    open: setDuplicatingProject,
    close,
    duplicateName,
    setDuplicateName,
    tasks,
    isLoadingTasks,
    selectedTaskIds,
    allSelected,
    toggleTask,
    toggleAllTasks,
    confirm,
    isPending: duplicateMutation.isPending,
  };
}
