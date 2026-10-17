"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { fetchShippingConfig, type ShippingConfig } from "@/hooks/use-shipping-methods";
import { toast } from "sonner";
import type { ShippingMethodId, ShippingMethodInfo } from "@/types";

/** Form state keeps numbers as strings so the inputs can be edited freely. */
interface MethodForm {
  label: string;
  eta: string;
  price: string;
  enabled: boolean;
  freeEligible: boolean;
}

interface FormState {
  standard: MethodForm;
  express: MethodForm;
  freeOverEnabled: boolean;
  freeOver: string;
}

const METHOD_IDS: ShippingMethodId[] = ["standard", "express"];

const toForm = (config: ShippingConfig): FormState => {
  const byId = (id: ShippingMethodId): MethodForm => {
    const m = config.methods.find((x) => x.id === id) as ShippingMethodInfo;
    return { label: m.label, eta: m.eta, price: m.price.toFixed(2), enabled: m.enabled, freeEligible: m.freeEligible };
  };
  return {
    standard: byId("standard"),
    express: byId("express"),
    freeOverEnabled: config.freeShippingOver !== null,
    freeOver: config.freeShippingOver !== null ? config.freeShippingOver.toFixed(2) : "",
  };
};

const validPrice = (v: string) => v.trim() !== "" && Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) <= 500;

function validate(form: FormState): string | null {
  for (const id of METHOD_IDS) {
    const m = form[id];
    if (!m.label.trim()) return `Give the ${id} method a name.`;
    if (!m.eta.trim()) return `Add a delivery estimate for ${m.label}.`;
    if (!validPrice(m.price)) return `${m.label} price must be between $0 and $500.`;
  }
  if (!form.standard.enabled && !form.express.enabled) return "At least one shipping method must stay enabled.";
  if (form.freeOverEnabled && !(Number(form.freeOver) >= 1)) return "Enter a free-shipping threshold of at least $1.";
  return null;
}

