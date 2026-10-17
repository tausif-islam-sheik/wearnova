import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Categories",
  description: "Organize marketplace categories on Wearnova.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
