import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Building2,
  Grid3x3,
  ClipboardCheck,
  ArrowLeftRight,
  TrendingUp,
  Settings,
  Boxes,
  Flag,
  Scale,
  ScrollText,
  Star,
  TicketPercent,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin/overview", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/users", label: "Users", icon: Users },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: ShoppingBag },
      { href: "/admin/inventory", label: "Inventory", icon: Boxes },
      { href: "/admin/brands", label: "Brands", icon: Building2 },
      { href: "/admin/categories", label: "Categories", icon: Grid3x3 },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ClipboardCheck },
      { href: "/admin/transactions", label: "Transactions", icon: ArrowLeftRight },
      { href: "/admin/promos", label: "Promo codes", icon: TicketPercent },
    ],
  },
  {
    label: "Moderation",
    items: [
      { href: "/admin/reports", label: "Reports", icon: Flag },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
      { href: "/admin/disputes", label: "Disputes", icon: Scale },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/admin/analytics", label: "Analytics", icon: TrendingUp },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/audit-log", label: "Audit log", icon: ScrollText },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export const adminNavItems: AdminNavItem[] = adminNavGroups.flatMap((g) => g.items);

export const adminRouteLabels: Record<string, string> = Object.fromEntries([
  ...adminNavItems.map((item) => [item.href, item.label]),
  ["/admin/overview", "Dashboard"],
]);
