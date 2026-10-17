import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Uploaded media comes back as an absolute URL, older rows may hold a bare `/uploads/...` path. */
export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined
  if (/^(https?:|data:|blob:)/.test(url)) return url
  const origin = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(/\/api\/?$/, "")
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`
}
