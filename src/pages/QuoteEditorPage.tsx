import { usePageTitle } from "@/hooks/usePageTitle";
import { useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { UnsavedChangesDialog } from "@/components/quote-editor/UnsavedChangesDialog";
import { QuoteItemsTable } from "@/components/quote-editor/QuoteItemsTable";
import { QuoteTaxConfiguration } from "@/components/quote-editor/QuoteTaxConfiguration";
import { QuoteDiscountControl } from "@/components/quote-editor/QuoteDiscountControl";
import { QuoteClientSection } from "@/components/quote-editor/QuoteClientSection";
import { QuoteHeader } from "@/components/quote-editor/QuoteHeader";
import { QuoteProjectLink } from "@/components/quote-editor/QuoteProjectLink";
import { QuoteTermsNotes } from "@/components/quote-editor/QuoteTermsNotes";
import { QuotePreviewPDF } from "@/components/quote-editor/QuotePreviewPDF";
import { useAuthStore } from "@/store/authStore";
import { useServices } from "@/hooks/useServices";
import { useProjects } from "@/hooks/useProjects";
import { useCreateQuote, useUpdateQuote, useQuote } from "@/hooks/useQuotes";
import { generateQuotePdf } from "@/lib/quotePdf";
import { useUnsavedChangesGuard } from "@/hooks/quote-editor/useUnsavedChangesGuard";
import { useQuoteTotals } from "@/hooks/quote-editor/useQuoteTotals";
import { useQuoteItems } from "@/hooks/quote-editor/useQuoteItems";
import { useQuoteForm } from "@/hooks/quote-editor/useQuoteForm";
import { toast } from "sonner";
import type { QuoteItem } from "@/types";

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
      <QuoteHeader
        onBack={() => safeNavigate("/cotizaciones")}
        onDownloadPdf={handleDownloadPDF}
        onSave={handleSave}
        saving={createQuote.isPending || updateQuote.isPending}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ===== LEFT — FORM ===== */}
        <div className="space-y-6" onChange={markDirty}>
          <QuoteProjectLink
            quoteNumber={quoteNumber}
            onQuoteNumberChange={setQuoteNumber}
            isEditing={isEditing}
            status={status}
            onStatusChange={setStatus}
            validDays={validDays}
            onValidDaysChange={setValidDays}
            projectId={projectId}
            onProjectIdChange={setProjectId}
            projects={projects}
          />

          <QuoteClientSection
            clientName={clientName}
            onClientNameChange={setClientName}
            clientEmail={clientEmail}
            onClientEmailChange={setClientEmail}
            clientPhone={clientPhone}
            onClientPhoneChange={setClientPhone}
            clientIsCompany={clientIsCompany}
            onClientIsCompanyChange={setClientIsCompany}
            clientCompany={clientCompany}
            onClientCompanyChange={setClientCompany}
            clientNit={clientNit}
            onClientNitChange={setClientNit}
          />

          <QuoteItemsTable
            items={items}
            onAdd={addItem}
            onRemove={removeItem}
            onUpdate={updateItem}
            services={services}
            onAddService={addServiceToItems}
          />

          {/* Taxes & discount */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              Descuentos e impuestos
            </h2>
            <QuoteDiscountControl
              discountType={discountType}
              onDiscountTypeChange={setDiscountType}
              discountValue={discountValue}
              onDiscountValueChange={setDiscountValue}
            />
            <QuoteTaxConfiguration
              applyIva={applyIva}
              onApplyIvaChange={setApplyIva}
              ivaRate={ivaRate}
              onIvaRateChange={setIvaRate}
              applyRetefuente={applyRetefuente}
              onApplyRetefuenteChange={setApplyRetefuente}
              retefuenteRate={retefuenteRate}
              onRetefuenteRateChange={setRetefuenteRate}
              applyReteica={applyReteica}
              onApplyReteicaChange={setApplyReteica}
              reteicaRate={reteicaRate}
              onReteicaRateChange={setReteicaRate}
            />
          </div>

          <QuoteTermsNotes
            terms={terms}
            onTermsChange={setTerms}
            notes={notes}
            onNotesChange={setNotes}
          />
        </div>

        {/* ===== RIGHT — PREVIEW ===== */}
        <div className="xl:sticky xl:top-6 xl:self-start">
          <QuotePreviewPDF
            ref={previewRef}
            profile={profile ?? null}
            quoteNumber={quoteNumber}
            validDays={validDays}
            today={today}
            clientName={clientName}
            clientEmail={clientEmail}
            clientPhone={clientPhone}
            clientIsCompany={clientIsCompany}
            clientCompany={clientCompany}
            clientNit={clientNit}
            items={items}
            terms={terms}
            totals={totals}
            applyIva={applyIva}
            ivaRate={ivaRate}
            applyRetefuente={applyRetefuente}
            retefuenteRate={retefuenteRate}
            applyReteica={applyReteica}
            reteicaRate={reteicaRate}
            discountType={discountType}
            discountValue={discountValue}
          />
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
