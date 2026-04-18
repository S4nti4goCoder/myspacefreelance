export interface QuoteItemForCalc {
  quantity: number;
  unit_price: number;
}

export interface DiscountConfig {
  type: "percentage" | "fixed";
  value: number;
}

export function calculateSubtotal(items: QuoteItemForCalc[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
}

export function calculateDiscount(
  subtotal: number,
  discount: DiscountConfig,
): number {
  if (discount.type === "percentage") {
    return subtotal * (discount.value / 100);
  }
  return discount.value;
}

export interface TaxConfig {
  applyIva: boolean;
  ivaRate: number;
  applyRetefuente: boolean;
  retefuenteRate: number;
  applyReteica: boolean;
  reteicaRate: number;
}

export interface TaxAmounts {
  ivaAmount: number;
  retefuenteAmount: number;
  reteicaAmount: number;
}

export function calculateTaxes(base: number, config: TaxConfig): TaxAmounts {
  return {
    ivaAmount: config.applyIva ? base * (config.ivaRate / 100) : 0,
    retefuenteAmount: config.applyRetefuente
      ? base * (config.retefuenteRate / 100)
      : 0,
    reteicaAmount: config.applyReteica ? base * (config.reteicaRate / 100) : 0,
  };
}
