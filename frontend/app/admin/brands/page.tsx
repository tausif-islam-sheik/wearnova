"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, Building2, Package, PackageX, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable, type DataTableColumn, type RowAction } from "@/components/admin/DataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { LoadError } from "@/components/admin/LoadError";
import { TablePageSkeleton } from "@/components/admin/PageSkeletons";
import { api } from "@/lib/api";
import { StatCard, STAT_GRID } from "@/components/admin/StatCard";
import { runBatch, reportBatch } from "@/lib/batch";

interface BrandDto {
  id: string;
  name: string;
  slug: string;
  logoLetter: string;
  productCount: number;
  createdAt: string;
}

/** Form body; mounts fresh each time the dialog opens, so its state starts from `brand`. */
function BrandForm({
  brand,
  onClose,
  onSaved,
}: {
  brand: BrandDto | null;
  onClose: () => void;
  onSaved: (brand: BrandDto, isNew: boolean) => void;
}) {
  const [name, setName] = useState(brand?.name ?? "");
  const [slug, setSlug] = useState(brand?.slug ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Enter a brand name");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = { name: name.trim(), ...(slug.trim() ? { slug: slug.trim() } : {}) };
      const saved = brand
        ? await api.patch<BrandDto>(`/brands/${brand.id}`, body)
        : await api.post<BrandDto>("/brands", body);
      onSaved(saved, !brand);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the brand");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <DialogHeader>
        <DialogTitle>{brand ? "Edit brand" : "Add brand"}</DialogTitle>
        <DialogDescription>
          {brand
            ? "Renaming a brand also updates the brand shown on its listings."
            : "New brands become available when creating products."}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="brand-name">Name</Label>
        <Input
          id="brand-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          autoFocus
          aria-invalid={!!error}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="brand-slug">Slug</Label>
        <Input
          id="brand-slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="Generated from the name"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" disabled={saving} />}>Cancel</DialogClose>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {brand ? "Save changes" : "Add brand"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<BrandDto[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [dialogBrand, setDialogBrand] = useState<BrandDto | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BrandDto | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  useEffect(() => {
    api.get<BrandDto[]>("/brands")
      .then(setBrands)
      .catch(setError)
      .finally(() => setDataLoading(false));
  }, [reloadKey]);

  const openAdd = () => {
    setDialogBrand(null);
    setDialogOpen(true);
  };
  const openEdit = useCallback((brand: BrandDto) => {
    setDialogBrand(brand);
    setDialogOpen(true);
  }, []);

  const handleSaved = (saved: BrandDto, isNew: boolean) => {
    setBrands((prev) =>
      (isNew ? [...prev, saved] : prev.map((b) => (b.id === saved.id ? saved : b))).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    );
    toast.success(isNew ? `Added ${saved.name}` : `Saved ${saved.name}`);
  };

  const handleDelete = async (brand: BrandDto) => {
    try {
      await api.delete(`/brands/${brand.id}`);
      setBrands((prev) => prev.filter((b) => b.id !== brand.id));
      toast.success(`Deleted ${brand.name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't delete the brand");
      throw e;
    }
  };

  /** Brands still used by listings refuse to delete; the toast reports why for those. */
  const bulkDelete = async () => {
    const res = await runBatch(selectedKeys, (id) => api.delete(`/brands/${id}`));
    setBrands((prev) => prev.filter((b) => !res.succeeded.includes(b.id)));
    reportBatch("Deleted", "brand", res);
    setSelectedKeys(res.failed.map((f) => f.id));
  };

  const columns: DataTableColumn<Record<string, unknown>>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Brand",
        sortable: true,
        render: (row) => {
          const brand = row as unknown as BrandDto;
          return (
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted font-semibold text-sm text-foreground">
                {brand.logoLetter}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{brand.name}</p>
                <p className="text-xs text-muted-foreground">/{brand.slug}</p>
              </div>
            </div>
          );
        },
      },
      {
        key: "productCount",
        label: "Products",
        sortable: true,
        align: "right",
        render: (row) => {
          const brand = row as unknown as BrandDto;
          return (
            <Badge variant="outline" className="px-2.5 py-0.5 text-[10px] font-medium rounded-full tabular-nums">
              {brand.productCount}
            </Badge>
          );
        },
      },
    ],
    [],
  );

  const rowActions: RowAction<Record<string, unknown>>[] = useMemo(
    () => [
      { label: "Edit", icon: <Pencil className="size-3.5" />, onClick: (row) => openEdit(row as unknown as BrandDto) },
      {
        label: "Delete",
        icon: <Trash2 className="size-3.5" />,
        variant: "destructive",
        onClick: (row) => setDeleteTarget(row as unknown as BrandDto),
      },
    ],
    [openEdit],
  );

  const tableData = useMemo(() => brands.map((b) => b as unknown as Record<string, unknown>), [brands]);

  const topBrand = brands.reduce<BrandDto | null>(
    (best, b) => (b.productCount > (best?.productCount ?? 0) ? b : best),
    null,
  );

  if (dataLoading) return <TablePageSkeleton statCards={4} />;
  if (error && brands.length === 0) {
    return (
      <LoadError
        what="brands"
        error={error}
        onRetry={() => {
          setDataLoading(true);
          setError(null);
          setReloadKey((k) => k + 1);
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Brands</h1>
          <p className="text-sm text-muted-foreground mt-1">{brands.length} total brands</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="size-4" />
          Add brand
        </Button>
      </div>

      <div className={STAT_GRID}>
        <StatCard icon={Building2} label="Total brands" value={brands.length} iconBg="bg-blue-500/10" iconColor="text-blue-500" />
        <StatCard icon={Package} label="In use" value={brands.filter((b) => b.productCount > 0).length} iconBg="bg-emerald-500/10" iconColor="text-emerald-500" />
        <StatCard icon={PackageX} label="Unused" value={brands.filter((b) => b.productCount === 0).length} iconBg="bg-muted" iconColor="text-muted-foreground" />
        <StatCard
          icon={Trophy}
          label="Top brand"
          value={topBrand ? topBrand.name : "—"}
          trend={topBrand ? `${topBrand.productCount} listing${topBrand.productCount === 1 ? "" : "s"}` : undefined}
          trendColor="text-muted-foreground"
          iconBg="bg-warning/10"
          iconColor="text-warning"
        />
      </div>

      <DataTable
        columns={columns}
        data={tableData}
        selectable
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        exportFileName="brands"
        bulkActions={[{ label: "Delete", variant: "destructive", onClick: () => setBulkDeleteOpen(true) }]}
        searchPlaceholder="Search brands..."
        searchKeys={["name", "slug"]}
        emptyTitle="No brands found"
        emptyDescription="No brands match your search criteria"
        rowActions={rowActions}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <BrandForm brand={dialogBrand} onClose={() => setDialogOpen(false)} onSaved={handleSaved} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Delete ${selectedKeys.length} brand${selectedKeys.length === 1 ? "" : "s"}?`}
        description="Brands that are still used by listings can't be deleted and will be left in place."
        confirmLabel="Delete"
        onConfirm={bulkDelete}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete brand?"
        description={
          <>
            &ldquo;{deleteTarget?.name}&rdquo; will be removed. Brands that are still used by listings can&apos;t be
            deleted.
          </>
        }
        confirmLabel="Delete"
        onConfirm={() => (deleteTarget ? handleDelete(deleteTarget) : undefined)}
      />
    </div>
  );
}
