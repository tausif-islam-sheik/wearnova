import { z } from "zod";
import { isValidPhone } from "@/lib/phone";
import type { Address } from "@/types";

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the recipient's full name").max(100),
  phone: z
    .string()
    .min(1, "Enter a phone number we can reach")
    .refine(isValidPhone, "Enter a valid phone number for the selected country"),
  street: z.string().trim().min(3, "Enter a street address").max(200),
  apt: z.string().trim().max(100).optional(),
  city: z.string().trim().min(1, "Select or enter a city").max(100),
  state: z.string().trim().min(1, "Select or enter a state or region").max(100),
  zip: z.string().trim().min(2, "Enter a ZIP / postal code").max(20),
  country: z.string().min(2, "Select a country"),
});

export type AddressFormValues = z.infer<typeof addressSchema>;

export const emptyAddress: AddressFormValues = {
  fullName: "",
  phone: "",
  street: "",
  apt: "",
  city: "",
  state: "",
  zip: "",
  country: "United States",
};

export function toFormValues(address: Address): AddressFormValues {
  return {
    fullName: address.fullName ?? "",
    phone: address.phone ?? "",
    street: address.street,
    apt: address.apt ?? "",
    city: address.city,
    state: address.state,
    zip: address.zip,
    country: address.country,
  };
}

/** Body for the API: drops empty optionals so DTO validation stays clean. */
export function toAddressPayload(values: AddressFormValues) {
  const { apt, ...rest } = values;
  return apt?.trim() ? { ...rest, apt: apt.trim() } : rest;
}

export function formatAddressLines(a: Address): string[] {
  return [
    a.fullName,
    [a.street, a.apt].filter(Boolean).join(", "),
    [a.city, a.state, a.zip].filter(Boolean).join(", "),
    a.country,
    a.phone,
  ].filter((l): l is string => Boolean(l));
}

export const money = (n: number) => `$${n.toFixed(2)}`;
