const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let accessToken: string | null = null;
  if (typeof window !== "undefined") {
    const stores = ["desire-wardrobe-admin-auth", "desire-wardrobe-auth"];
    for (const store of stores) {
      const raw = localStorage.getItem(store);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        accessToken = parsed?.state?.accessToken ?? null;
        if (accessToken) break;
      } catch {
        // ignore parse error
      }
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new ApiError(
      json.message ?? json.error ?? "Request failed",
      res.status,
    );
  }

  return json.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, formData: FormData) => {
    let accessToken: string | null = null;
    if (typeof window !== "undefined") {
      const stores = ["desire-wardrobe-admin-auth", "desire-wardrobe-auth"];
      for (const store of stores) {
        const raw = localStorage.getItem(store);
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          accessToken = parsed?.state?.accessToken ?? null;
          if (accessToken) break;
        } catch {
          // ignore parse error
        }
      }
    }

    const headers: Record<string, string> = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    return fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: formData,
    }).then(async (res) => {
      const json = await res.json();
      if (!res.ok) {
        throw new ApiError(
          json.message ?? json.error ?? "Upload failed",
          res.status,
        );
      }
      return json.data as T;
    });
  },
};

export { ApiError };

interface PageInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Reads every page of a paginated list endpoint (`{ [key]: T[], pagination }`) so admin tables
 * never silently stop at the first page. Pages after the first are fetched in parallel.
 */
export async function fetchAllPages<T>(
  path: string,
  key: string,
  { pageSize = 100, maxPages = 50 }: { pageSize?: number; maxPages?: number } = {},
): Promise<{ items: T[]; total: number }> {
  const sep = path.includes("?") ? "&" : "?";
  const load = (page: number) =>
    api.get<Record<string, unknown> & { pagination: PageInfo }>(
      `${path}${sep}page=${page}&limit=${pageSize}`,
    );

  const first = await load(1);
  const items = [...((first[key] as T[] | undefined) ?? [])];
  const lastPage = Math.min(first.pagination?.totalPages ?? 1, maxPages);

  if (lastPage > 1) {
    const rest = await Promise.all(Array.from({ length: lastPage - 1 }, (_, i) => load(i + 2)));
    for (const res of rest) items.push(...((res[key] as T[] | undefined) ?? []));
  }
  return { items, total: first.pagination?.total ?? items.length };
}

/** Downloads a file from an authenticated endpoint by fetching it as a blob (a plain link cannot send the token). */
export async function downloadFile(path: string, filename: string): Promise<void> {
  let accessToken: string | null = null;
  for (const store of ["desire-wardrobe-admin-auth", "desire-wardrobe-auth"]) {
    const raw = localStorage.getItem(store);
    if (!raw) continue;
    try {
      accessToken = JSON.parse(raw)?.state?.accessToken ?? null;
      if (accessToken) break;
    } catch {
      // ignore parse error
    }
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new ApiError(json?.message ?? "Download failed", res.status);
  }
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
