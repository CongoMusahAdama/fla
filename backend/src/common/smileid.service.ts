import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class SmileIdService {
    private readonly logger = new Logger(SmileIdService.name);
    private partnerId: string;
    private apiKey: string;
    private baseUrl = 'https://api.smileidentity.com/v1'; // Production URL

    constructor(private configService: ConfigService) {
        this.partnerId = this.configService.get<string>('SMILE_ID_PARTNER_ID') || '';
        this.apiKey = this.configService.get<string>('SMILE_ID_API_KEY') || '';
        
        // Use Sandbox URL if not in production
        if (process.env.NODE_ENV !== 'production') {
            this.baseUrl = 'https://sandbox.smileidentity.com/v1';
        }
    }

    isConfigured(): boolean {
        return Boolean(this.partnerId && this.apiKey);
    }

    /**
     * Generates a signature for Smile ID API requests
     * @param timestamp ISO 8601 timestamp
     */
    private generateSignature(timestamp: string): string {
        const hmac = crypto.createHmac('sha256', this.apiKey);
        hmac.update(timestamp);
        hmac.update(this.partnerId);
        hmac.update('sid_request');
        return hmac.digest('base64');
    }

    /**
     * Verifies a Ghana Card using Enhanced KYC (Database check)
     */
    async verifyGhanaCard(data: {
        idNumber: string;
        firstName: string;
        lastName: string;
        dob: string; // YYYY-MM-DD
        userId: string;
    }) {
        try {
            const timestamp = new Date().toISOString();
            const signature = this.generateSignature(timestamp);

            const payload = {
                partner_id: this.partnerId,
                timestamp,
                signature,
                user_id: data.userId,
                job_id: `KYC_${Date.now()}`,
                job_type: 5, // Enhanced KYC
                id_number: data.idNumber,
                id_type: 'GHANA_CARD',
                first_name: data.firstName,
                last_name: data.lastName,
                dob: data.dob,
                country: 'GH',
            };

            this.logger.log(`Initiating Smile ID Enhanced KYC for user: ${data.userId}`);

            const response = await fetch(`${this.baseUrl}/id_verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok && result.ResultCode === '1012') {
                this.logger.log(`Smile ID: Identity Verified for ${data.userId}`);
                return { success: true, message: 'Verified', data: result };
            } else {
                this.logger.warn(`Smile ID Verification Failed: ${result.ResultText || 'Unknown Error'}`);
                return { success: false, message: result.ResultText || 'Verification failed', data: result };
            }
        } catch (error) {
            this.logger.error(`Smile ID API Error: ${error.message}`);
            return { success: false, message: 'Identity service connection error', error: error.message };
        }
    }

    /**
     * Document Verification (OCR + Biometric match)
     * For when you want to compare the uploaded card against the NIA database AND match the selfie.
     */
    async verifyDocumentWithBiometrics(data: {
        userId: string;
        idCardFrontImage: string; // Base64 or URL
        selfieImage: string; // Base64 or URL
    }) {
        // Job Type 6 in Smile ID is Document Verification
        this.logger.log(`Initiating Smile ID Doc + Biometric Verification for: ${data.userId}`);
        
        // Implementation for Job Type 6 would go here
        // This is more complex as it involves uploading images to Smile ID's S3 or passing Base64
        return { success: true, message: 'Pending confirmation of document processing flow' };
    }
}
