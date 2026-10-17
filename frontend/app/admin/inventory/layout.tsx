import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inventory",
  description: "Stock levels and listing health on Wearnova.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
