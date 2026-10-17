"use client";

import { Button } from "@/components/ui/button";
import { SettingsNav } from "@/components/shared/SettingsNav";
import { SecurityBanner } from "@/components/shared/SecurityBanner";
import { SettingsLinkRow } from "@/components/shared/SettingsLinkRow";

export default function SecuritySettingsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Settings</h1>

      <div className="flex flex-col gap-12 md:flex-row">
        <aside className="w-full shrink-0 md:w-[220px]">
          <SettingsNav />
        </aside>

        <div className="flex-1 max-w-[800px]">
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

          <div className="mt-8">
            <h2 className="text-xl font-bold text-foreground">
              Keep your account secure
            </h2>
            <p className="mt-1 text-sm text-foreground-muted">
              Review your info to help protect your account.
            </p>

            <div className="mt-4 divide-y rounded-lg border border-border">
              <SettingsLinkRow
                label="Email"
                description="Keep your email up to date."
                variant="row"
                onClick={() => { /* TODO: route to email change page */ }}
              />
              <SettingsLinkRow
                label="Password"
                description="Protect your account with a stronger password."
                variant="row"
                onClick={() => { /* TODO: route to password change page */ }}
              />
              <SettingsLinkRow
                label="2-step verification"
                description="Secure your login with a simple verification step."
                variant="row"
                onClick={() => { /* TODO: route to 2FA setup page */ }}
              />
              <SettingsLinkRow
                label="Login activity"
                description="Manage your logged-in devices."
                variant="row"
                onClick={() => { /* TODO: route to login activity page */ }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
