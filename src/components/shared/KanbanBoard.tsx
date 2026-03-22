import { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useUpdateTasksOrder,
} from "@/hooks/useTasks";
import type { Task, TaskStatus } from "@/types";

const columns: { id: TaskStatus; label: string; color: string }[] = [
  { id: "todo", label: "Pendiente", color: "text-muted-foreground" },
  { id: "progress", label: "En progreso", color: "text-blue-500" },
  { id: "review", label: "En revisión", color: "text-orange-500" },
  { id: "done", label: "Completado", color: "text-green-500" },
];

interface TaskFormData {
  title: string;
  description: string;
  due_date: string;
  status: TaskStatus;
}

interface KanbanBoardProps {
  projectId: string;
}

export default function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { data: tasks = [] } = useTasks(projectId);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const updateTasksOrder = useUpdateTasksOrder();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [createStatus, setCreateStatus] = useState<TaskStatus>("todo");

  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    due_date: "",
    status: "todo",
  });

  const getColumnTasks = (status: TaskStatus) =>
    tasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.order_index - b.order_index);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceStatus = result.source.droppableId as TaskStatus;
    const destStatus = result.destination.droppableId as TaskStatus;
    const sourceTasks = getColumnTasks(sourceStatus);
    const destTasks = getColumnTasks(destStatus);

    const draggedTask = sourceTasks[result.source.index];
    if (!draggedTask) return;

    let updatedTasks: { id: string; order_index: number; status: string }[] =
      [];

    if (sourceStatus === destStatus) {
      const reordered = Array.from(sourceTasks);
      reordered.splice(result.source.index, 1);
      reordered.splice(result.destination.index, 0, draggedTask);
      updatedTasks = reordered.map((t, i) => ({
        id: t.id,
        order_index: i,
        status: t.status,
      }));
    } else {
      const newSourceTasks = Array.from(sourceTasks);
      newSourceTasks.splice(result.source.index, 1);

      const newDestTasks = Array.from(destTasks);
      newDestTasks.splice(result.destination.index, 0, {
        ...draggedTask,
        status: destStatus,
      });

      updatedTasks = [
        ...newSourceTasks.map((t, i) => ({
          id: t.id,
          order_index: i,
          status: sourceStatus,
        })),
        ...newDestTasks.map((t, i) => ({
          id: t.id,
          order_index: i,
          status: destStatus,
        })),
      ];
    }

    updateTasksOrder.mutate(updatedTasks);
  };

  const openCreate = (status: TaskStatus) => {
    setCreateStatus(status);
    setFormData({ title: "", description: "", due_date: "", status });
    setIsCreateOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description ?? "",
      due_date: task.due_date ?? "",
      status: task.status,
    });
  };

  const handleCreate = () => {
    if (!formData.title.trim()) return;
    const columnTasks = getColumnTasks(createStatus);
    createTask.mutate(
      {
        project_id: projectId,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        due_date: formData.due_date || null,
        status: createStatus,
        order_index: columnTasks.length,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setFormData({
            title: "",
            description: "",
            due_date: "",
            status: "todo",
          });
        },
      },
    );
  };

  const handleUpdate = () => {
    if (!editingTask || !formData.title.trim()) return;
    updateTask.mutate(
      {
        id: editingTask.id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        due_date: formData.due_date || null,
        status: formData.status,
      },
      {
        onSuccess: () => setEditingTask(null),
      },
    );
  };

  const handleDeleteConfirm = () => {
    if (!deletingTask) return;
    deleteTask.mutate(deletingTask.id, {
      onSettled: () => setDeletingTask(null),
    });
  };

  return (
    <div className="w-full">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {columns.map((col) => {
            const colTasks = getColumnTasks(col.id);
            return (
              <div key={col.id} className="flex flex-col gap-2">
                {/* Column header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${col.color}`}>
                      {col.label}
                    </span>
                    <Badge variant="secondary" className="text-xs h-5 px-1.5">
                      {colTasks.length}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => openCreate(col.id)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Droppable column */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-24 rounded-xl p-2 space-y-2 transition-colors ${
                        snapshot.isDraggingOver ? "bg-accent" : "bg-muted/30"
                      }`}
                    >
                      {colTasks.map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`bg-card border border-border rounded-lg p-3 space-y-2 ${
                                snapshot.isDragging ? "shadow-lg rotate-1" : ""
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <div
                                  {...provided.dragHandleProps}
                                  className="mt-0.5 text-muted-foreground cursor-grab active:cursor-grabbing shrink-0"
                                >
                                  <GripVertical className="h-3.5 w-3.5" />
                                </div>
                                <p className="text-sm font-medium text-foreground flex-1 leading-tight">
                                  {task.title}
                                </p>
                              </div>

                              {task.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 pl-5">
                                  {task.description}
                                </p>
                              )}

                              {task.due_date && (
                                <div className="flex items-center gap-1 pl-5">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(task.due_date).toLocaleDateString(
                                      "es-CO",
                                      {
                                        day: "2-digit",
                                        month: "short",
                                      },
                                    )}
                                  </span>
                                </div>
                              )}

                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => openEdit(task)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => setDeletingTask(task)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {colTasks.length === 0 && !snapshot.isDraggingOver && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center justify-center h-16 text-xs text-muted-foreground"
                        >
                          Sin tareas
                        </motion.div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Create task dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva tarea</DialogTitle>
          </DialogHeader>
          <TaskFormFields formData={formData} setFormData={setFormData} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.title.trim() || createTask.isPending}
            >
              {createTask.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit task dialog */}
      <Dialog
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar tarea</DialogTitle>
          </DialogHeader>
          <TaskFormFields
            formData={formData}
            setFormData={setFormData}
            showStatus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTask(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!formData.title.trim() || updateTask.isPending}
            >
              {updateTask.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deletingTask}
        onOpenChange={(open) => !open && setDeletingTask(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Eliminar tarea
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar{" "}
              <span className="font-semibold text-foreground">
                "{deletingTask?.title}"
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingTask(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteTask.isPending}
            >
              {deleteTask.isPending ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TaskFormFieldsProps {
  formData: TaskFormData;
  setFormData: React.Dispatch<React.SetStateAction<TaskFormData>>;
  showStatus?: boolean;
}

function TaskFormFields({
  formData,
  setFormData,
  showStatus,
}: TaskFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>
          Título <span className="text-destructive">*</span>
        </Label>
        <Input
          placeholder="Título de la tarea"
          value={formData.title}
          onChange={(e) =>
            setFormData((p) => ({ ...p, title: e.target.value }))
          }
        />
      </div>
      <div className="space-y-2">
        <Label>Descripción</Label>
        <Textarea
          placeholder="Descripción opcional..."
          value={formData.description}
          onChange={(e) =>
            setFormData((p) => ({ ...p, description: e.target.value }))
          }
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label>Fecha límite</Label>
        <Input
          type="date"
          value={formData.due_date}
          onChange={(e) =>
            setFormData((p) => ({ ...p, due_date: e.target.value }))
          }
        />
      </div>
      {showStatus && (
        <div className="space-y-2">
          <Label>Estado</Label>
          <select
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={formData.status}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                status: e.target.value as TaskStatus,
              }))
            }
          >
            <option value="todo">Pendiente</option>
            <option value="progress">En progreso</option>
            <option value="review">En revisión</option>
            <option value="done">Completado</option>
          </select>
        </div>
      )}
    </div>
  );
}
