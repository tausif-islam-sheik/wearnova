import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Overview of the Wearnova marketplace.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
