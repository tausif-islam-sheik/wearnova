type Cell = string | number | boolean | null | undefined;

/** Nested objects are flattened up to three levels (`order.listing.title`); arrays of primitives are joined. */
function flatten(row: Record<string, unknown>): Record<string, Cell> {
  const out: Record<string, Cell> = {};
  const put = (key: string, value: unknown, depth: number) => {
    if (value === null || value === undefined) out[key] = "";
    else if (value instanceof Date) out[key] = value.toISOString();
    else if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") out[key] = value;
    else if (Array.isArray(value)) out[key] = value.every((v) => typeof v !== "object" || v === null) ? value.join("; ") : "";
    else if (typeof value === "object" && depth < 3) {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) put(`${key}.${k}`, v, depth + 1);
    }
  };
  for (const [k, v] of Object.entries(row)) put(k, v, 0);
  return out;
}

/** Quote when needed, and defuse values a spreadsheet would run as a formula (=, +, -, @). */
function escapeCell(value: Cell): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: readonly object[]): string {
  const flat = rows.map((r) => flatten(r as Record<string, unknown>));
  const columns: string[] = [];
  for (const row of flat) for (const key of Object.keys(row)) if (!columns.includes(key)) columns.push(key);
  const lines = [columns.map(escapeCell).join(",")];
  for (const row of flat) lines.push(columns.map((c) => escapeCell(row[c])).join(","));
  return lines.join("\r\n");
}

/** Downloads rows as a UTF-8 CSV that opens correctly in Excel. */
export function downloadCsv(filename: string, rows: readonly object[]) {
  const blob = new Blob(["﻿", toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
