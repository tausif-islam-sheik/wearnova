import { format, formatDistanceToNow } from "date-fns";

export function formatDate(iso: string): string {
  return format(new Date(iso), "MMM d, yyyy");
}

export function relativeTime(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}
