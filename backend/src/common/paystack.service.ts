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

    async initializePayment(data: {
        email: string;
        amount: number;
        reference: string;
        subaccount?: string;
        transaction_charge?: number;
        callback_url?: string;
        metadata?: any;
    }) {
        try {
            const params = { ...data, amount: Math.round(data.amount * 100) };
            const response = await axios.post(`${this.baseUrl}/transaction/initialize`, params, { 
                headers: this.headers,
                timeout: 10000 
            });
            return response.data.data;
        } catch (error) {
            this.logger.error(`Failed to initialize Paystack transaction: ${error.response?.data?.message || error.message}`);
            throw error;
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
