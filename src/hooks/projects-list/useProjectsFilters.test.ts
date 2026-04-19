import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProjectsFilters } from "./useProjectsFilters";

describe("useProjectsFilters", () => {
  it("starts with default values", () => {
    const { result } = renderHook(() => useProjectsFilters());
    expect(result.current.search).toBe("");
    expect(result.current.statusFilter).toBe("all");
    expect(result.current.clientFilter).toBe("all");
    expect(result.current.sortBy).toBe("created_desc");
    expect(result.current.showArchived).toBe(false);
  });

  it("updates each filter via its setter", () => {
    const { result } = renderHook(() => useProjectsFilters());
    act(() => result.current.setSearch("foo"));
    act(() => result.current.setStatusFilter("progress"));
    act(() => result.current.setClientFilter("client-1"));
    act(() => result.current.setSortBy("name_asc"));
    act(() => result.current.setShowArchived(true));
    expect(result.current.search).toBe("foo");
    expect(result.current.statusFilter).toBe("progress");
    expect(result.current.clientFilter).toBe("client-1");
    expect(result.current.sortBy).toBe("name_asc");
    expect(result.current.showArchived).toBe(true);
  });

  it("resetFilters returns search/status/client/sort to defaults but keeps showArchived", () => {
    const { result } = renderHook(() => useProjectsFilters());
    act(() => {
      result.current.setSearch("x");
      result.current.setStatusFilter("done");
      result.current.setClientFilter("c");
      result.current.setSortBy("name_asc");
      result.current.setShowArchived(true);
    });
    act(() => result.current.resetFilters());
    expect(result.current.search).toBe("");
    expect(result.current.statusFilter).toBe("all");
    expect(result.current.clientFilter).toBe("all");
    expect(result.current.sortBy).toBe("created_desc");
    expect(result.current.showArchived).toBe(true);
  });

  it("counts active filters (excluding sort and showArchived)", () => {
    const { result } = renderHook(() => useProjectsFilters());
    expect(result.current.activeFiltersCount).toBe(0);
    act(() => result.current.setSearch("x"));
    expect(result.current.activeFiltersCount).toBe(1);
    act(() => result.current.setStatusFilter("done"));
    expect(result.current.activeFiltersCount).toBe(2);
    act(() => result.current.setClientFilter("c"));
    expect(result.current.activeFiltersCount).toBe(3);
  });
});
