import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audit Log",
  description: "A record of who did what in the Wearnova admin panel.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
