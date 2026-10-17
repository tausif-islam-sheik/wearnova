import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Personalization",
  description: "Personalize your Wearnova experience.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
