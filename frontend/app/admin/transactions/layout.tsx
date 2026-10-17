import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transactions",
  description: "Review marketplace transactions on Wearnova.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
