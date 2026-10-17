import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { SmsService } from '@/modules/sms/sms.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly smsService: SmsService,
  ) {}

  async signup(data: { name: string; email: string; password: string; phone: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(data.password, 12);
    const phone = this.normalizePhone(data.phone);
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        phone,
        role: 'user',
        isPhoneVerified: false,
      },
    });

    await this.generateOtp(user.id, phone);

    return {
      pendingVerification: true,
      phoneMasked: this.maskPhone(phone),
      message: 'A verification code has been sent to your phone',
    };
  }

  async verifyPhone(email: string, otp: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid email or verification code');

    if (user.isPhoneVerified) {
      return this.issueSession(user);
    }

    const verification = await this.prisma.phoneVerification.findUnique({
      where: { userId: user.id },
    });
    if (!verification)
      throw new BadRequestException('No verification code found. Please request a new one');

    if (verification.expiresAt < new Date()) {
      throw new BadRequestException('Verification code has expired. Please request a new one');
    }

    if (verification.attempts >= this.maxAttempts()) {
      throw new BadRequestException('Too many failed attempts. Please request a new code');
    }

    const valid = await bcrypt.compare(otp, verification.otpHash);
    if (!valid) {
      await this.prisma.phoneVerification.update({
        where: { id: verification.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Incorrect verification code');
    }

    const verifiedMethods = Array.from(new Set([...(user.verifiedMethods ?? []), 'phone']));

    await this.prisma.$transaction([
      this.prisma.phoneVerification.delete({ where: { id: verification.id } }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { isPhoneVerified: true, verifiedMethods },
      }),
    ]);

    return this.issueSession(user);
  }

  async resendOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('No account found for this email');

    if (user.isPhoneVerified) {
      throw new BadRequestException('This phone number is already verified');
    }

    if (!user.phone) throw new BadRequestException('No phone number on file');

    await this.generateOtp(user.id, user.phone);

    return {
      pendingVerification: true,
      phoneMasked: this.maskPhone(user.phone),
      message: 'A new verification code has been sent to your phone',
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid email or password');

    if (user.isSuspended) {
      throw new ForbiddenException('This account has been suspended. Contact support for help.');
    }

    if (!user.isPhoneVerified) {
      throw new ForbiddenException(
        'Phone number not verified. Verify your phone number to continue',
      );
    }

    return this.issueSession(user);
  }

  async adminLogin(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== 'admin')
      throw new UnauthorizedException('Invalid admin credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid admin credentials');

    if (user.isSuspended) throw new UnauthorizedException('Admin account is suspended');

    const token = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role },
      { expiresIn: '2h' },
    );
    return { accessToken: token, user: this.sanitizeUser(user) };
  }

  private async generateOtp(userId: string, phone: string) {
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const ttlMinutes = this.config.get<number>('OTP_TTL_MINUTES') ?? 10;

    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await this.prisma.phoneVerification.upsert({
      where: { userId },
      create: { userId, phone, otpHash, expiresAt, attempts: 0 },
      update: { otpHash, expiresAt, attempts: 0 },
    });

    await this.smsService.sendOtp(phone, otp);
  }

  private maxAttempts(): number {
    return this.config.get<number>('OTP_MAX_ATTEMPTS') ?? 5;
  }

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/[\s()-]+/g, '');
    if (digits.startsWith('+')) return digits; // already E.164
    // Legacy Australian formats from before international numbers were supported.
    if (digits.startsWith('0')) return `+61${digits.slice(1)}`;
    return digits.startsWith('61') ? `+${digits}` : digits;
  }

  private maskPhone(phone: string): string {
    if (phone.length < 7) return `${phone.slice(0, 1)}***`;
    return `${phone.slice(0, 3)}****${phone.slice(-2)}`;
  }

  private issueSession(user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl: string | null;
    bio: string | null;
    isSuspended: boolean;
    isPhoneVerified: boolean;
    phone: string | null;
    createdAt: Date;
    ratingsCount: number;
    avgRating: number;
    followersCount: number;
    followingCount: number;
    location: string | null;
    verifiedMethods: string[];
    badges: string[];
    lastSeen: Date;
  }) {
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return { accessToken: token, user: this.sanitizeUser(user) };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return this.sanitizeUser(user);
  }

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      avatarUrl?: string | null;
      bio?: string | null;
      phone?: string | null;
      location?: string | null;
    },
  ) {
    const updateData: Record<string, string | null> = {};

    if (data.name !== undefined) {
      const name = String(data.name).trim();
      if (name.length < 2 || name.length > 80) {
        throw new BadRequestException('Name must be between 2 and 80 characters');
      }
      updateData.name = name;
    }
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl || null;

    const optionalText: [keyof typeof data, number][] = [
      ['bio', 300],
      ['phone', 30],
      ['location', 80],
    ];
    for (const [field, max] of optionalText) {
      const value = data[field];
      if (value === undefined) continue;
      const text = value === null ? '' : String(value).trim();
      if (text.length > max) {
        throw new BadRequestException(`${field} must be at most ${max} characters`);
      }
      updateData[field] = text || null;
    }

    if (Object.keys(updateData).length === 0) {
      return this.getMe(userId);
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData as never,
    });
    return this.sanitizeUser(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    const hashed = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });
    return { message: 'Password updated successfully' };
  }

  private sanitizeUser(user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl: string | null;
    bio: string | null;
    isSuspended: boolean;
    isPhoneVerified: boolean;
    phone: string | null;
    createdAt: Date;
    ratingsCount: number;
    avgRating: number;
    followersCount: number;
    followingCount: number;
    location: string | null;
    verifiedMethods: string[];
    badges: string[];
    lastSeen: Date;
  }) {
    const { password: _pw, ...safe } = user as unknown as Record<string, unknown>;
    void _pw;
    return safe;
  }
}
