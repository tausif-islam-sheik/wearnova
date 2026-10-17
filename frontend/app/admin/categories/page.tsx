"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { ChevronRight, ChevronDown, FolderPlus, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { LoadError } from "@/components/admin/LoadError";
import { StatCard, STAT_GRID } from "@/components/admin/StatCard";
import { useAdminLoading, TablePageSkeleton } from "@/components/admin/PageSkeletons";
import { useListingStore } from "@/stores/useListingStore";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Grid3x3, Layers, Tag } from "lucide-react";
import { useRowSelection, type RowSelection } from "@/hooks/use-row-selection";
import { SelectionBar, SelectAllCheckbox, RowCheckbox } from "@/components/admin/SelectionBar";
import { downloadCsv } from "@/lib/csv";
import { runBatch, reportBatch } from "@/lib/batch";

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  children: CategoryNode[];
}

function countListingsInTree(
  listings: ReturnType<typeof useListingStore.getState>["listings"],
  category: CategoryNode
): number {
  let count = listings.filter((l) => l.categoryId === category.id).length;
  for (const sub of category.children) {
    count += countListingsInTree(listings, sub);
  }
  return count;
}

const categoryColors = [
  "text-brand-primary",
  "text-emerald-600 dark:text-emerald-400",
  "text-amber-600 dark:text-amber-400",
  "text-violet-600 dark:text-violet-400",
  "text-rose-600 dark:text-rose-400",
  "text-blue-600 dark:text-blue-400",
  "text-pink-600 dark:text-pink-400",
  "text-cyan-600 dark:text-cyan-400",
  "text-orange-600 dark:text-orange-400",
];

function flatten(nodes: CategoryNode[], depth = 0): { node: CategoryNode; depth: number }[] {
  return nodes.flatMap((n) => [{ node: n, depth }, ...flatten(n.children, depth + 1)]);
}

function descendantIds(node: CategoryNode): string[] {
  return node.children.flatMap((c) => [c.id, ...descendantIds(c)]);
}

type CategoryDialogState =
  | { mode: "add"; parentId: string | null }
  | { mode: "edit"; category: CategoryNode; parentId: string | null };

