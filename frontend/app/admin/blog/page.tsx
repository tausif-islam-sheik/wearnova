"use client";

import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard, STAT_GRID } from "@/components/admin/StatCard";
import { useAdminLoading, EmptyPageSkeleton } from "@/components/admin/PageSkeletons";
import { EmptyState } from "@/components/admin/EmptyState";

export default function BlogPage() {
  const loading = useAdminLoading();
  if (loading) return <EmptyPageSkeleton />;
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Blog
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage blog posts and articles
          </p>
        </div>
        <Button
          className="bg-foreground text-background hover:bg-foreground/90"
          disabled
          title="The blog editor isn't available yet"
        >
          <Plus className="size-4 mr-1.5" />
          New Post (coming soon)
        </Button>
      </div>

      <div className={STAT_GRID}>
        <StatCard
          icon={FileText}
          label="Total Posts"
          value={0}
          iconBg="bg-brand-primary/10"
          iconColor="text-brand-primary"
        />
      </div>

      <Card className="border border-border/50">
        <CardContent className="p-0">
          <EmptyState
            title="No blog posts yet"
            description="Create your first blog post to get started"
          />
        </CardContent>
      </Card>
    </div>
  );
}
