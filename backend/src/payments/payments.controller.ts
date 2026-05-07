import { Controller, Post, Body, Logger, Get, UseGuards, Request, Param } from '@nestjs/common';
import { HubtelService } from './hubtel.service';
import { OrdersService } from '../orders/orders.service';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { WithdrawalService } from './withdrawal.service';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';
import { HubtelWebhookDto } from './dto/hubtel-webhook.dto';

@Controller('payments')
export class PaymentsController {
    private readonly logger = new Logger(PaymentsController.name);

    constructor(
        private readonly hubtelService: HubtelService,
        private readonly ordersService: OrdersService,
        private readonly configService: ConfigService,
        private readonly withdrawalService: WithdrawalService,
    ) { }

    @Post('webhook/hubtel')
    async handleHubtelWebhook(@Body() payload: HubtelWebhookDto) {
        // Business Rule: treat webhook as trigger, always verify with Hubtel API
        const clientReference = payload.Data?.ClientReference || payload.clientReference;
        const status = payload.Status || payload.status;
        const transactionId = payload.Data?.TransactionId || payload.transactionId;
        const metadata = payload.Data?.Metadata || payload.metadata;

        this.logger.log(`Hubtel Webhook received for ref: ${clientReference}`);

        if (status === 'Success') {
            // SECURITY: Double verify with Hubtel API to be absolutely sure
            const verification = await this.hubtelService.verifyTransaction(clientReference as string);
            
            if (verification.responseCode === '00' && (verification.data.status === 'Success' || verification.data.status === 'Paid')) {
                const orderId = metadata?.orderId || clientReference;
                const paymentType = metadata?.paymentType;

                if (paymentType === 'first_mile_fee') {
                    this.logger.log(`Hubtel: First-mile delivery fee payment successful for order: ${orderId}`);
                    await this.ordersService.handleFirstMilePaymentSuccess(orderId, transactionId as string);
                } else {
                    this.logger.log(`Hubtel: Main order payment successful for order: ${orderId}`);
                    await this.ordersService.handlePaymentSuccess(orderId, transactionId as string);
                }
            } else {
                this.logger.warn(`Hubtel Webhook verification failed for ref: ${clientReference}`);
            }
        }

        return { status: 'success' };
    }

    @Get('lookup-name/:network/:number')
    async lookupAccountName(@Param('network') network: string, @Param('number') number: string) {
        // Mock name inquiry for now. In production, this should integrate with Hubtel/Paystack Name Enquiry API
        console.log(`[PAYMENT_LOOKUP] Network: ${network}, Number: ${number}`);
        
        // Basic validation
        if (!number || number.length < 9) {
            return { success: false, message: 'Invalid number length' };
        }

        // Mock response
        // Using a slight delay to simulate network request
        await new Promise(resolve => setTimeout(resolve, 800));

        let mockName = 'Verified Merchant';
        if (number.endsWith('1')) mockName = 'Fadilan Salifu';
        else if (number.endsWith('2')) mockName = 'Musah Congo Adama';
        else if (number.endsWith('3')) mockName = 'John Doe';
        else if (number.endsWith('307') || number.endsWith('068')) mockName = 'Musah Congo Adama';
        else if (number.endsWith('00')) mockName = 'FLA System Admin';
        else mockName = 'Verified Payout Account';

        return { success: true, name: mockName };
    }

    // Withdrawal Endpoints
    @UseGuards(AuthGuard('jwt'))
    @Post('withdrawals/request')
    async requestWithdrawal(@Request() req, @Body() body: RequestWithdrawalDto) {
        // Security: Authorization handled by Guard, logic by Service
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
