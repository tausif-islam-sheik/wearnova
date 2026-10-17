import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Settings",
  description: "Manage your payment methods on Wearnova.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