/** Form body; mounts fresh each time the dialog opens. */
function CategoryForm({
  state,
  tree,
  onClose,
  onSaved,
}: {
  state: CategoryDialogState;
  tree: CategoryNode[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = state.mode === "edit" ? state.category : null;
  const [name, setName] = useState(editing?.name ?? "");
  const [slug, setSlug] = useState(editing?.slug ?? "");
  const [parentId, setParentId] = useState<string>(state.parentId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A category can't be moved under itself or one of its own sub-categories.
  const blocked = useMemo(
    () => new Set(editing ? [editing.id, ...descendantIds(editing)] : []),
    [editing],
  );
  const parentOptions = useMemo(() => flatten(tree).filter(({ node }) => !blocked.has(node.id)), [tree, blocked]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Enter a category name");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = { name: name.trim(), parentId: parentId || null, ...(slug.trim() ? { slug: slug.trim() } : {}) };
      if (editing) await api.patch(`/categories/${editing.id}`, body);
      else await api.post("/categories", body);
      toast.success(editing ? `Saved ${name.trim()}` : `Added ${name.trim()}`);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the category");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <DialogHeader>
        <DialogTitle>{editing ? "Edit category" : "Add category"}</DialogTitle>
        <DialogDescription>
          {editing
            ? "Renaming also updates the category names shown on its listings."
            : "Create a top-level category, or place it inside an existing one."}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="cat-name">Name</Label>
        <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoFocus />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cat-slug">Slug</Label>
        <Input
          id="cat-slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="Generated from the name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cat-parent">Parent category</Label>
        <NativeSelect id="cat-parent" className="w-full" value={parentId} onChange={(e) => setParentId(e.target.value)}>
          <NativeSelectOption value="">None (top-level)</NativeSelectOption>
          {parentOptions.map(({ node, depth }) => (
            <NativeSelectOption key={node.id} value={node.id}>
              {"\u00a0\u00a0".repeat(depth)}
              {node.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" disabled={saving} />}>Cancel</DialogClose>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {editing ? "Save changes" : "Add category"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function CategoryRow({
  category,
  listings,
  depth,
  colorIndex,
  parentId,
  onAddChild,
  onEdit,
  onDelete,
  selection,
}: {
  category: CategoryNode;
  listings: ReturnType<typeof useListingStore.getState>["listings"];
  depth: number;
  colorIndex: number;
  onAddChild: (parent: CategoryNode) => void;
  onEdit: (category: CategoryNode, parentId: string | null) => void;
  onDelete: (category: CategoryNode) => void;
  parentId: string | null;
  selection: RowSelection<CategoryNode>;
}) {
  const [expanded, setExpanded] = useState(depth === 0);
  const hasSubs = category.children.length > 0;
  const count = countListingsInTree(listings, category);
  const color = categoryColors[colorIndex % categoryColors.length];

  return (
    <>
      <TableRow className="hover:bg-muted/20 transition-colors">
        <TableCell className="w-10">
          <RowCheckbox item={category} label={category.name} selection={selection} />
        </TableCell>
        <TableCell>
          <div
            className="flex items-center gap-2"
            style={{ paddingLeft: `${depth * 20}px` }}
          >
            {hasSubs ? (
              <button
                onClick={() => setExpanded(!expanded)}
                className="size-5 flex items-center justify-center rounded hover:bg-muted transition-colors"
              >
                {expanded ? (
                  <ChevronDown className="size-3.5" />
                ) : (
                  <ChevronRight className="size-3.5" />
                )}
              </button>
            ) : (
              <span className="size-5" />
            )}
            <span className={`font-medium text-sm ${color}`}>{category.name}</span>
          </div>
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">{category.slug}</TableCell>
        <TableCell className="text-right">
          <Badge className="px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-muted text-muted-foreground tabular-nums">
            {count}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Add a sub-category to ${category.name}`}
              title="Add sub-category"
              onClick={() => onAddChild(category)}
            >
              <FolderPlus className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Edit ${category.name}`}
              title="Edit"
              onClick={() => onEdit(category, parentId)}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete ${category.name}`}
              title="Delete"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(category)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {expanded &&
        category.children.map((sub, idx) => (
          <CategoryRow
            key={sub.id}
            category={sub}
            listings={listings}
            depth={depth + 1}
            colorIndex={colorIndex + idx + 1}
            parentId={category.id}
            onAddChild={onAddChild}
            onEdit={onEdit}
            onDelete={onDelete}
            selection={selection}
          />
        ))}
    </>
  );
}

export default function CategoriesPage() {
  const loading = useAdminLoading();
  const listings = useListingStore((s) => s.listings);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [dialog, setDialog] = useState<CategoryDialogState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryNode | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const selection = useRowSelection<CategoryNode>();

  useEffect(() => {
    api.get<CategoryNode[]>("/categories")
      .then(setCategories)
      .catch(setError)
      .finally(() => setDataLoading(false));
  }, [reloadKey]);

  /** Re-read the tree after a change without flashing the loading skeleton. */
  const refresh = useCallback(
    () => api.get<CategoryNode[]>("/categories").then(setCategories).catch(() => toast.error("Couldn't refresh categories")),
    [],
  );

  /** Every category in the tree, flat, so "select all" and bulk delete can reach sub-categories. */
  const flatNodes = useMemo(() => flatten(categories).map((x) => x.node), [categories]);

  /**
   * Deepest categories first, one at a time: a parent can't be deleted while its children exist.
   * Categories that still have listings (or children that were kept) are refused and reported.
   */
  const bulkDelete = async () => {
    const depth = new Map(flatten(categories).map((x) => [x.node.id, x.depth]));
    const ordered = [...selection.ids].sort((a, b) => (depth.get(b) ?? 0) - (depth.get(a) ?? 0));
    const res = await runBatch(ordered, (id) => api.delete(`/categories/${id}`), 1);
    reportBatch("Deleted", "category", res);
    selection.clear();
    await refresh();
  };

  const handleDelete = async (category: CategoryNode) => {
    try {
      await api.delete(`/categories/${category.id}`);
      toast.success(`Deleted ${category.name}`);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't delete the category");
      throw e;
    }
  };

  const totalCategories = useMemo(() => {
    let count = 0;
    const walk = (c: CategoryNode) => {
      count++;
      for (const sub of c.children) walk(sub);
    };
    categories.forEach(walk);
    return count;
  }, [categories]);

  if (loading || dataLoading) return <TablePageSkeleton statCards={3} />;
  if (error && categories.length === 0) {
    return (
      <LoadError
        what="categories"
        error={error}
        onRetry={() => {
          setDataLoading(true);
          setError(null);
          setReloadKey((k) => k + 1);
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Categories</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage product categories</p>
      </div>

      <div className={STAT_GRID}>
        <StatCard icon={Grid3x3} label="Top-level Categories" value={categories.length} iconBg="bg-brand-primary/10" iconColor="text-brand-primary" />
        <StatCard icon={Layers} label="Total Categories" value={totalCategories} iconBg="bg-blue-500/10" iconColor="text-blue-500" />
        <StatCard icon={Tag} label="All Listings" value={listings.length} iconBg="bg-amber-500/10" iconColor="text-amber-500" />
      </div>

      <Card className="border border-border/50">
        <div className="flex items-center justify-between p-4 pb-2">
          <div>
            <p className="text-sm font-semibold text-foreground">Category Tree</p>
            <p className="text-xs text-muted-foreground mt-0.5">Hierarchical view of all categories</p>
          </div>
          <Button size="sm" onClick={() => setDialog({ mode: "add", parentId: null })}>
            <Plus className="size-4" />
            Add category
          </Button>
        </div>
        <SelectionBar
          count={selection.count}
          onClear={selection.clear}
          onExport={() => downloadCsv("categories", selection.rows.map(({ children, ...rest }) => ({ ...rest, subCategories: children.length })))}
        >
          <Button size="sm" variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </SelectionBar>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-10">
                  <SelectAllCheckbox items={flatNodes} selection={selection} />
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Slug</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground text-right">Listings</TableHead>
                <TableHead className="w-28 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat, idx) => (
                <CategoryRow
                  key={cat.id}
                  category={cat}
                  listings={listings}
                  depth={0}
                  colorIndex={idx}
                  parentId={null}
                  onAddChild={(parent) => setDialog({ mode: "add", parentId: parent.id })}
                  onEdit={(category, parentId) => setDialog({ mode: "edit", category, parentId })}
                  onDelete={setDeleteTarget}
                  selection={selection}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          {dialog && (
            <CategoryForm state={dialog} tree={categories} onClose={() => setDialog(null)} onSaved={() => void refresh()} />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Delete ${selection.count} categor${selection.count === 1 ? "y" : "ies"}?`}
        description="Categories that still have listings can't be deleted and will be left in place. Sub-categories are removed before their parents."
        confirmLabel="Delete"
        onConfirm={bulkDelete}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete category?"
        description={
          <>
            &ldquo;{deleteTarget?.name}&rdquo; will be removed. Categories that still have sub-categories or
            listings can&apos;t be deleted.
          </>
        }
        confirmLabel="Delete"
        onConfirm={() => (deleteTarget ? handleDelete(deleteTarget) : undefined)}
      />
    </div>
  );
}
