import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { AUDIT_KEY, type AuditContext, type AuditSpec } from './audited.decorator';
import { AuditService } from './audit.service';

/** Handlers return plain data, but depending on interceptor order we may see the envelope. */
function unwrap(result: unknown): Record<string, unknown> | undefined {
  if (!result || typeof result !== 'object') return undefined;
  const r = result as Record<string, unknown>;
  if ('success' in r && 'data' in r && r.data && typeof r.data === 'object') {
    return r.data as Record<string, unknown>;
  }
  return r;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const spec = this.reflector.get<AuditSpec | undefined>(AUDIT_KEY, context.getHandler());
    if (!spec) return next.handle();

    const req = context.switchToHttp().getRequest<AuditContext['req']>();
    // Only runs for successful responses (errors skip `tap`), and is not awaited, so the
    // response is never delayed by the audit write.
    return next.handle().pipe(
      tap((result) => {
        void this.audit.recordFor(spec, { req, res: unwrap(result) });
      }),
    );
  }
}
