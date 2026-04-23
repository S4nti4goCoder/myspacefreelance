import { usePageTitle } from "@/hooks/usePageTitle";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  X,
  FileText,
  AlertTriangle,
  Archive,
  ArchiveRestore,
  Trash2,
  Pencil,
  Eye,
  ChevronDown,
  Filter,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { useQuotes, usePaginatedQuotes, useUpdateQuote, useDeleteQuote } from "@/hooks/useQuotes";
import { useCanAccess } from "@/hooks/useMyPermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatCOP, formatDate, downloadCSV } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import type { Quote, QuoteStatus } from "@/types";
import {
  QUOTE_STATUS_LABELS as statusLabels,
  QUOTE_STATUS_VARIANTS as statusVariants,
  QUOTE_STATUS_COLORS as statusColors,
} from "@/lib/constants";

function calculateTotal(quote: Quote): number {
  const items = quote.items ?? [];
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const discount =
    quote.discount_type === "percentage"
      ? subtotal * (quote.discount_value / 100)
      : quote.discount_value;
  const afterDiscount = subtotal - discount;
  const iva = quote.apply_iva ? afterDiscount * (quote.iva_rate / 100) : 0;
  const retefuente = quote.apply_retefuente
    ? afterDiscount * (quote.retefuente_rate / 100)
    : 0;
  const reteica = quote.apply_reteica
    ? afterDiscount * (quote.reteica_rate / 100)
    : 0;
  return afterDiscount + iva - retefuente - reteica;
}

