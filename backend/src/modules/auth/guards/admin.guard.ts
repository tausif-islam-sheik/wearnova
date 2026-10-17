import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: { role?: string } }>();
    const user = request.user;
    if (!user) throw new UnauthorizedException('Authentication required');
    if (user.role !== 'admin') throw new UnauthorizedException('Admin access required');
    return true;
  }
}
