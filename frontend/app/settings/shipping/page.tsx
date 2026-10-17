"use client";

import { Home, Package } from "lucide-react";
import { SettingsNav } from "@/components/shared/SettingsNav";
import { SecurityBanner } from "@/components/shared/SecurityBanner";
import { ShippingOptionRow } from "@/components/shared/ShippingOptionRow";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { SavedAddresses } from "@/components/checkout/saved-addresses";

export default function ShippingSettingsPage() {
  return (
    <AuthGuard>
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

      <div className="flex flex-col gap-12 md:flex-row">
        {/* Sidebar */}
        <aside className="w-full shrink-0 md:w-[220px]">
          <SettingsNav />
        </aside>

        {/* Main content */}
        <div className="flex-1 max-w-[800px] space-y-6">
          <h2 className="text-xl font-bold text-foreground">Your address</h2>

          <SavedAddresses />
          <p className="-mt-3 text-sm text-foreground-muted">
            Where orders are delivered, and what we&apos;ll use to process returns. Saved addresses appear at checkout.
          </p>

          {/* Info banner (no action) */}
          <SecurityBanner>
            <p className="text-sm text-foreground">
              Disabling shipping options may reduce sales. If a member can only buy from you with a disabled option, we may still offer it.{" "}
              <a href="#" className="underline text-brand-primary">
                Learn more about disabled options
              </a>.
            </p>
          </SecurityBanner>

          {/* Shipping as a seller section */}
          <div>
            <h3 className="text-lg font-bold text-foreground">
              Shipping as a seller
            </h3>
            <p className="mt-1 text-sm text-foreground-muted">
              Choose which options you&apos;d like to use for each shipping type.
            </p>

            <div className="mt-4 space-y-4">
              <ShippingOptionRow
                icon={Home}
                title="From your address"
                description="A courier collects the order from you."
                disabled
              />
              <p className="-mt-2 text-sm text-foreground-muted">
                Currently, there are no options that ship from your address.
              </p>

              <ShippingOptionRow
                icon={Package}
                title="From a drop-off point"
                description="You take the order to a location like a locker or package shop."
              />
            </div>

            {/* Footer */}
            <div className="mt-6 space-y-2 text-sm text-foreground-muted">
              <p>
                Some shipping options are enabled for all sellers on our platform and can&apos;t be turned off.
              </p>
              <p>
                <a href="#" className="underline text-brand-primary">
                  See compensation information
                </a>{" "}
                for sellers using integrated shipping.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}
