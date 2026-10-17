import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to buy and sell pre-loved fashion on Wearnova.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
