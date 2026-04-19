import { motion } from "framer-motion";
import { Building2, User, Phone, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface QuoteClientSectionProps {
  clientName: string;
  onClientNameChange: (v: string) => void;
  clientEmail: string;
  onClientEmailChange: (v: string) => void;
  clientPhone: string;
  onClientPhoneChange: (v: string) => void;
  clientIsCompany: boolean;
  onClientIsCompanyChange: (v: boolean) => void;
  clientCompany: string;
  onClientCompanyChange: (v: string) => void;
  clientNit: string;
  onClientNitChange: (v: string) => void;
}

export function QuoteClientSection(props: QuoteClientSectionProps) {
  return (
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
            value={props.clientName}
            onChange={(e) => props.onClientNameChange(e.target.value)}
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
              value={props.clientEmail}
              onChange={(e) => props.onClientEmailChange(e.target.value)}
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
              value={props.clientPhone}
              onChange={(e) => props.onClientPhoneChange(e.target.value)}
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
          checked={props.clientIsCompany}
          onChange={(e) => props.onClientIsCompanyChange(e.target.checked)}
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
      {props.clientIsCompany && (
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
              value={props.clientCompany}
              onChange={(e) => props.onClientCompanyChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>NIT</Label>
            <Input
              placeholder="900.000.000-0"
              value={props.clientNit}
              onChange={(e) => props.onClientNitChange(e.target.value)}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
