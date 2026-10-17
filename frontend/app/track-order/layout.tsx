import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Your Order",
  description: "Track your Wearnova order.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
