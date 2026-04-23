import { usePageTitle } from "@/hooks/usePageTitle";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Briefcase,
  Search,
  X,
  Tag,
} from "lucide-react";
import {
  useServices,
  usePaginatedServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
} from "@/hooks/useServices";
import { useCanAccess } from "@/hooks/useMyPermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { formatCOP } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { ServiceForm, type ServiceFormData } from "@/components/shared/ServiceForm";
import type { Service } from "@/types";

const emptyForm: ServiceFormData = {
  name: "",
  description: "",
  price: "",
  category: "",
};

const EMPTY_SERVICES: Service[] = [];

export default function ServicesPage() {
  usePageTitle("Servicios");
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const canCreate = useCanAccess("services", "can_create");
  const canEdit = useCanAccess("services", "can_edit");
  const canDelete = useCanAccess("services", "can_delete");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceFormData>(emptyForm);
  const [prevSearch, setPrevSearch] = useState(search);
  if (prevSearch !== search) {
    setPrevSearch(search);
    setPage(1);
  }

  const { data: paginatedData, isLoading } = usePaginatedServices({ search, page });
  const { data: allServices } = useServices();

  const filtered = paginatedData?.services ?? EMPTY_SERVICES;
  const totalPages = paginatedData?.totalPages ?? 1;
  const totalItems = paginatedData?.total ?? 0;
  const pageSize = paginatedData?.pageSize ?? 12;

  const categories = useMemo(() => {
    if (!allServices) return [];
    const cats = allServices
      .map((s) => s.category)
      .filter((c): c is string => !!c);
    return [...new Set(cats)].sort();
  }, [allServices]);

  const grouped = useMemo(() => {
    const withCategory = filtered.filter((s) => s.category);
    const withoutCategory = filtered.filter((s) => !s.category);
    const groups: Record<string, Service[]> = {};
    withCategory.forEach((s) => {
      const cat = s.category!;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    });
    if (withoutCategory.length > 0) groups["Sin categoría"] = withoutCategory;
    return groups;
  }, [filtered]);

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (service: Service) => {
    setEditingService(service);
    setForm({
      name: service.name,
      description: service.description ?? "",
      price: service.price.toString(),
      category: service.category ?? "",
    });
  };

  const handleCreate = () => {
    if (!form.name.trim() || !form.price) return;
    createService.mutate(
      {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: parseFloat(form.price),
        category: form.category.trim() || null,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setForm(emptyForm);
        },
      },
    );
  };

  const handleUpdate = () => {
    if (!editingService || !form.name.trim() || !form.price) return;
    updateService.mutate(
      {
        id: editingService.id,
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: parseFloat(form.price),
        category: form.category.trim() || null,
      },
      { onSuccess: () => setEditingService(null) },
    );
  };

  const handleDeleteConfirm = () => {
    if (!deletingService) return;
    deleteService.mutate(deletingService.id, {
      onSettled: () => setDeletingService(null),
    });
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
          <h1 className="text-2xl font-bold text-foreground">Mis servicios</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {totalItems} servicio
            {totalItems !== 1 ? "s" : ""} en tu catálogo
          </p>
        </div>
        {canCreate && (
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo servicio
          </Button>
        )}
      </motion.div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, descripción o categoría..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-9"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 gap-3"
        >
          <div className="bg-muted rounded-full p-4">
            <Briefcase className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">
            {search
              ? "No hay servicios con esa búsqueda"
              : "Aún no tienes servicios en tu catálogo"}
          </p>
          {!search && canCreate && (
            <Button variant="outline" onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar primer servicio
            </Button>
          )}
        </motion.div>
      )}

      {/* Services grouped by category */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {category}
                </h2>
                <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
                  {items.length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {items.map((service, i) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    layout
                  >
                    <Card className="hover:border-primary/50 transition-colors">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-foreground truncate">
                            {service.name}
                          </p>
                          <p className="text-sm font-bold text-primary shrink-0">
                            {formatCOP(service.price)}
                          </p>
                        </div>
                        {service.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {service.description}
                          </p>
                        )}
                        {(canEdit || canDelete) && (
                          <div className="flex items-center justify-end gap-1 pt-1 border-t border-border">
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                aria-label="Editar servicio"
                                onClick={() => handleOpenEdit(service)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                aria-label="Eliminar servicio"
                                onClick={() => setDeletingService(service)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && filtered.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={totalItems}
          pageSize={pageSize}
        />
      )}

      {/* Create dialog */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setForm(emptyForm);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo servicio</DialogTitle>
          </DialogHeader>
          <ServiceForm form={form} setForm={setForm} categories={categories} />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setForm(emptyForm);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                !form.name.trim() || !form.price || createService.isPending
              }
            >
              {createService.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={!!editingService}
        onOpenChange={(open) => {
          if (!open) setEditingService(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar servicio</DialogTitle>
          </DialogHeader>
          <ServiceForm form={form} setForm={setForm} categories={categories} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingService(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={
                !form.name.trim() || !form.price || updateService.isPending
              }
            >
              {updateService.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={!!deletingService}
        onOpenChange={(open) => {
          if (!open) setDeletingService(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Eliminar servicio
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar{" "}
              <span className="font-semibold text-foreground">
                "{deletingService?.name}"
              </span>
              ? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingService(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteService.isPending}
            >
              {deleteService.isPending ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
