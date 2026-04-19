import { usePageTitle } from "@/hooks/usePageTitle";
import { useRef } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UnsavedChangesDialog } from "@/components/quote-editor/UnsavedChangesDialog";
import { useAuthStore } from "@/store/authStore";
import { useServices } from "@/hooks/useServices";
import { useProjects } from "@/hooks/useProjects";
import { useCreateQuote, useUpdateQuote, useQuote } from "@/hooks/useQuotes";
import { formatCOP } from "@/lib/utils";
import { generateQuotePdf } from "@/lib/quotePdf";
import { useUnsavedChangesGuard } from "@/hooks/quote-editor/useUnsavedChangesGuard";
import { useQuoteTotals } from "@/hooks/quote-editor/useQuoteTotals";
import { useQuoteItems } from "@/hooks/quote-editor/useQuoteItems";
import { useQuoteForm } from "@/hooks/quote-editor/useQuoteForm";
import { toast } from "sonner";
import type { QuoteItem, QuoteStatus } from "@/types";
import { QUOTE_STATUS_LABELS as statusLabels } from "@/lib/constants";

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

  const {
    quoteNumber,
    setQuoteNumber,
    status,
    setStatus,
    validDays,
    setValidDays,
    projectId,
    setProjectId,
    terms,
    setTerms,
    notes,
    setNotes,
    clientName,
    setClientName,
    clientEmail,
    setClientEmail,
    clientPhone,
    setClientPhone,
    clientIsCompany,
    setClientIsCompany,
    clientCompany,
    setClientCompany,
    clientNit,
    setClientNit,
    items,
    setItems,
    applyIva,
    setApplyIva,
    applyRetefuente,
    setApplyRetefuente,
    applyReteica,
    setApplyReteica,
    ivaRate,
    setIvaRate,
    retefuenteRate,
    setRetefuenteRate,
    reteicaRate,
    setReteicaRate,
    discountType,
    setDiscountType,
    discountValue,
    setDiscountValue,
  } = useQuoteForm(existingQuote, profile ?? null, isEditing);

  const {
    markDirty,
    clearDirty,
    showDialog: showUnsavedDialog,
    safeNavigate,
    confirmLeave,
    cancelLeave,
  } = useUnsavedChangesGuard();

  const totals = useQuoteTotals(
    items.map((i) => ({ quantity: i.quantity, unit_price: i.unit_price })),
    { type: discountType, value: discountValue },
    {
      applyIva,
      ivaRate,
      applyRetefuente,
      retefuenteRate,
      applyReteica,
      reteicaRate,
    },
  );

  const {
    subtotal,
    discountAmount,
    ivaAmount,
    retefuenteAmount,
    reteicaAmount,
    total,
  } = totals;

  const { addItem, removeItem, updateItem, addServiceToItems } = useQuoteItems(
    items,
    setItems,
    markDirty,
  );

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
            clearDirty();
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
            clearDirty();
            navigate("/cotizaciones");
          },
        },
      );
    }
  };

  const handleDownloadPDF = () => {
    toast.info("Generando PDF...");
    try {
      const pdf = generateQuotePdf({
        profile: profile ?? null,
        quoteNumber,
        validDays,
        clientName,
        clientEmail,
        clientPhone,
        clientIsCompany,
        clientCompany,
        clientNit,
        items: items
          .filter((i) => i.description.trim())
          .map((i) => ({
            description: i.description,
            quantity: i.quantity,
            unit_price: i.unit_price,
          })),
        terms,
        applyIva,
        ivaRate,
        applyRetefuente,
        retefuenteRate,
        applyReteica,
        reteicaRate,
        discountType,
        discountValue,
        subtotal,
        discountAmount,
        ivaAmount,
        retefuenteAmount,
        reteicaAmount,
        total,
      });
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
                        onClick={() => addServiceToItems(s)}
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

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onConfirm={confirmLeave}
        onCancel={cancelLeave}
      />
    </div>
  );
}
