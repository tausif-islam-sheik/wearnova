import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disputes",
  description: "Review and settle buyer disputes on Wearnova orders.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
