import { useState, useEffect } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClients } from "@/hooks/useClients";
import type { Project } from "@/types";

type ProjectFormData = Omit<
  Project,
  "id" | "user_id" | "created_at" | "share_token" | "progress"
>;

interface ProjectFormProps {
  initialData?: Partial<Project>;
  onSubmit: (data: ProjectFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ProjectForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: ProjectFormProps) {
  const { data: clients } = useClients();

  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [clientId, setClientId] = useState(initialData?.client_id ?? "");
  const [startDate, setStartDate] = useState(initialData?.start_date ?? "");
  const [dueDate, setDueDate] = useState(initialData?.due_date ?? "");
  const [status, setStatus] = useState(initialData?.status ?? "todo");
  const [budget, setBudget] = useState(initialData?.budget?.toString() ?? "");
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    setName(initialData?.name ?? "");
    setDescription(initialData?.description ?? "");
    setClientId(initialData?.client_id ?? "");
    setStartDate(initialData?.start_date ?? "");
    setDueDate(initialData?.due_date ?? "");
    setStatus(initialData?.status ?? "todo");
    setBudget(initialData?.budget?.toString() ?? "");
    setTags(initialData?.tags ?? []);
  }, [initialData]);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      client_id: clientId === "none" || clientId === "" ? null : clientId,
      start_date: startDate || null,
      due_date: dueDate || null,
      status: status as Project["status"],
      budget: budget ? parseFloat(budget) : null,
      tags,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="project-name">
          Nombre <span className="text-destructive">*</span>
        </Label>
        <Input
          id="project-name"
          placeholder="Nombre del proyecto"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="project-description">Descripción</Label>
        <Textarea
          id="project-description"
          placeholder="Descripción del proyecto..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cliente</Label>
          <Select
            value={clientId}
            onValueChange={setClientId}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sin cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin cliente</SelectItem>
              {clients?.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Estado</Label>
          <Select
            value={status}
            onValueChange={(val) => setStatus(val as Project["status"])}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">Pendiente</SelectItem>
              <SelectItem value="progress">En progreso</SelectItem>
              <SelectItem value="review">En revisión</SelectItem>
              <SelectItem value="done">Completado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start-date">Fecha de inicio</Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="due-date">Fecha de entrega</Label>
          <Input
            id="due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="budget">Presupuesto (COP)</Label>
        <Input
          id="budget"
          type="number"
          placeholder="0"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          disabled={isLoading}
          min="0"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Etiquetas</Label>
        <Input
          id="tags"
          placeholder="Escribe y presiona Enter para agregar..."
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          disabled={isLoading}
        />
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading || !name.trim()}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar"
          )}
        </Button>
      </div>
    </form>
  );
}
