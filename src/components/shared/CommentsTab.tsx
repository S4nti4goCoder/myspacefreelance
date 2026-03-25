import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Trash2, MessageSquare, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useComments,
  useCreateComment,
  useDeleteComment,
} from "@/hooks/useComments";
import { useAuthStore } from "@/store/authStore";
import { formatRelativeTime } from "@/lib/utils";
import type { Comment } from "@/types";

interface CommentsTabProps {
  projectId: string;
  projectName?: string;
  projectOwnerId?: string;
}

export default function CommentsTab({ projectId }: CommentsTabProps) {
  const { data: comments, isLoading } = useComments(projectId);
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();
  const { user, profile } = useAuthStore();

  const [message, setMessage] = useState("");
  const [deletingComment, setDeletingComment] = useState<Comment | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSend = () => {
    if (!message.trim()) return;

    const isClient = profile?.role === "client";

    createComment.mutate(
      {
        project_id: projectId,
        author: profile?.name ?? user?.email ?? "Freelancer",
        message: message.trim(),
        is_from_client: isClient,
      },
      {
        onSuccess: () => {
          setMessage("");
          textareaRef.current?.focus();
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingComment) return;
    deleteComment.mutate(deletingComment.id, {
      onSettled: () => setDeletingComment(null),
    });
  };

  if (isLoading) {
    return <div className="h-32 bg-muted animate-pulse rounded-xl" />;
  }

  return (
    <div className="flex flex-col h-150 border border-border rounded-xl overflow-hidden">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments?.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground"
          >
            <div className="bg-muted rounded-full p-4">
              <MessageSquare className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium">No hay comentarios aún</p>
            <p className="text-xs text-center max-w-xs">
              Escribe el primer mensaje. Tu cliente también puede comentar desde
              su portal.
            </p>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {comments?.map((comment) => {
            const isFromMe = !comment.is_from_client;

            return (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex gap-2 group ${isFromMe ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`shrink-0 rounded-full p-1.5 h-8 w-8 flex items-center justify-center ${
                    isFromMe
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isFromMe ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>

                <div
                  className={`flex flex-col max-w-[75%] gap-1 ${isFromMe ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">
                      {comment.is_from_client ? comment.author : "Tú"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(comment.created_at)}
                    </span>
                  </div>

                  <div
                    className={`relative px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      isFromMe
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted text-foreground rounded-tl-sm"
                    }`}
                  >
                    {comment.message}

                    {isFromMe && (
                      <button
                        onClick={() => setDeletingComment(comment)}
                        className="absolute -left-7 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Input area */}
      <div className="border-t border-border p-3 bg-card">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            placeholder="Escribe un mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={createComment.isPending}
            rows={1}
            className="resize-none min-h-9 max-h-32"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!message.trim() || createComment.isPending}
            className="shrink-0"
          >
            {createComment.isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          Enter para enviar · Shift+Enter para nueva línea
        </p>
      </div>

      {/* Delete confirmation */}
      <Dialog
        open={!!deletingComment}
        onOpenChange={(open) => !open && setDeletingComment(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar comentario</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este mensaje?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingComment(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteComment.isPending}
            >
              {deleteComment.isPending ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
