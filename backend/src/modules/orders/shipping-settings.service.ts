import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateShippingSettingsDto } from './dto/update-shipping-settings.dto';
import {
  DEFAULT_SHIPPING_SETTINGS,
  SHIPPING_METHOD_IDS,
  SHIPPING_SETTING_KEY,
  type ShippingMethodConfig,
  type ShippingSettings,
} from './shipping.constants';

/** Shipping prices and rules, editable by admins (stored as JSON in PlatformSetting). */
@Injectable()
export class ShippingSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<ShippingSettings> {
    const row = await this.prisma.platformSetting.findUnique({
      where: { key: SHIPPING_SETTING_KEY },
    });
    let stored: Partial<ShippingSettings> = {};
    try {
      stored = row ? (JSON.parse(row.value) as Partial<ShippingSettings>) : {};
    } catch {
      stored = {}; // corrupted value -> fall back to defaults
    }

    const methods = {} as ShippingSettings['methods'];
    for (const id of SHIPPING_METHOD_IDS) {
      methods[id] = {
        ...DEFAULT_SHIPPING_SETTINGS.methods[id],
        ...(stored.methods?.[id] as Partial<ShippingMethodConfig> | undefined),
      };
    }
    const over = stored.freeShippingOver;
    return { methods, freeShippingOver: typeof over === 'number' && over > 0 ? over : null };
  }

  async update(dto: UpdateShippingSettingsDto): Promise<ShippingSettings> {
    if (!dto.standard.enabled && !dto.express.enabled) {
      throw new BadRequestException('At least one shipping method must stay enabled.');
    }
    const next: ShippingSettings = {
      methods: { standard: dto.standard, express: dto.express },
      freeShippingOver: dto.freeShippingOver ?? null,
    };
    await this.prisma.platformSetting.upsert({
      where: { key: SHIPPING_SETTING_KEY },
      create: { key: SHIPPING_SETTING_KEY, value: JSON.stringify(next) },
      update: { value: JSON.stringify(next) },
    });
    return next;
  }
}
