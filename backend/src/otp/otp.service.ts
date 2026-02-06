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

        console.log(`OTP stored for ${email}: ${code} (expires at ${expiresAt})`);
    }

    async verifyOTP(email: string, code: string): Promise<boolean> {
        const otpData = this.otpStore.get(email);

        if (!otpData) {
            console.log(`No OTP found for ${email}`);
            return false;
        }

        if (otpData.verified) {
            console.log(`OTP already verified for ${email}`);
            return false;
        }

        if (new Date() > otpData.expiresAt) {
            console.log(`OTP expired for ${email}`);
            this.otpStore.delete(email);
            return false;
        }

        if (otpData.code !== code) {
            console.log(`Invalid OTP for ${email}. Expected: ${otpData.code}, Got: ${code}`);
            return false;
        }

        // Mark as verified
        otpData.verified = true;
        this.otpStore.set(email, otpData);

        console.log(`OTP verified successfully for ${email}`);
        return true;
    }

    async deleteOTP(email: string): Promise<void> {
        this.otpStore.delete(email);
        console.log(`OTP deleted for ${email}`);
    }

    async isVerified(email: string): Promise<boolean> {
        const otpData = this.otpStore.get(email);
        return otpData?.verified || false;
    }
}
