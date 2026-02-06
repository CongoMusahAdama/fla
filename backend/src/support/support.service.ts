import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Support, SupportDocument } from './schemas/support.schema';

@Injectable()
export class SupportService {
    constructor(@InjectModel(Support.name) private supportModel: Model<SupportDocument>) { }

    async createDispute(userId: string, data: any): Promise<Support> {
        const dispute = new this.supportModel({
            userId: new Types.ObjectId(userId),
            ...data
        });
        return dispute.save();
    }

    async findByUser(userId: string): Promise<Support[]> {
        return this.supportModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).exec();
    }
}
