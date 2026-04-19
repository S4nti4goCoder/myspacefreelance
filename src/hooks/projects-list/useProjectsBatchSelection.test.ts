import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProjectsBatchSelection } from "./useProjectsBatchSelection";

describe("useProjectsBatchSelection", () => {
  it("starts empty", () => {
    const { result } = renderHook(() => useProjectsBatchSelection());
    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.count).toBe(0);
    expect(result.current.batchConfirm).toBeNull();
  });

  it("toggle adds and removes IDs", () => {
    const { result } = renderHook(() => useProjectsBatchSelection());
    act(() => result.current.toggle("a"));
    expect(result.current.selectedIds.has("a")).toBe(true);
    expect(result.current.count).toBe(1);
    act(() => result.current.toggle("a"));
    expect(result.current.selectedIds.has("a")).toBe(false);
    expect(result.current.count).toBe(0);
  });

  it("toggleAll selects all when none selected, clears when all selected", () => {
    const { result } = renderHook(() => useProjectsBatchSelection());
    const ids = ["a", "b", "c"];
    act(() => result.current.toggleAll(ids));
    expect(result.current.count).toBe(3);
    act(() => result.current.toggleAll(ids));
    expect(result.current.count).toBe(0);
  });

  it("toggleAll with partial selection selects all", () => {
    const { result } = renderHook(() => useProjectsBatchSelection());
    act(() => result.current.toggle("a"));
    act(() => result.current.toggleAll(["a", "b", "c"]));
    expect(result.current.count).toBe(3);
  });

  it("clear empties the selection", () => {
    const { result } = renderHook(() => useProjectsBatchSelection());
    act(() => result.current.toggle("a"));
    act(() => result.current.toggle("b"));
    act(() => result.current.clear());
    expect(result.current.count).toBe(0);
  });

  it("setBatchConfirm stores and clears the dialog state", () => {
    const { result } = renderHook(() => useProjectsBatchSelection());
    act(() => result.current.setBatchConfirm({ action: "archive" }));
    expect(result.current.batchConfirm).toEqual({ action: "archive" });
    act(() => result.current.setBatchConfirm(null));
    expect(result.current.batchConfirm).toBeNull();
  });
});
