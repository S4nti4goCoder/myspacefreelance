import { useState } from "react";
import {
  Plus,
  FileText,
  Pencil,
  Trash2,
  AlertTriangle,
  Save,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useDocuments,
  useCreateDocument,
  useUpdateDocument,
  useDeleteDocument,
} from "@/hooks/useDocuments";
import type { Document } from "@/types";
import MDEditor from "@uiw/react-md-editor";
import { useThemeStore } from "@/store/themeStore";

interface DocumentsTabProps {
  projectId: string;
}

export default function DocumentsTab({ projectId }: DocumentsTabProps) {
  const { data: documents, isLoading } = useDocuments(projectId);
  const createDocument = useCreateDocument();
  const updateDocument = useUpdateDocument();
  const deleteDocument = useDeleteDocument();

  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState<Document | null>(null);

  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const { resolvedTheme } = useThemeStore();

  const handleSelectDoc = (doc: Document) => {
    setSelectedDoc(doc);
    setEditTitle(doc.title);
    setEditContent(doc.content);
    setIsEditing(false);
  };

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createDocument.mutate(
      {
        project_id: projectId,
        title: newTitle.trim(),
        content: newContent,
      },
      {
        onSuccess: (doc) => {
          setIsCreateOpen(false);
          setNewTitle("");
          setNewContent("");
          setSelectedDoc(doc);
          setEditTitle(doc.title);
          setEditContent(doc.content);
          setIsEditing(false);
        },
      },
    );
  };

  const handleSave = () => {
    if (!selectedDoc) return;
    updateDocument.mutate(
      {
        id: selectedDoc.id,
        title: editTitle.trim(),
        content: editContent,
      },
      {
        onSuccess: (doc) => {
          setSelectedDoc(doc);
          setIsEditing(false);
        },
      },
    );
  };

  const handleDeleteConfirm = () => {
    if (!deletingDoc) return;
    deleteDocument.mutate(
      { id: deletingDoc.id, projectId },
      {
        onSuccess: () => {
          if (selectedDoc?.id === deletingDoc.id) setSelectedDoc(null);
          setDeletingDoc(null);
        },
      },
    );
  };

  if (isLoading) {
    return <div className="h-32 bg-muted animate-pulse rounded-xl" />;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-96">
      {/* Documents list */}
      <div className="lg:w-64 shrink-0 space-y-2">
        <Button
          size="sm"
          className="w-full gap-2"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Nuevo documento
        </Button>

        <ScrollArea className="h-80 lg:h-125">
          <div className="space-y-1 pr-2">
            {documents?.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <p className="text-xs text-muted-foreground text-center">
                  No hay documentos aún
                </p>
              </div>
            )}
            {documents?.map((doc) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center justify-between gap-1 p-2 rounded-lg cursor-pointer transition-colors group ${
                  selectedDoc?.id === doc.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
                onClick={() => handleSelectDoc(doc)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-sm truncate">{doc.title}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 ${
                    selectedDoc?.id === doc.id
                      ? "text-primary-foreground hover:bg-primary-foreground/20"
                      : "text-destructive hover:bg-destructive/10"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingDoc(doc);
                  }}
                  aria-label="Eliminar documento"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Document editor / viewer */}
      <div className="flex-1 border border-border rounded-xl overflow-hidden">
        {!selectedDoc ? (
          <div className="flex flex-col items-center justify-center h-full py-16 gap-3 text-muted-foreground">
            <FileText className="h-10 w-10" />
            <p className="text-sm">Selecciona un documento para verlo</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Doc header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              {isEditing ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="max-w-xs h-8 text-sm font-semibold"
                />
              ) : (
                <h3 className="font-semibold text-foreground">
                  {selectedDoc.title}
                </h3>
              )}
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditTitle(selectedDoc.title);
                        setEditContent(selectedDoc.content);
                      }}
                      className="gap-1"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={updateDocument.isPending}
                      className="gap-1"
                    >
                      <Save className="h-3.5 w-3.5" />
                      {updateDocument.isPending ? "Guardando..." : "Guardar"}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="gap-1"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                )}
              </div>
            </div>

            {/* Doc content */}
            {isEditing ? (
              <div className="flex-1 flex flex-col p-4 gap-3">
                <MDEditor
                  value={editContent}
                  onChange={(val) => setEditContent(val ?? "")}
                  height={400}
                  data-color-mode={resolvedTheme}
                />
              </div>
            ) : (
              <ScrollArea className="flex-1 p-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>
                    {selectedDoc.content ||
                      "*Este documento está vacío. Haz clic en Editar para agregar contenido.*"}
                  </ReactMarkdown>
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                Título <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Título del documento"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Contenido inicial (Markdown)</Label>
              <Textarea
                placeholder="# Mi documento&#10;&#10;Escribe aquí en Markdown..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newTitle.trim() || createDocument.isPending}
            >
              {createDocument.isPending ? "Creando..." : "Crear documento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={!!deletingDoc}
        onOpenChange={(open) => !open && setDeletingDoc(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Eliminar documento
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar{" "}
              <span className="font-semibold text-foreground">
                "{deletingDoc?.title}"
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingDoc(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteDocument.isPending}
            >
              {deleteDocument.isPending ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
