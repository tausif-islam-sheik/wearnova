"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberRow } from "@/components/shared/MemberRow";
import { api } from "@/lib/api";
import type { User } from "@/types";

interface PaginatedUsers {
  users: User[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function FollowersPage() {
  const params = useParams();
  const displayName = (params.username as string)?.replace(/-/g, " ") ?? "";

  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [followers, setFollowers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingUser(true);
    api
      .get<{ users: User[] }>(`/users?search=${encodeURIComponent(displayName)}`)
      .then((res) => {
        if (cancelled) return;
        const match = res.users.find(
          (u) => u.name.toLowerCase() === displayName.toLowerCase()
        );
        setTargetUser(match ?? null);
      })
      .catch(() => {
        if (!cancelled) setTargetUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingUser(false);
      });
    return () => {
      cancelled = true;
    };
  }, [displayName]);

  useEffect(() => {
    if (!targetUser) return;
    let cancelled = false;
    setLoading(true);
    api
      .get<PaginatedUsers>(`/users/${targetUser.id}/followers?limit=100`)
      .then((res) => {
        if (cancelled) return;
        setFollowers(res.users);
        setTotal(res.pagination.total);
      })
      .catch(() => {
        if (!cancelled) {
          setFollowers([]);
          setTotal(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [targetUser]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link
        href={`/seller/${params.username}`}
        className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground mb-6"
      >
        <ArrowLeft className="size-4" />
        Back to profile
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <Users className="size-5 text-brand-primary" strokeWidth={1.5} />
        <h1 className="text-xl font-bold text-foreground">
          {targetUser ? targetUser.name : displayName}&apos;s followers
        </h1>
        {!loading && (
          <span className="text-sm text-foreground-muted">({total})</span>
        )}
      </div>

      {loadingUser ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 rounded-lg border border-border p-4">
              <Skeleton className="size-12 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : !targetUser ? (
        <div className="rounded-lg border border-border p-10 text-center">
          <p className="text-sm text-foreground-muted">Member not found.</p>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 rounded-lg border border-border p-4">
              <Skeleton className="size-12 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : followers.length === 0 ? (
        <div className="rounded-lg border border-border p-10 text-center">
          <Users className="mx-auto size-8 text-foreground-faint mb-3" strokeWidth={1.5} />
          <p className="text-sm text-foreground-muted">
            No followers yet. Follow this member to be the first!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {followers.map((member) => (
            <MemberRow key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  );
}
