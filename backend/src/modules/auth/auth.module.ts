import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAdminStrategy } from './strategies/jwt-admin.strategy';
import { SmsModule } from '@/modules/sms/sms.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    SmsModule,
    JwtModule.registerAsync({
      useFactory: () => {
        if (!process.env.JWT_SECRET) {
          throw new Error('JWT_SECRET environment variable is required');
        }
        const secret = process.env.JWT_SECRET;
        const expiresIn = process.env.JWT_EXPIRES_IN ?? '7d';
        return {
          secret,
          signOptions: { expiresIn: expiresIn as unknown as number },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAdminStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
