import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WhatsappClickTopupDocument = WhatsappClickTopup & Document;

/** One Paystack reference can credit a vendor's click balance only once. */
@Schema({ timestamps: true })
export class WhatsappClickTopup {
  @Prop({ required: true, unique: true })
  reference: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  vendorId: Types.ObjectId;

  @Prop({ required: true })
  clicks: number;

  @Prop({ required: true })
  amountGhs: number;

  @Prop({ default: false })
  credited: boolean;
}

export const WhatsappClickTopupSchema = SchemaFactory.createForClass(WhatsappClickTopup);
