"use client";

import Link from "next/link";
import { Bell, CheckCircle2, Flag, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminPending } from "@/hooks/use-admin-pending";
import { cn } from "@/lib/utils";

const STALE_AFTER_DAYS = 3;

function waiting(iso: string | null) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  const stale = days >= STALE_AFTER_DAYS;
  if (days >= 1) return { text: `Oldest has waited ${days} day${days === 1 ? "" : "s"}`, stale };
  const hours = Math.floor(ms / 3_600_000);
  return { text: hours >= 1 ? `Oldest has waited ${hours} hr` : "Oldest arrived just now", stale };
}

/** Bell in the top bar: what needs an admin's attention right now. */
export function AdminNotifications() {
  const { pending } = useAdminPending();

  const items = [
    {
      href: "/admin/reports",
      icon: Flag,
      count: pending?.reports.open ?? 0,
      label: (n: number) => `${n} open report${n === 1 ? "" : "s"}`,
      age: waiting(pending?.reports.oldest ?? null),
    },
    {
      href: "/admin/disputes",
      icon: Scale,
      count: pending?.disputes.open ?? 0,
      label: (n: number) => `${n} open dispute${n === 1 ? "" : "s"}`,
      age: waiting(pending?.disputes.oldest ?? null),
    },
  ].filter((i) => i.count > 0);

  const total = items.reduce((sum, i) => sum + i.count, 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative text-muted-foreground hover:text-foreground"
            aria-label={total > 0 ? `Notifications, ${total} need attention` : "Notifications"}
          />
        }
      >
        <Bell className="size-4" />
        {total > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-white">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-foreground">Needs your attention</p>
        </div>
        {items.length === 0 ? (
          <div className="flex items-center gap-2.5 px-3 pb-3 pt-1 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-success" />
            You&apos;re all caught up.
          </div>
        ) : (
          items.map((item) => (
            <DropdownMenuItem key={item.href} render={<Link href={item.href} />} className="cursor-pointer">
              <item.icon className="mr-2 size-4 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm text-foreground">{item.label(item.count)}</p>
                {item.age && (
                  <p className={cn("text-xs", item.age.stale ? "font-medium text-warning" : "text-muted-foreground")}>
                    {item.age.text}
                  </p>
                )}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
