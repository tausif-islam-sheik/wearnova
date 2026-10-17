"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Tag,
  Package,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { StatCard, STAT_GRID } from "@/components/admin/StatCard";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DataTable, type DataTableColumn, type RowAction } from "@/components/admin/DataTable";
import { useAdminLoading, TablePageSkeleton } from "@/components/admin/PageSkeletons";
import { api, fetchAllPages } from "@/lib/api";
import { toast } from "sonner";
import type { Listing } from "@/types";

interface UserDto {
  id: string;
  name: string;
}



const statusBadgeStyle: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  sold: "bg-muted text-muted-foreground border-border",
  reserved: "bg-warning/10 text-warning border-warning/20",
  deactivated: "bg-muted text-muted-foreground border-border",
};

export default function ProductsPage() {
  const loading = useAdminLoading();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [brandFilter, setBrandFilter] = useState("All Brands");
  const [sortBy, setSortBy] = useState("Newest First");
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [pendingDelete, setPendingDelete] = useState<string[] | null>(null);

  useEffect(() => {
    Promise.all([
      fetchAllPages<Listing>("/listings?status=all", "listings", { pageSize: 200 }),
      fetchAllPages<UserDto>("/users/admin/list", "users"),
    ])
      .then(([listingsRes, usersRes]) => {
        setListings(listingsRes.items);
        setTotal(listingsRes.total);
        setUsers(usersRes.items);
      })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setDataLoading(false));
  }, []);

  const filteredListings = useMemo(() => {
    let base = listings;
    if (statusFilter !== "All Status") {
      base = base.filter((l) => l.status === statusFilter);
    }
    if (brandFilter !== "All Brands") {
      base = base.filter((l) => l.brand === brandFilter);
    }
    const sorted = [...base];
    if (sortBy === "Newest First") {
      sorted.sort(
        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
      );
    } else if (sortBy === "liked") {
      sorted.sort((a, b) => b.likesCount - a.likesCount);
    }
    return sorted;
  }, [listings, statusFilter, brandFilter, sortBy]);

  const availableBrands = useMemo(
    () => [...new Set(listings.map((l) => l.brand))].sort((a, b) => a.localeCompare(b)),
    [listings],
  );

  const stats = useMemo(() => {
    const active = listings.filter((l) => l.status === "active").length;
    const sold = listings.filter((l) => l.status === "sold").length;
    return { total, active, sold };
  }, [listings, total]);

  function getUserName(userId: string): string {
    const user = users.find((u) => u.id === userId);
    return user?.name ?? userId;
  }

  function getInitials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  }

  /** Deletes the given listings; only the ones that actually succeeded leave the table. */
  const deleteListings = async (ids: string[]) => {
    const results = await Promise.allSettled(ids.map((id) => api.delete(`/listings/${id}`)));
    const deleted = ids.filter((_, i) => results[i].status === "fulfilled");
    const failed = ids.length - deleted.length;
    if (deleted.length > 0) {
      setListings((prev) => prev.filter((l) => !deleted.includes(l.id)));
      setTotal((t) => Math.max(0, t - deleted.length));
      setSelectedKeys((prev) => prev.filter((k) => !deleted.includes(k)));
    }
    if (failed === 0) {
      toast.success(deleted.length === 1 ? "Product deleted" : `Deleted ${deleted.length} products`);
    } else if (deleted.length === 0) {
      toast.error(ids.length === 1 ? "Failed to delete product" : "Failed to delete products");
    } else {
      toast.error(`Deleted ${deleted.length}, but ${failed} could not be deleted`);
    }
  };

  const pendingTitle =
    pendingDelete?.length === 1
      ? listings.find((l) => l.id === pendingDelete[0])?.title ?? "this product"
      : null;

  const columns: DataTableColumn<Record<string, unknown>>[] = useMemo(
    () => [
      {
        key: "title",
        label: "Product",
        className: "w-[260px]",
        render: (row) => {
          const listing = row as unknown as Listing;
          return (
            <div className="flex items-center gap-3">
              {listing.images?.[0] ? (
                <img src={listing.images[0]} alt="" className="size-10 rounded-md object-cover bg-muted shrink-0" />
              ) : (
                <div className="size-10 rounded-md bg-muted shrink-0 flex items-center justify-center">
                  <Package className="size-4 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <p className="max-w-[200px] truncate text-sm font-medium text-foreground" title={listing.title}>{listing.title}</p>
                <p className="text-xs text-muted-foreground">{listing.categoryPath?.[listing.categoryPath.length - 1]}</p>
              </div>
            </div>
          );
        },
      },
      {
        key: "sellerId",
        label: "Seller",
        className: "w-[150px]",
        render: (row) => {
          const listing = row as unknown as Listing;
          const name = getUserName(listing.sellerId);
          return (
            <div className="flex items-center gap-2">
              <Avatar size="sm">
                <AvatarFallback className="text-[10px]">{getInitials(name)}</AvatarFallback>
              </Avatar>
              <span className="text-sm">{name}</span>
            </div>
          );
        },
      },
      {
        key: "brand",
        label: "Brand",
        className: "w-[130px]",
        render: (row) => {
          const listing = row as unknown as Listing;
          return (
            <span className="text-sm text-foreground">{listing.brand}</span>
          );
        },
      },
      {
        key: "price",
        label: "Price",
        sortable: true,
        align: "center",
        className: "w-[100px]",
        render: (row) => {
          const listing = row as unknown as Listing;
          return <span className="text-sm font-semibold tabular-nums text-foreground">${listing.price.toLocaleString()}</span>;
        },
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        align: "center",
        className: "w-[110px]",
        render: (row) => {
          const listing = row as unknown as Listing;
          return (
            <Badge variant="outline" className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full capitalize ${statusBadgeStyle[listing.status] ?? statusBadgeStyle.deactivated}`}>
              {listing.status}
            </Badge>
          );
        },
      },
      {
        key: "likesCount",
        label: "Likes",
        sortable: true,
        align: "center",
        className: "w-[70px]",
        render: (row) => {
          const listing = row as unknown as Listing;
          return <span className="text-sm tabular-nums">{listing.likesCount}</span>;
        },
      },
    ],
    [users]
  );

  const rowActions: RowAction<Record<string, unknown>>[] = useMemo(() => [
    {
      label: "Edit",
      icon: <Pencil className="size-3.5" />,
      onClick: (row) => {
        const listing = row as unknown as Listing;
        router.push(`/admin/products/${listing.id}/edit`);
      },
    },
    {
      label: "Delete",
      icon: <Trash2 className="size-3.5" />,
      variant: "destructive",
      onClick: (row) => setPendingDelete([(row as unknown as Listing).id]),
    },
  ], []);

  const tableData = useMemo(
    () => filteredListings.map((l) => l as unknown as Record<string, unknown>),
    [filteredListings]
  );

  if (loading || dataLoading) return <TablePageSkeleton statCards={3} headerAction />;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} total products</p>
        </div>
        <Button onClick={() => router.push("/admin/products/new")}>
          <Plus className="size-4 mr-1.5" />
          Add Product
        </Button>
      </div>

      <div className={STAT_GRID}>
        <StatCard icon={ShoppingBag} label="Total Products" value={stats.total} iconBg="bg-brand-primary/10" iconColor="text-brand-primary" />
        <StatCard icon={Tag} label="Active Products" value={stats.active} iconBg="bg-emerald-500/10" iconColor="text-emerald-500" />
        <StatCard icon={Tag} label="Sold Products" value={stats.sold} iconBg="bg-blue-500/10" iconColor="text-blue-500" />
      </div>

      <DataTable
        columns={columns}
        data={tableData}
        searchPlaceholder="Search products..."
        searchKeys={["title", "brand"]}
        onRowClick={(row) => {
          const listing = row as unknown as Listing;
          router.push(`/admin/products/${listing.id}/edit`);
        }}
        filter={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
              <SelectTrigger className="w-36 h-9 rounded!">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Newest First">Newest First</SelectItem>
                <SelectItem value="liked">Most liked</SelectItem>
              </SelectContent>
            </Select>
            <Select value={brandFilter} onValueChange={(v) => v && setBrandFilter(v)}>
              <SelectTrigger className="w-40 h-9 rounded!">
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Brands">All Brands</SelectItem>
                {availableBrands.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
              <SelectTrigger className="w-36 h-9 rounded!">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Status">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="deactivated">Deactivated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        emptyTitle="No products found"
        emptyDescription="No products match your search criteria"
        selectable
        equalColumns
        exportFileName="products"
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        rowActions={rowActions}
        bulkActions={[
          {
            label: "Delete selected",
            variant: "destructive",
            onClick: (keys) => setPendingDelete(keys),
          },
        ]}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={pendingDelete?.length === 1 ? "Delete product?" : `Delete ${pendingDelete?.length ?? 0} products?`}
        description={
          pendingTitle
            ? <>&ldquo;{pendingTitle}&rdquo; will be permanently removed. This can&apos;t be undone.</>
            : "These products will be permanently removed. This can't be undone."
        }
        confirmLabel="Delete"
        onConfirm={() => deleteListings(pendingDelete ?? [])}
      />
    </div>
  );
}
