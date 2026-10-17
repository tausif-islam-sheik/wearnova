import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the Wearnova marketplace.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
