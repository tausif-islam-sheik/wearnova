"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Power, Trash2, TicketPercent, CheckCircle2, ShoppingCart, Ban } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
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
import { cn } from "@/lib/utils";
import { StatCard, STAT_GRID } from "@/components/admin/StatCard";
import { runBatch, reportBatch } from "@/lib/batch";

type PromoType = "percent" | "fixed" | "free_shipping";
type PromoStatus = "active" | "inactive" | "expired" | "exhausted";

interface PromoDto {
  id: string;
  code: string;
  type: PromoType;
  value: number;
  minOrder: number | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  active: boolean;
  status: PromoStatus;
  createdAt: string;
}

const STATUS_STYLES: Record<PromoStatus, string> = {
  active: "border-success/20 bg-success/10 text-success",
  inactive: "border-border bg-muted text-muted-foreground",
  expired: "border-warning/20 bg-warning/10 text-warning",
  exhausted: "border-warning/20 bg-warning/10 text-warning",
};

function describe(p: Pick<PromoDto, "type" | "value">) {
  if (p.type === "percent") return `${p.value}% off`;
  if (p.type === "fixed") return `$${p.value.toFixed(2)} off`;
  return "Free shipping";
}

function toDateInput(iso: string | null) {
  return iso ? iso.slice(0, 10) : "";
}