export default function QuotesPage() {
  usePageTitle("Cotizaciones");
  const updateQuote = useUpdateQuote();
  const deleteQuote = useDeleteQuote();
  const navigate = useNavigate();

  const canCreate = useCanAccess("quotes", "can_create");
  const canEdit = useCanAccess("quotes", "can_edit");
  const canDelete = useCanAccess("quotes", "can_delete");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [deletingQuote, setDeletingQuote] = useState<Quote | null>(null);
  const [page, setPage] = useState(1);
  const filtersKey = `${search}|${statusFilter}|${showArchived}`;
  const [prevFiltersKey, setPrevFiltersKey] = useState(filtersKey);
  if (prevFiltersKey !== filtersKey) {
    setPrevFiltersKey(filtersKey);
    setPage(1);
  }

  const { data: paginatedData, isLoading } = usePaginatedQuotes({
    search,
    status: statusFilter as QuoteStatus | "all",
    showArchived,
    page,
  });

  // For archived count badge
  const { data: allQuotes } = useQuotes();

  const filtered = paginatedData?.quotes ?? [];
  const totalPages = paginatedData?.totalPages ?? 1;
  const totalItems = paginatedData?.total ?? 0;
  const pageSize = paginatedData?.pageSize ?? 12;

  const archivedCount = useMemo(
    () => allQuotes?.filter((q) => q.status === "archived").length ?? 0,
    [allQuotes],
  );

  const handleArchive = (quote: Quote) => {
    updateQuote.mutate({ id: quote.id, status: "archived" });
  };

  const handleUnarchive = (quote: Quote) => {
    updateQuote.mutate({ id: quote.id, status: "draft" });
  };

  const handleExportCSV = () => {
    if (!allQuotes || allQuotes.length === 0) {
      toast.error("No hay cotizaciones para exportar");
      return;
    }

    const s = search.trim().toLowerCase();
    const rows = allQuotes
      .filter((q) =>
        showArchived ? q.status === "archived" : q.status !== "archived",
      )
      .filter((q) =>
        !showArchived && statusFilter !== "all" ? q.status === statusFilter : true,
      )
      .filter((q) =>
        s
          ? q.quote_number.toLowerCase().includes(s) ||
            q.client_name.toLowerCase().includes(s) ||
            (q.client_company?.toLowerCase().includes(s) ?? false)
          : true,
      );

    if (rows.length === 0) {
      toast.error("No hay cotizaciones que coincidan con los filtros");
      return;
    }

    const headers = [
      "Número",
      "Cliente",
      "Empresa",
      "Estado",
      "Fecha",
      "Ítems",
      "Total",
    ];
    const csvRows = rows.map((q) => [
      q.quote_number,
      q.client_name,
      q.client_company ?? "",
      statusLabels[q.status] ?? q.status,
      formatDate(q.created_at),
      String(q.items?.length ?? 0),
      String(calculateTotal(q)),
    ]);

    const suffix = showArchived ? "archivadas" : "activas";
    downloadCSV(`cotizaciones-${suffix}.csv`, headers, csvRows);
    toast.success(
      `${rows.length} cotización${rows.length !== 1 ? "es" : ""} exportada${rows.length !== 1 ? "s" : ""}`,
    );
  };

  const handleDeleteConfirm = () => {
    if (!deletingQuote) return;
    deleteQuote.mutate(deletingQuote.id, {
      onSettled: () => setDeletingQuote(null),
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
          <h1 className="text-2xl font-bold text-foreground">
            {showArchived ? "Cotizaciones archivadas" : "Cotizaciones"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {totalItems} cotización{totalItems !== 1 ? "es" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="gap-2"
            title="Exportar a CSV"
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowArchived(!showArchived);
              setStatusFilter("all");
              setSearch("");
            }}
            className="gap-2"
          >
            {showArchived ? (
              <>
                <ArchiveRestore className="h-4 w-4" />
                Ver activas
              </>
            ) : (
              <>
                <Archive className="h-4 w-4" />
                Archivadas
                {archivedCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-xs px-1.5 py-0 h-4"
                  >
                    {archivedCount}
                  </Badge>
                )}
              </>
            )}
          </Button>
          {!showArchived && canCreate && (
            <Button
              onClick={() => navigate("/cotizaciones/nueva")}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Nueva cotización
            </Button>
          )}
        </div>
      </motion.div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, cliente o empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {!showArchived && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <Filter className="h-3.5 w-3.5" />
                {statusFilter === "all"
                  ? "Todos los estados"
                  : statusLabels[statusFilter]}
                {statusFilter !== "all" && (
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                )}
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                Todos los estados
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter("draft")}>
                Borrador
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("sent")}>
                Enviada
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("accepted")}>
                Aceptada
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("rejected")}>
                Rechazada
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
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
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">
            {showArchived
              ? "No hay cotizaciones archivadas"
              : search || statusFilter !== "all"
                ? "No hay cotizaciones con estos filtros"
                : "Aún no tienes cotizaciones"}
          </p>
          {!showArchived && !search && statusFilter === "all" && canCreate && (
            <Button
              variant="outline"
              onClick={() => navigate("/cotizaciones/nueva")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Crear primera cotización
            </Button>
          )}
        </motion.div>
      )}

      {/* Quotes list */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.map((quote, i) => {
            const total = calculateTotal(quote);
            const itemCount = quote.items?.length ?? 0;

            return (
              <motion.div
                key={quote.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.04 }}
                layout
              >
                <Card
                  className={`hover:border-primary/50 transition-colors ${showArchived ? "opacity-75 hover:opacity-100" : ""}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="bg-muted rounded-lg p-2 shrink-0">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-foreground">
                              {quote.quote_number}
                            </p>
                            <Badge variant={statusVariants[quote.status]}>
                              {statusLabels[quote.status]}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {quote.client_name}
                            {quote.client_company &&
                              ` · ${quote.client_company}`}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <p className="text-xs text-muted-foreground">
                              {formatDate(quote.created_at)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {itemCount} ítem{itemCount !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <p
                          className={`font-bold text-lg ${statusColors[quote.status]}`}
                        >
                          {formatCOP(total)}
                        </p>
                        <div className="flex gap-1">
                          {showArchived ? (
                            <>
                              {canEdit && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  title="Desarchivar"
                                  onClick={() => handleUnarchive(quote)}
                                >
                                  <ArchiveRestore className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => setDeletingQuote(quote)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Ver"
                                onClick={() =>
                                  navigate(`/cotizaciones/${quote.id}`)
                                }
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              {canEdit && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  title="Editar"
                                  onClick={() =>
                                    navigate(`/cotizaciones/${quote.id}/editar`)
                                  }
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {canEdit && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                      title="Cambiar estado"
                                    >
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      disabled
                                      className="text-xs text-muted-foreground"
                                    >
                                      Cambiar estado
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {(
                                      [
                                        "draft",
                                        "sent",
                                        "accepted",
                                        "rejected",
                                      ] as const
                                    )
                                      .filter((s) => s !== quote.status)
                                      .map((s) => (
                                        <DropdownMenuItem
                                          key={s}
                                          onClick={() =>
                                            updateQuote.mutate({
                                              id: quote.id,
                                              status: s,
                                            })
                                          }
                                        >
                                          {statusLabels[s]}
                                        </DropdownMenuItem>
                                      ))}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleArchive(quote)}
                                      className="text-muted-foreground"
                                    >
                                      <Archive className="h-3.5 w-3.5 mr-2" />
                                      Archivar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

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

      {/* Delete confirmation */}
      <Dialog
        open={!!deletingQuote}
        onOpenChange={(open) => !open && setDeletingQuote(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Eliminar cotización
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar{" "}
              <span className="font-semibold text-foreground">
                "{deletingQuote?.quote_number}"
              </span>
              ? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingQuote(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteQuote.isPending}
            >
              {deleteQuote.isPending ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
