"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SettingsNav } from "@/components/shared/SettingsNav";
import { SettingsRow } from "@/components/shared/SettingsRow";
import { SecurityBanner } from "@/components/shared/SecurityBanner";

export default function SettingsPage() {
  const [showCity, setShowCity] = useState(true);

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
          {/* Security prompt banner */}
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

          {/* Profile details card */}
          <div className="divide-y rounded-lg border border-border">
            <SettingsRow label="Your photo">
              <div className="flex items-center gap-3">
                <div className="size-12 overflow-hidden rounded-full bg-brand-primary/10">
                  <Image
                    src="/avatars/default.jpg"
                    alt=""
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                </div>
                <Button variant="outline" className="rounded gap-1.5 text-sm">
                  <Camera className="size-3.5" />
                  Choose photo
                </Button>
              </div>
            </SettingsRow>
            <SettingsRow label="Username">
              <Button variant="outline" className="rounded text-sm">
                Change username
              </Button>
            </SettingsRow>
            <SettingsRow label="About you" align="start">
              <textarea
                placeholder="Tell us more about yourself and your style"
                className="min-h-20 w-72 resize-none border-0 border-b border-border bg-transparent p-0 text-sm text-foreground outline-none placeholder:text-foreground-muted focus:border-brand-primary"
              />
            </SettingsRow>
          </div>

          {/* My location section */}
          <div>
            <p className="mb-2 text-sm text-foreground-muted">My location</p>
            <div className="divide-y rounded-lg border border-border">
              <SettingsRow label="Country">
                <span className="flex items-center gap-1 text-sm font-medium text-foreground cursor-pointer">
                  United States
                  <ChevronDown className="size-3.5 text-foreground-muted" />
                </span>
                {/* TODO: wire to real Select + location data */}
              </SettingsRow>
              <SettingsRow label="Town/City">
                <span className="flex items-center gap-1 text-sm font-medium text-foreground cursor-pointer">
                  San Francisco, CA
                  <ChevronDown className="size-3.5 text-foreground-muted" />
                </span>
                {/* TODO: wire to real Select + location data */}
              </SettingsRow>
              <SettingsRow label="Show city in profile">
                <Switch
                  checked={showCity}
                  onCheckedChange={setShowCity}
                />
              </SettingsRow>
            </div>
          </div>

          {/* Language section */}
          <div className="divide-y rounded-lg border border-border">
            <SettingsRow label="Language">
              <span className="flex items-center gap-1 text-sm font-medium text-foreground cursor-pointer">
                English, US (English)
                <ChevronDown className="size-3.5 text-foreground-muted" />
              </span>
              {/* TODO: wire to real Select + language data */}
            </SettingsRow>
          </div>

          {/* Update button */}
          <div className="flex justify-end">
            <Button className="rounded bg-brand-primary text-white hover:bg-brand-primary-hover px-6 py-2.5">
              Update profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
