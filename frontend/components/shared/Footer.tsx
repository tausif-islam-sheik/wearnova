/**
 * FOOTER LINK AUDIT — Step 0
 *
 * EXISTING ROUTES (linked to real pages):
 *   /                          → Homepage (exists)
 *   /search                    → Search/browse catalog (exists)
 *   /sell                      → Sell flow (exists)
 *   /favorites                 → Favorites (exists)
 *   /orders                    → My orders (exists)
 *   /settings                  → Settings (exists)
 *   /login                     → Login (exists)
 *   /signup                    → Signup (exists)
 *   /listing/[id]              → Listing detail (exists)
 *   /c/[...category]           → Category browse (exists)
 *   /brands/[brand]            → Brand page (exists)
 *   /seller/[username]         → Seller profile (exists)
 *   /wallet                    → Wallet (exists)
 *   /referrals                 → Referrals (exists)
 *   /donations                 → Donations (exists)
 *   /admin/*                   → Admin panel (exists, no footer)
 *
 * MISSING ROUTES (linked but no page exists):
 *   /about                     → MISSING — TODO: create About page
 *   /sustainability            → MISSING — TODO: create Sustainability page
 *   /press                     → MISSING — TODO: create Press page
 *   /advertising               → MISSING — TODO: create Advertising page
 *   /accessibility             → MISSING — TODO: create Accessibility page
 *   /how-it-works              → EXISTS
 *   /mobile-apps               → MISSING — no real mobile apps exist; REMOVED from footer
 *   /infoboard                 → EXISTS
 *   /help                      → EXISTS
 *   /help/selling              → EXISTS
 *   /help/buying               → EXISTS
 *   /help/trust-safety         → EXISTS
 *   /privacy                   → EXISTS
 *   /cookies                   → EXISTS
 *   /cookie-settings           → EXISTS (basic preference UI)
 *   /terms                     → EXISTS
 *
 * SOCIAL HANDLES:
 *   Instagram → https://instagram.com (placeholder — real handle needed via config/env)
 *   Facebook  → https://facebook.com (placeholder — real handle needed via config/env)
 *   X         → https://x.com (placeholder — real handle needed via config/env)
 *
 * APP STORE BADGES:
 *   Badge SVGs exist in /public/ but no real mobile apps exist. REMOVED entirely.
 *
 * COOKIE CONSENT:
 *   Basic preference UI exists at /cookie-settings.
 *
 * BRAND TAGLINE:
 *   No brand tagline/mission copy found anywhere. TODO placeholder inserted.
 */

import Link from "next/link";
import { Separator } from "@/components/ui/separator";

/* ─── link data ─────────────────────────────────────────────── */

const discoverLinks = [
  { label: "How it works", href: "/how-it-works" },
  { label: "Browse", href: "/search" },
  { label: "Sell", href: "/sell" },
  { label: "Infoboard", href: "/infoboard" },
];

const helpLinks = [
  { label: "Help Center", href: "/help" },
  { label: "Selling", href: "/help/selling" },
  { label: "Buying", href: "/help/buying" },
  { label: "Trust and Safety", href: "/help/trust-safety" },
];

const legalLinks = [
  { label: "Privacy Center", href: "/privacy" },
  { label: "Cookie Policy", href: "/cookies" },
  { label: "Terms & Conditions", href: "/terms" },
];

/* ─── sub-components ────────────────────────────────────────── */

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold tracking-wide text-foreground mb-4">
        {heading}
      </h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-4 transition-colors duration-150"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialIcon({
  label,
  href,
  children,
}: {
  label: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-all duration-150 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {children}
    </a>
  );
}

/* ─── main component ────────────────────────────────────────── */

export function Footer() {
  return (
    <footer className="bg-secondary border-t border-border mt-auto">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-8">
        {/* Zones A + B: brand + nav columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10 lg:gap-8">
          {/* Zone A — Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            {/* Logo mark + wordmark */}
            <Link href="/" className="inline-block mb-4">
              <span
                className="text-3xl tracking-wide text-brand-primary"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Wearnova
              </span>
            </Link>

            {/* TODO: brand tagline copy needed — no existing tagline found in project */}
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mb-6">
              Your peer-to-peer marketplace for pre-loved fashion and more.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-2.5">
              <SocialIcon label="Instagram" href="https://instagram.com">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-4"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
                </svg>
              </SocialIcon>
              <SocialIcon label="Facebook" href="https://facebook.com">
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </SocialIcon>
              <SocialIcon label="X" href="https://x.com">
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </SocialIcon>
            </div>
          </div>

          {/* Zone B — Nav columns */}
          <FooterColumn heading="Discover" links={discoverLinks} />
          <FooterColumn heading="Help" links={helpLinks} />
          <FooterColumn heading="Legal" links={legalLinks} />
        </div>

        {/* Zone C — App downloads: REMOVED (no real mobile apps exist) */}

        {/* Zone D — Bottom legal bar */}
        <Separator className="mt-12 mb-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Cookie Settings — preference UI exists at /cookie-settings */}
          <Link
            href="/cookie-settings"
            className="text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-4 transition-colors duration-150"
          >
            Cookie Settings
          </Link>

          <p className="text-xs text-muted-foreground">
            &copy; 2026 Wearnova
          </p>
        </div>
      </div>
    </footer>
  );
}
