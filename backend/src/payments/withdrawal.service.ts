import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Withdrawal, WithdrawalDocument } from './schemas/withdrawal.schema';
import { UsersService } from '../users/users.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class WithdrawalService {
    constructor(
        @InjectModel(Withdrawal.name) private withdrawalModel: Model<WithdrawalDocument>,
        private readonly usersService: UsersService,
        private readonly settingsService: SettingsService,
    ) { }

    async requestWithdrawal(vendorId: string, amount: number, paymentDetails: any) {
        const vendor = await this.usersService.findOneById(vendorId);
        if (!vendor) throw new NotFoundException('Vendor not found');

        if (vendor.walletBalance < amount) {
            throw new BadRequestException('Insufficient balance');
        }

        const minWithdrawal = (await this.settingsService.getSetting('withdrawal_minimum')) || 50;
        if (amount < minWithdrawal) {
            throw new BadRequestException(`Minimum withdrawal amount is GH₵ ${minWithdrawal}`);
        }

        // Commission Logic: Use dynamic commission setting (default 10%), but 0% for referees (already calculated in earning)
        const isReferee = vendor.role === 'referee';
        const commissionRate = isReferee ? 0 : (await this.settingsService.getSetting('platform_commission')) || 6;
        const adminCommission = amount * (commissionRate / 100);
        const netAmount = amount - adminCommission;

        const withdrawal = new this.withdrawalModel({
            vendorId: new Types.ObjectId(vendorId),
            amount,
            adminCommission,
            netAmount,
            status: 'pending',
            paymentMethod: paymentDetails.paymentMethod || 'momo',
            momoNumber: paymentDetails.momoNumber || vendor.momoNumber,
            accountName: paymentDetails.accountName || vendor.accountName,
            notes: paymentDetails.notes,
        });

        // Deduct from wallet balance immediately (locked in request)
        await this.usersService.update(vendorId, {
            walletBalance: vendor.walletBalance - amount
        });

        return withdrawal.save();
    }

    async approveWithdrawal(withdrawalId: string, adminNotes?: string) {
        const withdrawal = await this.withdrawalModel.findById(withdrawalId);
        if (!withdrawal) throw new NotFoundException('Withdrawal request not found');
        if (withdrawal.status !== 'pending') throw new BadRequestException('Withdrawal is not pending');

        withdrawal.status = 'processed';
        withdrawal.adminNotes = adminNotes;
        withdrawal.processedAt = new Date();

        return withdrawal.save();
    }

    async declineWithdrawal(withdrawalId: string, adminNotes?: string) {
        const withdrawal = await this.withdrawalModel.findById(withdrawalId);
        if (!withdrawal) throw new NotFoundException('Withdrawal request not found');
        if (withdrawal.status !== 'pending') throw new BadRequestException('Withdrawal is not pending');

        withdrawal.status = 'declined';
        withdrawal.adminNotes = adminNotes;
        withdrawal.declinedAt = new Date();

        // Refund the amount back to vendor's wallet
        const vendor = await this.usersService.findOneById(withdrawal.vendorId.toString());
        if (vendor) {
            await this.usersService.update(withdrawal.vendorId.toString(), {
                walletBalance: vendor.walletBalance + withdrawal.amount
            });
        }

        return withdrawal.save();
    }

    async getVendorWithdrawals(vendorId: string) {
        return this.withdrawalModel.find({ vendorId: new Types.ObjectId(vendorId) }).sort({ createdAt: -1 }).exec();
    }

    async getAllWithdrawals() {
        return this.withdrawalModel.find().populate('vendorId', 'name email shopName').sort({ createdAt: -1 }).exec();
    }
}
