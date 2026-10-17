import type { Metadata } from "next";
import { api } from "@/lib/api";
import type { User } from "@/types";

interface Params {
  params: Promise<{ username: string }>;
}

function slugToName(slug: string): string {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { username } = await params;
  const fallbackName = slugToName(username);
  try {
    const data = await api.get<{ users?: User[] }>(`/users?search=${encodeURIComponent(fallbackName)}`);
    const user = data.users?.find(
      (u) => u.name.toLowerCase().replace(/\s+/g, "-") === username.toLowerCase()
    );
    if (user) {
      return { title: { default: `${user.name} | Seller Profile`, template: "%s | Wearnova" }, description: `View ${user.name}'s items and reviews on Wearnova.` };
    }
  } catch {
    // fall through to slug-derived title
  }
  return { title: { default: `${fallbackName} | Seller Profile`, template: "%s | Wearnova" } };
}

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
