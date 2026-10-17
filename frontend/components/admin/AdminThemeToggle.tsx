"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark";

const STORAGE_KEY = "desire-wardrobe-admin-theme";

const options: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light theme", icon: Sun },
  { value: "dark", label: "Dark theme", icon: Moon },
];

function readInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* storage unavailable */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const isDark = theme === "dark";
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
}

/**
 * Applies the admin theme to <html> while the admin panel is mounted,
 * and restores the storefront (light) look when leaving it.
 * First visit defaults to the OS preference; after that the saved choice wins.
 */
export function useAdminTheme() {
  const [theme, setThemeState] = useState<Theme | null>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- read persisted theme after hydration
  useEffect(() => setThemeState(readInitialTheme()), []);

  useEffect(() => {
    if (theme) applyTheme(theme);
  }, [theme]);

  useEffect(
    () => () => {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "";
    },
    []
  );

  const setTheme = (next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable */
    }
  };

  return { theme, setTheme };
}

export function AdminThemeToggle() {
  const { theme, setTheme } = useAdminTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/50 p-0.5"
    >
      {options.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              "inline-flex size-6 cursor-pointer items-center justify-center rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}
