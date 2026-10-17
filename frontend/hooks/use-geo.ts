"use client";

import { useEffect, useState } from "react";
import { getCitiesOfState, getStatesOfCountry } from "@countrystatecity/countries-browser";

export interface GeoState {
  name: string;
  code: string;
}

// Per-session cache so reopening the form (or switching back) doesn't refetch.
const statesCache = new Map<string, GeoState[]>();
const citiesCache = new Map<string, string[]>();

/** Fetch keyed by `key`; `loading` stays true until that key's data arrived. */
function useLazyList<T>(key: string | null, load: () => Promise<T[]>, cache: Map<string, T[]>) {
  const [result, setResult] = useState<{ key: string; items: T[] } | null>(null);

  useEffect(() => {
    if (!key || cache.has(key)) return;
    let cancelled = false;
    load()
      .catch(() => [] as T[]) // offline / CDN hiccup -> callers fall back to free text
      .then((items) => {
        if (!cancelled) {
          cache.set(key, items);
          setResult({ key, items });
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `load` is derived from `key`
  }, [key]);

  if (!key) return { items: [] as T[], loading: false };
  const cached = cache.get(key);
  if (cached) return { items: cached, loading: false };
  return { items: result?.key === key ? result.items : [], loading: true };
}

const unique = (names: string[]) => Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));

/** States / provinces of a country (ISO-2 code). Empty list => country has none in the dataset. */
export function useStates(countryCode: string | undefined) {
  return useLazyList<GeoState>(
    countryCode ?? null,
    async () =>
      (await getStatesOfCountry(countryCode!))
        .map((s) => ({ name: s.name, code: s.iso2 }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    statesCache
  );
}

/** Cities of a state. Empty list => none known, so the UI should accept free text. */
export function useCities(countryCode: string | undefined, stateCode: string | undefined) {
  const key = countryCode && stateCode ? `${countryCode}:${stateCode}` : null;
  return useLazyList<string>(
    key,
    async () => unique((await getCitiesOfState(countryCode!, stateCode!)).map((c) => c.name)),
    citiesCache
  );
}
