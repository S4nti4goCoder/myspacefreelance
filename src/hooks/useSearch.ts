import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Project, Task, Attachment } from "@/types";

export interface SearchResults {
  projects: Project[];
  tasks: (Task & { project_name: string })[];
  attachments: (Attachment & { project_name: string })[];
}

export function useSearch(query: string) {
  const [results, setResults] = useState<SearchResults>({
    projects: [],
    tasks: [],
    attachments: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ projects: [], tasks: [], attachments: [] });
      return;
    }

    const search = async () => {
      setIsLoading(true);

      const [projectsRes, tasksRes, attachmentsRes] = await Promise.all([
        supabase
          .from("projects")
          .select("*")
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(5),

        supabase
          .from("tasks")
          .select("*, project:projects(name)")
          .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(5),

        supabase
          .from("attachments")
          .select("*, project:projects(name)")
          .ilike("file_name", `%${query}%`)
          .limit(5),
      ]);

      setResults({
        projects: (projectsRes.data ?? []) as Project[],
        tasks: (tasksRes.data ?? []).map(
          (t: Task & { project: { name: string } }) => ({
            ...t,
            project_name: t.project?.name ?? "",
          }),
        ),
        attachments: (attachmentsRes.data ?? []).map(
          (a: Attachment & { project: { name: string } }) => ({
            ...a,
            project_name: a.project?.name ?? "",
          }),
        ),
      });

      setIsLoading(false);
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  return { results, isLoading };
}
