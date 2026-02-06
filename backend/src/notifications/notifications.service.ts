import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
    constructor(@InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>) { }

    async create(userId: string, data: any): Promise<Notification> {
        const notification = new this.notificationModel({
            userId: new Types.ObjectId(userId),
            ...data
        });
        return notification.save();
    }

    async findByUser(userId: string): Promise<Notification[]> {
        return this.notificationModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).exec();
    }

    async markAsRead(id: string): Promise<Notification | null> {
        return this.notificationModel.findByIdAndUpdate(id, { isRead: true }, { new: true }).exec();
    }
}
