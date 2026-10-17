"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function DonationsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground mb-6">
        <ArrowLeft className="size-4" />
        Back
      </Link>
      <h1 className="text-xl font-bold text-foreground mb-2">Donations</h1>
      <p className="text-sm text-foreground-muted">
        Support causes you care about. Donate items or funds to verified charities.
      </p>
      <div className="mt-8 rounded bg-surface-muted p-8 text-center">
        <p className="text-sm text-foreground-muted">Donations feature coming soon.</p>
      </div>
    </div>
  );
}