/** Form body; mounts fresh each time the dialog opens. `promo` null means "add". */
function PromoForm({
  promo,
  onClose,
  onSaved,
}: {
  promo: PromoDto | null;
  onClose: () => void;
  onSaved: (promo: PromoDto, isNew: boolean) => void;
}) {
  const [code, setCode] = useState(promo?.code ?? "");
  const [type, setType] = useState<PromoType>(promo?.type ?? "percent");
  const [value, setValue] = useState(promo && promo.type !== "free_shipping" ? String(promo.value) : "");
  const [minOrder, setMinOrder] = useState(promo?.minOrder != null ? String(promo.minOrder) : "");
  const [maxUses, setMaxUses] = useState(promo?.maxUses != null ? String(promo.maxUses) : "");
  const [expiresAt, setExpiresAt] = useState(toDateInput(promo?.expiresAt ?? null));
  const [active, setActive] = useState(promo?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const used = (promo?.usedCount ?? 0) > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type !== "free_shipping" && !value.trim()) {
      setError(type === "percent" ? "Enter a percentage" : "Enter a discount amount");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = {
        code: code.trim(),
        type,
        value: type === "free_shipping" ? 0 : Number(value),
        minOrder: minOrder.trim() === "" ? null : Number(minOrder),
        maxUses: maxUses.trim() === "" ? null : Number(maxUses),
        expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : null,
        active,
      };
      const saved = promo
        ? await api.patch<PromoDto>(`/promos/${promo.id}`, body)
        : await api.post<PromoDto>("/promos", body);
      onSaved(saved, !promo);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the promo code");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <DialogHeader>
        <DialogTitle>{promo ? "Edit promo code" : "New promo code"}</DialogTitle>
        <DialogDescription>Customers enter the code at checkout. Codes aren&apos;t case sensitive.</DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="promo-code">Code</Label>
        <Input
          id="promo-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={24}
          autoFocus={!promo}
          disabled={used}
          placeholder="SUMMER20"
          className="font-mono uppercase"
        />
        {used && <p className="text-xs text-muted-foreground">Used codes can&apos;t be renamed.</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="promo-type">Discount type</Label>
          <NativeSelect
            id="promo-type"
            className="w-full"
            value={type}
            onChange={(e) => setType(e.target.value as PromoType)}
          >
            <NativeSelectOption value="percent">Percentage off</NativeSelectOption>
            <NativeSelectOption value="fixed">Fixed amount off</NativeSelectOption>
            <NativeSelectOption value="free_shipping">Free shipping</NativeSelectOption>
          </NativeSelect>
        </div>
        {type !== "free_shipping" && (
          <div className="space-y-2">
            <Label htmlFor="promo-value">{type === "percent" ? "Percentage (1–100)" : "Amount ($)"}</Label>
            <Input
              id="promo-value"
              type="number"
              inputMode="decimal"
              min={0}
              step={type === "percent" ? 1 : 0.5}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="promo-min">Min. order ($)</Label>
          <Input
            id="promo-min"
            type="number"
            inputMode="decimal"
            min={0}
            step={0.5}
            value={minOrder}
            onChange={(e) => setMinOrder(e.target.value)}
            placeholder="None"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="promo-max">Max uses</Label>
          <Input
            id="promo-max"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            placeholder="Unlimited"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="promo-expires">Expires</Label>
          <Input id="promo-expires" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="size-4 accent-[var(--primary)]"
        />
        Active (customers can use it)
      </label>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" disabled={saving} />}>Cancel</DialogClose>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {promo ? "Save changes" : "Create code"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function PromosPage() {
  const [promos, setPromos] = useState<PromoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogPromo, setDialogPromo] = useState<PromoDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PromoDto | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  useEffect(() => {
    api.get<PromoDto[]>("/promos")
      .then(setPromos)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [reloadKey]);

  const openAdd = () => {
    setDialogPromo(null);
    setDialogOpen(true);
  };
  const openEdit = useCallback((promo: PromoDto) => {
    setDialogPromo(promo);
    setDialogOpen(true);
  }, []);

  const handleSaved = (saved: PromoDto, isNew: boolean) => {
    setPromos((prev) => (isNew ? [saved, ...prev] : prev.map((p) => (p.id === saved.id ? saved : p))));
    toast.success(isNew ? `Created ${saved.code}` : `Saved ${saved.code}`);
  };

  const toggleActive = useCallback(async (promo: PromoDto) => {
    try {
      const saved = await api.patch<PromoDto>(`/promos/${promo.id}`, { active: !promo.active });
      setPromos((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
      toast.success(saved.active ? `${saved.code} is active` : `${saved.code} was deactivated`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't update the promo code");
    }
  }, []);

  const handleDelete = async (promo: PromoDto) => {
    try {
      await api.delete(`/promos/${promo.id}`);
      setPromos((prev) => prev.filter((p) => p.id !== promo.id));
      toast.success(`Deleted ${promo.code}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't delete the promo code");
      throw e;
    }
  };

  const bulkSetActive = async (active: boolean) => {
    const targets = promos.filter((p) => selectedKeys.includes(p.id) && p.active !== active).map((p) => p.id);
    if (targets.length === 0) {
      toast.info(active ? "Those codes are already active" : "Those codes are already inactive");
      setSelectedKeys([]);
      return;
    }
    const res = await runBatch(targets, (id) => api.patch(`/promos/${id}`, { active }));
    reportBatch(active ? "Activated" : "Deactivated", "promo code", res);
    setSelectedKeys([]);
    setReloadKey((k) => k + 1);
  };

  /** Codes that customers have already used can't be deleted; the toast says so for those. */
  const bulkDelete = async () => {
    const res = await runBatch(selectedKeys, (id) => api.delete(`/promos/${id}`));
    setPromos((prev) => prev.filter((p) => !res.succeeded.includes(p.id)));
    reportBatch("Deleted", "promo code", res);
    setSelectedKeys(res.failed.map((f) => f.id));
  };

  const columns: DataTableColumn<Record<string, unknown>>[] = useMemo(
    () => [
      {
        key: "code",
        label: "Code",
        sortable: true,
        render: (row) => <span className="font-mono text-sm font-semibold">{(row as unknown as PromoDto).code}</span>,
      },
      {
        key: "type",
        label: "Discount",
        render: (row) => <span className="text-sm">{describe(row as unknown as PromoDto)}</span>,
      },
      {
        key: "minOrder",
        label: "Min. order",
        sortable: true,
        sortValue: (row) => (row as unknown as PromoDto).minOrder ?? 0,
        render: (row) => {
          const p = row as unknown as PromoDto;
          return (
            <span className="text-sm text-muted-foreground">{p.minOrder != null ? `$${p.minOrder.toFixed(2)}` : "—"}</span>
          );
        },
      },
      {
        key: "usedCount",
        label: "Used",
        sortable: true,
        render: (row) => {
          const p = row as unknown as PromoDto;
          return (
            <span className="text-sm tabular-nums">
              {p.usedCount}
              <span className="text-muted-foreground"> / {p.maxUses ?? "∞"}</span>
            </span>
          );
        },
      },
      {
        key: "expiresAt",
        label: "Expires",
        sortable: true,
        sortValue: (row) => {
          const p = row as unknown as PromoDto;
          return p.expiresAt ? new Date(p.expiresAt).getTime() : Number.MAX_SAFE_INTEGER;
        },
        render: (row) => {
          const p = row as unknown as PromoDto;
          return (
            <span className="text-sm text-muted-foreground">
              {p.expiresAt
                ? new Date(p.expiresAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                : "Never"}
            </span>
          );
        },
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        render: (row) => {
          const p = row as unknown as PromoDto;
          return (
            <Badge variant="outline" className={cn("capitalize", STATUS_STYLES[p.status])}>
              {p.status}
            </Badge>
          );
        },
      },
    ],
    [],
  );

  const rowActions: RowAction<Record<string, unknown>>[] = useMemo(
    () => [
      { label: "Edit", icon: <Pencil className="size-3.5" />, onClick: (row) => openEdit(row as unknown as PromoDto) },
      {
        label: "Deactivate",
        icon: <Power className="size-3.5" />,
        hidden: (row) => !(row as unknown as PromoDto).active,
        onClick: (row) => void toggleActive(row as unknown as PromoDto),
      },
      {
        label: "Activate",
        icon: <Power className="size-3.5" />,
        hidden: (row) => (row as unknown as PromoDto).active,
        onClick: (row) => void toggleActive(row as unknown as PromoDto),
      },
      {
        label: "Delete",
        icon: <Trash2 className="size-3.5" />,
        variant: "destructive",
        onClick: (row) => setDeleteTarget(row as unknown as PromoDto),
      },
    ],
    [openEdit, toggleActive],
  );

  const tableData = useMemo(() => promos.map((p) => p as unknown as Record<string, unknown>), [promos]);

  if (loading) return <TablePageSkeleton statCards={0} />;
  if (error && promos.length === 0) {
    return (
      <LoadError
        what="promo codes"
        error={error}
        onRetry={() => {
          setLoading(true);
          setError(null);
          setReloadKey((k) => k + 1);
        }}
      />
    );
  }

  const activeCount = promos.filter((p) => p.status === "active").length;
  const redemptions = promos.reduce((sum, p) => sum + p.usedCount, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Promo codes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {promos.length} codes · {activeCount} currently usable
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="size-4" />
          New code
        </Button>
      </div>

      <div className={STAT_GRID}>
        <StatCard icon={TicketPercent} label="Total codes" value={promos.length} iconBg="bg-blue-500/10" iconColor="text-blue-500" />
        <StatCard icon={CheckCircle2} label="Usable now" value={activeCount} iconBg="bg-emerald-500/10" iconColor="text-emerald-500" />
        <StatCard icon={ShoppingCart} label="Times redeemed" value={redemptions.toLocaleString()} iconBg="bg-warning/10" iconColor="text-warning" />
        <StatCard icon={Ban} label="Inactive or expired" value={promos.length - activeCount} iconBg="bg-muted" iconColor="text-muted-foreground" />
      </div>

      <DataTable
        columns={columns}
        data={tableData}
        selectable
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        exportFileName="promo-codes"
        bulkActions={[
          { label: "Activate", variant: "outline", onClick: () => void bulkSetActive(true) },
          { label: "Deactivate", variant: "outline", onClick: () => void bulkSetActive(false) },
          { label: "Delete", variant: "destructive", onClick: () => setBulkDeleteOpen(true) },
        ]}
        searchPlaceholder="Search codes..."
        searchKeys={["code"]}
        emptyTitle="No promo codes yet"
        emptyDescription="Create a code to offer customers a discount at checkout."
        rowActions={rowActions}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <PromoForm promo={dialogPromo} onClose={() => setDialogOpen(false)} onSaved={handleSaved} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Delete ${selectedKeys.length} promo code${selectedKeys.length === 1 ? "" : "s"}?`}
        description="Codes that customers have already used can't be deleted; deactivate those instead."
        confirmLabel="Delete"
        onConfirm={bulkDelete}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete promo code?"
        description={
          <>
            <span className="font-mono">{deleteTarget?.code}</span> will stop working immediately. Codes that
            customers have already used can&apos;t be deleted, so deactivate those instead.
          </>
        }
        confirmLabel="Delete"
        onConfirm={() => (deleteTarget ? handleDelete(deleteTarget) : undefined)}
      />
    </div>
  );
}
