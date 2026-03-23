import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Tag,
  CheckSquare,
  FileText,
  Paperclip,
  Send,
  User,
  Bot,
  Download,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { getFileUrl } from "@/hooks/useAttachments";
import type { Project, Task, Document, Attachment, Comment } from "@/types";

const statusLabels: Record<string, string> = {
  todo: "Pendiente",
  progress: "En progreso",
  review: "En revisión",
  done: "Completado",
  cancelled: "Cancelado",
};

const statusVariants: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  todo: "secondary",
  progress: "default",
  review: "outline",
  done: "default",
  cancelled: "destructive",
};

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `Hace ${diffMins}m`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return date.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

function formatSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ClientProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !user) return;

    async function loadData() {
      setIsLoading(true);
      const [projectRes, tasksRes, docsRes, attachRes, commentsRes] =
        await Promise.all([
          supabase.from("projects").select("*").eq("id", id).single(),
          supabase
            .from("tasks")
            .select("*")
            .eq("project_id", id)
            .order("order_index"),
          supabase.from("documents").select("*").eq("project_id", id),
          supabase.from("attachments").select("*").eq("project_id", id),
          supabase
            .from("comments")
            .select("*")
            .eq("project_id", id)
            .order("created_at"),
        ]);

      if (projectRes.error || !projectRes.data) {
        toast.error("No tienes acceso a este proyecto");
        navigate("/cliente/dashboard");
        return;
      }

      setProject(projectRes.data);
      setTasks(tasksRes.data ?? []);
      setDocuments(docsRes.data ?? []);
      setAttachments(attachRes.data ?? []);
      setComments(commentsRes.data ?? []);
      setIsLoading(false);
    }

    loadData();
  }, [id, user, navigate]);

  // Realtime comments
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`client-comments:${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `project_id=eq.${id}`,
        },
        (payload) => {
          setComments((prev) => [...prev, payload.new as Comment]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // Auto scroll comments
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSendComment = async () => {
    if (!message.trim() || !project || !profile) return;
    setIsSending(true);

    const { error } = await supabase.from("comments").insert({
      project_id: project.id,
      author: profile.name,
      message: message.trim(),
      is_from_client: true,
    });

    if (error) {
      toast.error("Error al enviar el mensaje");
    } else {
      setMessage("");
    }
    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendComment();
    }
  };

  const doneTasks = tasks.filter((t) => t.status === "done").length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/cliente/dashboard")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="bg-primary rounded-lg p-1.5">
            <Briefcase className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">
              {project.name}
            </p>
            <p className="text-xs text-muted-foreground">Vista del cliente</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Project header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">
              {project.name}
            </h1>
            <Badge variant={statusVariants[project.status]}>
              {statusLabels[project.status]}
            </Badge>
          </div>

          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {project.due_date && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>Entrega: {formatDate(project.due_date)}</span>
              </div>
            )}
            {project.tags && project.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Tag className="h-4 w-4" />
                {project.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Progreso del proyecto
              </span>
              <span className="font-semibold">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-3" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Tareas</p>
                  <p className="font-semibold">
                    {doneTasks}/{tasks.length}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Documentos</p>
                  <p className="font-semibold">{documents.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-violet-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Archivos</p>
                  <p className="font-semibold">{attachments.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <Separator />

        {/* Tabs */}
        <Tabs defaultValue="tareas">
          <TabsList className="mb-4 w-full sm:w-auto">
            <TabsTrigger value="tareas">Tareas</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="archivos">Archivos</TabsTrigger>
            <TabsTrigger value="comentarios">Comentarios</TabsTrigger>
          </TabsList>

          {/* Tasks */}
          <TabsContent value="tareas" className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay tareas aún
              </p>
            ) : (
              tasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          task.status === "done"
                            ? "bg-green-500"
                            : task.status === "progress"
                              ? "bg-blue-500"
                              : task.status === "review"
                                ? "bg-orange-500"
                                : "bg-muted-foreground"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}
                        >
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {statusLabels[task.status]}
                      </Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documentos" className="space-y-3">
            {documents.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay documentos aún
              </p>
            ) : (
              documents.map((doc) => (
                <Card key={doc.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{doc.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>
                        {doc.content || "*Sin contenido*"}
                      </ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Attachments */}
          <TabsContent value="archivos">
            {attachments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay archivos aún
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {attachments.map((attachment) => {
                  const isImage = attachment.mime_type?.startsWith("image/");
                  const fileUrl = getFileUrl(attachment.file_path);

                  return (
                    <Card key={attachment.id} className="overflow-hidden">
                      {isImage && (
                        <div className="h-36 overflow-hidden">
                          <img
                            src={fileUrl}
                            alt={attachment.file_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardContent className="p-3 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {attachment.file_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatSize(attachment.size)}
                          </p>
                        </div>
                        <a
                          href={fileUrl}
                          download={attachment.file_name}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 gap-1"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Descargar
                          </Button>
                        </a>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Comments */}
          <TabsContent value="comentarios">
            <div
              className="flex flex-col border border-border rounded-xl overflow-hidden"
              style={{ height: "500px" }}
            >
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {comments.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                    <p className="text-sm">
                      No hay mensajes aún. ¡Sé el primero en escribir!
                    </p>
                  </div>
                )}
                {comments.map((comment) => {
                  const isFromClient = comment.is_from_client;
                  return (
                    <div
                      key={comment.id}
                      className={`flex gap-2 ${isFromClient ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <div
                        className={`shrink-0 rounded-full p-1.5 h-8 w-8 flex items-center justify-center ${
                          isFromClient
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isFromClient ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={`flex flex-col max-w-[75%] gap-1 ${isFromClient ? "items-end" : "items-start"}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-medium">
                            {isFromClient ? "Tú" : "Freelancer"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(comment.created_at)}
                          </span>
                        </div>
                        <div
                          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                            isFromClient
                              ? "bg-primary text-primary-foreground rounded-tr-sm"
                              : "bg-muted text-foreground rounded-tl-sm"
                          }`}
                        >
                          {comment.message}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-border p-3 bg-card space-y-2">
                <div className="flex gap-2 items-end">
                  <Textarea
                    placeholder="Escribe tu mensaje..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSending}
                    rows={1}
                    className="resize-none min-h-9 max-h-24 text-sm"
                  />
                  <Button
                    size="icon"
                    onClick={handleSendComment}
                    disabled={!message.trim() || isSending}
                    className="shrink-0"
                  >
                    {isSending ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter para enviar · Shift+Enter para nueva línea
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
