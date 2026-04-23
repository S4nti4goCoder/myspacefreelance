import { Plus, Trash2, GripVertical, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCOP } from "@/lib/utils";
import type { Service } from "@/types";
import type { ItemRow } from "@/hooks/quote-editor/useQuoteItems";

interface QuoteItemsTableProps {
  items: ItemRow[];
  onAdd: () => void;
  onRemove: (tempId: string) => void;
  onUpdate: (
    tempId: string,
    field: "description" | "quantity" | "unit_price",
    value: string | number,
  ) => void;
  services: Service[] | undefined;
  onAddService: (service: Service) => void;
}

export function QuoteItemsTable({
  items,
  onAdd,
  onRemove,
  onUpdate,
  services,
  onAddService,
}: QuoteItemsTableProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Ítems</h2>
        {services && services.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 h-8 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar servicio
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {services.map((s) => (
                <DropdownMenuItem key={s.id} onClick={() => onAddService(s)}>
                  <span className="flex-1 truncate">{s.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {formatCOP(s.price)}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2">
        <div className="col-span-5">Descripción</div>
        <div className="col-span-2 text-center">Cant.</div>
        <div className="col-span-3 text-right">Precio unit.</div>
        <div className="col-span-1 text-right">Total</div>
        <div className="col-span-1" />
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.tempId}
            className="grid grid-cols-12 gap-2 items-center"
          >
            <div className="col-span-1 flex justify-center">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="col-span-4">
              <Input
                placeholder="Descripción del ítem"
                value={item.description}
                onChange={(e) =>
                  onUpdate(item.tempId, "description", e.target.value)
                }
                className="h-8 text-sm"
              />
            </div>
            <div className="col-span-2">
              <Input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) =>
                  onUpdate(
                    item.tempId,
                    "quantity",
                    Math.max(1, parseFloat(e.target.value) || 1),
                  )
                }
                className="h-8 text-sm text-center"
              />
            </div>
            <div className="col-span-3">
              <Input
                type="number"
                min="0"
                value={item.unit_price}
                onChange={(e) =>
                  onUpdate(
                    item.tempId,
                    "unit_price",
                    Math.max(0, parseFloat(e.target.value) || 0),
                  )
                }
                className="h-8 text-sm text-right"
              />
            </div>
            <div className="col-span-1 text-right text-xs font-medium text-foreground">
              {formatCOP(item.quantity * item.unit_price)}
            </div>
            <div className="col-span-1 flex justify-center">
              <button
                type="button"
                aria-label="Eliminar ítem"
                onClick={() => onRemove(item.tempId)}
                className="cursor-pointer text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                disabled={items.length === 1}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAdd}
        className="w-full gap-2 border-dashed"
      >
        <Plus className="h-3.5 w-3.5" />
        Agregar ítem
      </Button>
    </div>
  );
}
