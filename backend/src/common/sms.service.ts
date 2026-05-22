import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiKey: string;
  private readonly senderId: string;
  private readonly baseUrl = 'https://api.mnotify.com/api/sms/quick';
  /** Last mNotify failure — surfaced in API errors for Postman/debugging */
  lastError: string | null = null;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('MNOTIFY_API_KEY') || '';
    this.senderId = this.configService.get<string>('MNOTIFY_SENDER_ID') || 'FLA';
  }

  /**
   * mNotify expects Ghana numbers as 0XXXXXXXXX (see API docs), not 233XXXXXXXXX.
   */
  private formatPhoneNumber(phone: string): string {
    if (!phone) return '';

    let cleaned = phone.replace(/\D/g, '');

    if (cleaned.startsWith('233') && cleaned.length >= 12) {
      cleaned = '0' + cleaned.slice(3);
    } else if (cleaned.length === 9) {
      cleaned = '0' + cleaned;
    }

    if (cleaned.startsWith('0') && cleaned.length === 10) {
      return cleaned;
    }

    this.logger.warn(`Invalid Ghana phone after normalize: ${phone} -> ${cleaned}`);
    return '';
  }

  private isMnotifySuccess(result: Record<string, unknown>): boolean {
    const code = String(result?.code ?? '');
    const status = String(result?.status ?? '').toLowerCase();
    return status === 'success' || code === '1000' || code === '2000';
  }

  /**
   * Vendor OTP — uses the same standard quick SMS route as welcome/alert messages.
   * mNotify's separate sms_type:"otp" route is often blocked (HTTP 419) even when
   * normal SMS works from wallet balance. Set MNOTIFY_USE_OTP_ROUTE=true to force OTP route.
   */
  async sendOtpSms(to: string, message: string): Promise<boolean> {
    const useOtpRoute = this.configService.get<string>('MNOTIFY_USE_OTP_ROUTE') === 'true';
    if (useOtpRoute) {
      return this.sendSms(to, message, { smsType: 'otp' });
    }
    this.logger.log('Sending verification code via standard mNotify SMS (same as welcome messages)');
    return this.sendSms(to, message);
  }

  /**
   * Sends a quick SMS via mNotify
   */
  async sendSms(to: string, message: string, options?: { smsType?: 'otp' }): Promise<boolean> {
    const formattedPhone = this.formatPhoneNumber(to);
    
    if (!formattedPhone) {
      this.logger.warn(`Invalid phone number provided: ${to}`);
      return false;
    }

    if (!this.apiKey) {
      this.lastError = 'MNOTIFY_API_KEY is not set on the server';
      this.logger.error('mNotify API Key is missing. SMS not sent.');
      return false;
    }

    this.lastError = null;

    try {
      this.logger.log(
        `mNotify SMS → recipient=${formattedPhone} sender="${this.senderId}" chars=${message.length}`,
      );

      const url = `${this.baseUrl}?key=${this.apiKey}`;
      const payload: Record<string, unknown> = {
        recipient: [formattedPhone],
        sender: this.senderId,
        message: message,
        is_schedule: false,
        schedule_date: '',
      };
      if (options?.smsType === 'otp') {
        payload.sms_type = 'otp';
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok && result?.error) {
        this.lastError = `mNotify (${response.status}): ${result.error}`;
        this.logger.error(this.lastError);
        if (options?.smsType === 'otp') {
          this.logger.warn(`Retrying OTP to ${formattedPhone} without sms_type: otp`);
          return this.sendSms(to, message);
        }
        return false;
      }

      if (response.ok && this.isMnotifySuccess(result)) {
        this.logger.log(
          `SMS sent successfully to ${formattedPhone} (mNotify code: ${result.code}, status: ${result.status})`,
        );
        return true;
      }

      this.lastError =
        result.error ||
        result.message ||
        `mNotify HTTP ${response.status} code ${result.code}`;
      this.logger.error(`mNotify Error: ${this.lastError}`);

      // OTP route failed — retry once as standard SMS so user still receives the code
      if (options?.smsType === 'otp') {
        this.logger.warn(`Retrying OTP to ${formattedPhone} without sms_type: otp`);
        return this.sendSms(to, message);
      }

      return false;
    } catch (error) {
      this.lastError = error.message;
      this.logger.error(`Failed to send SMS to ${formattedPhone}: ${error.message}`);
      return false;
    }
  }

  /**
   * Utility to notify admin via SMS
   */
  async sendAdminNotification(message: string): Promise<void> {
    const adminPhone = this.configService.get<string>('ADMIN_PHONE_NOTIFICATION');
    if (adminPhone) {
      await this.sendSms(adminPhone, `[Admin Alert] ${message}`);
    } else {
      this.logger.warn('ADMIN_PHONE_NOTIFICATION not set. Admin SMS skipped.');
    }
  }
}
