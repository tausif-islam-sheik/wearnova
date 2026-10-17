import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Product",
  description: "Create a new product listing on Wearnova.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
