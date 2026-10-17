import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Settings",
  description: "Manage your cookie preferences on Wearnova.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
