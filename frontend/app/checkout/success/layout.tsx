import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Your order was placed successfully on Wearnova.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
