import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SmsResult {
  success: boolean;
  provider: string;
  messageId?: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendOtp(phone: string, code: string): Promise<SmsResult> {
    const message = `Your KasiEats verification code is ${code}. Valid for 1 minute.`;
    return this.send(phone, message);
  }

  async send(phone: string, message: string): Promise<SmsResult> {
    const provider = this.configService.get<string>('SMS_PROVIDER', 'dev');

    switch (provider) {
      case 'twilio':
        return this.sendViaTwilio(phone, message);
      case 'africas_talking':
        return this.sendViaAfricasTalking(phone, message);
      default:
        this.logger.log(`[DEV SMS] ${phone}: ${message}`);
        return { success: true, provider: 'dev' };
    }
  }

  private async sendViaTwilio(phone: string, message: string): Promise<SmsResult> {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const from = this.configService.get<string>('TWILIO_FROM_NUMBER');

    if (!accountSid || !authToken || !from) {
      this.logger.warn('Twilio not configured — falling back to dev log');
      this.logger.log(`[DEV SMS] ${phone}: ${message}`);
      return { success: true, provider: 'dev-fallback' };
    }

    const body = new URLSearchParams({ To: phone, From: from, Body: message });
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    );

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Twilio SMS failed: ${error}`);
      return { success: false, provider: 'twilio' };
    }

    const data = (await response.json()) as { sid?: string };
    return { success: true, provider: 'twilio', messageId: data.sid };
  }

  private async sendViaAfricasTalking(phone: string, message: string): Promise<SmsResult> {
    const apiKey = this.configService.get<string>('AFRICAS_TALKING_API_KEY');
    const username = this.configService.get<string>('AFRICAS_TALKING_USERNAME');

    if (!apiKey || !username) {
      this.logger.warn('Africa\'s Talking not configured — falling back to dev log');
      this.logger.log(`[DEV SMS] ${phone}: ${message}`);
      return { success: true, provider: 'dev-fallback' };
    }

    const body = new URLSearchParams({ username, to: phone, message });
    const response = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body,
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Africa's Talking SMS failed: ${error}`);
      return { success: false, provider: 'africas_talking' };
    }

    return { success: true, provider: 'africas_talking' };
  }
}
