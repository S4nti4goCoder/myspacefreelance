import { useCallback } from "react";
import type { Service } from "@/types";

export interface ItemRow {
  tempId: string;
  description: string;
  quantity: number;
  unit_price: number;
  order_index: number;
}

export interface QuoteItemsHandlers {
  addItem: () => void;
  removeItem: (tempId: string) => void;
  updateItem: (
    tempId: string,
    field: keyof ItemRow,
    value: string | number,
  ) => void;
  addServiceToItems: (service: Service) => void;
}

export function useQuoteItems(
  items: ItemRow[],
  setItems: React.Dispatch<React.SetStateAction<ItemRow[]>>,
  markDirty: () => void,
): QuoteItemsHandlers {
  const addItem = useCallback(() => {
    markDirty();
    setItems((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        description: "",
        quantity: 1,
        unit_price: 0,
        order_index: prev.length,
      },
    ]);
  }, [markDirty, setItems]);

  const removeItem = useCallback(
    (tempId: string) => {
      if (items.length === 1) return;
      markDirty();
      setItems((prev) => prev.filter((i) => i.tempId !== tempId));
    },
    [items.length, markDirty, setItems],
  );

  const updateItem = useCallback(
    (tempId: string, field: keyof ItemRow, value: string | number) => {
      setItems((prev) =>
        prev.map((i) => (i.tempId === tempId ? { ...i, [field]: value } : i)),
      );
    },
    [setItems],
  );

  const addServiceToItems = useCallback(
    (service: Service) => {
      markDirty();
      setItems((prev) => [
        ...prev,
        {
          tempId: crypto.randomUUID(),
          description: service.name,
          quantity: 1,
          unit_price: service.price,
          order_index: prev.length,
        },
      ]);
    },
    [markDirty, setItems],
  );

  return { addItem, removeItem, updateItem, addServiceToItems };
}
