import { useMemo } from "react";
import {
  calculateQuoteTotals,
  type DiscountConfig,
  type QuoteItemForCalc,
  type QuoteTotals,
  type TaxConfig,
} from "@/lib/quoteCalculations";

export function useQuoteTotals(
  items: QuoteItemForCalc[],
  discount: DiscountConfig,
  taxes: TaxConfig,
): QuoteTotals {
  return useMemo(
    () => calculateQuoteTotals(items, discount, taxes),
    [items, discount, taxes],
  );
}
