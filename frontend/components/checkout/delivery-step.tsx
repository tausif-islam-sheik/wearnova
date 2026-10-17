"use client";

import { useState } from "react";
import { Loader2, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AddressForm } from "@/components/checkout/address-form";
import { ShippingMethodPicker } from "@/components/checkout/shipping-method";
import { NEW_ADDRESS } from "@/hooks/use-checkout";
import { formatAddressLines, toFormValues, type AddressFormValues } from "@/lib/checkout";
import { cn } from "@/lib/utils";
import type { Address, Quote, ShippingMethodId, ShippingMethodInfo } from "@/types";

const FORM_ID = "checkout-address-form";

interface DeliveryStepProps {
  saved: Address[] | null;
  selectedId: string;
  onSelect: (id: string) => void;
  methods: ShippingMethodInfo[];
  methodId: ShippingMethodId;
  onMethodChange: (id: ShippingMethodId) => void;
  quotes: Partial<Record<ShippingMethodId, Quote>>;
  quoteLoading: boolean;
  submitting: boolean;
  error: string | null;
  onContinueNew: (values: AddressFormValues, save: boolean) => void;
  onContinueSaved: (address: Address) => void;
  /** Pre-filled values when returning from the payment step. */
  initialValues?: AddressFormValues;
}

function SectionTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
      <span className="flex size-6 items-center justify-center rounded-full bg-foreground text-xs text-background">
        {n}
      </span>
      {children}
    </h2>
  );
}

export function DeliveryStep(props: DeliveryStepProps) {
  const { saved, selectedId, onSelect, submitting, error } = props;
  const [editing, setEditing] = useState(false);
  const isNew = selectedId === NEW_ADDRESS;
  const selectedAddress = saved?.find((a) => a.id === selectedId);
  const showForm = isNew || editing;

  return (
    <div className="space-y-8">
      <section aria-labelledby="delivery-address">
        <SectionTitle n={1}>
          <span id="delivery-address">Delivery address</span>
        </SectionTitle>

        {saved === null ? (
          <div className="space-y-2">
            <Skeleton className="h-24 w-full rounded" />
          </div>
        ) : saved.length === 0 ? null : (
          <RadioGroup value={selectedId} onValueChange={(v) => { setEditing(false); onSelect(v); }} aria-label="Delivery address">
            {saved.map((address) => {
              const selected = selectedId === address.id;
              return (
                <label
                  key={address.id}
                  htmlFor={`addr-${address.id}`}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded border p-4 transition-colors",
                    selected ? "border-foreground bg-muted/40" : "border-border hover:border-foreground/40"
                  )}
                >
                  <RadioGroupItem id={`addr-${address.id}`} value={address.id!} className="mt-1" />
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="mb-0.5 flex items-center gap-2 font-medium text-foreground">
                      <MapPin className="size-3.5 text-muted-foreground" />
                      {address.label || "Address"}
                      {address.isDefault && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          Default
                        </span>
                      )}
                    </span>
                    {formatAddressLines(address).map((line, i) => (
                      <span key={i} className="block text-muted-foreground">
                        {line}
                      </span>
                    ))}
                  </span>
                </label>
              );
            })}
            <label
              htmlFor="addr-new"
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded border border-dashed p-4 transition-colors",
                isNew ? "border-foreground bg-muted/40" : "border-border hover:border-foreground/40"
              )}
            >
              <RadioGroupItem id="addr-new" value={NEW_ADDRESS} />
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Plus className="size-4" /> Use a new address
              </span>
            </label>
          </RadioGroup>
        )}

        {saved !== null && showForm && (
          <div className={cn("rounded border border-border p-4", saved.length > 0 && "mt-4")}>
            <AddressForm
              key={isNew ? NEW_ADDRESS : selectedId}
              formId={FORM_ID}
              allowSave={isNew}
              defaultValues={
                isNew ? props.initialValues : selectedAddress ? toFormValues(selectedAddress) : undefined
              }
              onSubmit={(values, save) => props.onContinueNew(values, save)}
            />
          </div>
        )}
      </section>

      <section aria-labelledby="delivery-method">
        <SectionTitle n={2}>
          <span id="delivery-method">Shipping method</span>
        </SectionTitle>
        <ShippingMethodPicker
          methods={props.methods}
          value={props.methodId}
          onChange={props.onMethodChange}
          quotes={props.quotes}
          loading={props.quoteLoading}
        />
      </section>

      {error && (
        <p role="alert" className="rounded border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        {!isNew && selectedAddress && (
          <Button type="button" variant="outline" className="h-12 sm:px-6" onClick={() => setEditing((e) => !e)}>
            {editing ? "Close editor" : "Edit address"}
          </Button>
        )}
        {showForm ? (
          <Button type="submit" form={FORM_ID} className="h-12 flex-1 text-base font-semibold" disabled={submitting || props.quoteLoading}>
            {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Continue to payment
          </Button>
        ) : (
          <Button
            type="button"
            className="h-12 flex-1 text-base font-semibold"
            disabled={submitting || props.quoteLoading || !selectedAddress}
            onClick={() => selectedAddress && props.onContinueSaved(selectedAddress)}
          >
            {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Continue to payment
          </Button>
        )}
      </div>
    </div>
  );
}
