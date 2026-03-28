import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  AlertTriangle,
  Users,
  Shield,
  Mail,
  Phone,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  useCollaborators,
  useCreateCollaborator,
  useDeleteCollaborator,
} from "@/hooks/useCollaborators";
import type { Collaborator } from "@/types";
import CollaboratorPermissionsPage from "@/pages/CollaboratorPermissionsPage";

export default function CollaboratorsPage() {
  const { data: collaborators, isLoading } = useCollaborators();
  const createCollaborator = useCreateCollaborator();
  const deleteCollaborator = useDeleteCollaborator();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingCollab, setDeletingCollab] = useState<Collaborator | null>(
    null,
  );
  const [managingCollab, setManagingCollab] = useState<Collaborator | null>(
    null,
  );
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleOpenCreate = () => {
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setShowPassword(false);
    setIsCreateOpen(true);
  };

  const handleCreate = () => {
    if (!name.trim() || !email.trim() || !password.trim()) return;
    createCollaborator.mutate(
      { name: name.trim(), email: email.trim(), password, phone: phone.trim() },
      { onSuccess: () => setIsCreateOpen(false) },
    );
  };

  const handleDeleteConfirm = () => {
    if (!deletingCollab) return;
    deleteCollaborator.mutate(deletingCollab.id, {
      onSettled: () => setDeletingCollab(null),
    });
  };

  // Vista de gestión de permisos
  if (managingCollab) {
    return (
      <CollaboratorPermissionsPage
        collaborator={managingCollab}
        onBack={() => setManagingCollab(null)}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Colaboradores</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestiona el acceso y permisos de tus colaboradores
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo colaborador
        </Button>
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-36 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && collaborators?.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 gap-3"
        >
          <div className="bg-muted rounded-full p-5">
            <Users className="h-10 w-10 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium text-lg">
            No tienes colaboradores aún
          </p>
          <p className="text-muted-foreground text-sm text-center max-w-xs">
            Agrega un colaborador para que te ayude a gestionar tus proyectos
          </p>
          <Button onClick={handleOpenCreate} className="gap-2 mt-2">
            <Plus className="h-4 w-4" />
            Agregar primer colaborador
          </Button>
        </motion.div>
      )}

      {/* Collaborators grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {collaborators?.map((collab, i) => (
            <motion.div
              key={collab.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4 space-y-4">
                  {/* Avatar + info */}
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 rounded-xl h-11 w-11 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-lg">
                        {collab.profile?.name?.charAt(0).toUpperCase() ?? "C"}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground truncate">
                          {collab.profile?.name ?? "Sin nombre"}
                        </p>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          Colaborador
                        </Badge>
                      </div>
                      {collab.profile?.email && (
                        <div className="flex items-center gap-1 mt-1">
                          <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                          <p className="text-xs text-muted-foreground truncate">
                            {collab.profile.email}
                          </p>
                        </div>
                      )}
                      {collab.profile?.phone && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                          <p className="text-xs text-muted-foreground">
                            {collab.profile.phone}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Permissions summary */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {collab.permissions
                        ? `${collab.permissions.filter((p) => p.can_view).length} módulos con acceso`
                        : "Sin permisos configurados"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1 border-t border-border">
                    <Button
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => setManagingCollab(collab)}
                    >
                      <Shield className="h-3.5 w-3.5" />
                      Permisos
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeletingCollab(collab)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Create dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo colaborador</DialogTitle>
            <DialogDescription>
              Crea una cuenta para tu colaborador. Deberá cambiar su contraseña
              al primer inicio de sesión.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                Nombre completo <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Correo electrónico <span className="text-destructive">*</span>
              </Label>
              <Input
                type="email"
                placeholder="juan@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                placeholder="+57 300 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Contraseña temporal <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={createCollaborator.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                !name.trim() ||
                !email.trim() ||
                !password.trim() ||
                password.length < 8 ||
                createCollaborator.isPending
              }
            >
              {createCollaborator.isPending
                ? "Creando..."
                : "Crear colaborador"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={!!deletingCollab}
        onOpenChange={(open) => !open && setDeletingCollab(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Eliminar colaborador
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar a{" "}
              <span className="font-semibold text-foreground">
                {deletingCollab?.profile?.name}
              </span>
              ? Perderá acceso inmediatamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingCollab(null)}
              disabled={deleteCollaborator.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteCollaborator.isPending}
            >
              {deleteCollaborator.isPending ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
