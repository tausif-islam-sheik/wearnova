import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Promo Codes",
  description: "Create and manage checkout promo codes on Wearnova.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
