import { Controller, Post, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { VerifyPhoneDto } from './dto/verify-phone.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { Request } from 'express';
import { Audited } from '@/modules/audit/audited.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user and send phone verification code' })
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('verify-phone')
  @ApiOperation({ summary: 'Verify the phone number OTP to activate the account' })
  async verifyPhone(@Body() dto: VerifyPhoneDto) {
    return this.authService.verifyPhone(dto.email, dto.otp);
  }

  @Post('resend-otp')
  @ApiOperation({ summary: 'Resend the phone verification code' })
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto.email);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login as a regular user' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Audited({
    action: 'account.login',
    targetType: 'account',
    target: ({ res }) => (res?.user as { id?: string } | undefined)?.id,
    actor: ({ res }) => { const u = res?.user as { id?: string; email?: string } | undefined; return u?.id && u.email ? { id: u.id, email: u.email } : undefined; },
    summary: () => 'Signed in to the admin panel',
  })
  @Post('admin/login')
  @ApiOperation({ summary: 'Login as an admin' })
  async adminLogin(@Body() dto: AdminLoginDto) {
    return this.authService.adminLogin(dto.email, dto.password);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.authService.getMe(user.id);
  }

  @Get('admin/me')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current admin profile' })
  async getAdminMe(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.authService.getMe(user.id);
  }

  @Audited({
    action: 'account.profile',
    targetType: 'account',
    target: ({ req }) => req.user?.id,
    summary: () => 'Updated their profile',
  })
  @Put('admin/profile')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update admin profile' })
  async updateAdminProfile(
    @Req() req: Request,
    @Body()
    body: {
      name?: string;
      avatarUrl?: string | null;
      bio?: string | null;
      phone?: string | null;
      location?: string | null;
    },
  ) {
    const user = req.user as { id: string };
    return this.authService.updateProfile(user.id, body);
  }

  @Audited({
    action: 'account.password',
    targetType: 'account',
    target: ({ req }) => req.user?.id,
    summary: () => 'Changed their password',
  })
  @Put('admin/password')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change admin password' })
  async changeAdminPassword(
    @Req() req: Request,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    const user = req.user as { id: string };
    return this.authService.changePassword(user.id, body.currentPassword, body.newPassword);
  }
}
