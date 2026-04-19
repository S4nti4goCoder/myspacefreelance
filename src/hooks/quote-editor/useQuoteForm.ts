import { useEffect, useState } from "react";
import type { Profile, Quote, QuoteStatus } from "@/types";
import type { ItemRow } from "./useQuoteItems";

export interface QuoteFormState {
  quoteNumber: string;
  setQuoteNumber: React.Dispatch<React.SetStateAction<string>>;
  status: QuoteStatus;
  setStatus: React.Dispatch<React.SetStateAction<QuoteStatus>>;
  validDays: number;
  setValidDays: React.Dispatch<React.SetStateAction<number>>;
  projectId: string;
  setProjectId: React.Dispatch<React.SetStateAction<string>>;
  terms: string;
  setTerms: React.Dispatch<React.SetStateAction<string>>;
  notes: string;
  setNotes: React.Dispatch<React.SetStateAction<string>>;

  clientName: string;
  setClientName: React.Dispatch<React.SetStateAction<string>>;
  clientEmail: string;
  setClientEmail: React.Dispatch<React.SetStateAction<string>>;
  clientPhone: string;
  setClientPhone: React.Dispatch<React.SetStateAction<string>>;
  clientIsCompany: boolean;
  setClientIsCompany: React.Dispatch<React.SetStateAction<boolean>>;
  clientCompany: string;
  setClientCompany: React.Dispatch<React.SetStateAction<string>>;
  clientNit: string;
  setClientNit: React.Dispatch<React.SetStateAction<string>>;

  items: ItemRow[];
  setItems: React.Dispatch<React.SetStateAction<ItemRow[]>>;

  applyIva: boolean;
  setApplyIva: React.Dispatch<React.SetStateAction<boolean>>;
  applyRetefuente: boolean;
  setApplyRetefuente: React.Dispatch<React.SetStateAction<boolean>>;
  applyReteica: boolean;
  setApplyReteica: React.Dispatch<React.SetStateAction<boolean>>;
  ivaRate: number;
  setIvaRate: React.Dispatch<React.SetStateAction<number>>;
  retefuenteRate: number;
  setRetefuenteRate: React.Dispatch<React.SetStateAction<number>>;
  reteicaRate: number;
  setReteicaRate: React.Dispatch<React.SetStateAction<number>>;
  discountType: "percentage" | "fixed";
  setDiscountType: React.Dispatch<React.SetStateAction<"percentage" | "fixed">>;
  discountValue: number;
  setDiscountValue: React.Dispatch<React.SetStateAction<number>>;
}

export function useQuoteForm(
  existingQuote: Quote | undefined,
  profile: Profile | null,
  isEditing: boolean,
): QuoteFormState {
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
    if (profile) {
      setApplyIva(profile.apply_iva ?? false);
      setApplyRetefuente(profile.apply_retefuente ?? false);
      setApplyReteica(profile.apply_reteica ?? false);
      setIvaRate(profile.iva_rate ?? 19);
      setRetefuenteRate(profile.retefuente_rate ?? 10);
      setReteicaRate(profile.reteica_rate ?? 0.414);
    }
  }, [profile, existingQuote, isEditing]);

  return {
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
  };
}
