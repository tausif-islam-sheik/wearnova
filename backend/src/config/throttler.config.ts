import { ThrottlerModule } from '@nestjs/throttler';

export const ThrottlerConfigModule = ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]);
