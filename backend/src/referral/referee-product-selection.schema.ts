import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RefereeProductSelectionDocument = RefereeProductSelection & Document;

@Schema({ timestamps: true })
export class RefereeProductSelection {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    refereeId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Product', required: true, index: true })
    productId: Types.ObjectId;

    /** manual = referee picked it themselves | auto = platform auto-filled it */
    @Prop({ default: 'manual', enum: ['manual', 'auto'] })
    source: string;

    /** Flat GHS the referee adds on top of the vendor's price — buyer pays vendor price + this. */
    @Prop({ required: true })
    markupGhs: number;

    @Prop({ default: Date.now })
    selectedAt: Date;
}

export const RefereeProductSelectionSchema = SchemaFactory.createForClass(RefereeProductSelection);

// One referee can only pick a given product once; also enforces upsert-safe dedup.
RefereeProductSelectionSchema.index({ refereeId: 1, productId: 1 }, { unique: true });
// For vendor-side "which referees picked my product" lookups.
RefereeProductSelectionSchema.index({ productId: 1 });
