import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiKey: string;
  private readonly senderId: string;
  private readonly baseUrl = 'https://api.mnotify.com/api/sms/quick';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('MNOTIFY_API_KEY') || '';
    this.senderId = this.configService.get<string>('MNOTIFY_SENDER_ID') || 'FLA';
  }

  private formatPhoneNumber(phone: string): string {
    if (!phone) return '';
    
    // Remove any non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // Handle 0XXXXXXXXX format (Ghana)
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      cleaned = '233' + cleaned.substring(1);
    }
    // Handle XXXXXXXXX format (assume 233 is missing)
    else if (cleaned.length === 9) {
      cleaned = '233' + cleaned;
    }
    // Handle +233XXXXXXXXX or 233XXXXXXXXX (already correct)
    else if (cleaned.startsWith('233') && (cleaned.length === 12 || cleaned.length === 13)) {
      // already correct
    }

    return cleaned;
  }

  /**
   * Sends a quick SMS via mNotify
   */
  async sendSms(to: string, message: string): Promise<boolean> {
    const formattedPhone = this.formatPhoneNumber(to);
    
    if (!formattedPhone) {
      this.logger.warn(`Invalid phone number provided: ${to}`);
      return false;
    }

    if (!this.apiKey) {
      this.logger.error('mNotify API Key is missing. SMS not sent.');
      return false;
    }

    try {
      this.logger.log(`Sending SMS to ${formattedPhone}...`);
      
      const url = `${this.baseUrl}?key=${this.apiKey}`;
      const payload = {
        recipient: [formattedPhone],
        sender: this.senderId,
        message: message,
        is_schedule: false,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.code === '1000') {
        this.logger.log(`SMS sent successfully to ${formattedPhone}`);
        return true;
      } else {
        this.logger.error(`mNotify Error: ${result.message || 'Unknown error'} (Code: ${result.code})`);
        return false;
      }
    } catch (error) {
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
