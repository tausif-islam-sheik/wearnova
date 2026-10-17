import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly provider: string;

  constructor(private readonly config: ConfigService) {
    this.provider = this.config.get<string>('SMS_PROVIDER') ?? 'console';
  }

  async sendOtp(phone: string, otp: string): Promise<void> {
    const message = `Your Wearnova verification code is ${otp}. It expires in 10 minutes. Do not share it with anyone.`;

    switch (this.provider) {
      case 'twilio':
        await this.sendViaTwilio(phone, message);
        break;
      case 'africastalking':
        await this.sendViaAfricasTalking(phone, message);
        break;
      default:
        this.logger.warn(
          `[DEV] SMS provider "console" in use. Verification code for ${phone}: ${otp}`,
        );
    }
  }

  private async sendViaTwilio(phone: string, message: string): Promise<void> {
    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.config.get<string>('TWILIO_AUTH_TOKEN');
    const from = this.config.get<string>('TWILIO_FROM_NUMBER');
    if (!accountSid || !authToken || !from) {
      throw new Error('Twilio is configured as SMS provider but credentials are missing');
    }

    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const body = new URLSearchParams({ To: phone, From: from, Body: message });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    );
    if (!res.ok) {
      throw new Error(`Twilio SMS failed: ${res.status} ${await res.text()}`);
    }
  }

  private async sendViaAfricasTalking(phone: string, message: string): Promise<void> {
    const username = this.config.get<string>('AFRICAS_TALKING_USERNAME');
    const apiKey = this.config.get<string>('AFRICAS_TALKING_API_KEY');
    const from = this.config.get<string>('AFRICAS_TALKING_FROM') ?? '';
    if (!username || !apiKey) {
      throw new Error('Africa\'s Talking is configured as SMS provider but credentials are missing');
    }

    const res = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        apiKey,
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ username, to: phone, message, from }),
    });
    if (!res.ok) {
      throw new Error(`Africa's Talking SMS failed: ${res.status} ${await res.text()}`);
    }
  }
}
