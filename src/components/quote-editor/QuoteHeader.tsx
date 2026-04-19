import { ArrowLeft, Download, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuoteHeaderProps {
  onBack: () => void;
  onDownloadPdf: () => void;
  onSave: () => void;
  saving: boolean;
}

export function QuoteHeader({
  onBack,
  onDownloadPdf,
  onSave,
  saving,
}: QuoteHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="gap-2 -ml-2 text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Cotizaciones
      </Button>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onDownloadPdf} className="gap-2">
          <Download className="h-4 w-4" />
          Descargar PDF
        </Button>
        <Button onClick={onSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Guardando..." : "Guardar cotización"}
        </Button>
      </div>
    </div>
  );
}
