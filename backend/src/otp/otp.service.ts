import { Injectable } from '@nestjs/common';

@Injectable()
export class OtpService {
    private otpStore: Map<string, { code: string; expiresAt: Date; verified: boolean }> = new Map();

    private normalizeEmail(email: string): string {
        return email.toLowerCase().trim();
    }

    generateOTP(): string {
        return Math.floor(1000 + Math.random() * 9000).toString();
    }

    async storeOTP(email: string, code: string): Promise<void> {
        const key = this.normalizeEmail(email);
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        this.otpStore.set(key, {
            code,
            expiresAt,
            verified: false,
        });
    }

    async verifyOTP(email: string, code: string): Promise<boolean> {
        const key = this.normalizeEmail(email);
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

    async deleteOTP(email: string): Promise<void> {
        this.otpStore.delete(this.normalizeEmail(email));
    }

    async isVerified(email: string): Promise<boolean> {
        const otpData = this.otpStore.get(this.normalizeEmail(email));
        return otpData?.verified || false;
    }
}
