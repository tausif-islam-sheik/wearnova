import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Users",
  description: "Review and manage user accounts on Wearnova.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
