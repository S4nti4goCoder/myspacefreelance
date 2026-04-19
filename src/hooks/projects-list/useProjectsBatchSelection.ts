import { useState } from "react";

export type BatchAction =
  | { action: "archive" }
  | { action: "delete" }
  | { action: "status"; status: string };

export function useProjectsBatchSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchConfirm, setBatchConfirm] = useState<BatchAction | null>(null);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (ids: string[]) => {
    setSelectedIds((prev) =>
      prev.size === ids.length ? new Set() : new Set(ids),
    );
  };

  const clear = () => setSelectedIds(new Set());

  return {
    selectedIds,
    count: selectedIds.size,
    toggle,
    toggleAll,
    clear,
    batchConfirm,
    setBatchConfirm,
  };
}
