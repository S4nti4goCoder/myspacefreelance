import { ChevronDown, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Project, QuoteStatus } from "@/types";
import { QUOTE_STATUS_LABELS as statusLabels } from "@/lib/constants";

interface QuoteProjectLinkProps {
  quoteNumber: string;
  onQuoteNumberChange: (v: string) => void;
  isEditing: boolean;
  status: QuoteStatus;
  onStatusChange: (v: QuoteStatus) => void;
  validDays: number;
  onValidDaysChange: (v: number) => void;
  projectId: string;
  onProjectIdChange: (v: string) => void;
  projects: Project[] | undefined;
}

export function QuoteProjectLink({
  quoteNumber,
  onQuoteNumberChange,
  isEditing,
  status,
  onStatusChange,
  validDays,
  onValidDaysChange,
  projectId,
  onProjectIdChange,
  projects,
}: QuoteProjectLinkProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Datos de la cotización
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Número</Label>
          <Input
            value={quoteNumber || (isEditing ? "" : "Auto-generado")}
            onChange={(e) => onQuoteNumberChange(e.target.value)}
            placeholder="Auto-generado al guardar"
            disabled={!isEditing}
            className={!isEditing ? "text-muted-foreground" : ""}
          />
        </div>
        <div className="space-y-2">
          <Label>Estado</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {statusLabels[status]}
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full">
              {(Object.keys(statusLabels) as QuoteStatus[])
                .filter((s) => s !== "archived")
                .map((s) => (
                  <DropdownMenuItem key={s} onClick={() => onStatusChange(s)}>
                    {statusLabels[s]}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Válida por (días)</Label>
          <Input
            type="number"
            min="1"
            value={validDays}
            onChange={(e) => onValidDaysChange(parseInt(e.target.value) || 30)}
          />
        </div>
        <div className="space-y-2">
          <Label>Vincular a proyecto</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between truncate">
                <span className="truncate">
                  {projectId
                    ? (projects?.find((p) => p.id === projectId)?.name ?? "Proyecto")
                    : "Sin proyecto"}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuItem onClick={() => onProjectIdChange("")}>
                Sin proyecto
              </DropdownMenuItem>
              <Separator />
              {projects
                ?.filter((p) => p.status !== "archived")
                .map((p) => (
                  <DropdownMenuItem key={p.id} onClick={() => onProjectIdChange(p.id)}>
                    {p.name}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
