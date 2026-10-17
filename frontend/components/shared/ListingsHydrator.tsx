"use client";

import { useEffect, useRef } from "react";
import { useListingStore } from "@/stores/useListingStore";

export function ListingsHydrator() {
  const fetched = useRef(false);
  const fetchListings = useListingStore((s) => s.fetchListings);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchListings({ limit: 500 });
  }, [fetchListings]);

  return null;
}
