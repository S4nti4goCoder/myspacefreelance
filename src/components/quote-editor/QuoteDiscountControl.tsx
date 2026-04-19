import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface QuoteDiscountControlProps {
  discountType: "percentage" | "fixed";
  onDiscountTypeChange: (next: "percentage" | "fixed") => void;
  discountValue: number;
  onDiscountValueChange: (next: number) => void;
}

export function QuoteDiscountControl({
  discountType,
  onDiscountTypeChange,
  discountValue,
  onDiscountValueChange,
}: QuoteDiscountControlProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Tipo de descuento</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {discountType === "percentage" ? "Porcentaje %" : "Valor fijo $"}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => onDiscountTypeChange("percentage")}
            >
              Porcentaje %
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDiscountTypeChange("fixed")}>
              Valor fijo $
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="space-y-2">
        <Label>Valor del descuento</Label>
        <Input
          type="number"
          min="0"
          value={discountValue}
          onChange={(e) =>
            onDiscountValueChange(Math.max(0, parseFloat(e.target.value) || 0))
          }
          placeholder="0"
        />
      </div>
    </div>
  );
}
