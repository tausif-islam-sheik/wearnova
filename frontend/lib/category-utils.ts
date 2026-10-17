import type { Category } from "@/types";
import { categories as mockCategories } from "@/mocks/categories";
import { api } from "@/lib/api";

interface RawCategoryNode {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  children?: RawCategoryNode[];
}

function normalizeNode(node: RawCategoryNode): Category {
  return {
    id: node.id,
    name: node.name,
    slug: node.slug,
    icon: node.icon ?? undefined,
    subcategories: (node.children ?? []).map(normalizeNode),
  };
}

function isNormalized(node: Category | RawCategoryNode): node is Category {
  return "subcategories" in node;
}

function normalizeTree(data: Category[] | RawCategoryNode[]): Category[] {
  if (data.length === 0) return [];
  if (isNormalized(data[0])) return data as Category[];
  return (data as RawCategoryNode[]).map(normalizeNode);
}

const CATEGORY_ORDER = [
  "women", "men", "designer", "kids", "home",
  "electronics", "entertainment", "hobbies", "sports",
];

function sortByOrder(tree: Category[]): Category[] {
  return [...tree]
    .sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a.id);
      const bi = CATEGORY_ORDER.indexOf(b.id);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    })
    .map((cat) => ({
      ...cat,
      subcategories: sortByOrder(cat.subcategories ?? []),
    }));
}

export function findCategoryInTree(
  id: string,
  tree: readonly Category[]
): Category | null {
  for (const cat of tree) {
    if (cat.id === id) return cat;
    if (cat.subcategories?.length) {
      const found = findCategoryInTree(id, cat.subcategories);
      if (found) return found;
    }
  }
  return null;
}

export function getCategoryPathToRoot(
  id: string,
  tree: readonly Category[]
): Category[] | null {
  const path: Category[] = [];
  const search = (nodes: readonly Category[]): boolean => {
    for (const node of nodes) {
      path.push(node);
      if (node.id === id) return true;
      if (node.subcategories?.length && search(node.subcategories)) return true;
      path.pop();
    }
    return false;
  };
  if (search(tree)) return path;
  return null;
}

export function collectDescendantIds(cat: Category): Set<string> {
  const ids = new Set<string>();
  const walk = (node: Category) => {
    ids.add(node.id);
    node.subcategories?.forEach(walk);
  };
  walk(cat);
  return ids;
}

let cachedCategories: Category[] | null = null;
const sortedMock = sortByOrder(mockCategories);
let fetchPromise: Promise<Category[]> | null = null;

export async function getCategories(): Promise<Category[]> {
  if (cachedCategories) return cachedCategories;
  if (fetchPromise) return fetchPromise;
  fetchPromise = (async () => {
    try {
      const raw = await api.get<RawCategoryNode[]>("/categories");
      const normalized = sortByOrder(normalizeTree(raw));
      cachedCategories = normalized;
      return normalized;
    } catch {
      cachedCategories = sortedMock;
      return sortedMock;
    }
  })();
  return fetchPromise;
}

export function getCategoriesSync(): Category[] {
  return cachedCategories ?? sortedMock;
}
