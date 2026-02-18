import { Controller, Post, Body, Headers, Logger } from '@nestjs/common';
import { PaystackService } from './paystack.service';
import { OrdersService } from '../orders/orders.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Controller('payments')
export class PaymentsController {
    private readonly logger = new Logger(PaymentsController.name);

    constructor(
        private readonly paystackService: PaystackService,
        private readonly ordersService: OrdersService,
        private readonly configService: ConfigService,
    ) { }

    @Post('webhook')
    async handleWebhook(@Body() payload: any, @Headers('x-paystack-signature') signature: string) {
        const secret = this.configService.get<string>('PAYSTACK_SECRET_KEY') || '';

        // Verify the webhook signature
        const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(payload)).digest('hex');

        if (hash !== signature) {
            this.logger.warn('Unauthorized Paystack webhook attempt');
            return { status: 'error', message: 'Unauthorized' };
        }

        this.logger.log(`Paystack Webhook received: ${payload.event}`);

        if (payload.event === 'charge.success') {
            const { reference, id: transactionId, amount, status } = payload.data;

            if (status === 'success') {
                // Double verify with Paystack API to be absolutely sure
                const verification = await this.paystackService.verifyTransaction(reference);

                if (verification.status === true && verification.data.status === 'success' && verification.data.amount >= amount) {
                    // Update the order
                    this.logger.log(`Payment successful for order: ${reference}`);
                    await this.ordersService.handlePaymentSuccess(reference, transactionId.toString());
                }
            }
        }

        return { status: 'success' };
    }
}
