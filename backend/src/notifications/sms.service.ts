import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
    private readonly logger = new Logger(SmsService.name);
    private apiKey: string;
    private apiEndpoint: string;
    private senderId: string;

    constructor(private configService: ConfigService) {
        this.apiKey = this.configService.get<string>('MNOTIFY_API_KEY') || '';
        this.apiEndpoint = this.configService.get<string>('SMS_API_ENDPOINT') || 'https://api.mnotify.com/api/sms/quick';
        this.senderId = this.configService.get<string>('MNOTIFY_SENDER_ID') || 'FLA';
    }

    async sendSms(phone: string, message: string): Promise<boolean> {
        if (!this.apiKey || !phone) {
            this.logger.warn('SMS not sent: Missing API key or phone number');
            return false;
        }

        // mNotify expects 0XXXXXXXXX (Ghana local format)
        let formattedPhone = phone.replace(/\s+/g, '').replace(/\D/g, '');
        if (formattedPhone.startsWith('233') && formattedPhone.length >= 12) {
            formattedPhone = '0' + formattedPhone.slice(3);
        } else if (formattedPhone.length === 9) {
            formattedPhone = '0' + formattedPhone;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

            const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient: [formattedPhone],
                    sender: this.senderId,
                    message: message,
                    is_schedule: false,
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const result = await response.json();
            if (result.status === 'success' || result.code === '1000' || result.code === '2000') {
                this.logger.log(`SMS sent to ${formattedPhone} successfully`);
                return true;
            } else {
                this.logger.error(`SMS failed: ${result.message || JSON.stringify(result)}`);
                return false;
            }
        } catch (error: any) {
            this.logger.error(`SMS error for ${formattedPhone}: ${error.message}`);
            return false;
        }
    }

    async sendOrderNotification(phone: string, orderId: string, amount: number): Promise<boolean> {
        const message = `FLA: New Order #ORD-${orderId.slice(-6).toUpperCase()} received! Amount: GHS ${amount.toLocaleString()}. Log in to process.`;
        return this.sendSms(phone, message);
    }

    async sendDeliveryNotification(phone: string, orderId: string, fee: number): Promise<boolean> {
        const message = `FLA: Delivery fee of GHS ${fee} added to Order #ORD-${orderId.slice(-6).toUpperCase()}. Please pay on the platform.`;
        return this.sendSms(phone, message);
    }

    async sendAdminOrderSms(phone: string, orderId: string, amount: number): Promise<boolean> {
        const message = `FLA ADMIN: New Order #ORD-${orderId.slice(-6).toUpperCase()} - GH₵ ${amount.toLocaleString()}. Check HQ.`;
        return this.sendSms(phone, message);
    }
}
