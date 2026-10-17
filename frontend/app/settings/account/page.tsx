"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SettingsNav } from "@/components/shared/SettingsNav";
import { SettingsRow } from "@/components/shared/SettingsRow";
import { SecurityBanner } from "@/components/shared/SecurityBanner";

export default function AccountSettingsPage() {
  const [vacationMode, setVacationMode] = useState(false);
  const [fullName, setFullName] = useState("Sophia Chen");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

      <div className="flex flex-col gap-12 md:flex-row">
        {/* Sidebar */}
        <aside className="w-full shrink-0 md:w-[220px]">
          <SettingsNav />
        </aside>

        {/* Main content */}
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

          {/* Email / Phone card */}
          <div className="divide-y rounded-lg border border-border">
            <SettingsRow label="" align="start">
              <div className="flex w-full items-center justify-between">
                <div>
                  <p className="text-base font-medium text-foreground">
                    sophia@example.com
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-foreground-muted">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="size-3"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                    Verified
                  </p>
                </div>
                <Button variant="outline" className="rounded text-sm">
                  Change
                </Button>
              </div>
            </SettingsRow>
            <SettingsRow label="Phone number">
              <Button variant="outline" className="rounded text-sm">
                Verify
              </Button>
            </SettingsRow>
          </div>
          <p className="-mt-4 text-xs text-foreground-muted">
            Your phone number will only be used to help you log in. It won&apos;t be made public or used for marketing purposes.
          </p>

          {/* Personal details card */}
          <div className="divide-y rounded-lg border border-border">
            <SettingsRow label="Full name">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-72 border-0 border-b border-border bg-transparent p-0 text-sm text-foreground outline-none focus:border-brand-primary"
              />
            </SettingsRow>
            <SettingsRow label="Gender">
              <span className="flex items-center gap-1 text-sm text-foreground-muted cursor-pointer">
                Select gender
                <ChevronDown className="size-3.5 text-foreground-muted" />
              </span>
              {/* TODO: wire to real Select */}
            </SettingsRow>
            <SettingsRow label="Birthday">
              <span className="flex items-center gap-1 text-sm text-foreground-muted cursor-pointer">
                <Calendar className="size-3.5" />
                mm/dd/yyyy
              </span>
            </SettingsRow>
          </div>

          {/* Vacation mode */}
          <div className="rounded-lg border border-border">
            <SettingsRow label="Vacation mode">
              <Switch
                checked={vacationMode}
                onCheckedChange={setVacationMode}
              />
            </SettingsRow>
          </div>

          {/* Linked accounts card */}
          <div className="divide-y rounded-lg border border-border">
            <SettingsRow label="Facebook">
              <Button variant="outline" className="rounded text-sm">
                Link
              </Button>
            </SettingsRow>
            <SettingsRow label="Google">
              <Button
                variant="outline"
                className="rounded text-sm text-foreground-muted opacity-60 cursor-not-allowed"
                disabled
              >
                Linked
              </Button>
            </SettingsRow>
          </div>
          <p className="-mt-4 text-xs text-foreground-muted">
            Link to your other accounts to become a trusted, verified member.
          </p>

          {/* Change password */}
          <div className="rounded-lg border border-border">
            <SettingsRow label="Change password">
              <Button variant="outline" className="rounded text-sm">
                Change
              </Button>
            </SettingsRow>
          </div>

          {/* Delete account */}
          <div className="rounded-lg border border-border">
            <div className="flex cursor-pointer items-center justify-between px-6 py-5 transition-colors hover:bg-muted/50">
              <span className="text-sm font-medium text-foreground">
                Delete my account
              </span>
              <ChevronRight className="size-4 text-foreground-muted" />
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <Button className="rounded bg-brand-primary text-white hover:bg-brand-primary-hover px-6 py-2.5">
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
