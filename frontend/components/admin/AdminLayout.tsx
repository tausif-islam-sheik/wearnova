"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  User,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  Home,
} from "lucide-react";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { adminNavGroups, adminRouteLabels } from "@/config/admin-nav";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbEllipsis,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn, resolveMediaUrl } from "@/lib/utils";
import { AdminThemeToggle } from "@/components/admin/AdminThemeToggle";
import { AdminNotifications } from "@/components/admin/AdminNotifications";
import { AdminPendingProvider, useAdminPending } from "@/hooks/use-admin-pending";


function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

/* ── Breadcrumb helpers ── */

interface BreadcrumbSegment {
  label: string;
  href: string;
}

function getBreadcrumbSegments(pathname: string): BreadcrumbSegment[] {
  const segments: BreadcrumbSegment[] = [
    { label: "Dashboard", href: "/admin/overview" },
  ];

  const path = pathname.replace(/^\/admin\/?/, "");
  if (!path) return segments;

  const parts = path.split("/").filter(Boolean);
  let builtPath = "/admin";

  for (const part of parts) {
    builtPath += `/${part}`;
    const label =
      adminRouteLabels[builtPath] ??
      part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " ");
    segments.push({ label, href: builtPath });
  }

  return segments;
}

/* ── Dynamic Breadcrumb ── */

function AdminBreadcrumb() {
  const pathname = usePathname();
  const allSegments = getBreadcrumbSegments(pathname);

  const hasEllipsis = allSegments.length > 3;
  const first = allSegments[0];
  const last = allSegments[allSegments.length - 1];
  const secondToLast =
    allSegments.length > 2 ? allSegments[allSegments.length - 2] : null;
  const hiddenMiddle = hasEllipsis ? allSegments.slice(1, -2) : [];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href={first.href} />}>
            {first.label}
          </BreadcrumbLink>
        </BreadcrumbItem>

        {hasEllipsis && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <BreadcrumbEllipsis />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {hiddenMiddle.map((seg) => (
                    <DropdownMenuItem
                      key={seg.href}
                      render={<Link href={seg.href} />}
                    >
                      {seg.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
          </>
        )}

        {secondToLast && secondToLast.href !== first.href && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href={secondToLast.href} />}>
                {secondToLast.label}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}

        {last.href !== first.href && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{last.label}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/* ── Sidebar Header ── */

function AdminSidebarHeader() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <SidebarHeader className="p-3 border-b border-sidebar-border">
      <Link
        href="/admin"
        className={cn(
          "flex items-center gap-2.5 overflow-hidden",
          collapsed && "justify-center"
        )}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <span className="text-[10px] font-bold text-primary-foreground tracking-wide">
            CL
          </span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-xs font-bold text-sidebar-foreground tracking-widest uppercase">
              Wearnova
            </p>
            <p className="text-[10px] text-sidebar-foreground/40 tracking-wider uppercase">
              Admin
            </p>
          </div>
        )}
      </Link>
    </SidebarHeader>
  );
}

/* ── Sidebar Nav ── */

