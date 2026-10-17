import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Settings", template: "%s | Wearnova" },
  description: "Manage your Wearnova account settings.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
