import { Controller, Post, Body, Headers, Logger, Get, UseGuards, Request, Param } from '@nestjs/common';
import { PaystackService } from './paystack.service';
import { OrdersService } from '../orders/orders.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { AuthGuard } from '@nestjs/passport';
import { WithdrawalService } from './withdrawal.service';

@Controller('payments')
export class PaymentsController {
    private readonly logger = new Logger(PaymentsController.name);

    constructor(
        private readonly paystackService: PaystackService,
        private readonly ordersService: OrdersService,
        private readonly configService: ConfigService,
        private readonly withdrawalService: WithdrawalService,
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

    // Withdrawal Endpoints
    @UseGuards(AuthGuard('jwt'))
    @Post('withdrawals/request')
    async requestWithdrawal(@Request() req, @Body() body: { amount: number, paymentMethod?: string, momoNumber?: string, accountName?: string, notes?: string }) {
        if (req.user.role !== 'vendor') throw new Error('Only vendors can request withdrawals');
        return this.withdrawalService.requestWithdrawal(req.user.userId, body.amount, body);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('withdrawals/my-history')
    async getMyWithdrawals(@Request() req) {
        if (req.user.role !== 'vendor') throw new Error('Only vendors can view withdrawal history');
        return this.withdrawalService.getVendorWithdrawals(req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('withdrawals/admin/all')
    async getAllWithdrawals(@Request() req) {
        if (req.user.role !== 'admin') throw new Error('Unauthorized - Admin only');
        return this.withdrawalService.getAllWithdrawals();
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('withdrawals/:id/approve')
    async approveWithdrawal(@Param('id') id: string, @Request() req, @Body() body: { adminNotes?: string }) {
        if (req.user.role !== 'admin') throw new Error('Unauthorized - Admin only');
        return this.withdrawalService.approveWithdrawal(id, body.adminNotes);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('withdrawals/:id/decline')
    async declineWithdrawal(@Param('id') id: string, @Request() req, @Body() body: { adminNotes?: string }) {
        if (req.user.role !== 'admin') throw new Error('Unauthorized - Admin only');
        return this.withdrawalService.declineWithdrawal(id, body.adminNotes);
    }
}
