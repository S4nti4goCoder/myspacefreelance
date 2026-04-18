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
