import { describe, it, expect } from "vitest";
import {
  calculateSubtotal,
  calculateDiscount,
  calculateTaxes,
} from "./quoteCalculations";

describe("calculateSubtotal", () => {
  it("returns 0 for an empty list", () => {
    expect(calculateSubtotal([])).toBe(0);
  });

  it("multiplies quantity by unit_price for a single item", () => {
    expect(calculateSubtotal([{ quantity: 3, unit_price: 100 }])).toBe(300);
  });

  it("sums multiple items", () => {
    expect(
      calculateSubtotal([
        { quantity: 2, unit_price: 50 },
        { quantity: 1, unit_price: 200 },
      ]),
    ).toBe(300);
  });

  it("handles decimal quantities", () => {
    expect(calculateSubtotal([{ quantity: 1.5, unit_price: 100 }])).toBe(150);
  });

  it("returns 0 when all items have price 0", () => {
    expect(
      calculateSubtotal([
        { quantity: 5, unit_price: 0 },
        { quantity: 2, unit_price: 0 },
      ]),
    ).toBe(0);
  });
});

describe("calculateDiscount", () => {
  it("returns 0 for percentage 0", () => {
    expect(calculateDiscount(1000, { type: "percentage", value: 0 })).toBe(0);
  });

  it("calculates 10% of the subtotal", () => {
    expect(calculateDiscount(1000, { type: "percentage", value: 10 })).toBe(
      100,
    );
  });

  it("calculates 50% of the subtotal", () => {
    expect(calculateDiscount(2000, { type: "percentage", value: 50 })).toBe(
      1000,
    );
  });

  it("calculates 100% of the subtotal (full discount)", () => {
    expect(calculateDiscount(1500, { type: "percentage", value: 100 })).toBe(
      1500,
    );
  });

  it("returns the fixed value when type is fixed and value is smaller than subtotal", () => {
    expect(calculateDiscount(1000, { type: "fixed", value: 200 })).toBe(200);
  });

  it("returns the fixed value when it equals subtotal", () => {
    expect(calculateDiscount(500, { type: "fixed", value: 500 })).toBe(500);
  });

  it("returns the fixed value even if it exceeds subtotal (documents current behavior)", () => {
    expect(calculateDiscount(100, { type: "fixed", value: 500 })).toBe(500);
  });
});

const NO_TAXES = {
  applyIva: false,
  applyRetefuente: false,
  applyReteica: false,
  ivaRate: 19,
  retefuenteRate: 10,
  reteicaRate: 0.414,
};

describe("calculateTaxes", () => {
  it("returns all zeros when no tax is applied", () => {
    const result = calculateTaxes(1000, NO_TAXES);
    expect(result).toEqual({
      ivaAmount: 0,
      retefuenteAmount: 0,
      reteicaAmount: 0,
    });
  });

  it("applies only IVA at 19%", () => {
    const result = calculateTaxes(1000, { ...NO_TAXES, applyIva: true });
    expect(result.ivaAmount).toBe(190);
    expect(result.retefuenteAmount).toBe(0);
    expect(result.reteicaAmount).toBe(0);
  });

  it("applies IVA at a custom rate (5%)", () => {
    const result = calculateTaxes(1000, {
      ...NO_TAXES,
      applyIva: true,
      ivaRate: 5,
    });
    expect(result.ivaAmount).toBe(50);
  });

  it("applies only Retefuente at 10%", () => {
    const result = calculateTaxes(1000, {
      ...NO_TAXES,
      applyRetefuente: true,
    });
    expect(result.retefuenteAmount).toBe(100);
    expect(result.ivaAmount).toBe(0);
  });

  it("applies only ReteICA at 0.414%", () => {
    const result = calculateTaxes(1000, {
      ...NO_TAXES,
      applyReteica: true,
    });
    expect(result.reteicaAmount).toBeCloseTo(4.14, 5);
    expect(result.ivaAmount).toBe(0);
  });

  it("applies all three taxes independently", () => {
    const result = calculateTaxes(1000, {
      applyIva: true,
      applyRetefuente: true,
      applyReteica: true,
      ivaRate: 19,
      retefuenteRate: 10,
      reteicaRate: 0.414,
    });
    expect(result.ivaAmount).toBe(190);
    expect(result.retefuenteAmount).toBe(100);
    expect(result.reteicaAmount).toBeCloseTo(4.14, 5);
  });

  it("ignores rates when their toggle is off", () => {
    const result = calculateTaxes(1000, {
      applyIva: false,
      applyRetefuente: false,
      applyReteica: false,
      ivaRate: 50,
      retefuenteRate: 50,
      reteicaRate: 50,
    });
    expect(result).toEqual({
      ivaAmount: 0,
      retefuenteAmount: 0,
      reteicaAmount: 0,
    });
  });
});
