import { BadRequestException, Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import Stripe from 'stripe';
import { PrismaService } from '@/prisma/prisma.service';
import { AppConfigService } from '@/config/config.service';
import { UpdateStripeSettingsDto } from './dto/update-stripe-settings.dto';

type Field = 'secretKey' | 'publishableKey' | 'webhookSecret';
type Source = 'database' | 'environment' | 'none';
type Mode = 'test' | 'live' | null;

const SETTING_KEY: Record<Field, string> = {
  secretKey: 'stripe_secret_key',
  publishableKey: 'stripe_publishable_key',
  webhookSecret: 'stripe_webhook_secret',
};

/** Secrets are encrypted at rest; the publishable key is public and stored as-is. */
const ENCRYPTED: Record<Field, boolean> = {
  secretKey: true,
  publishableKey: false,
  webhookSecret: true,
};

const FORMAT: Record<Field, { pattern: RegExp; hint: string }> = {
  secretKey: {
    pattern: /^(sk|rk)_(test|live)_[A-Za-z0-9]{10,}$/,
    hint: 'a secret key starting with sk_live_',
  },
  publishableKey: {
    pattern: /^pk_(test|live)_[A-Za-z0-9]{10,}$/,
    hint: 'a publishable key starting with pk_live_',
  },
  webhookSecret: {
    pattern: /^whsec_[A-Za-z0-9]{10,}$/,
    hint: 'a webhook signing secret starting with whsec_',
  },
};

const PLACEHOLDER = /x{4,}/i;
const CACHE_MS = 10_000;

export interface ResolvedStripe {
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
  source: Record<Field, Source>;
}

const modeOf = (key: string): Mode =>
  /_test_/.test(key) ? 'test' : /_live_/.test(key) ? 'live' : null;
const usable = (value: string) => Boolean(value) && !PLACEHOLDER.test(value);
const mask = (value: string) =>
  `${value.slice(0, value.indexOf('_', value.indexOf('_') + 1) + 1)}••••••••${value.slice(-4)}`;

/**
 * Resolves the Stripe credentials: values saved by an admin (database) win over
 * the .env values, so keys can be rotated from the admin panel without a redeploy.
 */
@Injectable()
export class StripeCredentialsService {
  private cache: { at: number; value: ResolvedStripe } | null = null;
  private encryptionKey: Buffer | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  // -- encryption --------------------------------------------------------------

  private key(): Buffer {
    if (!this.encryptionKey) {
      const secret = process.env.SETTINGS_ENCRYPTION_KEY || process.env.JWT_SECRET;
      if (!secret) throw new Error('SETTINGS_ENCRYPTION_KEY or JWT_SECRET is required');
      this.encryptionKey = scryptSync(secret, 'desire-wardrobe:settings:v1', 32);
    }
    return this.encryptionKey;
  }

  private encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key(), iv);
    const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    return [
      'enc',
      'v1',
      iv.toString('base64'),
      cipher.getAuthTag().toString('base64'),
      data.toString('base64'),
    ].join(':');
  }

  private decrypt(stored: string): string | null {
    const [tag, version, iv, authTag, data] = stored.split(':');
    if (tag !== 'enc' || version !== 'v1' || !iv || !authTag || !data) return null;
    try {
      const decipher = createDecipheriv('aes-256-gcm', this.key(), Buffer.from(iv, 'base64'));
      decipher.setAuthTag(Buffer.from(authTag, 'base64'));
      return Buffer.concat([
        decipher.update(Buffer.from(data, 'base64')),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      return null; // key changed / corrupted -> treat as not saved
    }
  }

  // -- resolution --------------------------------------------------------------

  async resolve(): Promise<ResolvedStripe> {
    if (this.cache && Date.now() - this.cache.at < CACHE_MS) return this.cache.value;

    const rows = await this.prisma.platformSetting.findMany({
      where: { key: { in: Object.values(SETTING_KEY) } },
    });
    const stored = new Map(rows.map((r) => [r.key, r.value]));
    const env: Record<Field, string> = {
      secretKey: this.config.stripeSecretKey,
      publishableKey: this.config.stripePublishableKey,
      webhookSecret: this.config.stripeWebhookSecret,
    };

    const value = { source: {} as Record<Field, Source> } as ResolvedStripe;
    (Object.keys(SETTING_KEY) as Field[]).forEach((field) => {
      const raw = stored.get(SETTING_KEY[field]);
      const saved = raw ? (ENCRYPTED[field] ? this.decrypt(raw) : raw) : null;
      if (saved) {
        value[field] = saved;
        value.source[field] = 'database';
      } else if (usable(env[field])) {
        value[field] = env[field];
        value.source[field] = 'environment';
      } else {
        value[field] = '';
        value.source[field] = 'none';
      }
    });

    this.cache = { at: Date.now(), value };
    return value;
  }

  async isConfigured(): Promise<boolean> {
    return usable((await this.resolve()).secretKey);
  }

  // -- admin API ---------------------------------------------------------------

  async getAdminView() {
    const resolved = await this.resolve();
    const field = (name: Field, reveal = false) => ({
      configured: Boolean(resolved[name]),
      source: resolved.source[name],
      value: resolved[name] ? (reveal ? resolved[name] : mask(resolved[name])) : null,
    });
    return {
      configured: usable(resolved.secretKey),
      mode: modeOf(resolved.secretKey || resolved.publishableKey),
      modeMismatch:
        Boolean(resolved.secretKey && resolved.publishableKey) &&
        modeOf(resolved.secretKey) !== modeOf(resolved.publishableKey),
      secretKey: field('secretKey'),
      publishableKey: field('publishableKey', true), // public by design
      webhookSecret: field('webhookSecret'),
    };
  }

  async update(dto: UpdateStripeSettingsDto) {
    const updates: [Field, string][] = [];

    (Object.keys(SETTING_KEY) as Field[]).forEach((field) => {
      const raw = dto[field];
      if (raw === undefined) return;
      const value = raw.trim();
      if (value !== '') {
        const { pattern, hint } = FORMAT[field];
        if (PLACEHOLDER.test(value) || !pattern.test(value)) {
          throw new BadRequestException(`That doesn't look right — enter ${hint}.`);
        }
      }
      updates.push([field, value]);
    });

    // Secret + publishable must be from the same Stripe mode.
    const next = await this.resolve();
    const merged = {
      secretKey: updates.find(([f]) => f === 'secretKey')?.[1] ?? next.secretKey,
      publishableKey: updates.find(([f]) => f === 'publishableKey')?.[1] ?? next.publishableKey,
    };
    if (
      merged.secretKey &&
      merged.publishableKey &&
      modeOf(merged.secretKey) !== modeOf(merged.publishableKey)
    ) {
      throw new BadRequestException(
        'The secret key and publishable key are from different Stripe modes (test vs live).',
      );
    }

    await this.prisma.$transaction(
      updates.map(([field, value]) =>
        value === ''
          ? this.prisma.platformSetting.deleteMany({ where: { key: SETTING_KEY[field] } })
          : this.prisma.platformSetting.upsert({
              where: { key: SETTING_KEY[field] },
              create: {
                key: SETTING_KEY[field],
                value: ENCRYPTED[field] ? this.encrypt(value) : value,
              },
              update: { value: ENCRYPTED[field] ? this.encrypt(value) : value },
            }),
      ),
    );

    this.cache = null;
    return this.getAdminView();
  }

  /** Calls Stripe with the resolved secret key to prove it works. */
  async test(): Promise<{ ok: boolean; message: string; mode?: Mode }> {
    const { secretKey } = await this.resolve();
    if (!usable(secretKey))
      return { ok: false, message: 'No Stripe secret key is configured yet.' };
    try {
      await new Stripe(secretKey).balance.retrieve();
      const mode = modeOf(secretKey);
      return { ok: true, message: `Connected to Stripe${mode ? ` (${mode} mode)` : ''}.`, mode };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Stripe rejected the key';
      return { ok: false, message: message.replace(/sk_(test|live)_[A-Za-z0-9*•]+/g, 'sk_…') };
    }
  }

  async getPublicConfig() {
    const { publishableKey } = await this.resolve();
    return {
      publishableKey: usable(publishableKey) ? publishableKey : null,
      mode: modeOf(publishableKey),
    };
  }
}
