import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuoteTaxConfiguration } from "./QuoteTaxConfiguration";

const defaultProps = {
  applyIva: false,
  onApplyIvaChange: vi.fn(),
  ivaRate: 19,
  onIvaRateChange: vi.fn(),
  applyRetefuente: false,
  onApplyRetefuenteChange: vi.fn(),
  retefuenteRate: 10,
  onRetefuenteRateChange: vi.fn(),
  applyReteica: false,
  onApplyReteicaChange: vi.fn(),
  reteicaRate: 0.414,
  onReteicaRateChange: vi.fn(),
};

describe("QuoteTaxConfiguration", () => {
  it("renders all three tax toggles", () => {
    render(<QuoteTaxConfiguration {...defaultProps} />);
    expect(screen.getByLabelText(/IVA/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Retención en la fuente/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/ReteICA/i)).toBeInTheDocument();
  });

  it("disables the IVA rate input when applyIva is false", () => {
    render(<QuoteTaxConfiguration {...defaultProps} applyIva={false} />);
    const rateInputs = screen.getAllByRole("spinbutton");
    expect(rateInputs[0]).toBeDisabled();
  });

  it("enables the IVA rate input when applyIva is true", () => {
    render(<QuoteTaxConfiguration {...defaultProps} applyIva />);
    const rateInputs = screen.getAllByRole("spinbutton");
    expect(rateInputs[0]).not.toBeDisabled();
  });

  it("fires onApplyIvaChange when the IVA checkbox is clicked", async () => {
    const user = userEvent.setup();
    const onApplyIvaChange = vi.fn();
    render(
      <QuoteTaxConfiguration
        {...defaultProps}
        onApplyIvaChange={onApplyIvaChange}
      />,
    );
    await user.click(screen.getByLabelText(/IVA/i));
    expect(onApplyIvaChange).toHaveBeenCalledWith(true);
  });

  it("fires onIvaRateChange with the new numeric value", () => {
    const onIvaRateChange = vi.fn();
    render(
      <QuoteTaxConfiguration
        {...defaultProps}
        applyIva
        onIvaRateChange={onIvaRateChange}
      />,
    );
    const rateInputs = screen.getAllByRole("spinbutton");
    fireEvent.change(rateInputs[0], { target: { value: "5" } });
    expect(onIvaRateChange).toHaveBeenCalledWith(5);
  });

  it("clamps rate values between 0 and 100", () => {
    const onIvaRateChange = vi.fn();
    render(
      <QuoteTaxConfiguration
        {...defaultProps}
        applyIva
        onIvaRateChange={onIvaRateChange}
      />,
    );
    const rateInputs = screen.getAllByRole("spinbutton");
    fireEvent.change(rateInputs[0], { target: { value: "150" } });
    expect(onIvaRateChange).toHaveBeenCalledWith(100);
    fireEvent.change(rateInputs[0], { target: { value: "-10" } });
    expect(onIvaRateChange).toHaveBeenCalledWith(0);
  });
});
