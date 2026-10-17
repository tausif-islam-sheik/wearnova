"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AddressForm } from "@/components/checkout/address-form";
import { api } from "@/lib/api";
import { formatAddressLines, toAddressPayload, toFormValues, type AddressFormValues } from "@/lib/checkout";
import { toast } from "sonner";
import type { Address } from "@/types";

type Mode = { kind: "list" } | { kind: "add" } | { kind: "edit"; address: Address };

export function SavedAddresses() {
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const reload = useCallback(
    () =>
      api
        .get<Address[]>("/addresses")
        .then(setAddresses)
        .catch(() => {
          setAddresses([]);
          toast.error("Could not load your addresses");
        }),
    []
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  const save = async (values: AddressFormValues) => {
    setSaving(true);
    try {
      if (mode.kind === "edit") {
        await api.put(`/addresses/${mode.address.id}`, {
          ...toAddressPayload(values),
          label: mode.address.label ?? undefined,
          isDefault: mode.address.isDefault,
        });
      } else {
        await api.post("/addresses", toAddressPayload(values));
      }
      await reload();
      setMode({ kind: "list" });
      toast.success("Address saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save this address");
    } finally {
      setSaving(false);
    }
  };

  const makeDefault = async (address: Address) => {
    setBusyId(address.id!);
    try {
      await api.put(`/addresses/${address.id}`, {
        ...toAddressPayload(toFormValues(address)),
        label: address.label ?? undefined,
        isDefault: true,
      });
      await reload();
    } catch {
      toast.error("Could not update your default address");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (address: Address) => {
    setBusyId(address.id!);
    try {
      await api.delete(`/addresses/${address.id}`);
      await reload();
      toast.success("Address removed");
    } catch {
      toast.error("Could not remove this address");
    } finally {
      setBusyId(null);
      setConfirmDeleteId(null);
    }
  };

  if (mode.kind !== "list") {
    return (
      <div className="rounded border border-border p-5">
        <h3 className="mb-4 text-base font-semibold text-foreground">
          {mode.kind === "edit" ? "Edit address" : "Add an address"}
        </h3>
        <AddressForm
          key={mode.kind === "edit" ? mode.address.id : "add"}
          defaultValues={mode.kind === "edit" ? toFormValues(mode.address) : undefined}
          submitLabel="Save address"
          submitting={saving}
          onSubmit={save}
          onCancel={() => setMode({ kind: "list" })}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {addresses === null ? (
        <Skeleton className="h-28 w-full rounded" />
      ) : (
        addresses.map((address) => (
          <div key={address.id} className="flex flex-col gap-3 rounded border border-border p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 text-sm">
              <p className="mb-0.5 flex items-center gap-2 font-medium text-foreground">
                <MapPin className="size-3.5 text-muted-foreground" />
                {address.label || "Address"}
                {address.isDefault && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    Default
                  </span>
                )}
              </p>
              {formatAddressLines(address).map((line, i) => (
                <p key={i} className="text-muted-foreground">
                  {line}
                </p>
              ))}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {!address.isDefault && (
                <Button variant="outline" size="sm" disabled={busyId === address.id} onClick={() => makeDefault(address)}>
                  Set as default
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setMode({ kind: "edit", address })}>
                <Pencil className="mr-1 size-3.5" /> Edit
              </Button>
              {confirmDeleteId === address.id ? (
                <Button variant="destructive" size="sm" disabled={busyId === address.id} onClick={() => remove(address)}>
                  {busyId === address.id ? <Loader2 className="size-3.5 animate-spin" /> : "Confirm delete"}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Delete address"
                  onClick={() => setConfirmDeleteId(address.id!)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))
      )}

      {addresses && addresses.length === 0 && (
        <p className="text-sm text-muted-foreground">You haven&apos;t saved an address yet.</p>
      )}

      <button
        type="button"
        onClick={() => setMode({ kind: "add" })}
        className="flex w-full cursor-pointer items-center justify-between rounded border border-border px-6 py-5 text-left transition-colors hover:bg-muted/50"
      >
        <span className="text-sm font-medium text-foreground">Add an address</span>
        <Plus className="size-4 text-foreground-muted" strokeWidth={1.5} />
      </button>
    </div>
  );
}
