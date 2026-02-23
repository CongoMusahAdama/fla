import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaystackService {
    private readonly logger = new Logger(PaystackService.name);
    private secretKey: string;
    private readonly baseUrl = 'https://api.paystack.co';

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        this.secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY') || '';
    }

    async initializePayment(data: {
        reference: string;
        amount: number;
        currency: string;
        callback_url: string;
        email: string;
        metadata?: any;
    }) {
        try {
            // Paystack expects amount in the smallest currency unit (pesewas for GHS)
            const paystackAmount = Math.round(data.amount * 100);

            const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.secretKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    reference: data.reference,
                    amount: paystackAmount,
                    currency: data.currency,
                    callback_url: data.callback_url,
                    email: data.email,
                    metadata: data.metadata,
                }),
            });

            const result = await response.json();

            if (result.status) {
                return result.data.authorization_url;
            } else {
                this.logger.error(`Paystack initialization failed: ${JSON.stringify(result)}`);
                throw new Error(result.message || 'Payment initialization failed');
            }
        } catch (error) {
            this.logger.error(`Error initializing Paystack payment: ${error.message}`);
            throw error;
        }
    }

    async verifyTransaction(reference: string) {
        try {
            const response = await fetch(`${this.baseUrl}/transaction/verify/${reference}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.secretKey}`,
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();
            return result;
        } catch (error) {
            this.logger.error(`Error verifying Paystack transaction: ${error.message}`);
            throw error;
        }
    }

    async createTransferRecipient(data: {
        type: 'nuban' | 'mobile_money';
        name: string;
        account_number: string;
        bank_code: string;
        currency: string;
    }) {
        try {
            const response = await fetch(`${this.baseUrl}/transferrecipient`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.secretKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            return result;
        } catch (error) {
            this.logger.error(`Error creating Paystack transfer recipient: ${error.message}`);
            throw error;
        }
    }

    // Paystack uses subaccounts for splitting, but we can also do manual transfers (payouts)
    async initiateTransfer(data: {
        source: string;
        amount: number;
        recipient: string;
        reason: string;
        reference: string;
    }) {
        try {
            const paystackAmount = Math.round(data.amount * 100);

            const response = await fetch(`${this.baseUrl}/transfer`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.secretKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    amount: paystackAmount,
                }),
            });

            const result = await response.json();
            return result;
        } catch (error) {
            this.logger.error(`Error initiating Paystack transfer: ${error.message}`);
            throw error;
        }
    }
}
