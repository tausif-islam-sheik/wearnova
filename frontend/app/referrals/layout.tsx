import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Referrals",
  description: "Invite friends to Wearnova and earn rewards.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
