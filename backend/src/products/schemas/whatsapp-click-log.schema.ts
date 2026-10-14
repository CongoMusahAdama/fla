import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WhatsappClickLogDocument = WhatsappClickLog & Document;

/** One charged lead per buyer phone per vendor. Later taps from that number are free. */
@Schema({ timestamps: true })
export class WhatsappClickLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  vendorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  /** Stable buyer identity. Used to ignore an accidental double tap. */
  @Prop({ required: true })
  actorKey: string;

  /** Stable per vendor and buyer phone so the same number cannot be charged twice. */
  @Prop({ required: true })
  buyerKey: string;

  @Prop({ required: true })
  dayKey: string;
}

export const WhatsappClickLogSchema = SchemaFactory.createForClass(WhatsappClickLog);

WhatsappClickLogSchema.index({ vendorId: 1, actorKey: 1 });
WhatsappClickLogSchema.index({ buyerKey: 1 }, { unique: true });
