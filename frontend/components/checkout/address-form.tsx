"use client";

import { useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PhoneInput } from "@/components/ui/phone-input";
import { countryByName } from "@/lib/phone";
import { CountrySelect } from "@/components/ui/country-select";
import { ComboSelect } from "@/components/ui/combo-select";
import { useCities, useStates } from "@/hooks/use-geo";
import {
  addressSchema,
  emptyAddress,
  type AddressFormValues,
} from "@/lib/checkout";

interface AddressFormProps {
  defaultValues?: AddressFormValues;
  /** Lets an external button submit this form (`<button form={formId}>`). */
  formId?: string;
  submitLabel?: string;
  submitting?: boolean;
  /** Show a "save for next time" checkbox (checkout only). */
  allowSave?: boolean;
  onSubmit: (values: AddressFormValues, save: boolean) => void | Promise<void>;
  onCancel?: () => void;
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: (props: { id: string; invalid: boolean; describedBy?: string }) => React.ReactNode;
}) {
  const id = useId();
  return (
    <div className={className}>
      <Label htmlFor={id} className="mb-1.5 block text-sm">
        {label}
      </Label>
      {children({ id, invalid: Boolean(error), describedBy: error ? `${id}-error` : undefined })}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function AddressForm({
  defaultValues = emptyAddress,
  formId,
  submitLabel,
  submitting,
  allowSave,
  onSubmit,
  onCancel,
}: AddressFormProps) {
  const saveId = useId();
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AddressFormValues & { save: boolean }>({
    resolver: zodResolver(addressSchema) as never,
    defaultValues: { ...defaultValues, save: true },
    mode: "onTouched",
  });

  const country = watch("country");
  const save = watch("save");
  const state = watch("state");
  const countryIso = countryByName(country)?.code;
  const { items: states, loading: statesLoading } = useStates(countryIso);
  const stateCode = states.find((st) => st.name === state)?.code;
  const { items: cities, loading: citiesLoading } = useCities(countryIso, stateCode);
  // Countries without state data in the dataset fall back to free text.
  const hasStateList = statesLoading || states.length > 0;

  return (
    <form
      id={formId}
      noValidate
      onSubmit={handleSubmit(({ save: saveFlag, ...values }) => onSubmit(values, saveFlag))}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" error={errors.fullName?.message}>
          {({ id, invalid, describedBy }) => (
            <Input
              id={id}
              autoComplete="name"
              aria-invalid={invalid}
              aria-describedby={describedBy}
              {...register("fullName")}
            />
          )}
        </Field>
        <Field label="Phone" error={errors.phone?.message}>
          {({ id, invalid, describedBy }) => (
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <PhoneInput
                  // Re-mount while empty so the flag follows the chosen country.
                  key={field.value ? "typed" : country}
                  id={id}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  defaultCountry={countryByName(country)?.code ?? "US"}
                  placeholder="Phone number"
                  invalid={invalid}
                  describedBy={describedBy}
                />
              )}
            />
          )}
        </Field>
      </div>

      <Field label="Country" error={errors.country?.message}>
        {({ id, invalid }) => (
          <Controller
            control={control}
            name="country"
            render={({ field }) => (
              <CountrySelect
                id={id}
                value={field.value}
                invalid={invalid}
                onBlur={field.onBlur}
                onChange={(name) => {
                  field.onChange(name);
                  setValue("state", "");
                  setValue("city", "");
                }}
              />
            )}
          />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <Field label="Street address" error={errors.street?.message}>
          {({ id, invalid, describedBy }) => (
            <Input
              id={id}
              autoComplete="address-line1"
              aria-invalid={invalid}
              aria-describedby={describedBy}
              {...register("street")}
            />
          )}
        </Field>
        <Field label="Apt / suite (optional)" error={errors.apt?.message}>
          {({ id }) => <Input id={id} autoComplete="address-line2" {...register("apt")} />}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="State / region" error={errors.state?.message}>
          {({ id, invalid, describedBy }) =>
            hasStateList ? (
              <Controller
                control={control}
                name="state"
                render={({ field }) => (
                  <ComboSelect
                    id={id}
                    value={field.value}
                    options={states.map((st) => st.name)}
                    placeholder="Select state"
                    searchPlaceholder="Search state…"
                    loading={statesLoading}
                    allowCustom
                    invalid={invalid}
                    onBlur={field.onBlur}
                    onChange={(name) => {
                      field.onChange(name);
                      setValue("city", "");
                    }}
                  />
                )}
              />
            ) : (
              <Input
                id={id}
                autoComplete="address-level1"
                aria-invalid={invalid}
                aria-describedby={describedBy}
                {...register("state")}
              />
            )
          }
        </Field>
        <Field label="City" error={errors.city?.message}>
          {({ id, invalid, describedBy }) =>
            hasStateList && (!state || citiesLoading || cities.length > 0) ? (
              <Controller
                control={control}
                name="city"
                render={({ field }) => (
                  <ComboSelect
                    id={id}
                    value={field.value}
                    options={cities}
                    placeholder={state ? "Select city" : "Select a state first"}
                    searchPlaceholder="Search city…"
                    loading={citiesLoading}
                    disabled={!state}
                    allowCustom
                    invalid={invalid}
                    onBlur={field.onBlur}
                    onChange={field.onChange}
                  />
                )}
              />
            ) : (
              <Input
                id={id}
                autoComplete="address-level2"
                aria-invalid={invalid}
                aria-describedby={describedBy}
                {...register("city")}
              />
            )
          }
        </Field>
        <Field label="ZIP / postal code" error={errors.zip?.message}>
          {({ id, invalid, describedBy }) => (
            <Input
              id={id}
              autoComplete="postal-code"
              aria-invalid={invalid}
              aria-describedby={describedBy}
              {...register("zip")}
            />
          )}
        </Field>
      </div>

      {allowSave && (
        <div className="flex items-center gap-2">
          <Checkbox
            id={saveId}
            checked={save}
            onCheckedChange={(v) => setValue("save", v === true)}
          />
          <Label htmlFor={saveId} className="cursor-pointer text-sm font-normal">
            Save this address for next time
          </Label>
        </div>
      )}

      {submitLabel && (
        <div className="flex gap-3 pt-1">
          {onCancel && (
            <Button type="button" variant="outline" className="h-11 px-5" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" className="h-11 flex-1 font-semibold" disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            {submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}
