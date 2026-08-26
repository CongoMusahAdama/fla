import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReferralEarningDocument = ReferralEarning & Document;

@Schema({ timestamps: true })
export class ReferralEarning {
    /** The referee (affiliate) user */
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    refereeId: Types.ObjectId;

    /** The completed order that triggered this commission */
    @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
    orderId: Types.ObjectId;

    /** Vendor whose product was sold */
    @Prop({ type: Types.ObjectId, ref: 'User' })
    vendorId: Types.ObjectId;

    @Prop()
    vendorName: string;

    /** Short summary of product(s) sold */
    @Prop({ type: [String], default: [] })
    productNames: string[];

    /** Total product sale amount (GHS) */
    @Prop({ required: true })
    saleAmount: number;

    /** Referee's 10% commission (GHS) */
    @Prop({ required: true })
    commission: number;

    /** pending = waiting for order to complete | credited = added to wallet */
    @Prop({ default: 'credited', enum: ['pending', 'credited', 'withdrawn'] })
    status: string;

    /** Date the commission was credited to the wallet */
    @Prop()
    creditedAt?: Date;
}

export const ReferralEarningSchema = SchemaFactory.createForClass(ReferralEarning);

ReferralEarningSchema.index({ refereeId: 1, createdAt: -1 });
ReferralEarningSchema.index({ orderId: 1 }, { unique: true });
