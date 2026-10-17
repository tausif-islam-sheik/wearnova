import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security Settings",
  description: "Secure your Wearnova account.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
