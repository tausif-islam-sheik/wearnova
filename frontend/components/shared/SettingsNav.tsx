"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Profile details", href: "/settings" },
  { label: "Account settings", href: "/settings/account" },
  { label: "Shipping", href: "/settings/shipping" },
  { label: "Payments", href: "/settings/payments" },
  { label: "Bundle discounts", href: "/settings/bundle-discounts" },
  { label: "Security", href: "/settings/security" },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-5">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "text-sm transition-colors",
            pathname === item.href
              ? "font-semibold text-foreground"
              : "font-normal text-foreground-muted hover:text-foreground"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
