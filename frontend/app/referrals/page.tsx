"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReferralsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground mb-6">
        <ArrowLeft className="size-4" />
        Back
      </Link>
      <h1 className="text-xl font-bold text-foreground mb-2">Earn $50 from referrals</h1>
      <p className="text-sm text-foreground-muted mb-6">
        Share your referral link with friends. When they sign up and complete their first purchase, you both earn $50.
      </p>
      <div className="rounded bg-surface-muted p-8 text-center">
        <p className="text-sm text-foreground-muted mb-4">Referral feature coming soon.</p>
        <Button className="rounded bg-brand-primary text-white hover:bg-brand-primary-hover" disabled>
          Copy referral link
        </Button>
      </div>
    </div>
  );
}
