import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { gzip } from 'zlib';
import { promisify } from 'util';
import { Prisma } from '@/generated/client';
import { PrismaService } from '@/prisma/prisma.service';

const gzipAsync = promisify(gzip);

export const BACKUP_DIR = process.env.BACKUP_DIR ?? join(process.cwd(), 'backups');
const NAME_RE = /^backup-\d{8}-\d{6}-(manual|auto)\.json\.gz$/;
const DAY_MS = 86_400_000;

export type BackupType = 'manual' | 'auto';
export type BackupFrequency = 'daily' | 'weekly';

export interface BackupSettings {
  enabled: boolean;
  frequency: BackupFrequency;
  /** Hour of day (0-23, server time) the automatic backup runs. */
  hour: number;
  /** How many automatic backups to keep. Manual backups are never pruned. */
  retention: number;
}

export interface BackupInfo {
  name: string;
  type: BackupType;
  size: number;
  createdAt: string;
  tables: number;
  rows: number;
}

const DEFAULTS: BackupSettings = { enabled: false, frequency: 'daily', hour: 2, retention: 7 };
const KEYS = {
  enabled: 'backup.auto.enabled',
  frequency: 'backup.auto.frequency',
  hour: 'backup.auto.hour',
  retention: 'backup.retention',
} as const;

const pad = (n: number) => String(n).padStart(2, '0');
const stamp = (d: Date) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

@Injectable()
export class BackupsService {
  private readonly logger = new Logger(BackupsService.name);
  private running = false;

  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<BackupSettings> {
    const rows = await this.prisma.platformSetting.findMany({
      where: { key: { in: Object.values(KEYS) } },
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));
    const hour = Number(map.get(KEYS.hour));
    const retention = Number(map.get(KEYS.retention));
    const frequency = map.get(KEYS.frequency);
    return {
      enabled: map.get(KEYS.enabled) === 'true',
      frequency: frequency === 'weekly' ? 'weekly' : 'daily',
      hour: Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : DEFAULTS.hour,
      retention: Number.isInteger(retention) && retention >= 1 ? retention : DEFAULTS.retention,
    };
  }

  async updateSettings(input: Partial<BackupSettings>): Promise<BackupSettings> {
    const next: Partial<Record<keyof BackupSettings, string>> = {};
    if (input.enabled !== undefined) next.enabled = String(Boolean(input.enabled));
    if (input.frequency !== undefined) {
      if (input.frequency !== 'daily' && input.frequency !== 'weekly') {
        throw new BadRequestException('Frequency must be daily or weekly');
      }
      next.frequency = input.frequency;
    }
    if (input.hour !== undefined) {
      const h = Number(input.hour);
      if (!Number.isInteger(h) || h < 0 || h > 23) throw new BadRequestException('Hour must be 0-23');
      next.hour = String(h);
    }
    if (input.retention !== undefined) {
      const r = Number(input.retention);
      if (!Number.isInteger(r) || r < 1 || r > 90) {
        throw new BadRequestException('Keep between 1 and 90 automatic backups');
      }
      next.retention = String(r);
    }
    await this.prisma.$transaction(
      (Object.keys(next) as (keyof BackupSettings)[]).map((k) =>
        this.prisma.platformSetting.upsert({
          where: { key: KEYS[k] },
          update: { value: next[k]! },
          create: { key: KEYS[k], value: next[k]! },
        }),
      ),
    );
    return this.getSettings();
  }

