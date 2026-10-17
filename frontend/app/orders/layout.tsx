import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Orders",
  description: "Track and review your orders on Wearnova.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
