import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Sign In",
  description: "Sign in to the Wearnova admin dashboard.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
