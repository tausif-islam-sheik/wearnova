"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/useAuthStore";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  userId: string;
  className?: string;
}

export function FollowButton({ userId, className }: FollowButtonProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusLoaded, setStatusLoaded] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setStatusLoaded(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .get<{ following: boolean }>(`/users/${userId}/followers/status`)
      .then((res) => {
        if (!cancelled) {
          setFollowing(res.following);
          setStatusLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatusLoaded(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, isAuthenticated]);

  const handleToggle = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setLoading(true);
    try {
      if (following) {
        const res = await api.delete<{ following: boolean }>(`/users/${userId}/follow`);
        setFollowing(res.following);
        toast.success("Unfollowed");
      } else {
        const res = await api.post<{ following: boolean }>(`/users/${userId}/follow`);
        setFollowing(res.following);
        toast.success("Following");
      }
    } catch {
      toast.error("Could not update follow status");
    }
    setLoading(false);
  };

  if (!statusLoaded) {
    return (
      <Button variant="outline" size="sm" disabled className={cn("rounded", className)}>
        <Loader2 className="size-3.5 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      variant={following ? "outline" : "default"}
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className={cn("rounded gap-1.5", following ? "" : "bg-brand-primary text-white hover:bg-brand-primary-hover", className)}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : following ? (
        <UserCheck className="size-3.5" />
      ) : (
        <UserPlus className="size-3.5" />
      )}
      {following ? "Following" : "Follow"}
    </Button>
  );
}
