import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WithdrawalDocument = Withdrawal & Document;

@Schema({ timestamps: true })
export class Withdrawal {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    vendorId: Types.ObjectId;

    @Prop({ required: true })
    amount: number; // Requested amount (Gross)

    @Prop({ required: true })
    adminCommission: number; // 6% of amount

    @Prop({ required: true })
    netAmount: number; // Amount vendor actually gets (amount - commission)

    @Prop({
        type: String,
        enum: ['pending', 'approved', 'declined', 'processed'],
        default: 'pending'
    })
    status: string;

    @Prop()
    paymentMethod: string; // e.g., 'momo'

    @Prop()
    momoNumber: string;

    @Prop()
    accountName: string;

    @Prop()
    notes?: string;

    @Prop()
    adminNotes?: string;

    @Prop()
    processedAt?: Date;

    @Prop()
    declinedAt?: Date;
}

export const WithdrawalSchema = SchemaFactory.createForClass(Withdrawal);
