import jsPDF from "jspdf";
import { formatCOP } from "@/lib/utils";
import type { Profile } from "@/types";

export interface QuotePdfItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface QuotePdfInput {
  profile: Profile | null;
  quoteNumber: string;
  validDays: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientIsCompany: boolean;
  clientCompany: string;
  clientNit: string;
  items: QuotePdfItem[];
  terms: string;
  applyIva: boolean;
  ivaRate: number;
  applyRetefuente: boolean;
  retefuenteRate: number;
  applyReteica: boolean;
  reteicaRate: number;
  discountType: "percentage" | "fixed";
  discountValue: number;
  subtotal: number;
  discountAmount: number;
  ivaAmount: number;
  retefuenteAmount: number;
  reteicaAmount: number;
  total: number;
}

export function generateQuotePdf(input: QuotePdfInput): jsPDF {
  const {
    profile,
    quoteNumber,
    validDays,
    clientName,
    clientEmail,
    clientPhone,
    clientIsCompany,
    clientCompany,
    clientNit,
    items,
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
  } = input;

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
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
  items.forEach((item, idx) => {
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

  return pdf;
}
