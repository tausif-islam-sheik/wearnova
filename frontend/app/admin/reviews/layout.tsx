import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reviews",
  description: "Moderate seller reviews on Wearnova.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
