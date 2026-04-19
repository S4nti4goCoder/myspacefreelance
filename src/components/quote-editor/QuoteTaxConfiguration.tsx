import { Input } from "@/components/ui/input";

interface QuoteTaxConfigurationProps {
  applyIva: boolean;
  onApplyIvaChange: (next: boolean) => void;
  ivaRate: number;
  onIvaRateChange: (next: number) => void;
  applyRetefuente: boolean;
  onApplyRetefuenteChange: (next: boolean) => void;
  retefuenteRate: number;
  onRetefuenteRateChange: (next: number) => void;
  applyReteica: boolean;
  onApplyReteicaChange: (next: boolean) => void;
  reteicaRate: number;
  onReteicaRateChange: (next: number) => void;
}

interface TaxRow {
  id: string;
  label: string;
  desc: string;
  checked: boolean;
  setChecked: (next: boolean) => void;
  rate: number;
  setRate: (next: number) => void;
}

export function QuoteTaxConfiguration(props: QuoteTaxConfigurationProps) {
  const rows: TaxRow[] = [
    {
      id: "iva",
      label: "IVA",
      desc: "Responsable de IVA",
      checked: props.applyIva,
      setChecked: props.onApplyIvaChange,
      rate: props.ivaRate,
      setRate: props.onIvaRateChange,
    },
    {
      id: "rete",
      label: "Retención en la fuente",
      desc: "El cliente te retiene",
      checked: props.applyRetefuente,
      setChecked: props.onApplyRetefuenteChange,
      rate: props.retefuenteRate,
      setRate: props.onRetefuenteRateChange,
    },
    {
      id: "reteica",
      label: "ReteICA",
      desc: "Bogotá: 0.414%",
      checked: props.applyReteica,
      setChecked: props.onApplyReteicaChange,
      rate: props.reteicaRate,
      setRate: props.onReteicaRateChange,
    },
  ];
  return (
    <div className="space-y-2">
      {rows.map((tax) => (
        <div
          key={tax.id}
          className="flex items-center justify-between p-3 rounded-lg border border-border"
        >
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id={tax.id}
              checked={tax.checked}
              onChange={(e) => tax.setChecked(e.target.checked)}
              className="h-4 w-4 rounded accent-primary"
            />
            <div>
              <label
                htmlFor={tax.id}
                className="text-sm font-medium cursor-pointer"
              >
                {tax.label}
              </label>
              <p className="text-xs text-muted-foreground">{tax.desc}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={tax.rate}
              onChange={(e) =>
                tax.setRate(
                  Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)),
                )
              }
              className="w-20 h-8 text-sm text-right"
              disabled={!tax.checked}
              step="0.001"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </div>
      ))}
    </div>
  );
}
