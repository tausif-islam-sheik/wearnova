"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, UserCheck, UserPlus, UserX, LogIn, Ban, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { StatCard, STAT_GRID } from "@/components/admin/StatCard";
import { DataTable, type DataTableColumn, type RowAction } from "@/components/admin/DataTable";
import { useAdminLoading, TablePageSkeleton } from "@/components/admin/PageSkeletons";
import { useListingStore } from "@/stores/useListingStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { api, fetchAllPages } from "@/lib/api";
import { toast } from "sonner";
import { runBatch, reportBatch } from "@/lib/batch";

interface UserDto {
  id: string; name: string; email: string; role: string;
  avatarUrl: string | null; bio: string | null; isSuspended: boolean;
  createdAt: string; lastSeen: string | null;
  ratingsCount: number; avgRating: number | null;
  followersCount: number; followingCount: number;
  location: string | null; verifiedMethods: string[]; badges: string[];
}


function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

export default function UsersPage() {
  const loading = useAdminLoading();
  const router = useRouter();
  const listings = useListingStore((s) => s.listings);
  const setUser = useAuthStore((s) => s.setUser as (user: { id: string; name: string; email: string }) => void);
  const setViewingAsAdmin = useAuthStore((s) => s.setViewingAsAdmin);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [total, setTotal] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);
  const [suspendTarget, setSuspendTarget] = useState<UserDto | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [bulkSuspendOpen, setBulkSuspendOpen] = useState(false);

  useEffect(() => {
    fetchAllPages<UserDto>("/users/admin/list", "users")
      .then((res) => {
        setUsers(res.items);
        setTotal(res.total);
      })
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setDataLoading(false));
  }, []);

  const [now] = useState(() => Date.now());
  const monthAgo = now - 30 * 86_400_000;
  const suspendedCount = users.filter((u) => u.isSuspended).length;
  const newCount = users.filter((u) => new Date(u.createdAt).getTime() >= monthAgo).length;

  const handleImpersonate = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setUser(user);
      setViewingAsAdmin(true, userId);
      toast.success(`Viewing as ${user.name}`);
      router.push("/");
    }
  };

  const setSuspended = async (user: UserDto, suspended: boolean) => {
    try {
      await api.patch(`/users/${user.id}/suspend`, { suspended });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isSuspended: suspended } : u)));
      toast.success(suspended ? `${user.name} was suspended` : `${user.name} can sign in again`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't update the user");
      throw e;
    }
  };

  /** Admins and users already in the requested state are skipped, and the toast says how many. */
  const bulkSetSuspended = async (suspended: boolean) => {
    const targets = users.filter((u) => selectedKeys.includes(u.id) && u.role !== "admin" && u.isSuspended !== suspended);
    const skipped = selectedKeys.length - targets.length;
    if (targets.length === 0) {
      toast.info(suspended ? "Nothing to suspend" : "Nothing to restore", {
        description: "Admins and users already in that state are skipped.",
      });
      setSelectedKeys([]);
      return;
    }
    const res = await runBatch(
      targets.map((u) => u.id),
      (id) => api.patch(`/users/${id}/suspend`, { suspended }),
    );
    setUsers((prev) => prev.map((u) => (res.succeeded.includes(u.id) ? { ...u, isSuspended: suspended } : u)));
    reportBatch(suspended ? "Suspended" : "Restored access for", "user", res);
    if (skipped > 0) toast.message(`${skipped} skipped`, { description: "Admins and users already in that state." });
    setSelectedKeys([]);
  };

  const rowActions: RowAction<Record<string, unknown>>[] = useMemo(() => [
    {
      label: "Login as user",
      icon: <LogIn className="size-3.5" />,
      onClick: (row) => {
        const user = row as unknown as UserDto;
        handleImpersonate(user.id);
      },
    },
    {
      label: "Suspend user",
      icon: <Ban className="size-3.5" />,
      variant: "destructive",
      hidden: (row) => {
        const user = row as unknown as UserDto;
        return user.isSuspended || user.role === "admin";
      },
      onClick: (row) => setSuspendTarget(row as unknown as UserDto),
    },
    {
      label: "Restore access",
      icon: <ShieldCheck className="size-3.5" />,
      hidden: (row) => !(row as unknown as UserDto).isSuspended,
      onClick: (row) => {
        void setSuspended(row as unknown as UserDto, false).catch(() => {});
      },
    },
  ], [users]);

  const columns: DataTableColumn<Record<string, unknown>>[] = useMemo(
    () => [
      {
        key: "name",
        label: "User",
        render: (row) => {
          const user = row as unknown as UserDto;
          return (
            <div className="flex items-center gap-3">
              <Avatar size="sm">
                <AvatarFallback className="text-[10px]">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground" title={user.name}>
                  {user.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        key: "email",
        label: "Email",
        sortable: true,
        render: (row) => {
          const user = row as unknown as UserDto;
          return <span className="text-sm text-muted-foreground">{user.email}</span>;
        },
      },
      {
        key: "listingsCount",
        label: "Products",
        sortable: true,
        sortValue: (row) => {
          const user = row as unknown as UserDto;
          return listings.filter((l) => l.sellerId === user.id).length;
        },
        align: "right",
        render: (row) => {
          const user = row as unknown as UserDto;
          const count = listings.filter((l) => l.sellerId === user.id).length;
          return <span className="text-sm tabular-nums">{count}</span>;
        },
      },
      {
        key: "createdAt",
        label: "Joined",
        sortable: true,
        render: (row) => {
          const user = row as unknown as UserDto;
          return (
            <span className="text-sm text-muted-foreground">
              {new Date(user.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          );
        },
      },
      {
        key: "isSuspended",
        label: "Status",
        sortable: true,
        sortValue: (row) => ((row as unknown as UserDto).isSuspended ? 1 : 0),
        render: (row) => {
          const user = row as unknown as UserDto;
          return user.isSuspended ? (
            <Badge variant="outline" className="border-destructive/20 bg-destructive/10 text-[10px] font-medium text-destructive">
              Suspended
            </Badge>
          ) : (
            <Badge variant="outline" className="border-success/20 bg-success/10 text-[10px] font-medium text-success">
              Active
            </Badge>
          );
        },
      },
      {
        key: "verifiedMethods",
        label: "Verification",
        render: (row) => {
          const user = row as unknown as UserDto;
          const verified = user.verifiedMethods ?? [];
          if (verified.length === 0) {
            return (
              <Badge variant="outline" className="text-[10px] font-medium px-2 py-0 rounded-full text-muted-foreground border-border">
                Unverified
              </Badge>
            );
          }
          return (
            <div className="flex flex-wrap items-center gap-1.5">
              {verified.map((channel) => (
                <Badge
                  key={channel}
                  variant="outline"
                  className="border-success/20 bg-success/10 text-[10px] font-medium text-success"
                >
                  {channel}
                </Badge>
              ))}
            </div>
          );
        },
      },
    ],
    [listings, users]
  );

  const tableData = useMemo(
    () => users.map((u) => u as unknown as Record<string, unknown>),
    [users]
  );

  if (loading || dataLoading) return <TablePageSkeleton statCards={4} />;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Users
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total} registered users
        </p>
      </div>

      <div className={STAT_GRID}>
        <StatCard icon={Users} label="Total users" value={total} iconBg="bg-blue-500/10" iconColor="text-blue-500" />
        <StatCard icon={UserCheck} label="Active" value={users.length - suspendedCount} iconBg="bg-emerald-500/10" iconColor="text-emerald-500" />
        <StatCard icon={UserX} label="Suspended" value={suspendedCount} iconBg="bg-rose-500/10" iconColor="text-rose-500" />
        <StatCard icon={UserPlus} label="New (30 days)" value={newCount} iconBg="bg-warning/10" iconColor="text-warning" />
      </div>

      <DataTable
        columns={columns}
        data={tableData}
        selectable
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        exportFileName="users"
        bulkActions={[
          { label: "Suspend", variant: "destructive", onClick: () => setBulkSuspendOpen(true) },
          { label: "Restore access", variant: "outline", onClick: () => void bulkSetSuspended(false) },
        ]}
        searchPlaceholder="Search by email, username..."
        searchKeys={["name", "email"]}
        emptyTitle="No users found"
        emptyDescription="No users match your search criteria"
        rowActions={rowActions}
      />

      <ConfirmDialog
        open={bulkSuspendOpen}
        onOpenChange={setBulkSuspendOpen}
        title={`Suspend ${selectedKeys.length} user${selectedKeys.length === 1 ? "" : "s"}?`}
        description="They won't be able to sign in until you restore their access. Admins are never suspended."
        confirmLabel="Suspend"
        onConfirm={() => bulkSetSuspended(true)}
      />

      <ConfirmDialog
        open={suspendTarget !== null}
        onOpenChange={(open) => !open && setSuspendTarget(null)}
        title="Suspend this user?"
        description={
          <>
            {suspendTarget?.name} will be signed out of every request and won&apos;t be able to sign
            in until you restore their access.
          </>
        }
        confirmLabel="Suspend"
        onConfirm={() => (suspendTarget ? setSuspended(suspendTarget, true) : undefined)}
      />
    </div>
  );
}
