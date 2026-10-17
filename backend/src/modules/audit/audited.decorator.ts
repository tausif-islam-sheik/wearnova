import { SetMetadata } from '@nestjs/common';

/** What the audit hook can see once a handler has succeeded. */
export interface AuditContext {
  req: {
    params: Record<string, string>;
    body: Record<string, unknown>;
    user?: { id: string; email: string };
  };
  /** The handler's return value (already unwrapped from the `{ success, data }` envelope). */
  res: Record<string, unknown> | undefined;
}

export interface AuditSpec {
  /** Dotted name, e.g. `order.refund`. The part before the dot is used for filtering. */
  action: string;
  targetType: string;
  /** Defaults to `req.params.id`. */
  target?: (ctx: AuditContext) => string | undefined;
  /** One human sentence. Must never include secrets, passwords or tokens. */
  summary: (ctx: AuditContext) => string;
  /** For routes that have no authenticated user yet (e.g. admin login). */
  actor?: (ctx: AuditContext) => { id: string; email: string } | undefined;
}

export const AUDIT_KEY = 'audit_spec';

/** Marks an admin endpoint whose successful calls should be written to the audit log. */
export const Audited = (spec: AuditSpec) => SetMetadata(AUDIT_KEY, spec);
