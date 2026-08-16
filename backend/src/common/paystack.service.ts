import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class PaystackService {
    private readonly secretKey: string;
    private readonly logger = new Logger(PaystackService.name);
    private readonly baseUrl = 'https://api.paystack.co';

    constructor() {
        this.secretKey = process.env.PAYSTACK_SECRET_KEY || '';
        if (!this.secretKey) {
            this.logger.error('PAYSTACK_SECRET_KEY is missing from environment variables.');
        }
    }

    private get headers() {
        return {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
        };
    }

    /**
     * Verifies that the request actually came from Paystack
     */
    verifyWebhookSignature(signature: string, payload: any): boolean {
        const hash = crypto
            .createHmac('sha512', this.secretKey)
            .update(JSON.stringify(payload))
            .digest('hex');
        return hash === signature;
    }

    async createSubaccount(data: {
        business_name: string;
        settlement_bank: string;
        account_number: string;
        percentage_charge: number;
    }) {
        try {
            const response = await axios.post(`${this.baseUrl}/subaccount`, data, { 
                headers: this.headers,
                timeout: 10000 // 10s timeout
            });
            return response.data.data;
        } catch (error) {
            this.logger.error(`Failed to create Paystack subaccount: ${error.response?.data?.message || error.message}`);
            throw error;
        }
    }

    async updateSubaccount(
        subaccountCode: string,
        data: { percentage_charge?: number; business_name?: string; active?: boolean },
    ) {
        try {
            const response = await axios.put(`${this.baseUrl}/subaccount/${subaccountCode}`, data, {
                headers: this.headers,
                timeout: 10000,
            });
            return response.data.data;
        } catch (error) {
            this.logger.error(
                `Failed to update Paystack subaccount ${subaccountCode}: ${error.response?.data?.message || error.message}`,
            );
            throw error;
        }
    }

    /**
     * Creates a Transaction Split covering multiple subaccounts on one payment
     * (the basic `subaccount` param on initialize only supports one subaccount).
     * Used to auto-pay a referee's commission alongside the vendor's share.
     */
    async createSplit(data: {
        name: string;
        subaccounts: Array<{ subaccount: string; share: number }>;
        bearer_subaccount: string;
    }) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/split`,
                {
                    name: data.name,
                    type: 'percentage',
                    currency: 'GHS',
                    subaccounts: data.subaccounts,
                    bearer_type: 'subaccount',
                    bearer_subaccount: data.bearer_subaccount,
                },
                { headers: this.headers, timeout: 10000 },
            );
            return response.data.data;
        } catch (error) {
            this.logger.error(`Failed to create Paystack split: ${error.response?.data?.message || error.message}`);
            throw error;
        }
    }

    async initializePayment(data: {
        email: string;
        amount: number;
        reference: string;
        currency?: string;
        subaccount?: string;
        split_code?: string;
        transaction_charge?: number;
        bearer?: 'account' | 'subaccount';
        callback_url?: string;
        metadata?: any;
    }) {
        try {
            if (!this.secretKey) {
                throw new Error('PAYSTACK_SECRET_KEY is not configured on the server');
            }
            const params = {
                ...data,
                email: (data.email || '').trim() || 'support@flamingo-store1.com',
                amount: Math.round(Number(data.amount) * 100),
                currency: data.currency || 'GHS',
            };
            const response = await axios.post(`${this.baseUrl}/transaction/initialize`, params, {
                headers: this.headers,
                timeout: 15000,
            });
            return response.data.data;
        } catch (error: any) {
            const paystackMessage =
                error.response?.data?.message ||
                error.response?.data?.data?.message ||
                error.message ||
                'Paystack initialize failed';
            this.logger.error(`Failed to initialize Paystack transaction: ${paystackMessage}`);
            const enriched = new Error(
                Array.isArray(paystackMessage) ? paystackMessage.join(', ') : String(paystackMessage),
            );
            (enriched as any).response = error.response;
            throw enriched;
        }
    }

    async verifyTransaction(reference: string) {
        try {
            const response = await axios.get(`${this.baseUrl}/transaction/verify/${reference}`, { 
                headers: this.headers,
                timeout: 10000
            });
            return response.data.data;
        } catch (error) {
            this.logger.error(`Failed to verify Paystack transaction: ${error.response?.data?.message || error.message}`);
            throw error;
        }
    }

    async listBanks() {
        try {
            const response = await axios.get(`${this.baseUrl}/bank?country=ghana`, { 
                headers: this.headers,
                timeout: 10000
            });
            return response.data.data;
        } catch (error) {
            this.logger.error(`Failed to list banks: ${error.response?.data?.message || error.message}`);
            throw error;
        }
    }

    async resolveAccountNumber(accountNumber: string, bankCode: string) {
        try {
            const response = await axios.get(`${this.baseUrl}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, { 
                headers: this.headers,
                timeout: 10000
            });
            return response.data.data;
        } catch (error) {
            this.logger.error(`Failed to resolve account: ${error.response?.data?.message || error.message}`);
            throw error;
        }
    }
}
