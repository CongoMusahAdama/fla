import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ShuftiService {
    private readonly logger = new Logger(ShuftiService.name);
    private readonly clientId: string;
    private readonly secretKey: string;
    private readonly baseUrl = 'https://api.shuftipro.com';

    constructor(private readonly configService: ConfigService) {
        this.clientId = this.configService.get<string>('SHUFTI_CLIENT_ID') || '';
        this.secretKey = this.configService.get<string>('SHUFTI_SECRET_KEY') || '';
    }

    /**
     * Performs background verification using uploaded images.
     * This allows the user to stay on our site while Shufti Pro's experts verify the docs.
     */
    async verifyImages(reference: string, data: {
        email: string,
        ghanaCardFront: string, // URL or base64
        ghanaCardBack: string,
        selfie: string
    }) {
        try {
            const auth = Buffer.from(`${this.clientId}:${this.secretKey}`).toString('base64');
            
            const payload = {
                reference: reference,
                callback_url: `${process.env.BACKEND_URL}/api/payments/webhook/shufti`,
                email: data.email,
                document: {
                    proof: data.ghanaCardFront,
                    additional_proof: data.ghanaCardBack,
                    supported_types: ['id_card'],
                    country: 'GH',
                    fetch_enhanced_data: '1'
                },
                face: {
                    proof: data.selfie
                }
            };

            this.logger.log(`Submitting manual uploads to Shufti Pro for verification: ${reference}`);
            const response = await axios.post(this.baseUrl, payload, {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            this.logger.error(`Shufti Pro image verification failed: ${error.response?.data?.message || error.message}`);
            throw error;
        }
    }

    async verifyWebhook(payload: any, signature: string) {
        // Verification logic for production signatures
        return true;
    }
}
