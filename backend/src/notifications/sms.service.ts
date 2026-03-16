import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
    private apiKey: string;
    private apiEndpoint: string;
    private senderId: string;

    constructor(private configService: ConfigService) {
        this.apiKey = this.configService.get<string>('SMS_API_KEY') || '';
        this.apiEndpoint = this.configService.get<string>('SMS_API_ENDPOINT') || 'https://api.mnotify.com/api/sms/quick';
        this.senderId = this.configService.get<string>('SMS_SENDER_ID') || 'FLA';
    }

    async sendSms(phone: string, message: string): Promise<boolean> {
        if (!this.apiKey || !phone) {
            console.warn('[SmsService] SMS not sent: Missing API key or phone number');
            return false;
        }

        try {
            // Logic for mNotify or similar provider
            const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    recipient: [phone],
                    sender: this.senderId,
                    message: message,
                    is_schedule: false,
                }),
            });

            const result = await response.json();
            if (result.status === 'success') {
                console.log(`[SmsService] SMS sent to ${phone} successfully`);
                return true;
            } else {
                console.error('[SmsService] SMS failed:', result.message);
                return false;
            }
        } catch (error) {
            console.error('[SmsService] SMS error:', error.message);
            return false;
        }
    }

    async sendOrderNotification(phone: string, orderId: string, amount: number): Promise<boolean> {
        const message = `FLA: New Order #ORD-${orderId.slice(-6).toUpperCase()} received! Amount: GHS ${amount.toLocaleString()}. Log in to your dashboard to process.`;
        return this.sendSms(phone, message);
    }

    async sendDeliveryNotification(phone: string, orderId: string, fee: number): Promise<boolean> {
        const message = `FLA: Delivery fee of GHS ${fee} added to Order #ORD-${orderId.slice(-6).toUpperCase()}. Please pay on the platform to proceed.`;
        return this.sendSms(phone, message);
    }

    async sendAdminOrderSms(phone: string, orderId: string, amount: number): Promise<boolean> {
        const message = `FLA ADMIN ALERT: New Order #ORD-${orderId.slice(-6).toUpperCase()} placed. GH₵ ${amount.toLocaleString()} escrowed. Go to HQ to review.`;
        return this.sendSms(phone, message);
    }
}
