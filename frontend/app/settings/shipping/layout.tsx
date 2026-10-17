import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping Settings",
  description: "Manage your shipping preferences on Wearnova.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
