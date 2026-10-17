import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wallet",
  description: "Manage your Wearnova wallet balance.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
