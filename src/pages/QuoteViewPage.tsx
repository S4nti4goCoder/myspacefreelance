import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Pencil, FolderPlus } from "lucide-react";
import { useQuote, useUpdateQuote } from "@/hooks/useQuotes";
import { useCreateProject } from "@/hooks/useProjects";
import { Button } from "@/components/ui/button";
import { formatCOP } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import jsPDF from "jspdf";

const ACCENT_BLUE = "#1B2A4A";
const ACCENT_RED = "#E63946";

export default function QuoteViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { data: quote, isLoading } = useQuote(id ?? "");
  const updateQuote = useUpdateQuote();
  const createProject = useCreateProject();

  const handleCreateProject = () => {
    if (!quote) return;
    createProject.mutate(
      {
        name: quote.client_company
          ? `${quote.client_company} — ${quote.quote_number}`
          : `${quote.client_name} — ${quote.quote_number}`,
        description: `Proyecto creado desde cotización ${quote.quote_number}`,
        status: "progress",
        budget: (quote.items ?? []).reduce(
          (sum, i) => sum + i.quantity * i.unit_price,
          0,
        ),
        start_date: null,
        due_date: null,
        tags: [],
        clientId: null,
      },
      {
        onSuccess: (project) => {
          updateQuote.mutate({ id: quote.id, project_id: project.id });
          navigate(`/proyectos/${project.id}`);
          toast.success("Proyecto creado desde la cotización");
        },
      },
    );
  };

  const handleDownloadPDF = () => {
    if (!quote) return;
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
      pdf.setTextColor(...gray);
      pdf.setFont("helvetica", "normal");
      if (profile?.nit) {
        pdf.text(`NIT: ${profile.nit}`, margin + 35, y + 9);
      }
      if (profile?.city) {
        pdf.text(profile.city, margin + 35, y + 13);
      }

      pdf.setTextColor(...gray);
      pdf.setFontSize(9);
      pdf.text(createdDate, W - margin, y, { align: "right" });
      pdf.setTextColor(...blue);
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text(quote.quote_number, W - margin, y + 8, { align: "right" });
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...gray);
      pdf.text(`Válida por ${quote.valid_days} días`, W - margin, y + 13, {
        align: "right",
      });

      y += 32;

      pdf.setTextColor(26, 26, 26);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text(quote.client_name, margin, y);
      y += 5;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(...gray);
      if (quote.client_is_company && quote.client_company) {
        pdf.text(
          `${quote.client_company}${quote.client_nit ? ` · NIT: ${quote.client_nit}` : ""}`,
          margin,
          y,
        );
        y += 4;
      }
      if (quote.client_email) {
        pdf.text(quote.client_email, margin, y);
        y += 4;
      }
      if (quote.client_phone) {
        pdf.text(quote.client_phone, margin, y);
        y += 4;
      }

      y += 6;

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

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      (quote.items ?? []).forEach((item, idx) => {
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

      const totalsX = W - margin - 70;
      const totalsValueX = W - margin;

      const addTotalRow = (
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
      addTotalRow("SUBTOTAL:", formatCOP(subtotal));
      if (discountAmount > 0)
        addTotalRow(
          `DESCUENTO ${quote.discount_type === "percentage" ? quote.discount_value + "%" : ""}:`,
          `-${formatCOP(discountAmount)}`,
          false,
          red,
        );
      if (quote.apply_iva)
        addTotalRow(`IVA ${quote.iva_rate}%:`, `+${formatCOP(ivaAmount)}`);
      if (quote.apply_retefuente)
        addTotalRow(
          `RETEFUENTE ${quote.retefuente_rate}%:`,
          `-${formatCOP(retefuenteAmount)}`,
          false,
          red,
        );
      if (quote.apply_reteica)
        addTotalRow(
          `RETEICA ${quote.reteica_rate}%:`,
          `-${formatCOP(reteicaAmount)}`,
          false,
          red,
        );
      pdf.line(totalsX, y - 2, totalsValueX, y - 2);
      addTotalRow("TOTAL:", formatCOP(total), true, blue);

      y += 4;

      if (quote.terms) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(...blue);
        pdf.text("Nota:", margin, y);
        y += 4;
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(85, 85, 85);
        const lines = pdf.splitTextToSize(quote.terms, W - margin * 2);
        pdf.text(lines, margin, y);
        y += lines.length * 4 + 4;
      }

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

      pdf.save(`${quote.quote_number}.pdf`);
      toast.success("PDF descargado exitosamente");
    } catch (err) {
      console.error("PDF error:", err);
      toast.error("Error al generar el PDF");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-96 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="p-6 flex flex-col items-center justify-center py-16 gap-3">
        <p className="text-muted-foreground">Cotización no encontrada</p>
        <Button variant="outline" onClick={() => navigate("/cotizaciones")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
    );
  }

  const subtotal = (quote.items ?? []).reduce(
    (sum, i) => sum + i.quantity * i.unit_price,
    0,
  );
  const discountAmount =
    quote.discount_type === "percentage"
      ? subtotal * (quote.discount_value / 100)
      : quote.discount_value;
  const afterDiscount = subtotal - discountAmount;
  const ivaAmount = quote.apply_iva
    ? afterDiscount * (quote.iva_rate / 100)
    : 0;
  const retefuenteAmount = quote.apply_retefuente
    ? afterDiscount * (quote.retefuente_rate / 100)
    : 0;
  const reteicaAmount = quote.apply_reteica
    ? afterDiscount * (quote.reteica_rate / 100)
    : 0;
  const total = afterDiscount + ivaAmount - retefuenteAmount - reteicaAmount;

  const createdDate = new Date(quote.created_at).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="p-6 space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/cotizaciones")}
          className="gap-2 -ml-2 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Cotizaciones
        </Button>
        <div className="flex gap-2">
          {quote.status === "accepted" && !quote.project_id && (
            <Button
              variant="outline"
              onClick={handleCreateProject}
              className="gap-2"
              disabled={createProject.isPending}
            >
              <FolderPlus className="h-4 w-4" />
              {createProject.isPending ? "Creando..." : "Crear proyecto"}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => navigate(`/cotizaciones/${quote.id}/editar`)}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
          <Button onClick={handleDownloadPDF} className="gap-2">
            <Download className="h-4 w-4" />
            Descargar PDF
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex justify-center"
      >
        <div className="border border-border rounded-xl overflow-visible shadow-lg">
          <div
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
                    {createdDate}
                  </p>
                  <p
                    style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: ACCENT_BLUE,
                      margin: "0 0 4px 0",
                    }}
                  >
                    {quote.quote_number}
                  </p>
                  <p style={{ fontSize: "11px", color: "#666", margin: 0 }}>
                    Válida por {quote.valid_days} días
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: "32px" }}>
                <p
                  style={{
                    fontWeight: "bold",
                    fontSize: "14px",
                    color: "#1a1a1a",
                    margin: "0 0 4px 0",
                  }}
                >
                  {quote.client_name}
                </p>
                {quote.client_is_company && quote.client_company && (
                  <p
                    style={{ margin: "2px 0", color: "#444", fontSize: "12px" }}
                  >
                    {quote.client_company}{" "}
                    {quote.client_nit && `· NIT: ${quote.client_nit}`}
                  </p>
                )}
                {quote.client_email && (
                  <p
                    style={{ margin: "2px 0", color: "#666", fontSize: "11px" }}
                  >
                    {quote.client_email}
                  </p>
                )}
                {quote.client_phone && (
                  <p
                    style={{ margin: "2px 0", color: "#666", fontSize: "11px" }}
                  >
                    {quote.client_phone}
                  </p>
                )}
              </div>

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
                  {(quote.items ?? []).map((item, idx) => (
                    <tr
                      key={item.id}
                      style={{
                        background: idx % 2 === 0 ? "#F5F6FA" : "#ffffff",
                      }}
                    >
                      <td style={{ padding: "9px 12px", fontSize: "11px" }}>
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
                        {quote.discount_type === "percentage"
                          ? `${quote.discount_value}%`
                          : ""}
                        :
                      </span>
                      <span style={{ fontSize: "12px", color: ACCENT_RED }}>
                        -{formatCOP(discountAmount)}
                      </span>
                    </div>
                  )}
                  {quote.apply_iva && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "6px 0",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      <span style={{ fontSize: "12px", color: "#666" }}>
                        IVA {quote.iva_rate}%:
                      </span>
                      <span style={{ fontSize: "12px" }}>
                        +{formatCOP(ivaAmount)}
                      </span>
                    </div>
                  )}
                  {quote.apply_retefuente && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "6px 0",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      <span style={{ fontSize: "12px", color: "#666" }}>
                        RETEFUENTE {quote.retefuente_rate}%:
                      </span>
                      <span style={{ fontSize: "12px", color: ACCENT_RED }}>
                        -{formatCOP(retefuenteAmount)}
                      </span>
                    </div>
                  )}
                  {quote.apply_reteica && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "6px 0",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      <span style={{ fontSize: "12px", color: "#666" }}>
                        RETEICA {quote.reteica_rate}%:
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

              {quote.terms && (
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
                    {quote.terms}
                  </p>
                </div>
              )}

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
      </motion.div>
    </div>
  );
}
