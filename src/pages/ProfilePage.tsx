import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Save,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  MapPin,
  Globe,
  Building2,
  Upload,
  X,
  Receipt,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, profile, setProfile } = useAuthStore();

  // Información personal
  const [name, setName] = useState(profile?.name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Datos profesionales
  const [nit, setNit] = useState(profile?.nit ?? "");
  const [address, setAddress] = useState(profile?.address ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [website, setWebsite] = useState(profile?.website ?? "");
  const [isSavingProfessional, setIsSavingProfessional] = useState(false);

  // Logo
  const [logoUrl, setLogoUrl] = useState(profile?.logo_url ?? "");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Configuración fiscal
  const [applyIva, setApplyIva] = useState(profile?.apply_iva ?? false);
  const [applyRetefuente, setApplyRetefuente] = useState(
    profile?.apply_retefuente ?? false,
  );
  const [applyReteica, setApplyReteica] = useState(
    profile?.apply_reteica ?? false,
  );
  const [ivaRate, setIvaRate] = useState(profile?.iva_rate?.toString() ?? "19");
  const [retefuenteRate, setRetefuenteRate] = useState(
    profile?.retefuente_rate?.toString() ?? "10",
  );
  const [reteicaRate, setReteicaRate] = useState(
    profile?.reteica_rate?.toString() ?? "0.414",
  );
  const [isSavingFiscal, setIsSavingFiscal] = useState(false);

  // Contraseña
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    setName(profile?.name ?? "");
    setPhone(profile?.phone ?? "");
    setNit(profile?.nit ?? "");
    setAddress(profile?.address ?? "");
    setCity(profile?.city ?? "");
    setWebsite(profile?.website ?? "");
    setLogoUrl(profile?.logo_url ?? "");
    setApplyIva(profile?.apply_iva ?? false);
    setApplyRetefuente(profile?.apply_retefuente ?? false);
    setApplyReteica(profile?.apply_reteica ?? false);
    setIvaRate(profile?.iva_rate?.toString() ?? "19");
    setRetefuenteRate(profile?.retefuente_rate?.toString() ?? "10");
    setReteicaRate(profile?.reteica_rate?.toString() ?? "0.414");
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast.error("El nombre no puede estar vacío");
      return;
    }
    setIsSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name: name.trim(), phone: phone.trim() || null })
      .eq("id", user!.id);
    if (error) {
      toast.error("Error al guardar los cambios");
    } else {
      setProfile({
        ...profile!,
        name: name.trim(),
        phone: phone.trim() || null,
      });
      toast.success("Perfil actualizado exitosamente");
    }
    setIsSavingProfile(false);
  };

  const handleSaveProfessional = async () => {
    setIsSavingProfessional(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        nit: nit.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        website: website.trim() || null,
      })
      .eq("id", user!.id);
    if (error) {
      toast.error("Error al guardar los datos profesionales");
    } else {
      setProfile({
        ...profile!,
        nit: nit.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        website: website.trim() || null,
      });
      toast.success("Datos profesionales actualizados");
    }
    setIsSavingProfessional(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no puede superar 2MB");
      return;
    }

    setIsUploadingLogo(true);

    const ext = file.name.split(".").pop();
    const filePath = `logos/${user!.id}/logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("project-files")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error("Error al subir el logo");
      setIsUploadingLogo(false);
      return;
    }

    const { data } = supabase.storage
      .from("project-files")
      .getPublicUrl(filePath);
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

    const { error } = await supabase
      .from("profiles")
      .update({ logo_url: publicUrl })
      .eq("id", user!.id);

    if (error) {
      toast.error("Error al guardar el logo");
    } else {
      setLogoUrl(publicUrl);
      setProfile({ ...profile!, logo_url: publicUrl });
      toast.success("Logo actualizado exitosamente");
    }

    setIsUploadingLogo(false);
  };

  const handleRemoveLogo = async () => {
    const { error } = await supabase
      .from("profiles")
      .update({ logo_url: null })
      .eq("id", user!.id);
    if (error) {
      toast.error("Error al eliminar el logo");
    } else {
      setLogoUrl("");
      setProfile({ ...profile!, logo_url: null });
      toast.success("Logo eliminado");
    }
  };

  const handleSaveFiscal = async () => {
    setIsSavingFiscal(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        apply_iva: applyIva,
        apply_retefuente: applyRetefuente,
        apply_reteica: applyReteica,
        iva_rate: parseFloat(ivaRate) || 19,
        retefuente_rate: parseFloat(retefuenteRate) || 10,
        reteica_rate: parseFloat(reteicaRate) || 0.414,
      })
      .eq("id", user!.id);
    if (error) {
      toast.error("Error al guardar la configuración fiscal");
    } else {
      setProfile({
        ...profile!,
        apply_iva: applyIva,
        apply_retefuente: applyRetefuente,
        apply_reteica: applyReteica,
        iva_rate: parseFloat(ivaRate) || 19,
        retefuente_rate: parseFloat(retefuenteRate) || 10,
        reteica_rate: parseFloat(reteicaRate) || 0.414,
      });
      toast.success("Configuración fiscal actualizada");
    }
    setIsSavingFiscal(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error("Ingresa tu contraseña actual");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setIsSavingPassword(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile!.email,
      password: currentPassword,
    });

    if (signInError) {
      toast.error("La contraseña actual es incorrecta");
      setIsSavingPassword(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error("Error al cambiar la contraseña");
    } else {
      toast.success("Contraseña actualizada exitosamente");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setIsSavingPassword(false);
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Mi perfil</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestiona tu información personal, profesional y configuración fiscal
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fila 1 */}
        <div className="contents">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" />
                  Información personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={profile?.email ?? ""}
                      disabled
                      className="pl-9 bg-muted text-muted-foreground"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    El correo no se puede cambiar
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nombre <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="Tu nombre"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9"
                      disabled={isSavingProfile}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="+57 300 000 0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-9"
                      disabled={isSavingProfile}
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile || !name.trim()}
                    className="gap-2"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Guardar cambios
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <KeyRound className="h-4 w-4" />
                  Cambiar contraseña
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Contraseña actual</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrent ? "text" : "password"}
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="pr-9"
                      disabled={isSavingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrent ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNew ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pr-9"
                      disabled={isSavingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNew ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pr-9"
                      disabled={isSavingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleChangePassword}
                    disabled={
                      isSavingPassword ||
                      !currentPassword ||
                      !newPassword ||
                      !confirmPassword
                    }
                    className="gap-2"
                  >
                    {isSavingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <KeyRound className="h-4 w-4" />
                        Cambiar contraseña
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Fila 2 */}
        <div className="contents">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4" />
                  Datos profesionales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-4">
                    {logoUrl ? (
                      <div className="relative h-16 w-16 rounded-lg border border-border overflow-hidden">
                        <img
                          src={logoUrl}
                          alt="Logo"
                          className="h-full w-full object-contain"
                        />
                        <button
                          onClick={handleRemoveLogo}
                          className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:opacity-90"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="space-y-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        className="gap-2"
                      >
                        {isUploadingLogo ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Subiendo...
                          </>
                        ) : (
                          <>
                            <Upload className="h-3.5 w-3.5" />
                            Subir logo
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG o SVG. Máx 2MB.
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nit">NIT / Cédula</Label>
                    <Input
                      id="nit"
                      placeholder="900.000.000-0"
                      value={nit}
                      onChange={(e) => setNit(e.target.value)}
                      disabled={isSavingProfessional}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="city"
                        placeholder="Bogotá"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="pl-9"
                        disabled={isSavingProfessional}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    placeholder="Calle 00 # 00-00"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={isSavingProfessional}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Sitio web</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website"
                      placeholder="https://tuweb.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="pl-9"
                      disabled={isSavingProfessional}
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleSaveProfessional}
                    disabled={isSavingProfessional}
                    className="gap-2"
                  >
                    {isSavingProfessional ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Guardar cambios
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Receipt className="h-4 w-4" />
                  Configuración fiscal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Estos valores se aplicarán por defecto en cada cotización
                  nueva. Puedes ajustarlos por cotización individualmente.
                </p>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="apply-iva"
                      checked={applyIva}
                      onChange={(e) => setApplyIva(e.target.checked)}
                      className="h-4 w-4 rounded accent-primary"
                    />
                    <div>
                      <label
                        htmlFor="apply-iva"
                        className="text-sm font-medium cursor-pointer"
                      >
                        IVA
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Aplica si eres responsable de IVA
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={ivaRate}
                      onChange={(e) => setIvaRate(e.target.value)}
                      className="w-20 h-8 text-sm text-right"
                      disabled={!applyIva}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="apply-retefuente"
                      checked={applyRetefuente}
                      onChange={(e) => setApplyRetefuente(e.target.checked)}
                      className="h-4 w-4 rounded accent-primary"
                    />
                    <div>
                      <label
                        htmlFor="apply-retefuente"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Retención en la fuente
                      </label>
                      <p className="text-xs text-muted-foreground">
                        El cliente te retiene este % al pagar
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={retefuenteRate}
                      onChange={(e) => setRetefuenteRate(e.target.value)}
                      className="w-20 h-8 text-sm text-right"
                      disabled={!applyRetefuente}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="apply-reteica"
                      checked={applyReteica}
                      onChange={(e) => setApplyReteica(e.target.checked)}
                      className="h-4 w-4 rounded accent-primary"
                    />
                    <div>
                      <label
                        htmlFor="apply-reteica"
                        className="text-sm font-medium cursor-pointer"
                      >
                        ReteICA
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Varía por municipio (Bogotá: 0.414%)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={reteicaRate}
                      onChange={(e) => setReteicaRate(e.target.value)}
                      className="w-20 h-8 text-sm text-right"
                      disabled={!applyReteica}
                      step="0.001"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleSaveFiscal}
                    disabled={isSavingFiscal}
                    className="gap-2"
                  >
                    {isSavingFiscal ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Guardar configuración
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
