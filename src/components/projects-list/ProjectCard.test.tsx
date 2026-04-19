import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRouter } from "@/test/renderWithRouter";
import { ProjectCard } from "./ProjectCard";
import type { Project } from "@/types";

const baseProject = {
  id: "p1",
  name: "Test project",
  description: "Test description",
  status: "progress",
  progress: 42,
  due_date: null,
  budget: null,
  tags: [],
  start_date: null,
  client: null,
} as unknown as Project;

const noopHandlers = {
  onToggleSelect: vi.fn(),
  onEdit: vi.fn(),
  onDuplicate: vi.fn(),
  onArchive: vi.fn(),
  onUnarchive: vi.fn(),
  onDelete: vi.fn(),
};

describe("ProjectCard", () => {
  it("renders name, status badge and progress", () => {
    renderWithRouter(
      <ProjectCard
        project={baseProject}
        showArchived={false}
        viewMode="grid"
        isSelected={false}
        canEdit
        canCreate
        canDelete
        isUpdatePending={false}
        {...noopHandlers}
      />,
    );
    expect(screen.getByText("Test project")).toBeInTheDocument();
    expect(screen.getByText("En progreso")).toBeInTheDocument();
    expect(screen.getByText("42%")).toBeInTheDocument();
  });

  it("hides edit/duplicate/archive buttons when canEdit is false", () => {
    renderWithRouter(
      <ProjectCard
        project={baseProject}
        showArchived={false}
        viewMode="grid"
        isSelected={false}
        canEdit={false}
        canCreate={false}
        canDelete={false}
        isUpdatePending={false}
        {...noopHandlers}
      />,
    );
    expect(screen.queryByTitle("Editar")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Duplicar")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Archivar")).not.toBeInTheDocument();
  });

  it("shows unarchive and delete in archived variant", () => {
    renderWithRouter(
      <ProjectCard
        project={baseProject}
        showArchived
        viewMode="grid"
        isSelected={false}
        canEdit
        canCreate
        canDelete
        isUpdatePending={false}
        {...noopHandlers}
      />,
    );
    expect(screen.getByTitle("Desarchivar")).toBeInTheDocument();
    expect(screen.getByTitle("Eliminar permanentemente")).toBeInTheDocument();
    expect(screen.queryByTitle("Editar")).not.toBeInTheDocument();
  });

  it("fires onEdit when the edit button is clicked", async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    renderWithRouter(
      <ProjectCard
        project={baseProject}
        showArchived={false}
        viewMode="grid"
        isSelected={false}
        canEdit
        canCreate
        canDelete
        isUpdatePending={false}
        {...noopHandlers}
        onEdit={onEdit}
      />,
    );
    await user.click(screen.getByTitle("Editar"));
    expect(onEdit).toHaveBeenCalledWith(baseProject);
  });

  it("fires onToggleSelect when the checkbox is clicked", async () => {
    const onToggleSelect = vi.fn();
    const user = userEvent.setup();
    renderWithRouter(
      <ProjectCard
        project={baseProject}
        showArchived={false}
        viewMode="grid"
        isSelected={false}
        canEdit
        canCreate
        canDelete
        isUpdatePending={false}
        {...noopHandlers}
        onToggleSelect={onToggleSelect}
      />,
    );
    await user.click(screen.getByLabelText("Seleccionar"));
    expect(onToggleSelect).toHaveBeenCalledWith("p1");
  });
});
