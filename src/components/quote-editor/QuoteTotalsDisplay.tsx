import type { QuoteTotals } from "@/lib/quoteCalculations";
import { formatCOP } from "@/lib/utils";

interface QuoteTotalsDisplayProps {
  totals: QuoteTotals;
  applyIva: boolean;
  applyRetefuente: boolean;
  applyReteica: boolean;
  ivaRate: number;
  retefuenteRate: number;
  reteicaRate: number;
  discountType: "percentage" | "fixed";
  discountValue: number;
}

const ACCENT_BLUE = "#1B2A4A";
const ACCENT_RED = "#E63946";

export function QuoteTotalsDisplay({
  totals,
  applyIva,
  applyRetefuente,
  applyReteica,
  ivaRate,
  retefuenteRate,
  reteicaRate,
  discountType,
  discountValue,
}: QuoteTotalsDisplayProps) {
  const {
    subtotal,
    discountAmount,
    ivaAmount,
    retefuenteAmount,
    reteicaAmount,
    total,
  } = totals;

  const row = (
    label: string,
    value: string,
    color = "#1a1a1a",
    bold = false,
  ) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "4px 0",
      }}
    >
      <span
        style={{
          fontSize: bold ? "13px" : "11px",
          color: "#666",
          fontWeight: bold ? "bold" : "normal",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: bold ? "15px" : "12px",
          color,
          fontWeight: bold ? "bold" : "normal",
        }}
      >
        {value}
      </span>
    </div>
  );

  return (
    <div style={{ borderTop: "1px solid #eee", paddingTop: "12px" }}>
      {row("SUBTOTAL:", formatCOP(subtotal))}
      {discountAmount > 0 &&
        row(
          `DESCUENTO ${discountType === "percentage" ? `${discountValue}%` : ""}:`,
          `-${formatCOP(discountAmount)}`,
          ACCENT_RED,
        )}
      {applyIva && row(`IVA ${ivaRate}%:`, `+${formatCOP(ivaAmount)}`)}
      {applyRetefuente &&
        row(
          `RETEFUENTE ${retefuenteRate}%:`,
          `-${formatCOP(retefuenteAmount)}`,
          ACCENT_RED,
        )}
      {applyReteica &&
        row(
          `RETEICA ${reteicaRate}%:`,
          `-${formatCOP(reteicaAmount)}`,
          ACCENT_RED,
        )}
      <div
        style={{
          borderTop: "1px solid #eee",
          marginTop: "8px",
          paddingTop: "8px",
        }}
      >
        {row("TOTAL:", formatCOP(total), ACCENT_BLUE, true)}
      </div>
    </div>
  );
}
