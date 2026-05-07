import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Support, SupportDocument } from './schemas/support.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SupportService {
    constructor(
        @InjectModel(Support.name) private supportModel: Model<SupportDocument>,
        private readonly notificationsService: NotificationsService
    ) { }

    async createDispute(userId: string, data: any): Promise<Support> {
        const dispute = new this.supportModel({
            ...data,
            userId: new Types.ObjectId(userId),
            vendorId: data.vendorId ? new Types.ObjectId(data.vendorId) : undefined
        });
        const saved = await dispute.save();

        // Notify Vendor and Admins
        if (data.vendorId && data.orderId) {
            await this.notificationsService.create(data.vendorId.toString(), {
                title: 'New Dispute Opened',
                message: `A dispute has been opened for Order #${data.orderId.toString().slice(-6).toUpperCase()}`,
                type: 'order',
                orderId: data.orderId.toString()
            });
        }

        return saved;
    }

    async addMessage(disputeId: string, senderId: string, senderRole: string, message: string, attachments: string[] = []): Promise<Support> {
        const dispute = await this.supportModel.findById(disputeId).exec();
        if (!dispute) throw new NotFoundException('Dispute not found');

        const newMessage = {
            senderId: new Types.ObjectId(senderId),
            senderRole,
            message,
            attachments,
            createdAt: new Date()
        };

        dispute.messages.push(newMessage as any);
        const saved = await dispute.save();

        // Notify other parties
        const recipients = [dispute.userId.toString(), dispute.vendorId?.toString()].filter(id => id && id !== senderId);
        
        for (const recipientId of recipients) {
            await this.notificationsService.create(recipientId, {
                title: 'New Dispute Message',
                message: `New message in dispute for Order #${(dispute.orderId || '').toString().slice(-6).toUpperCase()}`,
                type: 'order',
                orderId: dispute.orderId
            });
        }

        return saved;
    }

    async findByUser(userId: string): Promise<Support[]> {
        return this.supportModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).exec();
    }

    async findByVendor(vendorId: string): Promise<Support[]> {
        return this.supportModel.find({ vendorId: new Types.ObjectId(vendorId) }).sort({ createdAt: -1 }).exec();
    }

    async findAll(): Promise<Support[]> {
        return this.supportModel.find().sort({ createdAt: -1 }).exec();
    }

    async findOne(id: string): Promise<Support> {
        const dispute = await this.supportModel.findById(id).exec();
        if (!dispute) throw new NotFoundException('Dispute not found');
        return dispute;
    }

    async updateStatus(id: string, status: string): Promise<Support> {
        const dispute = await this.supportModel.findByIdAndUpdate(id, { status }, { new: true }).exec();
        if (!dispute) throw new NotFoundException('Dispute not found');
        return dispute;
    }
}
