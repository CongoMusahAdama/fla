import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HubtelService {
    private readonly logger = new Logger(HubtelService.name);
    private clientId: string;
    private clientSecret: string;
    private merchantAccountNumber: string;
    private readonly baseUrl = 'https://api-definition.hubtel.com/v2/checkout/invoice/create';

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        this.clientId = this.configService.get<string>('HUBTEL_CLIENT_ID') || '';
        this.clientSecret = this.configService.get<string>('HUBTEL_CLIENT_SECRET') || '';
        this.merchantAccountNumber = this.configService.get<string>('HUBTEL_MERCHANT_ACCOUNT_NUMBER') || '';
    }

    async initializePayment(data: {
        reference: string;
        amount: number;
        description: string;
        callback_url: string;
        return_url: string;
        customerName?: string;
        customerEmail?: string;
        metadata?: any;
    }) {
        try {
            const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
            
            const payload = {
                totalAmount: data.amount,
                description: data.description,
                callbackUrl: data.callback_url,
                returnUrl: data.return_url,
                cancelUrl: data.return_url, // Using return url as cancel url for simplicity
                clientReference: data.reference,
                merchantBusinessLogoUrl: 'https://flamingo-store1.com/logo.png', // Fallback logo
                metadata: data.metadata,
            };

            this.logger.log(`Initializing Hubtel payment for ref: ${data.reference}`);

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok && result.responseCode === '00') {
                return result.data.checkoutDirectUrl;
            } else {
                this.logger.error(`Hubtel initialization failed: ${JSON.stringify(result)}`);
                throw new Error(result.message || 'Hubtel Payment initialization failed');
            }
        } catch (error) {
            this.logger.error(`Error initializing Hubtel payment: ${error.message}`);
            throw error;
        }
    }

    async verifyTransaction(clientReference: string) {
        try {
            // Hubtel usually sends payment status via webhook. 
            // For manual verification, we use the Status API
            const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
            const statusUrl = `https://api-definition.hubtel.com/v2/checkout/invoice/status/${clientReference}`;

            const response = await fetch(statusUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();
            return result;
        } catch (error) {
            this.logger.error(`Error verifying Hubtel transaction: ${error.message}`);
            throw error;
        }
    }
}
