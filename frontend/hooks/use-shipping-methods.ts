"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ShippingMethodInfo } from "@/types";

export interface ShippingConfig {
  methods: ShippingMethodInfo[];
  freeShippingOver: number | null;
}

let cache: Promise<ShippingConfig> | undefined;

/** Shipping methods + prices as configured in Admin → Settings → Shipping (cached per page load). */
export function fetchShippingConfig(force = false): Promise<ShippingConfig> {
  if (!cache || force) {
    cache = api.get<ShippingConfig>("/orders/shipping-methods").catch((e) => {
      cache = undefined; // retry next time
      throw e;
    });
  }
  return cache;
}

export function useShippingMethods() {
  const [config, setConfig] = useState<ShippingConfig | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchShippingConfig()
      .then((c) => !cancelled && setConfig(c))
      .catch(() => !cancelled && setConfig({ methods: [], freeShippingOver: null }));
    return () => {
      cancelled = true;
    };
  }, []);

  return { methods: config?.methods ?? [], freeShippingOver: config?.freeShippingOver ?? null, loading: config === null };
}
