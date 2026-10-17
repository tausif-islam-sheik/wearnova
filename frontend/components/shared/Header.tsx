"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, ChevronDown, Camera, Heart, ShieldCheck, Package, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Container } from "@/components/layout/container";
import { useAuthStore } from "@/stores/useAuthStore";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { useRouter } from "next/navigation";
import { CartButton } from "./CartDrawer";
import { CategoryNav } from "./CategoryNav";
import { mockUsers } from "@/mocks/users";

type SearchScope = "catalog" | "members";

export function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { isAdminAuthenticated, admin } = useAdminAuthStore();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const authHydrated = useAuthHydrated();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchScope, setSearchScope] = useState<SearchScope>("catalog");
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const handleCameraFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Please choose an image smaller than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        sessionStorage.setItem(
          "dw-visual-search",
          JSON.stringify({ src: reader.result as string, name: file.name })
        );
        router.push("/visual-search");
      } catch {
        alert("Could not process that photo. Please try a smaller image.");
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (searchScope === "members") {
      const match = mockUsers.find((u) =>
        u.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      );
      if (match) {
        router.push(`/seller/${match.name.toLowerCase().replace(/\s+/g, "-")}`);
      } else {
        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}&scope=members`);
      }
    } else {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 bg-background transition-shadow ${
        scrolled ? "shadow-sm border-b border-border" : ""
      }`}
    >
      <Container>
        {/* Top bar */}
        <div className="flex items-center gap-2 py-3 sm:gap-6">
          {/* Logo */}
          <Link
            href="/"
            aria-label="Wearnova — home"
            className="shrink-0 py-2 sm:py-0"
          >
            <span className="block text-3xl tracking-wide text-brand-primary sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
              Wearnova
            </span>
          </Link>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-2xl items-center"
          >
            <div className="flex w-full items-center rounded bg-surface-muted border border-transparent focus-within:border-border-subtle focus-within:bg-background transition-colors">
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center gap-0.5 px-3 py-1.5 text-sm font-medium text-foreground-muted hover:text-foreground rounded shrink-0 outline-none">
                  {searchScope === "catalog" ? "Catalog" : "Members"}
                  <ChevronDown className="size-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  <DropdownMenuItem onClick={() => setSearchScope("catalog")}>
                    Catalog
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSearchScope("members")}>
                    Members
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="h-4 w-px bg-border-subtle mx-1" />
              <div className="relative flex-1">
                <Input
                  type="search"
                  placeholder={searchScope === "catalog" ? "Search for items..." : "Search for members..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-9 placeholder:text-foreground-faint pr-7 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCameraFile}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Visual search — upload a photo"
                className="rounded shrink-0 mr-1 text-foreground-muted"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="size-4" />
              </Button>
            </div>
          </form>

          <div className="flex-1 md:hidden" />

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {isAdminAuthenticated && admin && (
              <Link
                href="/admin/overview"
                className="hidden sm:inline-flex items-center gap-1.5 h-9 rounded border border-brand-primary/30 bg-brand-primary/5 px-3 text-xs font-medium text-brand-primary hover:bg-brand-primary/10 transition-colors shrink-0"
              >
                <ShieldCheck className="size-3.5" />
                <span>Admin</span>
              </Link>
            )}
            <Link
              href="/track-order"
              className="hidden sm:inline-flex items-center gap-1.5 h-9 rounded px-3 text-xs font-medium text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors shrink-0"
            >
              <Package className="size-3.5" />
              <span className="hidden sm:inline">Track order</span>
            </Link>
            <CartButton />
            {!authHydrated ? (
              <div className="flex items-center gap-3">
                <div className="h-9 w-24 animate-pulse rounded bg-surface-muted" />
                <div className="hidden h-9 w-20 animate-pulse rounded bg-surface-muted sm:inline-flex" />
              </div>
            ) : isAuthenticated && user ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 sm:size-8 rounded text-foreground-muted hover:text-brand-primary"
                  onClick={() => router.push("/favorites")}
                >
                  <Heart className="size-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden sm:inline-flex size-11 sm:size-8 rounded text-foreground-muted hover:text-brand-primary"
                  onClick={() => router.push("/orders")}
                >
                  <Package className="size-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger className="outline-none">
                    <Avatar className="size-11 sm:size-8">
                      <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-xs font-medium">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                      onClick={() => router.push(`/seller/${user.name.toLowerCase().replace(/\s+/g, "-")}`)}
                    >
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => router.push("/settings")}
                      className="justify-between"
                    >
                      <span>Settings</span>
                      <span className="rounded-full bg-brand-primary px-2 py-0.5 text-[10px] font-medium text-white">
                        Action needed
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/personalization")}
                    >
                      Personalization
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/wallet")}
                    >
                      Wallet
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/orders")}
                    >
                      My orders
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        logout();
                        router.push("/");
                      }}
                    >
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  size="lg"
                  onClick={() => router.push("/sell")}
                  className="hidden sm:inline-flex rounded bg-brand-primary text-white hover:bg-brand-primary-hover"
                >
                  Sell now
                </Button>
              </>
            ) : (
              <>
                {/* Sign up / Log in segmented pill — same design on mobile and desktop */}
                <div className="flex items-center h-9 rounded border border-brand-primary text-brand-primary text-xs sm:text-sm font-medium hover:bg-brand-primary/5 transition-colors shrink-0">
                  <button
                    onClick={() => router.push("/signup")}
                    className="px-2.5 sm:px-3.5 h-full"
                  >
                    Sign up
                  </button>
                  <div className="w-px h-3.5 bg-brand-primary/40" />
                  <button
                    onClick={() => router.push("/login")}
                    className="px-2.5 sm:px-3.5 h-full"
                  >
                    Log in
                  </button>
                </div>
                <Button
                  size="lg"
                  className="rounded bg-brand-primary text-white hover:bg-brand-primary-hover hidden sm:inline-flex"
                  onClick={() => router.push("/sell")}
                >
                  Sell now
                </Button>
              </>
            )}
          </div>
        </div>
      </Container>

      {/* Category nav */}
      <CategoryNav />

      {/* Mobile search */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSearch}>
          <div className="flex items-center rounded bg-surface-muted border border-transparent focus-within:border-border-subtle focus-within:bg-background transition-colors">
            <div className="relative flex-1">
              <Input
                type="search"
                placeholder={searchScope === "catalog" ? "Search for items..." : "Search for members..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-9 placeholder:text-foreground-faint pr-7"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <Button
              type="submit"
              variant="ghost"
              size="icon-sm"
              className="rounded shrink-0 mr-1 text-foreground-muted"
            >
              <Search className="size-4" />
            </Button>
          </div>
        </form>
      </div>
    </header>
  );
}