  async list(): Promise<BackupInfo[]> {
    let names: string[] = [];
    try {
      names = await fs.readdir(BACKUP_DIR);
    } catch {
      return [];
    }
    const items = await Promise.all(
      names.filter((n) => NAME_RE.test(n)).map((n) => this.describe(n)),
    );
    return items
      .filter((i): i is BackupInfo => i !== null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  private async describe(name: string): Promise<BackupInfo | null> {
    try {
      const stat = await fs.stat(join(BACKUP_DIR, name));
      let tables = 0;
      let rows = 0;
      try {
        const meta = JSON.parse(await fs.readFile(join(BACKUP_DIR, `${name}.meta.json`), 'utf8'));
        tables = meta.tables ?? 0;
        rows = meta.rows ?? 0;
      } catch {
        /* sidecar missing: size and date are still shown */
      }
      return {
        name,
        type: name.endsWith('-auto.json.gz') ? 'auto' : 'manual',
        size: stat.size,
        createdAt: stat.mtime.toISOString(),
        tables,
        rows,
      };
    } catch {
      return null;
    }
  }

  /** Exports every table to one gzipped JSON file. */
  async create(type: BackupType): Promise<BackupInfo> {
    if (this.running) throw new ConflictException('A backup is already running');
    this.running = true;
    try {
      const models = Object.values(Prisma.ModelName) as string[];
      const data: Record<string, unknown[]> = {};
      let rows = 0;
      // One transaction so every table is read from the same snapshot.
      await this.prisma.$transaction(
        async (tx) => {
          for (const model of models) {
            const delegate = (tx as unknown as Record<string, { findMany: () => Promise<unknown[]> }>)[
              lowerFirst(model)
            ];
            const found = await delegate!.findMany();
            data[model] = found;
            rows += found.length;
          }
        },
        { timeout: 120_000, isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
      );

      const now = new Date();
      const payload = {
        meta: { app: 'Wearnova', createdAt: now.toISOString(), type, tables: models.length, rows },
        data,
      };
      const json = JSON.stringify(payload, (_k, v) => (typeof v === 'bigint' ? v.toString() : v));
      const compressed = await gzipAsync(Buffer.from(json));

      await fs.mkdir(BACKUP_DIR, { recursive: true });
      const name = `backup-${stamp(now)}-${type}.json.gz`;
      const target = join(BACKUP_DIR, name);
      await fs.writeFile(`${target}.tmp`, compressed);
      await fs.rename(`${target}.tmp`, target);
      await fs.writeFile(
        `${target}.meta.json`,
        JSON.stringify({ tables: models.length, rows }),
      );
      this.logger.log(`Created ${type} backup ${name} (${rows} rows, ${compressed.length} bytes)`);
      const info = await this.describe(name);
      return info!;
    } finally {
      this.running = false;
    }
  }

  resolve(name: string): string {
    if (!NAME_RE.test(name)) throw new BadRequestException('Invalid backup name');
    return join(BACKUP_DIR, name);
  }

  async assertExists(name: string): Promise<string> {
    const path = this.resolve(name);
    try {
      await fs.access(path);
    } catch {
      throw new NotFoundException('Backup not found');
    }
    return path;
  }

  async remove(name: string): Promise<{ deleted: true }> {
    const path = await this.assertExists(name);
    await fs.rm(path, { force: true });
    await fs.rm(`${path}.meta.json`, { force: true });
    return { deleted: true };
  }

  /** The next time the scheduler will run, or null when automatic backups are off. */
  async nextRunAt(settings?: BackupSettings, backups?: BackupInfo[]): Promise<string | null> {
    const s = settings ?? (await this.getSettings());
    if (!s.enabled) return null;
    const all = backups ?? (await this.list());
    const last = all.find((b) => b.type === 'auto');
    const interval = (s.frequency === 'weekly' ? 7 : 1) * DAY_MS;
    const at = (d: Date) => {
      const x = new Date(d);
      x.setHours(s.hour, 0, 0, 0);
      return x;
    };
    if (!last) {
      const today = at(new Date());
      return (today.getTime() > Date.now() ? today : new Date(today.getTime() + DAY_MS)).toISOString();
    }
    const lastDay = new Date(last.createdAt);
    lastDay.setHours(0, 0, 0, 0);
    return at(new Date(lastDay.getTime() + interval)).toISOString();
  }

  /** Called every minute by the scheduler. */
  async runIfDue(): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.enabled || this.running) return;
    const backups = await this.list();
    const next = await this.nextRunAt(settings, backups);
    if (!next || new Date(next).getTime() > Date.now()) return;
    await this.create('auto');
    await this.prune(settings.retention);
  }

  private async prune(keep: number): Promise<void> {
    const autos = (await this.list()).filter((b) => b.type === 'auto');
    for (const old of autos.slice(keep)) {
      await this.remove(old.name).catch(() => undefined);
      this.logger.log(`Pruned old automatic backup ${old.name}`);
    }
  }
}
