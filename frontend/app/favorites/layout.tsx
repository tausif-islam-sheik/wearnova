import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Favorites",
  description: "Items you have saved on Wearnova.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
