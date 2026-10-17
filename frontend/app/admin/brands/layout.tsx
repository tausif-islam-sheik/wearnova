import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Brands",
  description: "Manage brands on the Wearnova marketplace.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