export function ShippingSettings() {
  const [form, setForm] = useState<FormState | null>(null);
  const [saved, setSaved] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    fetchShippingConfig(true)
      .then((config) => {
        const next = toForm(config);
        setForm(next);
        setSaved(JSON.stringify(next));
      })
      .catch(() => toast.error("Failed to load shipping settings"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!form) {
    return (
      <Card className="border border-border/50">
        <CardContent className="space-y-4 p-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const dirty = JSON.stringify(form) !== saved;
  const problem = validate(form);

  const setMethod = (id: ShippingMethodId, patch: Partial<MethodForm>) =>
    setForm((f) => (f ? { ...f, [id]: { ...f[id], ...patch } } : f));

  const handleSave = async () => {
    if (problem) return toast.error(problem);
    setSaving(true);
    try {
      const body = {
        ...Object.fromEntries(
          METHOD_IDS.map((id) => [
            id,
            {
              label: form[id].label.trim(),
              eta: form[id].eta.trim(),
              price: Math.round(Number(form[id].price) * 100) / 100,
              enabled: form[id].enabled,
              freeEligible: form[id].freeEligible,
            },
          ])
        ),
        freeShippingOver: form.freeOverEnabled ? Math.round(Number(form.freeOver) * 100) / 100 : null,
      };
      const result = await api.put<ShippingConfig>("/orders/shipping-settings", body);
      await fetchShippingConfig(true).catch(() => undefined);
      const next = toForm(result);
      setForm(next);
      setSaved(JSON.stringify(next));
      toast.success("Shipping settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save shipping settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border border-border/50">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Truck className="size-4" /> Shipping
        </CardTitle>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Prices and options buyers see at checkout. The server calculates every order from these values, so changes
          apply to new quotes and orders straight away.
        </p>
      </CardHeader>

      <CardContent className="space-y-5 p-4">
        {METHOD_IDS.map((id) => {
          const m = form[id];
          return (
            <section
              key={id}
              aria-labelledby={`ship-${id}-title`}
              className={`space-y-4 rounded-md border border-border p-4 ${m.enabled ? "" : "bg-muted/30"}`}
            >
              <div className="flex items-center justify-between gap-4">
                <h3 id={`ship-${id}-title`} className="text-sm font-semibold capitalize text-foreground">
                  {id} method
                </h3>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`ship-${id}-enabled`} className="text-xs text-muted-foreground">
                    {m.enabled ? "Offered at checkout" : "Hidden from checkout"}
                  </Label>
                  <Switch
                    id={`ship-${id}-enabled`}
                    checked={m.enabled}
                    onCheckedChange={(v) => setMethod(id, { enabled: v })}
                    aria-label={`Offer ${id} shipping`}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor={`ship-${id}-label`} className="text-sm font-medium">
                    Name
                  </Label>
                  <Input
                    id={`ship-${id}-label`}
                    value={m.label}
                    maxLength={40}
                    onChange={(e) => setMethod(id, { label: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`ship-${id}-eta`} className="text-sm font-medium">
                    Delivery estimate
                  </Label>
                  <Input
                    id={`ship-${id}-eta`}
                    value={m.eta}
                    maxLength={60}
                    onChange={(e) => setMethod(id, { eta: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`ship-${id}-price`} className="text-sm font-medium">
                    Price
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                    <Input
                      id={`ship-${id}-price`}
                      type="number"
                      min={0}
                      max={500}
                      step="0.01"
                      inputMode="decimal"
                      value={m.price}
                      onChange={(e) => setMethod(id, { price: e.target.value })}
                      aria-invalid={!validPrice(m.price)}
                      className="h-9 pl-7"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-start justify-between gap-4 border-t border-border pt-3">
                <div>
                  <Label htmlFor={`ship-${id}-free`} className="text-sm font-medium">
                    Can be free
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Ships free when the seller offers free shipping
                    {form.freeOverEnabled ? " or the order reaches the free-shipping amount below" : ""}. Otherwise
                    the price above always applies.
                  </p>
                </div>
                <Switch
                  id={`ship-${id}-free`}
                  checked={m.freeEligible}
                  onCheckedChange={(v) => setMethod(id, { freeEligible: v })}
                  aria-label={`${id} can be free`}
                />
              </div>
            </section>
          );
        })}

        <section aria-labelledby="free-over-title" className="space-y-3 rounded-md border border-border p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 id="free-over-title" className="text-sm font-semibold text-foreground">
                Free shipping over an amount
              </h3>
              <p className="text-xs text-muted-foreground">
                Item totals at or above this amount ship free on methods marked &ldquo;Can be free&rdquo;.
              </p>
            </div>
            <Switch
              checked={form.freeOverEnabled}
              onCheckedChange={(v) => setForm((f) => (f ? { ...f, freeOverEnabled: v } : f))}
              aria-label="Enable free shipping over an amount"
            />
          </div>
          {form.freeOverEnabled && (
            <div className="relative w-40">
              <Label htmlFor="free-over" className="sr-only">
                Free shipping threshold
              </Label>
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <Input
                id="free-over"
                type="number"
                min={1}
                step="0.01"
                inputMode="decimal"
                value={form.freeOver}
                onChange={(e) => setForm((f) => (f ? { ...f, freeOver: e.target.value } : f))}
                className="h-9 pl-7"
              />
            </div>
          )}
        </section>

        {dirty && problem && (
          <p role="alert" className="text-xs text-destructive">
            {problem}
          </p>
        )}

        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <Button onClick={handleSave} disabled={saving || !dirty || Boolean(problem)} className="h-9">
            {saving && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            Save changes
          </Button>
          <Button
            variant="outline"
            className="h-9"
            disabled={saving || !dirty}
            onClick={() => setForm(JSON.parse(saved) as FormState)}
          >
            Discard changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
