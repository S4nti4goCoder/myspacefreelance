import { forwardRef } from "react";
import { formatCOP } from "@/lib/utils";
import type { Profile } from "@/types";
import type { QuoteTotals } from "@/lib/quoteCalculations";
import type { ItemRow } from "@/hooks/quote-editor/useQuoteItems";
import { QuoteTotalsDisplay } from "./QuoteTotalsDisplay";

const ACCENT_BLUE = "#1B2A4A";
const ACCENT_RED = "#E63946";

interface QuotePreviewPDFProps {
  profile: Profile | null;
  quoteNumber: string;
  validDays: number;
  today: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientIsCompany: boolean;
  clientCompany: string;
  clientNit: string;
  items: ItemRow[];
  terms: string;
  totals: QuoteTotals;
  applyIva: boolean;
  ivaRate: number;
  applyRetefuente: boolean;
  retefuenteRate: number;
  applyReteica: boolean;
  reteicaRate: number;
  discountType: "percentage" | "fixed";
  discountValue: number;
}

export const QuotePreviewPDF = forwardRef<HTMLDivElement, QuotePreviewPDFProps>(
  function QuotePreviewPDF(props, ref) {
    const {
      profile,
      quoteNumber,
      validDays,
      today,
      clientName,
      clientEmail,
      clientPhone,
      clientIsCompany,
      clientCompany,
      clientNit,
      items,
      terms,
      totals,
      applyIva,
      ivaRate,
      applyRetefuente,
      retefuenteRate,
      applyReteica,
      reteicaRate,
      discountType,
      discountValue,
    } = props;

    return (
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Vista previa</h2>
        </div>
        <div className="overflow-auto max-h-[calc(100vh-200px)] rounded-lg border border-border">
          <div
            ref={ref}
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

              {/* Totals */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: "32px",
                }}
              >
                <div style={{ width: "280px" }}>
                  <QuoteTotalsDisplay
                    totals={totals}
                    applyIva={applyIva}
                    applyRetefuente={applyRetefuente}
                    applyReteica={applyReteica}
                    ivaRate={ivaRate}
                    retefuenteRate={retefuenteRate}
                    reteicaRate={reteicaRate}
                    discountType={discountType}
                    discountValue={discountValue}
                  />
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
    );
  },
);
