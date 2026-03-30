import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  User,
  Mail,
  Trash2,
  AlertTriangle,
  FolderKanban,
  X,
  Eye,
  EyeOff,
  RefreshCw,
  Phone,
  FileText,
  Pencil,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useClientAccounts,
  useRegisterClient,
  useUpdateClientProfile,
  useDeleteClientAccount,
  useClientProjects,
  useAssignProjectToClient,
  useRemoveProjectFromClient,
} from "@/hooks/useClientAccounts";
import { useProjects } from "@/hooks/useProjects";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Profile } from "@/types";

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
  return Array.from(
    { length: 12 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

function ClientProjectsManager({ client }: { client: Profile }) {
  const { data: clientProjects } = useClientProjects(client.id);
  const { data: allProjects } = useProjects();
  const assignProject = useAssignProjectToClient();
  const removeProject = useRemoveProjectFromClient();

  const assignedProjectIds = clientProjects?.map((cp) => cp.project_id) ?? [];
  const unassignedProjects =
    allProjects?.filter((p) => !assignedProjectIds.includes(p.id)) ?? [];

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">
        Proyectos asignados a {client.name}
      </p>

      {clientProjects?.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No tiene proyectos asignados aún
        </p>
      )}

      <div className="space-y-2">
        {clientProjects?.map((cp) => (
          <div
            key={cp.id}
            className="flex items-center justify-between p-2 bg-muted rounded-lg"
          >
            <div className="flex items-center gap-2">
              <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm">
                {(cp.project as { name: string })?.name ?? "Proyecto"}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:bg-destructive/10"
              onClick={() => removeProject.mutate(cp.id)}
              disabled={removeProject.isPending}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {unassignedProjects.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Asignar proyecto:</p>
          <div className="space-y-1">
            {unassignedProjects.map((project) => (
              <Button
                key={project.id}
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 h-8"
                onClick={() =>
                  assignProject.mutate({
                    projectId: project.id,
                    clientId: client.id,
                  })
                }
                disabled={assignProject.isPending}
              >
                <Plus className="h-3.5 w-3.5" />
                {project.name}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClientAccountsPage() {
  const { data: clients, isLoading } = useClientAccounts();
  const registerClient = useRegisterClient();
  const updateClient = useUpdateClientProfile();
  const deleteClient = useDeleteClientAccount();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Profile | null>(null);
  const [deletingClient, setDeletingClient] = useState<Profile | null>(null);
  const [managingClient, setManagingClient] = useState<Profile | null>(null);
  const [resetClient, setResetClient] = useState<Profile | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newResetPassword, setNewResetPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: generatePassword(),
    phone: "",
    notes: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    notes: "",
  });

  const handleOpenCreate = () => {
    setCreateForm({
      name: "",
      email: "",
      password: generatePassword(),
      phone: "",
      notes: "",
    });
    setShowPassword(false);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (client: Profile) => {
    setEditingClient(client);
    setEditForm({
      name: client.name,
      phone: client.phone ?? "",
      notes: client.notes ?? "",
    });
  };

  const handleOpenReset = (client: Profile) => {
    setResetClient(client);
    setNewResetPassword(generatePassword());
    setShowResetPassword(false);
  };

  const handleCreate = () => {
    if (
      !createForm.name.trim() ||
      !createForm.email.trim() ||
      !createForm.password
    )
      return;
    registerClient.mutate(
      {
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        phone: createForm.phone.trim() || undefined,
        notes: createForm.notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          toast.success(
            `Cliente ${createForm.name} registrado. Comparte las credenciales de forma segura.`,
          );
        },
      },
    );
  };

  const handleUpdate = () => {
    if (!editingClient || !editForm.name.trim()) return;
    updateClient.mutate(
      {
        id: editingClient.id,
        name: editForm.name.trim(),
        phone: editForm.phone.trim() || undefined,
        notes: editForm.notes.trim() || undefined,
      },
      {
        onSuccess: () => setEditingClient(null),
      },
    );
  };

  const handleDeleteConfirm = () => {
    if (!deletingClient) return;
    deleteClient.mutate(deletingClient.id, {
      onSettled: () => setDeletingClient(null),
    });
  };

  const handleCopyCredentials = () => {
    const text = `Credenciales de acceso — MySpaceFreelance\nEmail: ${createForm.email}\nContraseña: ${createForm.password}\nURL: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    toast.success("Credenciales copiadas al portapapeles");
  };

  const handleCopyResetCredentials = () => {
    const text = `Credenciales actualizadas — MySpaceFreelance\nEmail: ${resetClient?.email}\nNueva contraseña: ${newResetPassword}\nURL: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    toast.success("Credenciales copiadas al portapapeles");
  };

  const handleResetPassword = async () => {
    if (!resetClient) return;
    setIsResetting(true);

    const { error } = await supabase.rpc("reset_client_password", {
      client_id: resetClient.id,
      new_password: newResetPassword,
    });

    if (error) {
      toast.error(error.message || "Error al restablecer la contraseña");
    } else {
      await supabase
        .from("profiles")
        .update({ password_changed: false })
        .eq("id", resetClient.id);

      toast.success(
        "Contraseña restablecida. El cliente deberá cambiarla en su próximo inicio de sesión.",
      );
      setResetClient(null);
    }
    setIsResetting(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Cuentas de clientes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {clients?.length ?? 0} cliente{clients?.length !== 1 ? "s" : ""}{" "}
            registrado{clients?.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Registrar cliente
        </Button>
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && clients?.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 gap-3"
        >
          <div className="bg-muted rounded-full p-4">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">
            No hay clientes registrados
          </p>
          <Button variant="outline" onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Registrar primer cliente
          </Button>
        </motion.div>
      )}

      {/* Clients grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients?.map((client, i) => (
          <motion.div
            key={client.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-full p-2 shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {client.name}
                      </p>
                      <Badge variant="secondary" className="text-xs mt-0.5">
                        Cliente
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleOpenEdit(client)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-blue-500 hover:text-blue-500 hover:bg-blue-500/10"
                      onClick={() => handleOpenReset(client)}
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeletingClient(client)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.notes && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{client.notes}</span>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => setManagingClient(client)}
                >
                  <FolderKanban className="h-3.5 w-3.5" />
                  Gestionar proyectos
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Create dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Nombre completo"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                type="email"
                placeholder="cliente@email.com"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                placeholder="+57 300 000 0000"
                value={createForm.phone}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, phone: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                placeholder="Información adicional..."
                value={createForm.notes}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, notes: e.target.value }))
                }
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Contraseña generada</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={createForm.password}
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, password: e.target.value }))
                    }
                    className="pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setCreateForm((p) => ({
                      ...p,
                      password: generatePassword(),
                    }))
                  }
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Generada automáticamente. Puedes cambiarla o regenerarla.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={handleCopyCredentials}
              type="button"
            >
              Copiar credenciales para compartir
            </Button>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={registerClient.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                !createForm.name.trim() ||
                !createForm.email.trim() ||
                !createForm.password ||
                registerClient.isPending
              }
            >
              {registerClient.isPending
                ? "Registrando..."
                : "Registrar cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={!!editingClient}
        onOpenChange={(open) => !open && setEditingClient(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Nombre completo"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                placeholder="+57 300 000 0000"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, phone: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                placeholder="Información adicional..."
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, notes: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingClient(null)}
              disabled={updateClient.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!editForm.name.trim() || updateClient.isPending}
            >
              {updateClient.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog
        open={!!resetClient}
        onOpenChange={(open) => !open && setResetClient(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Restablecer contraseña</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Se generará una nueva contraseña para{" "}
              <span className="font-semibold text-foreground">
                {resetClient?.name}
              </span>
              . El cliente deberá cambiarla en su próximo inicio de sesión.
            </p>
            <div className="space-y-2">
              <Label>Nueva contraseña generada</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showResetPassword ? "text" : "password"}
                    value={newResetPassword}
                    onChange={(e) => setNewResetPassword(e.target.value)}
                    className="pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword((p) => !p)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showResetPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setNewResetPassword(generatePassword())}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={handleCopyResetCredentials}
              type="button"
            >
              Copiar credenciales para compartir
            </Button>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetClient(null)}
              disabled={isResetting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={!newResetPassword || isResetting}
            >
              {isResetting ? "Restableciendo..." : "Restablecer contraseña"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage projects dialog */}
      <Dialog
        open={!!managingClient}
        onOpenChange={(open) => !open && setManagingClient(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gestionar proyectos</DialogTitle>
          </DialogHeader>
          {managingClient && <ClientProjectsManager client={managingClient} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setManagingClient(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={!!deletingClient}
        onOpenChange={(open) => !open && setDeletingClient(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Eliminar cliente
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la cuenta de{" "}
              <span className="font-semibold text-foreground">
                {deletingClient?.name}
              </span>
              ? Perderá acceso a todos los proyectos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingClient(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteClient.isPending}
            >
              {deleteClient.isPending ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
