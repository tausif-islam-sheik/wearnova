import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Manage Products", template: "%s | Wearnova" },
  description: "Review and manage listings on Wearnova.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
