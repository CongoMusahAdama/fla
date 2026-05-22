import { Injectable } from '@nestjs/common';

type OtpChannel = 'phone' | 'email';

@Injectable()
export class OtpService {
    private otpStore: Map<string, { code: string; expiresAt: Date; verified: boolean }> = new Map();

    /** Ghana local format 0XXXXXXXXX */
    normalizePhone(phone: string): string {
        let cleaned = (phone || '').replace(/\D/g, '');
        if (cleaned.startsWith('233') && cleaned.length >= 12) {
            cleaned = '0' + cleaned.slice(3);
        } else if (cleaned.length === 9) {
            cleaned = '0' + cleaned;
        }
        return cleaned.startsWith('0') && cleaned.length === 10 ? cleaned : '';
    }

    private storageKey(channel: OtpChannel, value: string): string {
        if (channel === 'phone') {
            return `phone:${this.normalizePhone(value)}`;
        }
        return `email:${value.toLowerCase().trim()}`;
    }

    generateOTP(): string {
        return Math.floor(1000 + Math.random() * 9000).toString();
    }

    async storeOTP(channel: OtpChannel, value: string, code: string): Promise<void> {
        const key = this.storageKey(channel, value);
        if (channel === 'phone' && !key.replace('phone:', '')) return;
        if (channel === 'email' && key === 'email:') return;

        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        this.otpStore.set(key, {
            code,
            expiresAt,
            verified: false,
        });
    }

    async verifyOTP(channel: OtpChannel, value: string, code: string): Promise<boolean> {
        const key = this.storageKey(channel, value);
        const otpData = this.otpStore.get(key);

        if (!otpData || otpData.verified || new Date() > otpData.expiresAt) {
            if (otpData && new Date() > otpData.expiresAt) {
                this.otpStore.delete(key);
            }
            return false;
        }

        if (otpData.code !== code.trim()) {
            return false;
        }

        otpData.verified = true;
        this.otpStore.set(key, otpData);
        return true;
    }

    async deleteOTP(channel: OtpChannel, value: string): Promise<void> {
        const key = this.storageKey(channel, value);
        this.otpStore.delete(key);
    }

    async isVerified(channel: OtpChannel, value: string): Promise<boolean> {
        const otpData = this.otpStore.get(this.storageKey(channel, value));
        return otpData?.verified || false;
    }
}
