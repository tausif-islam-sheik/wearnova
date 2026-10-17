import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reports",
  description: "Review listings and users flagged by the Wearnova community.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
