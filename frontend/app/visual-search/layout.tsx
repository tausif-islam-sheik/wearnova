import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Visual Search",
  description:
    "Upload a photo and find matching pre-loved items on Wearnova.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
