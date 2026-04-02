import { usePageTitle } from "@/hooks/usePageTitle";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Save,
  Download,
  ArrowLeft,
  GripVertical,
  FileText,
  Building2,
  User,
  Phone,
  Mail,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/authStore";
import { useServices } from "@/hooks/useServices";
import { useProjects } from "@/hooks/useProjects";
import { useCreateQuote, useUpdateQuote, useQuote } from "@/hooks/useQuotes";
import { formatCOP } from "@/lib/utils";
import { toast } from "sonner";
import jsPDF from "jspdf";
import type { QuoteItem, QuoteStatus } from "@/types";
import { QUOTE_STATUS_LABELS as statusLabels } from "@/lib/constants";

interface ItemRow extends Omit<QuoteItem, "id" | "quote_id"> {
  tempId: string;
}

const ACCENT_BLUE = "#1B2A4A";
const ACCENT_RED = "#E63946";

export default function QuoteEditorPage() {
  usePageTitle("Editor de cotización");
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { data: existingQuote } = useQuote(id ?? "");
  const { data: services } = useServices();
  const { data: projects } = useProjects();
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const previewRef = useRef<HTMLDivElement>(null);
  const isEditing = !!id;

  // En modo creación, el número lo genera el trigger SQL.
  // Mostramos un placeholder hasta que el backend lo asigne.
  const [quoteNumber, setQuoteNumber] = useState("");
  const [status, setStatus] = useState<QuoteStatus>("draft");
  const [validDays, setValidDays] = useState(30);
  const [projectId, setProjectId] = useState<string>("");
  const [terms, setTerms] = useState("");
  const [notes, setNotes] = useState("");

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientIsCompany, setClientIsCompany] = useState(false);
  const [clientCompany, setClientCompany] = useState("");
  const [clientNit, setClientNit] = useState("");

  const [items, setItems] = useState<ItemRow[]>([
    {
      tempId: crypto.randomUUID(),
      description: "",
      quantity: 1,
      unit_price: 0,
      order_index: 0,
    },
  ]);

  const [applyIva, setApplyIva] = useState(false);
  const [applyRetefuente, setApplyRetefuente] = useState(false);
  const [applyReteica, setApplyReteica] = useState(false);
  const [ivaRate, setIvaRate] = useState(19);
  const [retefuenteRate, setRetefuenteRate] = useState(10);
  const [reteicaRate, setReteicaRate] = useState(0.414);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    "percentage",
  );
  const [discountValue, setDiscountValue] = useState(0);

  useEffect(() => {
    if (isEditing && existingQuote) {
      setQuoteNumber(existingQuote.quote_number);
      setStatus(existingQuote.status);
      setValidDays(existingQuote.valid_days);
      setProjectId(existingQuote.project_id ?? "");
      setTerms(existingQuote.terms ?? "");
      setNotes(existingQuote.notes ?? "");
      setClientName(existingQuote.client_name);
      setClientEmail(existingQuote.client_email ?? "");
      setClientPhone(existingQuote.client_phone ?? "");
      setClientIsCompany(existingQuote.client_is_company);
      setClientCompany(existingQuote.client_company ?? "");
      setClientNit(existingQuote.client_nit ?? "");
      setApplyIva(existingQuote.apply_iva);
      setApplyRetefuente(existingQuote.apply_retefuente);
      setApplyReteica(existingQuote.apply_reteica);
      setIvaRate(existingQuote.iva_rate);
      setRetefuenteRate(existingQuote.retefuente_rate);
      setReteicaRate(existingQuote.reteica_rate);
      setDiscountType(existingQuote.discount_type);
      setDiscountValue(existingQuote.discount_value);
      if (existingQuote.items && existingQuote.items.length > 0) {
        setItems(existingQuote.items.map((i) => ({ ...i, tempId: i.id })));
      }
      return;
    }

    // Modo creación: solo cargar configuración fiscal del perfil.
    // El quote_number lo asigna el trigger SQL al guardar.
    if (profile) {
      setApplyIva(profile.apply_iva ?? false);
      setApplyRetefuente(profile.apply_retefuente ?? false);
      setApplyReteica(profile.apply_reteica ?? false);
      setIvaRate(profile.iva_rate ?? 19);
      setRetefuenteRate(profile.retefuente_rate ?? 10);
      setReteicaRate(profile.reteica_rate ?? 0.414);
    }
  }, [profile, existingQuote, isEditing]);

  // Track dirty state for unsaved changes warning
  const [isDirty, setIsDirty] = useState(false);
  const markDirty = useCallback(() => setIsDirty(true), []);

  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const pendingNavRef = useRef<string | null>(null);

  const safeNavigate = useCallback(
    (to: string) => {
      if (isDirty) {
        pendingNavRef.current = to;
        setShowUnsavedDialog(true);
      } else {
        navigate(to);
      }
    },
    [isDirty, navigate],
  );

  const confirmLeave = useCallback(() => {
    setShowUnsavedDialog(false);
    if (pendingNavRef.current) {
      navigate(pendingNavRef.current);
      pendingNavRef.current = null;
    }
  }, [navigate]);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0),
    [items],
  );

  const discountAmount = useMemo(() => {
    if (discountType === "percentage") return subtotal * (discountValue / 100);
    return discountValue;
  }, [subtotal, discountType, discountValue]);

  const afterDiscount = subtotal - discountAmount;
  const ivaAmount = applyIva ? afterDiscount * (ivaRate / 100) : 0;
  const retefuenteAmount = applyRetefuente
    ? afterDiscount * (retefuenteRate / 100)
    : 0;
  const reteicaAmount = applyReteica ? afterDiscount * (reteicaRate / 100) : 0;
  const total = afterDiscount + ivaAmount - retefuenteAmount - reteicaAmount;

  const addItem = () => {
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
  };

  const removeItem = (tempId: string) => {
    if (items.length === 1) return;
    markDirty();
    setItems((prev) => prev.filter((i) => i.tempId !== tempId));
  };

  const updateItem = (
    tempId: string,
    field: keyof ItemRow,
    value: string | number,
  ) => {
    setItems((prev) =>
      prev.map((i) => (i.tempId === tempId ? { ...i, [field]: value } : i)),
    );
  };

  const addServiceToItems = (serviceId: string) => {
    const service = services?.find((s) => s.id === serviceId);
    if (!service) return;
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
  };

  const getItemsInput = (): Omit<QuoteItem, "quote_id">[] =>
    items
      .filter((i) => i.description.trim())
      .map((i, idx) => ({
        id: i.tempId,
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
        order_index: idx,
      }));

  const handleSave = async () => {
    if (!clientName.trim()) {
      toast.error("El nombre del cliente es requerido");
      return;
    }
    if (items.every((i) => !i.description.trim())) {
      toast.error("Agrega al menos un ítem a la cotización");
      return;
    }
    const invalidItem = items.find(
      (i) => i.description.trim() && (i.quantity < 1 || i.unit_price < 0),
    );
    if (invalidItem) {
      toast.error("Revisa las cantidades y precios de los ítems");
      return;
    }
    if (discountValue < 0) {
      toast.error("El descuento no puede ser negativo");
      return;
    }
    if (discountType === "percentage" && discountValue > 100) {
      toast.error("El descuento no puede superar el 100%");
      return;
    }

    const baseData = {
      status,
      valid_days: validDays,
      project_id: projectId || null,
      client_name: clientName.trim(),
      client_email: clientEmail.trim() || null,
      client_phone: clientPhone.trim() || null,
      client_is_company: clientIsCompany,
      client_company: clientCompany.trim() || null,
      client_nit: clientNit.trim() || null,
      apply_iva: applyIva,
      apply_retefuente: applyRetefuente,
      apply_reteica: applyReteica,
      iva_rate: ivaRate,
      retefuente_rate: retefuenteRate,
      reteica_rate: reteicaRate,
      discount_type: discountType,
      discount_value: discountValue,
      terms: terms.trim() || null,
      notes: notes.trim() || null,
    };

    if (isEditing && existingQuote) {
      // En edición sí enviamos el quote_number existente
      updateQuote.mutate(
        {
          id: existingQuote.id,
          quote_number: quoteNumber,
          ...baseData,
          items: getItemsInput(),
        },
        {
          onSuccess: () => {
            setIsDirty(false);
            navigate("/cotizaciones");
          },
        },
      );
    } else {
      // En creación NO enviamos quote_number: el trigger SQL lo genera
      createQuote.mutate(
        {
          ...baseData,
          user_id: profile!.id,
          items: getItemsInput(),
        },
        {
          onSuccess: (data) => {
            setQuoteNumber(data.quote_number);
            setIsDirty(false);
            navigate("/cotizaciones");
          },
        },
      );
    }
  };

  const handleDownloadPDF = () => {
    toast.info("Generando PDF...");
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const W = 210;
      const margin = 20;
      let y = 20;

      const blue: [number, number, number] = [27, 42, 74];
      const red: [number, number, number] = [230, 57, 70];
      const gray: [number, number, number] = [102, 102, 102];
      const lightGray: [number, number, number] = [245, 246, 250];

      // Header — freelancer
      pdf.setFillColor(...blue);
      pdf.rect(margin, y, 30, 12, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text(
        (profile?.name?.charAt(0) ?? "F").toUpperCase(),
        margin + 15,
        y + 8.5,
        { align: "center" },
      );
      pdf.setTextColor(...blue);
      pdf.setFontSize(13);
      pdf.text(profile?.name ?? "Tu nombre", margin + 35, y + 5);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...gray);
      if (profile?.nit) {
        pdf.text(`NIT: ${profile.nit}`, margin + 35, y + 9);
      }
      if (profile?.city) {
        pdf.text(profile.city, margin + 35, y + 13);
      }

      // Header — quote info
      const todayStr = new Date().toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      pdf.setTextColor(...gray);
      pdf.setFontSize(9);
      pdf.text(todayStr, W - margin, y, { align: "right" });
      pdf.setTextColor(...blue);
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text(quoteNumber || "COT-001", W - margin, y + 8, { align: "right" });
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...gray);
      pdf.text(`Válida por ${validDays} días`, W - margin, y + 13, {
        align: "right",
      });

      y += 32;

      // Client
      pdf.setTextColor(26, 26, 26);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text(clientName || "Nombre del cliente", margin, y);
      y += 5;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(...gray);
      if (clientIsCompany && clientCompany) {
        pdf.text(
          `${clientCompany}${clientNit ? ` · NIT: ${clientNit}` : ""}`,
          margin,
          y,
        );
        y += 4;
      }
      if (clientEmail) {
        pdf.text(clientEmail, margin, y);
        y += 4;
      }
      if (clientPhone) {
        pdf.text(clientPhone, margin, y);
        y += 4;
      }

      y += 6;

      // Items table header
      pdf.setFillColor(...blue);
      pdf.rect(margin, y, W - margin * 2, 9, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text("Descripción", margin + 3, y + 6);
      pdf.text("Cant.", W - 60, y + 6, { align: "center" });
      pdf.text("Und", W - 45, y + 6, { align: "center" });
      pdf.text("Total", W - margin - 2, y + 6, { align: "right" });
      y += 9;

      // Items rows
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      items
        .filter((i) => i.description.trim())
        .forEach((item, idx) => {
          if (idx % 2 === 0) {
            pdf.setFillColor(...lightGray);
            pdf.rect(margin, y, W - margin * 2, 8, "F");
          }
          pdf.setTextColor(26, 26, 26);
          pdf.text(item.description, margin + 3, y + 5.5);
          pdf.text(String(item.quantity), W - 60, y + 5.5, { align: "center" });
          pdf.text("1", W - 45, y + 5.5, { align: "center" });
          pdf.text(
            formatCOP(item.quantity * item.unit_price),
            W - margin - 2,
            y + 5.5,
            { align: "right" },
          );
          y += 8;
        });

      y += 4;

      // Totals
      const totalsX = W - margin - 70;
      const totalsValueX = W - margin;

      const addRow = (
        label: string,
        value: string,
        bold = false,
        color: [number, number, number] = [26, 26, 26],
      ) => {
        pdf.setFont("helvetica", bold ? "bold" : "normal");
        pdf.setFontSize(bold ? 11 : 9);
        pdf.setTextColor(...gray);
        pdf.text(label, totalsX, y);
        pdf.setTextColor(...color);
        pdf.text(value, totalsValueX, y, { align: "right" });
        y += bold ? 7 : 5;
      };

      pdf.setDrawColor(238, 238, 238);
      pdf.line(totalsX, y - 2, totalsValueX, y - 2);
      addRow("SUBTOTAL:", formatCOP(subtotal));
      if (discountAmount > 0)
        addRow(
          `DESCUENTO ${discountType === "percentage" ? discountValue + "%" : ""}:`,
          `-${formatCOP(discountAmount)}`,
          false,
          red,
        );
      if (applyIva) addRow(`IVA ${ivaRate}%:`, `+${formatCOP(ivaAmount)}`);
      if (applyRetefuente)
        addRow(
          `RETEFUENTE ${retefuenteRate}%:`,
          `-${formatCOP(retefuenteAmount)}`,
          false,
          red,
        );
      if (applyReteica)
        addRow(
          `RETEICA ${reteicaRate}%:`,
          `-${formatCOP(reteicaAmount)}`,
          false,
          red,
        );
      pdf.line(totalsX, y - 2, totalsValueX, y - 2);
      addRow("TOTAL:", formatCOP(total), true, blue);

      y += 4;

      // Terms
      if (terms) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(...blue);
        pdf.text("Nota:", margin, y);
        y += 4;
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(85, 85, 85);
        const lines = pdf.splitTextToSize(terms, W - margin * 2);
        pdf.text(lines, margin, y);
        y += lines.length * 4 + 4;
      }

      // Footer
      const footerY = 277;
      pdf.setDrawColor(...blue);
      pdf.setLineWidth(0.5);
      pdf.line(margin, footerY, W - margin, footerY);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...gray);
      let footerX = margin;
      if (profile?.phone) {
        pdf.text(`Tel: ${profile.phone}`, footerX, footerY + 5);
        footerX += 55;
      }
      if (profile?.email) {
        pdf.text(`Email: ${profile.email}`, footerX, footerY + 5);
        footerX += 65;
      }
      if (profile?.website) {
        pdf.text(`Web: ${profile.website}`, footerX, footerY + 5);
      }
      if (profile?.nit) {
        pdf.text(`C.C./NIT ${profile.nit}`, W - margin, footerY + 5, {
          align: "right",
        });
      }

      pdf.save(`${quoteNumber || "cotizacion"}.pdf`);
      toast.success("PDF descargado exitosamente");
    } catch (err) {
      console.error("PDF error:", err);
      toast.error("Error al generar el PDF");
    }
  };

  const today = new Date().toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => safeNavigate("/cotizaciones")}
          className="gap-2 -ml-2 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Cotizaciones
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Descargar PDF
          </Button>
          <Button
            onClick={handleSave}
            disabled={createQuote.isPending || updateQuote.isPending}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {createQuote.isPending || updateQuote.isPending
              ? "Guardando..."
              : "Guardar cotización"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ===== LEFT — FORM ===== */}
        <div className="space-y-6" onChange={markDirty}>
          {/* Quote metadata */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Datos de la cotización
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Número</Label>
                <Input
                  value={quoteNumber || (isEditing ? "" : "Auto-generado")}
                  onChange={(e) => setQuoteNumber(e.target.value)}
                  placeholder="Auto-generado al guardar"
                  disabled={!isEditing}
                  className={!isEditing ? "text-muted-foreground" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      {statusLabels[status]}
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    {(Object.keys(statusLabels) as QuoteStatus[])
                      .filter((s) => s !== "archived")
                      .map((s) => (
                        <DropdownMenuItem key={s} onClick={() => setStatus(s)}>
                          {statusLabels[s]}
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Válida por (días)</Label>
                <Input
                  type="number"
                  min="1"
                  value={validDays}
                  onChange={(e) => setValidDays(parseInt(e.target.value) || 30)}
                />
              </div>
              <div className="space-y-2">
                <Label>Vincular a proyecto</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between truncate"
                    >
                      <span className="truncate">
                        {projectId
                          ? (projects?.find((p) => p.id === projectId)?.name ??
                            "Proyecto")
                          : "Sin proyecto"}
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuItem onClick={() => setProjectId("")}>
                      Sin proyecto
                    </DropdownMenuItem>
                    <Separator />
                    {projects
                      ?.filter((p) => p.status !== "archived")
                      .map((p) => (
                        <DropdownMenuItem
                          key={p.id}
                          onClick={() => setProjectId(p.id)}
                        >
                          {p.name}
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Client data */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Datos del cliente
            </h2>
            <div className="space-y-2">
              <Label>
                Nombre <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nombre del cliente"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="pl-9"
                  maxLength={100}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="email@ejemplo.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="pl-9"
                    maxLength={100}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="+57 300 000 0000"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="pl-9"
                    maxLength={20}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
              <input
                type="checkbox"
                id="is-company"
                checked={clientIsCompany}
                onChange={(e) => setClientIsCompany(e.target.checked)}
                className="h-4 w-4 rounded accent-primary"
              />
              <label
                htmlFor="is-company"
                className="text-sm font-medium cursor-pointer flex items-center gap-2"
              >
                <Building2 className="h-4 w-4" />
                Es empresa
              </label>
            </div>
            {clientIsCompany && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 gap-4"
              >
                <div className="space-y-2">
                  <Label>Nombre empresa</Label>
                  <Input
                    placeholder="Empresa S.A.S."
                    value={clientCompany}
                    onChange={(e) => setClientCompany(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>NIT</Label>
                  <Input
                    placeholder="900.000.000-0"
                    value={clientNit}
                    onChange={(e) => setClientNit(e.target.value)}
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Items */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Ítems</h2>
              {services && services.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 h-8 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Agregar servicio
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {services.map((s) => (
                      <DropdownMenuItem
                        key={s.id}
                        onClick={() => addServiceToItems(s.id)}
                      >
                        <span className="flex-1 truncate">{s.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatCOP(s.price)}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2">
              <div className="col-span-5">Descripción</div>
              <div className="col-span-2 text-center">Cant.</div>
              <div className="col-span-3 text-right">Precio unit.</div>
              <div className="col-span-1 text-right">Total</div>
              <div className="col-span-1" />
            </div>

            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.tempId}
                  className="grid grid-cols-12 gap-2 items-center"
                >
                  <div className="col-span-1 flex justify-center">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="col-span-4">
                    <Input
                      placeholder="Descripción del ítem"
                      value={item.description}
                      onChange={(e) =>
                        updateItem(item.tempId, "description", e.target.value)
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          item.tempId,
                          "quantity",
                          Math.max(1, parseFloat(e.target.value) || 1),
                        )
                      }
                      className="h-8 text-sm text-center"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      min="0"
                      value={item.unit_price}
                      onChange={(e) =>
                        updateItem(
                          item.tempId,
                          "unit_price",
                          Math.max(0, parseFloat(e.target.value) || 0),
                        )
                      }
                      className="h-8 text-sm text-right"
                    />
                  </div>
                  <div className="col-span-1 text-right text-xs font-medium text-foreground">
                    {formatCOP(item.quantity * item.unit_price)}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      onClick={() => removeItem(item.tempId)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={addItem}
              className="w-full gap-2 border-dashed"
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar ítem
            </Button>
          </div>

          {/* Taxes & discount */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              Descuentos e impuestos
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de descuento</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      {discountType === "percentage"
                        ? "Porcentaje %"
                        : "Valor fijo $"}
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => setDiscountType("percentage")}
                    >
                      Porcentaje %
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDiscountType("fixed")}>
                      Valor fijo $
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="space-y-2">
                <Label>Valor del descuento</Label>
                <Input
                  type="number"
                  min="0"
                  value={discountValue}
                  onChange={(e) =>
                    setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))
                  }
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              {[
                {
                  id: "iva",
                  label: "IVA",
                  desc: "Responsable de IVA",
                  checked: applyIva,
                  setChecked: setApplyIva,
                  rate: ivaRate,
                  setRate: setIvaRate,
                },
                {
                  id: "rete",
                  label: "Retención en la fuente",
                  desc: "El cliente te retiene",
                  checked: applyRetefuente,
                  setChecked: setApplyRetefuente,
                  rate: retefuenteRate,
                  setRate: setRetefuenteRate,
                },
                {
                  id: "reteica",
                  label: "ReteICA",
                  desc: "Bogotá: 0.414%",
                  checked: applyReteica,
                  setChecked: setApplyReteica,
                  rate: reteicaRate,
                  setRate: setReteicaRate,
                },
              ].map((tax) => (
                <div
                  key={tax.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={tax.id}
                      checked={tax.checked}
                      onChange={(e) => tax.setChecked(e.target.checked)}
                      className="h-4 w-4 rounded accent-primary"
                    />
                    <div>
                      <label
                        htmlFor={tax.id}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {tax.label}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {tax.desc}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={tax.rate}
                      onChange={(e) =>
                        tax.setRate(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))
                      }
                      className="w-20 h-8 text-sm text-right"
                      disabled={!tax.checked}
                      step="0.001"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Terms & notes */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              Términos y notas
            </h2>
            <div className="space-y-2">
              <Label>
                Términos y condiciones{" "}
                <span className="text-xs text-muted-foreground">
                  (aparece en el PDF)
                </span>
              </Label>
              <Textarea
                placeholder="Ej: La cotización es válida por 30 días..."
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Notas internas{" "}
                <span className="text-xs text-muted-foreground">
                  (no aparece en el PDF)
                </span>
              </Label>
              <Textarea
                placeholder="Notas privadas sobre esta cotización..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* ===== RIGHT — PREVIEW ===== */}
        <div className="xl:sticky xl:top-6 xl:self-start">
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Vista previa
              </h2>
            </div>
            <div className="overflow-auto max-h-[calc(100vh-200px)] rounded-lg border border-border">
              <div
                ref={previewRef}
                style={{
                  width: "794px",
                  minHeight: "1123px",
                  backgroundColor: "#ffffff",
                  fontFamily: "Arial, sans-serif",
                  fontSize: "12px",
                  color: "#1a1a1a",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: "48px" }}>
                  {/* Header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "40px",
                    }}
                  >
                    <div>
                      {profile?.logo_url ? (
                        <img
                          src={profile.logo_url}
                          alt="Logo"
                          style={{
                            height: "64px",
                            objectFit: "contain",
                            marginBottom: "8px",
                          }}
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div
                          style={{
                            width: "64px",
                            height: "64px",
                            background: ACCENT_BLUE,
                            borderRadius: "8px",
                            marginBottom: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span
                            style={{
                              color: "#fff",
                              fontSize: "24px",
                              fontWeight: "bold",
                            }}
                          >
                            {profile?.name?.charAt(0) ?? "F"}
                          </span>
                        </div>
                      )}
                      <p
                        style={{
                          fontWeight: "bold",
                          fontSize: "16px",
                          color: ACCENT_BLUE,
                          margin: 0,
                        }}
                      >
                        {profile?.name ?? "Tu nombre"}
                      </p>
                      {profile?.nit && (
                        <p
                          style={{
                            margin: "2px 0",
                            color: "#666",
                            fontSize: "11px",
                          }}
                        >
                          NIT: {profile.nit}
                        </p>
                      )}
                      {profile?.city && (
                        <p
                          style={{
                            margin: "2px 0",
                            color: "#666",
                            fontSize: "11px",
                          }}
                        >
                          {profile.city}
                        </p>
                      )}
                      {profile?.phone && (
                        <p
                          style={{
                            margin: "2px 0",
                            color: "#666",
                            fontSize: "11px",
                          }}
                        >
                          {profile.phone}
                        </p>
                      )}
                      {profile?.website && (
                        <p
                          style={{
                            margin: "2px 0",
                            color: ACCENT_RED,
                            fontSize: "11px",
                          }}
                        >
                          {profile.website}
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p
                        style={{
                          fontSize: "11px",
                          color: "#666",
                          margin: "0 0 4px 0",
                        }}
                      >
                        {today}
                      </p>
                      <p
                        style={{
                          fontSize: "20px",
                          fontWeight: "bold",
                          color: ACCENT_BLUE,
                          margin: "0 0 4px 0",
                        }}
                      >
                        {quoteNumber || "COT-###"}
                      </p>
                      <p style={{ fontSize: "11px", color: "#666", margin: 0 }}>
                        Válida por {validDays} días
                      </p>
                    </div>
                  </div>

                  {/* Client */}
                  <div style={{ marginBottom: "32px" }}>
                    <p
                      style={{
                        fontWeight: "bold",
                        fontSize: "14px",
                        color: "#1a1a1a",
                        margin: "0 0 4px 0",
                      }}
                    >
                      {clientName || "Nombre del cliente"}
                    </p>
                    {clientIsCompany && clientCompany && (
                      <p
                        style={{
                          margin: "2px 0",
                          color: "#444",
                          fontSize: "12px",
                        }}
                      >
                        {clientCompany} {clientNit && `· NIT: ${clientNit}`}
                      </p>
                    )}
                    {clientEmail && (
                      <p
                        style={{
                          margin: "2px 0",
                          color: "#666",
                          fontSize: "11px",
                        }}
                      >
                        {clientEmail}
                      </p>
                    )}
                    {clientPhone && (
                      <p
                        style={{
                          margin: "2px 0",
                          color: "#666",
                          fontSize: "11px",
                        }}
                      >
                        {clientPhone}
                      </p>
                    )}
                  </div>

                  {/* Items table */}
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      marginBottom: "24px",
                    }}
                  >
                    <thead>
                      <tr style={{ background: ACCENT_BLUE, color: "#fff" }}>
                        <th
                          style={{
                            padding: "10px 12px",
                            textAlign: "left",
                            fontSize: "11px",
                            fontWeight: "600",
                          }}
                        >
                          Descripción
                        </th>
                        <th
                          style={{
                            padding: "10px 12px",
                            textAlign: "center",
                            fontSize: "11px",
                            fontWeight: "600",
                            width: "60px",
                          }}
                        >
                          Cant.
                        </th>
                        <th
                          style={{
                            padding: "10px 12px",
                            textAlign: "center",
                            fontSize: "11px",
                            fontWeight: "600",
                            width: "60px",
                          }}
                        >
                          Und
                        </th>
                        <th
                          style={{
                            padding: "10px 12px",
                            textAlign: "right",
                            fontSize: "11px",
                            fontWeight: "600",
                            width: "120px",
                          }}
                        >
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items
                        .filter((i) => i.description)
                        .map((item, idx) => (
                          <tr
                            key={item.tempId}
                            style={{
                              background: idx % 2 === 0 ? "#F5F6FA" : "#ffffff",
                            }}
                          >
                            <td
                              style={{ padding: "9px 12px", fontSize: "11px" }}
                            >
                              {item.description}
                            </td>
                            <td
                              style={{
                                padding: "9px 12px",
                                textAlign: "center",
                                fontSize: "11px",
                              }}
                            >
                              {item.quantity}
                            </td>
                            <td
                              style={{
                                padding: "9px 12px",
                                textAlign: "center",
                                fontSize: "11px",
                              }}
                            >
                              1
                            </td>
                            <td
                              style={{
                                padding: "9px 12px",
                                textAlign: "right",
                                fontSize: "11px",
                              }}
                            >
                              {formatCOP(item.quantity * item.unit_price)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginBottom: "32px",
                    }}
                  >
                    <div style={{ width: "280px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "6px 0",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        <span style={{ fontSize: "12px", color: "#666" }}>
                          SUBTOTAL:
                        </span>
                        <span style={{ fontSize: "12px", fontWeight: "600" }}>
                          {formatCOP(subtotal)}
                        </span>
                      </div>
                      {discountAmount > 0 && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "6px 0",
                            borderBottom: "1px solid #eee",
                          }}
                        >
                          <span style={{ fontSize: "12px", color: "#666" }}>
                            DESCUENTO{" "}
                            {discountType === "percentage"
                              ? `${discountValue}%`
                              : ""}
                            :
                          </span>
                          <span style={{ fontSize: "12px", color: ACCENT_RED }}>
                            -{formatCOP(discountAmount)}
                          </span>
                        </div>
                      )}
                      {applyIva && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "6px 0",
                            borderBottom: "1px solid #eee",
                          }}
                        >
                          <span style={{ fontSize: "12px", color: "#666" }}>
                            IVA {ivaRate}%:
                          </span>
                          <span style={{ fontSize: "12px" }}>
                            +{formatCOP(ivaAmount)}
                          </span>
                        </div>
                      )}
                      {applyRetefuente && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "6px 0",
                            borderBottom: "1px solid #eee",
                          }}
                        >
                          <span style={{ fontSize: "12px", color: "#666" }}>
                            RETEFUENTE {retefuenteRate}%:
                          </span>
                          <span style={{ fontSize: "12px", color: ACCENT_RED }}>
                            -{formatCOP(retefuenteAmount)}
                          </span>
                        </div>
                      )}
                      {applyReteica && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "6px 0",
                            borderBottom: "1px solid #eee",
                          }}
                        >
                          <span style={{ fontSize: "12px", color: "#666" }}>
                            RETEICA {reteicaRate}%:
                          </span>
                          <span style={{ fontSize: "12px", color: ACCENT_RED }}>
                            -{formatCOP(reteicaAmount)}
                          </span>
                        </div>
                      )}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "10px 0",
                          marginTop: "4px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: "bold",
                            color: ACCENT_BLUE,
                          }}
                        >
                          TOTAL:
                        </span>
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: "bold",
                            color: ACCENT_BLUE,
                          }}
                        >
                          {formatCOP(total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Terms */}
                  {terms && (
                    <div style={{ marginBottom: "24px" }}>
                      <p
                        style={{
                          fontWeight: "bold",
                          fontSize: "12px",
                          color: ACCENT_BLUE,
                          marginBottom: "6px",
                        }}
                      >
                        Nota:
                      </p>
                      <p
                        style={{
                          fontSize: "11px",
                          color: "#555",
                          lineHeight: "1.5",
                        }}
                      >
                        {terms}
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div
                    style={{
                      borderTop: `2px solid ${ACCENT_BLUE}`,
                      paddingTop: "16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "auto",
                    }}
                  >
                    <div style={{ display: "flex", gap: "20px" }}>
                      {profile?.phone && (
                        <span style={{ fontSize: "10px", color: "#666" }}>
                          📞 {profile.phone}
                        </span>
                      )}
                      {profile?.email && (
                        <span style={{ fontSize: "10px", color: "#666" }}>
                          ✉ {profile.email}
                        </span>
                      )}
                      {profile?.website && (
                        <span style={{ fontSize: "10px", color: "#666" }}>
                          🌐 {profile.website}
                        </span>
                      )}
                    </div>
                    {profile?.nit && (
                      <span style={{ fontSize: "10px", color: "#666" }}>
                        C.C./NIT {profile.nit}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unsaved changes dialog */}
      <Dialog
        open={showUnsavedDialog}
        onOpenChange={(open) => !open && setShowUnsavedDialog(false)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cambios sin guardar</DialogTitle>
            <DialogDescription>
              Tienes cambios sin guardar en esta cotización. ¿Deseas salir sin
              guardar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnsavedDialog(false)}>
              Seguir editando
            </Button>
            <Button
              variant="destructive"
              onClick={confirmLeave}
            >
              Salir sin guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
