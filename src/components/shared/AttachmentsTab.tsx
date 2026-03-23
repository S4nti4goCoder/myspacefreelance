import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Trash2,
  Download,
  FileText,
  FileImage,
  File,
  AlertTriangle,
  Eye,
  FileSpreadsheet,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useAttachments,
  useUploadAttachment,
  useDeleteAttachment,
  getFileUrl,
} from "@/hooks/useAttachments";
import { toast } from "sonner";
import type { Attachment } from "@/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface AttachmentsTabProps {
  projectId: string;
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File;
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType === "application/pdf") return FileText;
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("csv")
  )
    return FileSpreadsheet;
  if (mimeType.includes("word") || mimeType.includes("document"))
    return FileText;
  if (
    mimeType.includes("javascript") ||
    mimeType.includes("html") ||
    mimeType.includes("css") ||
    mimeType.includes("json") ||
    mimeType.includes("plain")
  )
    return FileCode;
  return File;
}

function getFileColor(mimeType: string | null) {
  if (!mimeType) return "text-muted-foreground";
  if (mimeType.startsWith("image/")) return "text-blue-500";
  if (mimeType === "application/pdf") return "text-red-500";
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("csv")
  )
    return "text-green-500";
  if (mimeType.includes("word") || mimeType.includes("document"))
    return "text-blue-400";
  return "text-muted-foreground";
}

function getFileLabel(mimeType: string | null) {
  if (!mimeType) return "archivo";
  if (mimeType.startsWith("image/"))
    return mimeType.split("/")[1].toUpperCase();
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return "XLSX";
  if (mimeType.includes("word") || mimeType.includes("document")) return "DOCX";
  if (mimeType.includes("csv")) return "CSV";
  if (mimeType.includes("plain")) return "TXT";
  return mimeType.split("/").pop()?.split("+")[0]?.toUpperCase() ?? "archivo";
}

function isPreviewable(mimeType: string | null): boolean {
  if (!mimeType) return false;
  return (
    mimeType.startsWith("image/") ||
    mimeType === "application/pdf" ||
    mimeType.includes("plain") ||
    mimeType.includes("word") ||
    mimeType.includes("document")
  );
}

function formatSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function downloadFile(url: string, fileName: string) {
  const response = await fetch(url);
  const blob = await response.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export default function AttachmentsTab({ projectId }: AttachmentsTabProps) {
  const { data: attachments, isLoading } = useAttachments(projectId);
  const uploadAttachment = useUploadAttachment();
  const deleteAttachment = useDeleteAttachment();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deletingAttachment, setDeletingAttachment] =
    useState<Attachment | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" supera el límite de 10MB`);
        return;
      }
      uploadAttachment.mutate({ file, projectId });
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDeleteConfirm = () => {
    if (!deletingAttachment) return;
    deleteAttachment.mutate(deletingAttachment, {
      onSettled: () => setDeletingAttachment(null),
    });
  };

  const handleDownload = async (attachment: Attachment) => {
    setDownloadingId(attachment.id);
    try {
      const url = getFileUrl(attachment.file_path);
      await downloadFile(url, attachment.file_name);
      toast.success("Descarga completada");
    } catch {
      toast.error("Error al descargar el archivo");
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return <div className="h-32 bg-muted animate-pulse rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-accent/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-2">
          {uploadAttachment.isPending ? (
            <>
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">
                Subiendo archivos...
              </p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Arrastra archivos aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-muted-foreground">
                Máximo 10MB por archivo — Imágenes, PDFs, Word, Excel y más
              </p>
            </>
          )}
        </div>
      </div>

      {/* Files grid */}
      {attachments?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
          <File className="h-8 w-8" />
          <p className="text-sm">No hay archivos subidos aún</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {attachments?.map((attachment, i) => {
            const FileIcon = getFileIcon(attachment.mime_type);
            const iconColor = getFileColor(attachment.mime_type);
            const fileLabel = getFileLabel(attachment.mime_type);
            const isImage = attachment.mime_type?.startsWith("image/");
            const canPreview = isPreviewable(attachment.mime_type);
            const fileUrl = getFileUrl(attachment.file_path);

            return (
              <motion.div
                key={attachment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="border border-border rounded-xl overflow-hidden bg-card hover:border-primary/50 transition-colors group"
              >
                {/* Preview area */}
                <div
                  className={`h-44 bg-muted flex items-center justify-center overflow-hidden relative ${canPreview ? "cursor-pointer" : ""}`}
                  onClick={() => canPreview && setPreviewAttachment(attachment)}
                >
                  {isImage ? (
                    <img
                      src={fileUrl}
                      alt={attachment.file_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <FileIcon className={`h-14 w-14 ${iconColor}`} />
                      <span className="text-xs text-muted-foreground font-medium uppercase">
                        {fileLabel}
                      </span>
                    </div>
                  )}
                  {canPreview && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="h-7 w-7 text-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 space-y-2">
                  <p
                    className="text-sm font-medium text-foreground truncate"
                    title={attachment.file_name}
                  >
                    {attachment.file_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(attachment.size)}
                  </p>
                  <div className="flex gap-1">
                    {canPreview && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setPreviewAttachment(attachment)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDownload(attachment)}
                      disabled={downloadingId === attachment.id}
                    >
                      {downloadingId === attachment.id ? (
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeletingAttachment(attachment)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Preview dialog */}
      <Dialog
        open={!!previewAttachment}
        onOpenChange={(open) => !open && setPreviewAttachment(null)}
      >
        <DialogContent
          className="max-w-6xl w-[95vw] h-[92vh] flex flex-col p-0 gap-0 overflow-hidden"
          style={{ maxWidth: "90vw", width: "90vw" }}
        >
          <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
            <DialogTitle className="truncate pr-8 text-base">
              {previewAttachment?.file_name}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-hidden">
            {previewAttachment &&
              (() => {
                const mime = previewAttachment.mime_type ?? "";
                const fileUrl = getFileUrl(previewAttachment.file_path);

                if (mime.startsWith("image/")) {
                  return (
                    <div className="w-full h-full flex items-center justify-center bg-muted/30 p-6">
                      <img
                        src={fileUrl}
                        alt={previewAttachment.file_name}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                      />
                    </div>
                  );
                }

                if (mime === "application/pdf" || mime.includes("plain")) {
                  return (
                    <iframe
                      src={fileUrl}
                      className="w-full h-full border-0"
                      title={previewAttachment.file_name}
                    />
                  );
                }

                if (mime.includes("word") || mime.includes("document")) {
                  return (
                    <iframe
                      src={`https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`}
                      className="w-full h-full border-0"
                      title={previewAttachment.file_name}
                    />
                  );
                }

                // No previewable — Excel, CSV, etc.
                return (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8">
                    <div className="bg-muted rounded-full p-6">
                      {(() => {
                        const FileIcon = getFileIcon(mime);
                        const iconColor = getFileColor(mime);
                        return (
                          <FileIcon className={`h-14 w-14 ${iconColor}`} />
                        );
                      })()}
                    </div>
                    <div className="text-center space-y-2 max-w-md">
                      <p className="font-semibold text-foreground text-lg">
                        {previewAttachment.file_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Este tipo de archivo{" "}
                        <span className="font-medium text-foreground">
                          ({getFileLabel(mime)})
                        </span>{" "}
                        no puede previsualizarse en el navegador. Descárgalo
                        para abrirlo con su aplicación correspondiente.
                      </p>
                    </div>
                    <Button
                      size="lg"
                      onClick={() => handleDownload(previewAttachment)}
                      className="gap-2 mt-2"
                    >
                      <Download className="h-5 w-5" />
                      Descargar {getFileLabel(mime)}
                    </Button>
                  </div>
                );
              })()}
          </div>

          <div className="px-6 py-3 border-t border-border shrink-0 flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              {getFileLabel(previewAttachment?.mime_type ?? null)} ·{" "}
              {formatSize(previewAttachment?.size ?? null)}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                previewAttachment && handleDownload(previewAttachment)
              }
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Descargar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={!!deletingAttachment}
        onOpenChange={(open) => !open && setDeletingAttachment(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Eliminar archivo
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar{" "}
              <span className="font-semibold text-foreground">
                "{deletingAttachment?.file_name}"
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingAttachment(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteAttachment.isPending}
            >
              {deleteAttachment.isPending ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
