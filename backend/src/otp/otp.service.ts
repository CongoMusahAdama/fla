import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

export interface OTP {
    email: string;
    code: string;
    expiresAt: Date;
    verified: boolean;
}

export type OTPDocument = OTP & Document;

@Injectable()
export class OtpService {
    private otpStore: Map<string, { code: string; expiresAt: Date; verified: boolean }> = new Map();

    generateOTP(): string {
        // Generate 4-digit OTP
        return Math.floor(1000 + Math.random() * 9000).toString();
    }

    async storeOTP(email: string, code: string): Promise<void> {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP expires in 10 minutes

        this.otpStore.set(email, {
            code,
            expiresAt,
            verified: false
        });
    }

    async verifyOTP(email: string, code: string): Promise<boolean> {
        const otpData = this.otpStore.get(email);

        if (!otpData) {
            return false;
        }

        if (otpData.verified) {
            return false;
        }

        if (new Date() > otpData.expiresAt) {
            this.otpStore.delete(email);
            return false;
        }

        if (otpData.code !== code) {
            return false;
        }

        // Mark as verified
        otpData.verified = true;
        this.otpStore.set(email, otpData);

        return true;
    }

    async deleteOTP(email: string): Promise<void> {
        this.otpStore.delete(email);
    }

    async isVerified(email: string): Promise<boolean> {
        const otpData = this.otpStore.get(email);
        return otpData?.verified || false;
    }
}
