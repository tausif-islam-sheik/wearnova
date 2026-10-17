import {
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/min";

export type { CountryCode };

export interface PhoneCountry {
  code: CountryCode;
  name: string;
  dial: string;
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export const PHONE_COUNTRIES: PhoneCountry[] = getCountries()
  .map((code) => ({
    code,
    name: regionNames.of(code) ?? code,
    dial: getCountryCallingCode(code),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function getPhoneCountry(code: CountryCode): PhoneCountry {
  return PHONE_COUNTRIES.find((c) => c.code === code) ?? PHONE_COUNTRIES[0]!;
}

export function countryByName(name: string | undefined): PhoneCountry | undefined {
  return name ? PHONE_COUNTRIES.find((c) => c.name === name) : undefined;
}

/** The country a stored E.164 number belongs to (for the flag), if it can be told. */
export function countryOfNumber(value: string | undefined): CountryCode | undefined {
  if (!value) return undefined;
  return parsePhoneNumberFromString(value)?.country;
}

/** Digits typed in `country` -> E.164 when complete, otherwise a "+<dial><digits>" draft. */
export function toE164(country: CountryCode, text: string): string {
  const digits = text.replace(/\D/g, "");
  if (!digits) return "";
  const parsed = parsePhoneNumberFromString(text, country);
  if (parsed?.isValid()) return parsed.number;
  return `+${getCountryCallingCode(country)}${digits.replace(/^0+/, "")}`;
}

/** National part of a stored number, for pre-filling the input. */
export function nationalPart(value: string | undefined, country: CountryCode): string {
  if (!value) return "";
  const parsed = parsePhoneNumberFromString(value);
  if (parsed && parsed.country === country) return parsed.nationalNumber;
  const dial = `+${getCountryCallingCode(country)}`;
  return value.startsWith(dial) ? value.slice(dial.length) : "";
}

export const isValidPhone = (value: string) => isValidPhoneNumber(value);
