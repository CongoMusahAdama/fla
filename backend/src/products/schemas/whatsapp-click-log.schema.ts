import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WhatsappClickLogDocument = WhatsappClickLog & Document;

/** One charged tap per buyer per product per Ghana day. */
@Schema({ timestamps: true })
export class WhatsappClickLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  vendorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true })
  buyerKey: string;

  @Prop({ required: true })
  dayKey: string;
}

export const WhatsappClickLogSchema = SchemaFactory.createForClass(WhatsappClickLog);

WhatsappClickLogSchema.index({ productId: 1, buyerKey: 1, dayKey: 1 }, { unique: true });
