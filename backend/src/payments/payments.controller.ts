import {
    Controller,
    Post,
    Body,
    Logger,
    Get,
    UseGuards,
    Request,
    Param,
    Headers,
    UnauthorizedException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
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
import { amountDueForRenewal } from '../users/vendor-subscription.util';
import { isVendorDocumented } from '../common/vendor-trust.util';
import * as crypto from 'crypto';

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
        if (!this.shuftiService.verifyWebhook(payload, signature)) {
            this.logger.warn('Shufti webhook rejected: invalid or missing signature');
            throw new UnauthorizedException('Invalid webhook signature');
        }
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
                    isIdentityVerified: true,
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
                    isVerified: false,
                    isIdentityVerified: false,
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
    async handlePaystackWebhook(
        @Body() payload: any,
        @Headers('x-paystack-signature') signature: string,
    ) {
        if (!signature || !this.paystackService.verifyWebhookSignature(signature, payload)) {
            this.logger.warn('Paystack webhook rejected: invalid or missing signature');
            throw new UnauthorizedException('Invalid webhook signature');
        }
        // Paystack Webhook payload structure: { event: 'charge.success', data: { ... } }
        const event = payload.event;
        const data = payload.data;

        this.logger.log(`Paystack Webhook received: ${event}`);

        if (event === 'charge.success') {
            const reference = data.reference;
            const status = data.status;
            const transactionId = data.id?.toString();
            const metadata = data.metadata || {};

            if (status === 'success') {
                const paymentType = metadata?.paymentType;

                if (paymentType === 'vendor_subscription') {
                    const vendorId = metadata.vendorId || metadata.userId;
                    if (!vendorId) {
                        this.logger.error(`Paystack subscription charge missing vendorId (ref=${reference})`);
                    } else {
                        const amountGhs =
                            typeof data.amount === 'number' ? data.amount / 100 : undefined;
                        await this.usersService.activateSubscriptionFromPayment(vendorId, {
                            amountGhs,
                            reference,
                        });
                        this.logger.log(`Vendor subscription activated for ${vendorId} (ref=${reference})`);
                    }
                } else if (paymentType === 'first_mile_fee') {
                    this.logger.warn(`Ignored Paystack first_mile_fee for order — delivery fees are off-platform`);
                } else {
                    const orderId = metadata?.orderId || reference;
                    this.logger.log(`Paystack: Main order payment successful for order: ${orderId}`);
                    await this.ordersService.handlePaymentSuccess(orderId, transactionId);
                }
            }
        }

        return { status: 'success' };
    }

    /**
     * Vendor subscription unlock/renew — Paystack checkout (no admin MoMo).
     * Full amount goes to the main Paystack account (no subaccount split).
     *
     * TEMP: Paystack billing is skipped unless REQUIRE_VENDOR_SUBSCRIPTION_PAYSTACK=true
     * so KYC-approved vendors can upload while the gateway issue is fixed.
     */
    @UseGuards(AuthGuard('jwt'))
    @Post('subscription/initialize')
    async initializeVendorSubscription(@Request() req) {
        if (req.user.role !== 'vendor') {
            throw new ForbiddenException('Only vendors can pay subscriptions');
        }
        const vendor = await this.usersService.findOneById(req.user.userId);
        if (!vendor || (vendor as any).role !== 'vendor') {
            throw new BadRequestException('Vendor not found');
        }
        if (!(vendor as any).kycApprovedAt) {
            throw new ForbiddenException(
                'Complete document verification and wait for admin approval before paying for uploads.',
            );
        }
        if (!isVendorDocumented(vendor as any)) {
            throw new BadRequestException('Business registration documents must be uploaded before subscription.');
        }

        const amountGhs = amountDueForRenewal(vendor as any);
        const requirePaystack =
            String(this.configService.get('REQUIRE_VENDOR_SUBSCRIPTION_PAYSTACK') || '')
                .toLowerCase()
                .trim() === 'true';

        // Temporary unlock path — re-enable charged Paystack with env flag on Render.
        if (!requirePaystack) {
            this.logger.warn(
                `TEMP subscription unlock without Paystack for vendor ${req.user.userId} (set REQUIRE_VENDOR_SUBSCRIPTION_PAYSTACK=true to charge)`,
            );
            const activated = await this.usersService.activateSubscriptionFromPayment(req.user.userId, {
                amountGhs: 0,
                reference: `TEMP-UNLOCK-${req.user.userId.slice(-6)}-${Date.now()}`,
            });
            return {
                unlocked: true,
                temporaryUnlock: true,
                amountGhs: 0,
                vendor: activated.vendor,
                message:
                    'Product uploads unlocked for 30 days. Paystack billing is temporarily paused while we fix the payment gateway.',
            };
        }

        const frontend =
            this.configService.get<string>('FRONTEND_URL')?.replace(/\/$/, '') ||
            'https://flamingo-store1.com';
        const vendorEmail = String((vendor as any).email || '').trim();
        const email =
            vendorEmail && vendorEmail.includes('@')
                ? vendorEmail
                : `vendor-${req.user.userId.slice(-8)}@flamingo-store1.com`;
        const reference = `FLA-SUB-${req.user.userId.slice(-8)}-${crypto.randomBytes(4).toString('hex')}`;

        try {
            const init = await this.paystackService.initializePayment({
                email,
                amount: amountGhs,
                currency: 'GHS',
                reference,
                callback_url: `${frontend}/vendor?subscription=paid`,
                metadata: {
                    paymentType: 'vendor_subscription',
                    vendorId: req.user.userId,
                    amountGhs,
                    plan: (vendor as any).subscriptionPlan || 'intro',
                },
            });

            return {
                authorizationUrl: init.authorization_url,
                accessCode: init.access_code,
                reference: init.reference || reference,
                amountGhs,
            };
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                'Could not start Paystack checkout';
            this.logger.error(`Vendor subscription Paystack init failed: ${msg}`);
            throw new BadRequestException(
                Array.isArray(msg) ? msg.join(', ') : String(msg),
            );
        }
    }

    /** Client-side verify after Paystack redirect (webhook may lag). */
    @UseGuards(AuthGuard('jwt'))
    @Post('order/verify')
    async verifyOrderPayment(
        @Request() req,
        @Body() body: { reference?: string; orderId?: string },
    ) {
        const reference = body?.reference?.trim();
        if (!reference) {
            throw new BadRequestException('Payment reference is required');
        }

        const tx = await this.paystackService.verifyTransaction(reference);
        if (!tx || tx.status !== 'success') {
            throw new BadRequestException('Payment not successful yet');
        }

        const meta = tx.metadata || {};
        if (meta.paymentType === 'vendor_subscription' || meta.paymentType === 'first_mile_fee') {
            throw new BadRequestException('Not an order payment');
        }

        const orderId = String(meta.orderId || body?.orderId || reference).trim();
        if (!orderId) {
            throw new BadRequestException('Order id missing from payment');
        }

        // Ensures the caller owns the order (or is admin)
        await this.ordersService.findOne(orderId, {
            role: req.user.role,
            userId: req.user.userId,
        });

        const transactionId = tx.id?.toString?.() || reference;
        await this.ordersService.handlePaymentSuccess(orderId, transactionId);
        return { success: true, orderId };
    }

    /** Client-side verify after Paystack redirect (webhook may lag). */
    @UseGuards(AuthGuard('jwt'))
    @Post('subscription/verify')
    async verifyVendorSubscription(@Request() req, @Body() body: { reference?: string }) {
        if (req.user.role !== 'vendor') {
            throw new ForbiddenException('Only vendors can verify subscriptions');
        }
        const reference = body?.reference?.trim();
        if (!reference) {
            throw new BadRequestException('Payment reference is required');
        }

        const tx = await this.paystackService.verifyTransaction(reference);
        if (!tx || tx.status !== 'success') {
            throw new BadRequestException('Payment not successful yet');
        }

        const meta = tx.metadata || {};
        if (meta.paymentType && meta.paymentType !== 'vendor_subscription') {
            throw new BadRequestException('Not a subscription payment');
        }
        const vendorId = meta.vendorId || meta.userId || req.user.userId;
        if (vendorId !== req.user.userId) {
            throw new ForbiddenException('This payment belongs to another account');
        }

        const amountGhs = typeof tx.amount === 'number' ? tx.amount / 100 : undefined;
        return this.usersService.activateSubscriptionFromPayment(req.user.userId, {
            amountGhs,
            reference,
        });
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
        if (req.user.role !== 'vendor' && req.user.role !== 'referee') throw new Error('Only vendors or referees can request withdrawals');
        return this.withdrawalService.requestWithdrawal(req.user.userId, body.amount, body);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('withdrawals/my-history')
    async getMyWithdrawals(@Request() req) {
        if (req.user.role !== 'vendor' && req.user.role !== 'referee') throw new Error('Only vendors or referees can view withdrawal history');
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
