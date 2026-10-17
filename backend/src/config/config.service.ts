import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: NestConfigService) {}

  get nodeEnv(): string {
    return this.config.getOrThrow<string>('NODE_ENV');
  }

  get port(): number {
    return this.config.getOrThrow<number>('PORT');
  }

  get databaseUrl(): string {
    return this.config.getOrThrow<string>('DATABASE_URL');
  }

  get jwtSecret(): string {
    return this.config.getOrThrow<string>('JWT_SECRET');
  }

  get jwtExpiresIn(): string {
    return this.config.getOrThrow<string>('JWT_EXPIRES_IN');
  }

  get jwtAdminExpiresIn(): string {
    return this.config.getOrThrow<string>('JWT_ADMIN_EXPIRES_IN');
  }

  get frontendUrl(): string {
    return this.config.getOrThrow<string>('FRONTEND_URL');
  }

  get uploadDir(): string {
    return this.config.getOrThrow<string>('UPLOAD_DIR');
  }

  get maxFileSize(): number {
    return this.config.getOrThrow<number>('MAX_FILE_SIZE');
  }

  get bcryptSaltRounds(): number {
    return this.config.getOrThrow<number>('BCRYPT_SALT_ROUNDS');
  }

  get stripeSecretKey(): string {
    return this.config.get<string>('STRIPE_SECRET_KEY') ?? '';
  }

  get stripePublishableKey(): string {
    return this.config.get<string>('STRIPE_PUBLISHABLE_KEY') ?? '';
  }

  get stripeWebhookSecret(): string {
    return this.config.get<string>('STRIPE_WEBHOOK_SECRET') ?? '';
  }

  /** False for an empty key or the `sk_test_xxxx…` placeholder from .env.example. */
  get stripeConfigured(): boolean {
    const key = this.stripeSecretKey;
    return Boolean(key) && !/x{4,}/i.test(key);
  }

  get platformFeePercentDefault(): number {
    return this.config.getOrThrow<number>('PLATFORM_FEE_PERCENT_DEFAULT');
  }

  get escrowAutoConfirmDays(): number {
    return this.config.getOrThrow<number>('ESCROW_AUTO_CONFIRM_DAYS');
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }
}
