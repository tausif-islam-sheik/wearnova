import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Marketplace analytics and insights for Wearnova.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
