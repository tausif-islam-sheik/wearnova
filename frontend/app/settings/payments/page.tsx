"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SettingsNav } from "@/components/shared/SettingsNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, Wallet, ArrowRight, CheckCircle2, AlertCircle, Banknote } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { CopyButton } from "@/components/ui/copy-button";

interface ConnectStatus {
  accountId: string | null;
  onboardingComplete: boolean;
  payoutsEnabled: boolean;
}

interface PayoutRecord {
  id: string;
  productName: string;
  buyer: string;
  gross: number;
  fee: number;
  net: number;
  payout: string;
  date: string;
  status: string;
}

export default function PaymentsSettingsPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [payoutsLoading, setPayoutsLoading] = useState(true);

  useEffect(() => {
    const refreshed = searchParams.get("refresh") === "1";
    const success = searchParams.get("onboarding") === "success";
    if (success) toast.success("Payout setup complete");
    if (refreshed) toast.error("Payout setup was interrupted");
    api.get<ConnectStatus>("/stripe/connect/status")
      .then((res) => {
        setStatus(res);
        setLoading(false);
      })
      .catch(() => {
        setStatus({ accountId: null, onboardingComplete: false, payoutsEnabled: false });
        setLoading(false);
      });
    api.get<{ transactions: PayoutRecord[] }>("/transactions")
      .then((res) => setPayouts(res.transactions ?? []))
      .catch(() => {})
      .finally(() => setPayoutsLoading(false));
  }, [searchParams]);

  const startOnboarding = async () => {
    setStarting(true);
    try {
      const res = await api.post<{ url: string }>("/stripe/connect/onboard", {});
      window.location.href = res.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start payout setup");
    }
    setStarting(false);
  };

  const onboardingDone = Boolean(status?.onboardingComplete && status?.payoutsEnabled);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

      <div className="flex flex-col gap-12 md:flex-row">
        {/* Sidebar */}
        <aside className="w-full shrink-0 md:w-[220px]">
          <SettingsNav />
        </aside>

        {/* Main content */}
        <div className="flex-1 max-w-[800px]">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Wallet className="size-5 text-brand-primary" />
              Payouts &amp; Stripe Connect
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Receive your sale earnings directly to your bank account. Payouts
              are released after buyers confirm delivery.
            </p>
          </div>

          {/* Onboarding status */}
          <div className="mt-6 rounded-xl border border-border p-5">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Checking payout setup...
              </div>
            ) : onboardingDone ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-5 text-emerald-600" />
                    <p className="font-medium text-foreground">
                      Payouts are active
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your Stripe Connect account is fully onboarded. Sale
                    earnings will be transferred to your bank account.
                  </p>
                  <p className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-2 font-mono">
                    {status?.accountId}
                    <CopyButton value={status?.accountId ?? ""} />
                  </p>
                </div>
                <Button variant="outline" onClick={startOnboarding} disabled={starting}>
                  {starting && <Loader2 className="size-4 mr-1.5 animate-spin" />}
                  Update details
                </Button>
              </div>
            ) : status?.accountId ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="size-5 text-amber-600" />
                    <p className="font-medium text-foreground">
                      Payout setup incomplete
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Finish the remaining steps to start receiving payouts.
                    Buyers cannot complete a purchase from you until this is
                    done.
                  </p>
                </div>
                <Button
                  className="bg-brand-primary text-white hover:bg-brand-primary-hover"
                  onClick={startOnboarding}
                  disabled={starting}
                >
                  {starting ? (
                    <Loader2 className="size-4 mr-1.5 animate-spin" />
                  ) : (
                    <ArrowRight className="size-4 mr-1.5" />
                  )}
                  Continue setup
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-5 text-brand-primary" />
                    <p className="font-medium text-foreground">
                      Set up payouts to start selling
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Connect your bank account via Stripe. Verification takes a
                    few minutes and is required before buyers can pay you.
                  </p>
                </div>
                <Button
                  className="bg-brand-primary text-white hover:bg-brand-primary-hover"
                  onClick={startOnboarding}
                  disabled={starting}
                >
                  {starting ? (
                    <Loader2 className="size-4 mr-1.5 animate-spin" />
                  ) : (
                    <ArrowRight className="size-4 mr-1.5" />
                  )}
                  Connect Stripe
                </Button>
              </div>
            )}
          </div>

          {/* Payout history */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-foreground">
                Payout history
              </p>
              <span className="text-xs text-muted-foreground">
                Released after buyer confirmation
              </span>
            </div>

            {payoutsLoading ? (
              <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
                <Loader2 className="size-5 animate-spin mx-auto mb-2" />
                Loading payouts...
              </div>
            ) : payouts.length === 0 ? (
              <div className="rounded-xl border border-border p-8 text-center">
                <Banknote className="size-8 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
                <p className="text-sm font-medium text-foreground">
                  No payouts yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Earnings appear here once buyers confirm delivery of your
                  items.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border divide-y divide-border">
                {payouts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {p.productName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(p.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        · {p.buyer}
                      </p>
                      <p className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground mt-1 font-mono">
                        {p.payout}
                        <CopyButton value={p.payout} />
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-foreground">
                        ${p.net.toFixed(2)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Fee ${p.fee.toFixed(2)} · Gross ${p.gross.toFixed(2)}
                      </p>
                      <Badge variant="outline" className="mt-1 text-[10px] px-1.5 py-0">
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground leading-relaxed">
            <p className="flex items-center gap-1.5 font-medium text-foreground mb-1">
              <ShieldCheck className="size-3.5" />
              How escrow payouts work
            </p>
            <p>
              Buyer pays → funds held in escrow → you ship the item → buyer
              confirms receipt → the platform deducts its commission and
              transfers the remaining amount to your Stripe balance. Disputes
              are reviewed by our team before any funds move.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
