import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  DollarSign,
  Calendar,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  usePayments,
  useCreatePayment,
  useUpdatePayment,
  useDeletePayment,
} from "@/hooks/usePayments";
import { formatCOP, formatDate } from "@/lib/utils";
import type { Payment } from "@/types";

const PAYMENT_METHODS = [
  "Daviplata",
  "Nequi",
  "Transferencia bancaria",
  "Efectivo",
  "PayPal",
  "Tarjeta de crédito",
  "Tarjeta débito",
  "Otro",
];

const PAYMENT_CONCEPTS = [
  "Anticipo",
  "Primer pago (25%)",
  "Segundo pago (50%)",
  "Tercer pago (75%)",
  "Pago final",
  "Pago completo",
  "Abono",
  "Otro",
];

const conceptColors: Record<string, string> = {
  Anticipo: "bg-blue-500/10 text-blue-500",
  "Primer pago (25%)": "bg-violet-500/10 text-violet-500",
  "Segundo pago (50%)": "bg-orange-500/10 text-orange-500",
  "Tercer pago (75%)": "bg-yellow-500/10 text-yellow-500",
  "Pago final": "bg-green-500/10 text-green-500",
  "Pago completo": "bg-green-500/10 text-green-500",
  Abono: "bg-cyan-500/10 text-cyan-500",
  Otro: "bg-muted text-muted-foreground",
};

interface PaymentFormData {
  amount: string;
  payment_date: string;
  method: string;
  concept: string;
  notes: string;
}

interface PaymentsTabProps {
  projectId: string;
}

const emptyForm: PaymentFormData = {
  amount: "",
  payment_date: new Date().toISOString().split("T")[0],
  method: "Daviplata",
  concept: "Anticipo",
  notes: "",
};

function encodeNotes(concept: string, notes: string): string {
  return notes.trim() ? `${concept} | ${notes.trim()}` : concept;
}

function decodeNotes(raw: string | null): { concept: string; notes: string } {
  if (!raw) return { concept: "Otro", notes: "" };
  const parts = raw.split(" | ");
  const concept = PAYMENT_CONCEPTS.includes(parts[0]) ? parts[0] : "Otro";
  const notes = parts.slice(1).join(" | ");
  return { concept, notes };
}

export default function PaymentsTab({ projectId }: PaymentsTabProps) {
  const { data: payments, isLoading } = usePayments(projectId);
  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment();
  const deletePayment = useDeletePayment();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);
  const [form, setForm] = useState<PaymentFormData>(emptyForm);

  const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0;

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (payment: Payment) => {
    setEditingPayment(payment);
    const { concept, notes } = decodeNotes(payment.notes);
    setForm({
      amount: payment.amount.toString(),
      payment_date: payment.payment_date,
      method: payment.method ?? "Daviplata",
      concept,
      notes,
    });
  };

  const handleCreate = () => {
    if (!form.amount || !form.payment_date) return;
    const amount = parseFloat(form.amount);
    if (amount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }
    createPayment.mutate(
      {
        project_id: projectId,
        amount,
        payment_date: form.payment_date,
        method: form.method || null,
        notes: encodeNotes(form.concept, form.notes),
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setForm(emptyForm);
        },
      },
    );
  };

  const handleUpdate = () => {
    if (!editingPayment || !form.amount || !form.payment_date) return;
    const amount = parseFloat(form.amount);
    if (amount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }
    updatePayment.mutate(
      {
        id: editingPayment.id,
        amount,
        payment_date: form.payment_date,
        method: form.method || null,
        notes: encodeNotes(form.concept, form.notes),
      },
      { onSuccess: () => setEditingPayment(null) },
    );
  };

  const handleDeleteConfirm = () => {
    if (!deletingPayment) return;
    deletePayment.mutate(
      { id: deletingPayment.id, projectId },
      {
        onSettled: () => setDeletingPayment(null),
      },
    );
  };

  if (isLoading) {
    return <div className="h-32 bg-muted animate-pulse rounded-xl" />;
  }

  return (
    <div className="space-y-6">
      {/* Header con total */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-green-500/10 rounded-xl p-3">
            <DollarSign className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total recibido</p>
            <p className="text-2xl font-bold text-foreground">
              {formatCOP(totalPaid)}
            </p>
          </div>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Registrar pago
        </Button>
      </div>

      {/* Empty state */}
      {payments?.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12 gap-3"
        >
          <div className="bg-muted rounded-full p-4">
            <CreditCard className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">
            No hay pagos registrados
          </p>
          <Button variant="outline" onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Registrar primer pago
          </Button>
        </motion.div>
      )}

      {/* Payments list */}
      <div className="space-y-3">
        {payments?.map((payment, i) => {
          const { concept, notes } = decodeNotes(payment.notes);
          const conceptColor = conceptColors[concept] ?? conceptColors["Otro"];

          return (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="bg-green-500/10 rounded-lg p-2 shrink-0">
                        <DollarSign className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-foreground text-lg">
                            {formatCOP(payment.amount)}
                          </p>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${conceptColor}`}
                          >
                            {concept}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                          {payment.payment_date && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(payment.payment_date)}</span>
                            </div>
                          )}
                          {payment.method && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <CreditCard className="h-3 w-3" />
                              <span>{payment.method}</span>
                            </div>
                          )}
                        </div>
                        {notes && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenEdit(payment)}
                        aria-label="Editar pago"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeletingPayment(payment)}
                        aria-label="Eliminar pago"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Create / Edit dialog */}
      {[
        {
          open: isCreateOpen,
          onClose: () => setIsCreateOpen(false),
          title: "Registrar pago",
          onSave: handleCreate,
          isPending: createPayment.isPending,
        },
        {
          open: !!editingPayment,
          onClose: () => setEditingPayment(null),
          title: "Editar pago",
          onSave: handleUpdate,
          isPending: updatePayment.isPending,
        },
      ].map(({ open, onClose, title, onSave, isPending }) => (
        <Dialog key={title} open={open} onOpenChange={(o) => !o && onClose()}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>
                  Concepto <span className="text-destructive">*</span>
                </Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.concept}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, concept: e.target.value }))
                  }
                >
                  {PAYMENT_CONCEPTS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>
                  Monto (COP) <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  placeholder="0"
                  min="1"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, amount: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Fecha <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="date"
                  value={form.payment_date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, payment_date: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Método de pago</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.method}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, method: e.target.value }))
                  }
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Notas adicionales</Label>
                <Textarea
                  placeholder="Notas opcionales..."
                  value={form.notes}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  rows={2}
                  maxLength={500}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isPending}>
                Cancelar
              </Button>
              <Button
                onClick={onSave}
                disabled={!form.amount || !form.payment_date || isPending}
              >
                {isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ))}

      {/* Delete confirmation */}
      <Dialog
        open={!!deletingPayment}
        onOpenChange={(open) => !open && setDeletingPayment(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Eliminar pago
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el pago de{" "}
              <span className="font-semibold text-foreground">
                {deletingPayment ? formatCOP(deletingPayment.amount) : ""}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingPayment(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deletePayment.isPending}
            >
              {deletePayment.isPending ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
