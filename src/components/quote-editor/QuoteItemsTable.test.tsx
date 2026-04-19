import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuoteItemsTable } from "./QuoteItemsTable";
import type { ItemRow } from "@/hooks/quote-editor/useQuoteItems";

const makeItem = (overrides: Partial<ItemRow> = {}): ItemRow => ({
  tempId: "t1",
  description: "Servicio",
  quantity: 1,
  unit_price: 100,
  order_index: 0,
  ...overrides,
});

describe("QuoteItemsTable", () => {
  it("renders one row per item", () => {
    render(
      <QuoteItemsTable
        items={[makeItem({ tempId: "a" }), makeItem({ tempId: "b" })]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onUpdate={vi.fn()}
        services={[]}
        onAddService={vi.fn()}
      />,
    );
    expect(
      screen.getAllByPlaceholderText(/descripción del ítem/i),
    ).toHaveLength(2);
  });

  it("calls onAdd when the user clicks 'Agregar ítem'", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(
      <QuoteItemsTable
        items={[makeItem()]}
        onAdd={onAdd}
        onRemove={vi.fn()}
        onUpdate={vi.fn()}
        services={[]}
        onAddService={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /agregar ítem/i }));
    expect(onAdd).toHaveBeenCalledOnce();
  });

  it("calls onRemove with the tempId when the trash button is clicked", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <QuoteItemsTable
        items={[makeItem({ tempId: "abc" }), makeItem({ tempId: "def" })]}
        onAdd={vi.fn()}
        onRemove={onRemove}
        onUpdate={vi.fn()}
        services={[]}
        onAddService={vi.fn()}
      />,
    );
    const removeButtons = screen.getAllByRole("button", {
      name: /eliminar ítem/i,
    });
    await user.click(removeButtons[0]);
    expect(onRemove).toHaveBeenCalledWith("abc");
  });

  it("disables the trash button when only one item remains", () => {
    render(
      <QuoteItemsTable
        items={[makeItem()]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onUpdate={vi.fn()}
        services={[]}
        onAddService={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: /eliminar ítem/i }),
    ).toBeDisabled();
  });

  it("calls onUpdate when the description input changes", () => {
    const onUpdate = vi.fn();
    render(
      <QuoteItemsTable
        items={[makeItem({ tempId: "x" })]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onUpdate={onUpdate}
        services={[]}
        onAddService={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText(/descripción del ítem/i), {
      target: { value: "Nueva descripción" },
    });
    expect(onUpdate).toHaveBeenCalledWith(
      "x",
      "description",
      "Nueva descripción",
    );
  });
});
