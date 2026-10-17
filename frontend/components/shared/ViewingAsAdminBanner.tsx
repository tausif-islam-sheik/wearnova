"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/useAuthStore";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";

export function ViewingAsAdminBanner() {
  const router = useRouter();
  const viewingAsAdmin = useAuthStore((s) => s.viewingAsAdmin);
  const exitAdminView = useAuthStore((s) => s.exitAdminView);
  const admin = useAdminAuthStore((s) => s.admin);

  if (!viewingAsAdmin) return null;

  return (
    <div className="bg-brand-primary-dark text-white px-4 py-2 flex items-center justify-between text-sm">
      <span>
        You are viewing as a user &mdash; Admin Mode
        {admin && ` (${admin.name})`}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20"
          onClick={() => {
            exitAdminView();
            router.push("/admin/users");
          }}
        >
          Exit to Admin
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-white hover:bg-white/20"
          onClick={exitAdminView}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
