import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuoteTotalsDisplay } from "./QuoteTotalsDisplay";

const baseTotals = {
  subtotal: 1500,
  discountAmount: 75,
  afterDiscount: 1425,
  ivaAmount: 270.75,
  retefuenteAmount: 142.5,
  reteicaAmount: 5.8995,
  total: 1547.3505,
};

describe("QuoteTotalsDisplay", () => {
  it("renders the subtotal formatted as COP", () => {
    render(
      <QuoteTotalsDisplay
        totals={baseTotals}
        applyIva
        applyRetefuente
        applyReteica
        ivaRate={19}
        retefuenteRate={10}
        reteicaRate={0.414}
        discountType="percentage"
        discountValue={5}
      />,
    );
    expect(screen.getByText(/subtotal/i)).toBeInTheDocument();
    expect(screen.getByText(/\$\s?1\.500/)).toBeInTheDocument();
  });

  it("does not render IVA row when applyIva is false", () => {
    render(
      <QuoteTotalsDisplay
        totals={baseTotals}
        applyIva={false}
        applyRetefuente={false}
        applyReteica={false}
        ivaRate={19}
        retefuenteRate={10}
        reteicaRate={0.414}
        discountType="percentage"
        discountValue={0}
      />,
    );
    expect(screen.queryByText(/IVA/)).not.toBeInTheDocument();
  });

  it("renders discount row only when discountAmount > 0", () => {
    render(
      <QuoteTotalsDisplay
        totals={{ ...baseTotals, discountAmount: 0 }}
        applyIva={false}
        applyRetefuente={false}
        applyReteica={false}
        ivaRate={19}
        retefuenteRate={10}
        reteicaRate={0.414}
        discountType="percentage"
        discountValue={0}
      />,
    );
    expect(screen.queryByText(/descuento/i)).not.toBeInTheDocument();
  });

  it("shows the total formatted as COP", () => {
    render(
      <QuoteTotalsDisplay
        totals={baseTotals}
        applyIva
        applyRetefuente
        applyReteica
        ivaRate={19}
        retefuenteRate={10}
        reteicaRate={0.414}
        discountType="percentage"
        discountValue={5}
      />,
    );
    expect(screen.getByText(/^TOTAL:$/)).toBeInTheDocument();
    expect(screen.getByText(/\$\s?1\.547/)).toBeInTheDocument();
  });
});
