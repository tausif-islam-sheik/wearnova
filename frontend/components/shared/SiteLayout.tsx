"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { CartDrawer } from "./CartDrawer";
import { Footer } from "./Footer";

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome = pathname.startsWith("/admin");

  return (
    <div data-slot="site-layout" className="flex flex-col min-h-screen">
      {hideChrome ? null : <Header />}
      <main className="flex-1">{children}</main>
      {hideChrome ? null : <Footer />}
      {hideChrome ? null : <CartDrawer />}
    </div>
  );
}
