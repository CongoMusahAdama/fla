import { Controller, Post, Body, Logger, Get, UseGuards, Request, Param, Headers } from '@nestjs/common';
import { PaystackService } from '../common/paystack.service';
import { ShuftiService } from '../common/shufti.service';
import { OrdersService } from '../orders/orders.service';
import { UsersService } from '../users/users.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TempVerification } from '../common/schemas/temp-verification.schema';
import { UserDocument } from '../users/schemas/user.schema';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { WithdrawalService } from './withdrawal.service';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';

@Controller('payments')
export class PaymentsController {
    private readonly logger = new Logger(PaymentsController.name);

    constructor(
        private readonly paystackService: PaystackService,
        private readonly shuftiService: ShuftiService,
        private readonly ordersService: OrdersService,
        private readonly configService: ConfigService,
        private readonly withdrawalService: WithdrawalService,
        private readonly usersService: UsersService,
        @InjectModel(TempVerification.name) private tempVerificationModel: Model<TempVerification>,
    ) { }

    @Post('webhook/shufti')
    async handleShuftiWebhook(@Body() payload: any, @Headers('signature') signature: string) {
        this.logger.log(`Shufti Webhook received for ref: ${payload.reference}`);
        
        const event = payload.event;
        const reference = payload.reference;

        // Extract email if it's a TEMP reference
        let email = payload.email;
        if (reference.startsWith('TEMP_')) {
            const parts = reference.split('_');
            email = parts[parts.length - 2] + '@' + parts[parts.length - 1]; // Reconstruct email
        }

        if (event === 'verification.accepted') {
            this.logger.log(`Shufti: Identity verified for: ${email || reference}`);
            
            // Try updating user if they exist
            const user = await this.usersService.findOne(email) || await this.usersService.findOneById(reference);
            if (user) {
                await this.usersService.update((user as UserDocument)._id.toString(), { 
                    isVerified: true, 
                    verificationStatus: 'verified',
                    verificationDate: new Date()
                });
            } else {
                // Store in TempVerification for future signup
                await this.tempVerificationModel.findOneAndUpdate(
                    { email },
                    { status: 'verified', reference, payload },
                    { upsert: true }
                );
            }
        } else if (event === 'verification.declined') {
            this.logger.warn(`Shufti: Identity verification declined for: ${email || reference}`);
            const user = await this.usersService.findOne(email) || await this.usersService.findOneById(reference);
            if (user) {
                await this.usersService.update((user as UserDocument)._id.toString(), { 
                    verificationStatus: 'declined',
                    verificationDeclineReason: payload.declined_reason
                });
            } else {
                await this.tempVerificationModel.findOneAndUpdate(
                    { email },
                    { status: 'declined', reference, payload },
                    { upsert: true }
                );
            }
        }

        return { status: 'success' };
    }

    @Post('webhook/paystack')
    async handlePaystackWebhook(@Body() payload: any) {
        // Paystack Webhook payload structure: { event: 'charge.success', data: { ... } }
        const event = payload.event;
        const data = payload.data;

        this.logger.log(`Paystack Webhook received: ${event}`);

        if (event === 'charge.success') {
            const reference = data.reference;
            const status = data.status;
            const transactionId = data.id?.toString();
            const metadata = data.metadata;

            if (status === 'success') {
                const orderId = metadata?.orderId || reference;
                const paymentType = metadata?.paymentType;

                if (paymentType === 'first_mile_fee') {
                    this.logger.log(`Paystack: First-mile delivery fee payment successful for order: ${orderId}`);
                    await this.ordersService.handleFirstMilePaymentSuccess(orderId, transactionId);
                } else {
                    this.logger.log(`Paystack: Main order payment successful for order: ${orderId}`);
                    await this.ordersService.handlePaymentSuccess(orderId, transactionId);
                }
            }
        }

        return { status: 'success' };
    }

    @Get('lookup-name/:bankCode/:accountNumber')
    async lookupAccountName(@Param('bankCode') bankCode: string, @Param('accountNumber') accountNumber: string) {
        this.logger.log(`Paystack: Resolving account name for ${accountNumber} at ${bankCode}`);
        
        try {
            const result = await this.paystackService.resolveAccountNumber(accountNumber, bankCode);
            
            if (result.status && result.data) {
                return { 
                    success: true, 
                    name: result.data.account_name,
                    accountNumber: result.data.account_number 
                };
            }
            
            return { 
                success: false, 
                message: result.message || 'Could not resolve account name' 
            };
        } catch (error) {
            this.logger.error(`Paystack Resolution Error: ${error.message}`);
            return { 
                success: false, 
                message: 'Account verification service temporarily unavailable' 
            };
        }
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