function AdminSidebarNav() {
  const pathname = usePathname();
  const { pending } = useAdminPending();
  const badges: Record<string, number> = {
    "/admin/reports": pending?.reports.open ?? 0,
    "/admin/disputes": pending?.disputes.open ?? 0,
  };

  return (
    <SidebarContent>
      {adminNavGroups.map((group, groupIdx) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => {
                const isActive =
                  item.href === "/admin/overview"
                    ? pathname === "/admin/overview"
                    : pathname.startsWith(item.href);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      tooltip={item.label}
                      className={cn(
                        "transition-colors text-base rounded-lg px-3 py-2 h-auto",
                        isActive
                          ? "bg-brand-primary/10 text-brand-primary font-medium [&[data-active]]:bg-brand-primary/10"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className="size-4 shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.label}
                      </span>
                    </SidebarMenuButton>
                    {badges[item.href] > 0 && (
                      <SidebarMenuBadge aria-label={`${badges[item.href]} waiting`}>
                        {badges[item.href] > 99 ? "99+" : badges[item.href]}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
          {groupIdx < adminNavGroups.length - 1 && <SidebarSeparator />}
        </SidebarGroup>
      ))}
    </SidebarContent>
  );
}

/* ── Sidebar Footer ── */

function AdminSidebarFooter() {
  const router = useRouter();
  const { state } = useSidebar();
  const { admin, logout } = useAdminAuthStore();
  const collapsed = state === "collapsed";
  const initials = getInitials(admin?.name ?? "AU");
  const email = admin?.email ?? "admin@wearnova.com";
  const displayName = admin?.name ?? "Admin";

  return (
    <SidebarFooter className="p-2 border-t border-sidebar-border">
      <DropdownMenu>
        <DropdownMenuTrigger className="w-full cursor-pointer outline-none">
          <div
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors",
              collapsed && "justify-center px-0"
            )}
          >
            <Avatar className="!size-8">
              {admin?.avatarUrl && (
                <AvatarImage src={resolveMediaUrl(admin.avatarUrl)} alt={admin.name} />
              )}
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium leading-tight text-sidebar-foreground truncate">
                    {displayName}
                  </p>
                  <p className="text-xs leading-tight text-sidebar-foreground/40 truncate">
                    {email}
                  </p>
                </div>
                <ChevronDown className="size-3.5 shrink-0 text-sidebar-foreground/40" />
              </>
            )}
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="right" sideOffset={8} className="w-48">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium text-foreground truncate">
              {admin?.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            render={<Link href="/admin/profile" />}
            className="cursor-pointer"
          >
            <User className="size-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem
            render={<Link href="/admin/settings" />}
            className="cursor-pointer"
          >
            <Settings className="size-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="cursor-pointer"
            onClick={() => {
              logout();
              router.push("/admin");
            }}
          >
            <LogOut className="size-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarFooter>
  );
}

/* ── Top Bar ── */

function AdminTopBar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <nav className="sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b border-border/50 bg-background/95 px-4 backdrop-blur supports-backdrop-blur:bg-background/60">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>
        <div className="hidden sm:flex items-center text-sm">
          <AdminBreadcrumb />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <AdminNotifications />
        <AdminThemeToggle />
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg h-7 px-2.5 text-[0.8rem] font-medium whitespace-nowrap text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all shrink-0"
        >
          <Home className="size-4" />
          <span className="hidden sm:inline">Back to home</span>
        </Link>
      </div>
    </nav>
  );
}

/* ── Sidebar Wrapper ── */

function AdminSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  // On mobile the sidebar is a sheet: close it once a menu link has navigated.
  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  return (
    <Sidebar collapsible="icon">
      <AdminSidebarHeader />
      <AdminSidebarNav />
      <AdminSidebarFooter />
      <SidebarRail />
    </Sidebar>
  );
}

/* ── Main Layout ── */

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdminAuthenticated } = useAdminAuthStore();
  const [mounted, setMounted] = useState(false);

  const isLoginPage = pathname === "/admin";

  // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe mount guard
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !isAdminAuthenticated && !isLoginPage) {
      router.replace("/admin");
    }
  }, [mounted, isAdminAuthenticated, router, isLoginPage]);

  if (isLoginPage) {
    return (
      <>
        <style>{`[data-slot="site-layout"]>header,[data-slot="site-layout"]>footer{display:none!important}`}</style>
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </>
    );
  }

  if (!mounted || !isAdminAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <style>{`[data-slot="site-layout"]>header,[data-slot="site-layout"]>footer{display:none!important}`}</style>
      <AdminPendingProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "16rem",
          } as React.CSSProperties
        }
      >
        <AdminSidebar />

        <SidebarInset>
          <AdminTopBar />
          <main className="mx-auto min-h-[calc(100vh-3.5rem)] w-full max-w-9xl bg-muted/20 p-4 lg:p-8">
            {children}
          </main>
        </SidebarInset>

      </SidebarProvider>
      </AdminPendingProvider>
    </>
  );
}
