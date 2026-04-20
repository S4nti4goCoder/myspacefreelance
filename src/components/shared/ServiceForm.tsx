import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface ServiceFormData {
  name: string;
  description: string;
  price: string;
  category: string;
}

interface ServiceFormProps {
  form: ServiceFormData;
  setForm: React.Dispatch<React.SetStateAction<ServiceFormData>>;
  categories: string[];
}

export function ServiceForm({ form, setForm, categories }: ServiceFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>
          Nombre <span className="text-destructive">*</span>
        </Label>
        <Input
          placeholder="Ej: Diseño UI/UX"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label>Descripción</Label>
        <Textarea
          placeholder="Descripción del servicio..."
          value={form.description}
          onChange={(e) =>
            setForm((p) => ({ ...p, description: e.target.value }))
          }
          rows={2}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>
            Precio base (COP) <span className="text-destructive">*</span>
          </Label>
          <Input
            type="number"
            placeholder="0"
            min="0"
            value={form.price}
            onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Categoría</Label>
          <Input
            placeholder="Ej: Diseño, Desarrollo..."
            value={form.category}
            onChange={(e) =>
              setForm((p) => ({ ...p, category: e.target.value }))
            }
            list="categories-list"
          />
          <datalist id="categories-list">
            {categories.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>
      </div>
    </div>
  );
}
