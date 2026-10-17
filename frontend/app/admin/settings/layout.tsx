import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Settings",
  description: "Configure marketplace settings on Wearnova.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
