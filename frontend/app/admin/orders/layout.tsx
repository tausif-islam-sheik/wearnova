import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Orders",
  description: "Review and manage orders on Wearnova.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
