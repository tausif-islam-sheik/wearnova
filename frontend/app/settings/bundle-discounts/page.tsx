"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SettingsNav } from "@/components/shared/SettingsNav";
import { SecurityBanner } from "@/components/shared/SecurityBanner";

const tierLabels = ["2 items", "3 items", "5 items"];

export default function BundleDiscountsPage() {
  const [bundleDiscountsEnabled, setBundleDiscountsEnabled] = useState(false);
  const [tierPercentages, setTierPercentages] = useState(["5%", "10%", "20%"]);

  const handlePercentageChange = (index: number, value: string) => {
    const cleaned = value.replace(/%/g, "");
    if (cleaned === "" || /^\d+$/.test(cleaned)) {
      const next = [...tierPercentages];
      next[index] = cleaned === "" ? "" : cleaned + "%";
      setTierPercentages(next);
      // TODO: persist bundle discount tiers
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Settings</h1>

      <div className="flex flex-col gap-12 md:flex-row">
        <aside className="w-full shrink-0 md:w-[220px]">
          <SettingsNav />
        </aside>

        <div className="flex-1 max-w-[800px] space-y-6">
          <SecurityBanner>
            <h3 className="text-base font-semibold text-foreground">
              Add your phone number for extra security
            </h3>
            <p className="mt-1 text-sm text-foreground-muted">
              Your phone number helps us keep your account safe. It&apos;s
              never visible to other members and won&apos;t be used for
              marketing.
            </p>
            <Button className="mt-4 rounded bg-brand-primary text-white hover:bg-brand-primary-hover">
              Add phone number
            </Button>
          </SecurityBanner>

          <div className="rounded-lg border border-border">
            <div className="flex items-center justify-between px-6 py-5">
              <span className="text-sm font-medium text-foreground">
                Enable bundle discounts
              </span>
              <Switch
                checked={bundleDiscountsEnabled}
                onCheckedChange={setBundleDiscountsEnabled}
              />
            </div>
          </div>

          {!bundleDiscountsEnabled ? (
            <p className="-mt-4 text-sm text-foreground-muted">
              Why give a discount? It&apos;s a great way to get people to buy
              more from you, and you&apos;ll sell more items at once. For help,
              see our{" "}
              <a href="#" className="underline text-brand-primary">
                FAQ
              </a>
              .
            </p>
          ) : (
            <>
              <div className="divide-y rounded-lg border border-border">
                {tierPercentages.map((pct, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-6 py-5"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {tierLabels[index]}
                    </span>
                    <input
                      type="text"
                      value={pct}
                      onChange={(e) =>
                        handlePercentageChange(index, e.target.value)
                      }
                      className="w-16 border-0 border-b border-border bg-transparent p-0 text-right text-sm text-foreground-muted outline-none focus:border-brand-primary"
                    />
                  </div>
                ))}
              </div>
              <p className="-mt-4 text-sm text-foreground-muted">
                Great! You can give discounts in ascending order, starting with
                any number of items. The better the deal, the more you&apos;ll
                sell! For help, see the{" "}
                <a href="#" className="underline text-brand-primary">
                  FAQs
                </a>
                .
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
