import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  FolderKanban,
  CheckSquare,
  Paperclip,
  X,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSearch } from "@/hooks/useSearch";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { results, isLoading } = useSearch(query);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasResults =
    results.projects.length > 0 ||
    results.tasks.length > 0 ||
    results.attachments.length > 0;

  const isEmpty = query.length >= 2 && !isLoading && !hasResults;

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Buscar... (Ctrl+K)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-9 pr-8 h-9 text-sm"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && query.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1 left-0 right-0 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
          >
            {isLoading && (
              <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Buscando...</span>
              </div>
            )}

            {isEmpty && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No se encontraron resultados para "{query}"
              </div>
            )}

            {!isLoading && hasResults && (
              <div className="max-h-80 overflow-y-auto">
                {/* Projects */}
                {results.projects.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50">
                      Proyectos
                    </div>
                    {results.projects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => handleSelect(`/proyectos/${project.id}`)}
                        className="cursor-pointer w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors text-left"
                      >
                        <FolderKanban className="h-4 w-4 text-blue-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {project.name}
                          </p>
                          {project.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {project.description}
                            </p>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          Proyecto
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}

                {/* Tasks */}
                {results.tasks.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50">
                      Tareas
                    </div>
                    {results.tasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() =>
                          handleSelect(`/proyectos/${task.project_id}`)
                        }
                        className="cursor-pointer w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors text-left"
                      >
                        <CheckSquare className="h-4 w-4 text-green-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {task.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {task.project_name}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          Tarea
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}

                {/* Attachments */}
                {results.attachments.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50">
                      Archivos
                    </div>
                    {results.attachments.map((attachment) => (
                      <button
                        key={attachment.id}
                        onClick={() =>
                          handleSelect(`/proyectos/${attachment.project_id}`)
                        }
                        className="cursor-pointer w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors text-left"
                      >
                        <Paperclip className="h-4 w-4 text-violet-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {attachment.file_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {attachment.project_name}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          Archivo
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
