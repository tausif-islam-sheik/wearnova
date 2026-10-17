import { toast } from "sonner";

export interface BatchResult {
  succeeded: string[];
  failed: { id: string; reason: string }[];
}

/** Runs `fn` for every id (a few at a time) and never throws: failures are collected per id. */
export async function runBatch(
  ids: string[],
  fn: (id: string) => Promise<unknown>,
  concurrency = 4,
): Promise<BatchResult> {
  const result: BatchResult = { succeeded: [], failed: [] };
  let next = 0;
  const worker = async () => {
    while (next < ids.length) {
      const id = ids[next++]!;
      try {
        await fn(id);
        result.succeeded.push(id);
      } catch (e) {
        result.failed.push({ id, reason: e instanceof Error ? e.message : "Failed" });
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, ids.length) }, worker));
  return result;
}

/** One honest toast for a batch: all done, partly done (with a reason), or nothing done. */
export function reportBatch(verb: string, noun: string, result: BatchResult) {
  const plural = (n: number) => `${n} ${noun}${n === 1 ? "" : "s"}`;
  const { succeeded, failed } = result;
  if (failed.length === 0) {
    toast.success(`${verb} ${plural(succeeded.length)}`);
    return;
  }
  const why = [...new Set(failed.map((f) => f.reason))].slice(0, 2).join("; ");
  if (succeeded.length === 0) {
    toast.error(`Couldn't ${verb.toLowerCase()} ${plural(failed.length)}`, { description: why });
  } else {
    toast.warning(`${verb} ${plural(succeeded.length)}; ${failed.length} failed`, { description: why });
  }
}
