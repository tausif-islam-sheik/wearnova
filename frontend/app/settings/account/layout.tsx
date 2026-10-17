import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Settings",
  description: "Update your account details on Wearnova.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
