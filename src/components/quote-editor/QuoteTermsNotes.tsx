import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface QuoteTermsNotesProps {
  terms: string;
  onTermsChange: (v: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
}

export function QuoteTermsNotes({
  terms,
  onTermsChange,
  notes,
  onNotesChange,
}: QuoteTermsNotesProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <h2 className="text-sm font-semibold text-foreground">Términos y notas</h2>
      <div className="space-y-2">
        <Label>
          Términos y condiciones{" "}
          <span className="text-xs text-muted-foreground">(aparece en el PDF)</span>
        </Label>
        <Textarea
          placeholder="Ej: La cotización es válida por 30 días..."
          value={terms}
          onChange={(e) => onTermsChange(e.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label>
          Notas internas{" "}
          <span className="text-xs text-muted-foreground">(no aparece en el PDF)</span>
        </Label>
        <Textarea
          placeholder="Notas privadas sobre esta cotización..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={2}
        />
      </div>
    </div>
  );
}
